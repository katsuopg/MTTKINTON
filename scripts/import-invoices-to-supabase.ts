import dotenv from 'dotenv';
import path from 'path';

// 環境変数の読み込み
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { getAllInvoiceRecords } from '../src/lib/kintone/invoice';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const knownCustomerIds = new Set<string>();

function normalizeCustomerId(rawId: string | null | undefined): { id: string | null; matched: boolean } {
  if (!rawId) {
    return { id: null, matched: false };
  }

  const trimmed = rawId.trim();
  if (!trimmed) {
    return { id: null, matched: false };
  }

  const compact = trimmed.replace(/\s+/g, '');
  const hyphenated = compact.replace(/(\d)([A-Za-z])/g, '$1-$2');
  const spaced = trimmed.replace(/-/g, ' ');
  const candidates = Array.from(new Set([
    hyphenated,
    trimmed,
    spaced
  ]));

  for (const candidate of candidates) {
    if (knownCustomerIds.has(candidate)) {
      return { id: candidate, matched: true };
    }
  }

  return { id: hyphenated, matched: false };
}

function assertEnv(name: string, value: string | undefined): asserts value {
  if (!value) {
    throw new Error(`${name} is not set`);
  }
}

function parseNumber(value?: string | null): number | null {
  if (!value) {
    return null;
  }

  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

async function importAllInvoicesToSupabase() {
  console.log('=== Supabase請求書データ取り込み開始 ===\n');

  assertEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL);
  assertEnv('SUPABASE_SERVICE_ROLE_KEY', SERVICE_ROLE_KEY);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // 既存の顧客IDをキャッシュ
  const { data: existingCustomers, error: customerLoadError } = await supabase
    .from('customers')
    .select('customer_id,kintone_record_id,company_name');

  if (customerLoadError) {
    throw new Error(`顧客一覧の取得に失敗しました: ${customerLoadError.message}`);
  }

  const companyToCustomerId = new Map<string, string>();

  (existingCustomers || [])
    .forEach((row) => {
      const id = row.customer_id;
      if (!id) return;
      const isPlaceholder = row.kintone_record_id?.startsWith('missing-');
      if (!isPlaceholder) {
        knownCustomerIds.add(id);
        if (row.company_name) {
          companyToCustomerId.set(row.company_name, id);
        }
      }
    });

  try {
    const allInvoices = await getAllInvoiceRecords();
    console.log(`Kintoneから${allInvoices.length}件の請求書データを取得しました\n`);

    const batchSize = 10;
    let totalImported = 0;
    let totalErrors = 0;

    for (let i = 0; i < allInvoices.length; i += batchSize) {
      const batch = allInvoices.slice(i, i + batchSize);
      console.log(`バッチ ${Math.floor(i / batchSize) + 1}/${Math.ceil(allInvoices.length / batchSize)} (${batch.length}件) を処理中...`);

      for (const invoice of batch) {
        try {
          const customerName = invoice.CS_name?.value || null;
          const rawCustomerId = invoice.文字列__1行__3?.value || null;
          let { id: resolvedCustomerId, matched } = normalizeCustomerId(rawCustomerId);

          if (!matched && customerName && companyToCustomerId.has(customerName)) {
            resolvedCustomerId = companyToCustomerId.get(customerName)!;
            matched = true;
          }

          if (resolvedCustomerId && !matched && !knownCustomerIds.has(resolvedCustomerId)) {
            const placeholderData = {
              kintone_record_id: `missing-${resolvedCustomerId}`,
              customer_id: resolvedCustomerId,
              company_name: customerName || rawCustomerId || resolvedCustomerId,
              customer_rank: null,
              country: null,
              phone_number: null,
              fax_number: null,
              tax_id: null,
              payment_terms: null,
              address: null,
              website_url: null,
              notes: null,
              created_by: invoice.作成者?.value?.name || 'Migration',
              updated_by: invoice.更新者?.value?.name || 'Migration',
            };

            const { error: placeholderError } = await supabase
              .from('customers')
              .upsert(placeholderData, { onConflict: 'customer_id' });

            if (placeholderError) {
              console.warn(`顧客ID ${resolvedCustomerId} の補完に失敗: ${placeholderError.message}`);
            } else {
              knownCustomerIds.add(resolvedCustomerId);
            }
          }

          const data = {
            kintone_record_id: invoice.$id.value,
            work_no: invoice.文字列__1行_?.value || null,
            invoice_no: invoice.文字列__1行__0?.value || null,
            invoice_date: invoice.日付?.value || null,
            customer_id: resolvedCustomerId,
            customer_name: customerName,
            sub_total: parseNumber(invoice.subtotal?.value ?? invoice.total?.value),
            discount: parseNumber(invoice.discont?.value),
            after_discount: parseNumber(invoice.total?.value),
            vat: parseNumber(invoice.vatprice?.value),
            grand_total: parseNumber(invoice.計算?.value ?? invoice.total?.value),
            status: invoice.ラジオボタン?.value || null,
            created_by: invoice.作成者?.value?.name || null,
            updated_by: invoice.更新者?.value?.name || null,
          };

          const { error } = await supabase
            .from('invoices')
            .upsert(data, { onConflict: 'kintone_record_id' });

          if (error) {
            console.error(`エラー: 請求書 ${data.invoice_no || data.work_no} の取り込みに失敗:`, error.message);
            totalErrors++;
          } else {
            totalImported++;
          }
        } catch (error) {
          console.error('エラー: 請求書の処理中にエラーが発生:', error);
          totalErrors++;
        }
      }
    }

    console.log('\n=== 取り込み結果 ===');
    console.log(`成功: ${totalImported}件`);
    console.log(`エラー: ${totalErrors}件`);
    console.log(`合計: ${allInvoices.length}件`);

    const { count, error: countError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    if (!countError && count !== null) {
      console.log(`Supabaseの請求書テーブルには現在 ${count} 件のデータがあります`);
    }
  } catch (error) {
    console.error('取り込み全体でエラーが発生しました:', error);
  }
}

importAllInvoicesToSupabase();
