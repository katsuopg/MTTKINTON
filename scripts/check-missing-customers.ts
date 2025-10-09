import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { getAllCustomerRecords } from '../src/lib/kintone/customer';
import { getAllInvoiceRecords } from '../src/lib/kintone/invoice';

function normalizeId(rawId: string | undefined) {
  if (!rawId) return null;
  const trimmed = rawId.trim();
  if (!trimmed) return null;
  const compact = trimmed.replace(/\s+/g, '');
  const hyphenated = compact.replace(/(\d)([A-Za-z])/g, '$1-$2');
  return hyphenated;
}

async function main() {
  const allRecords = await getAllCustomerRecords();
  const allInvoices = await getAllInvoiceRecords();

  const customerIds = new Set(
    allRecords
      .map((record) => record['文字列__1行_']?.value)
      .filter((v): v is string => Boolean(v))
  );
  const normalizedCustomerIds = new Set(
    Array.from(customerIds).map((id) => normalizeId(id) ?? id)
  );

  const missing = new Set<string>();

  for (const invoice of allInvoices) {
    const rawId = invoice['文字列__1行__3']?.value;
    const normalized = normalizeId(rawId);
    if (!rawId) continue;

    if (normalized && normalizedCustomerIds.has(normalized)) {
      continue;
    }
    if (customerIds.has(rawId)) {
      continue;
    }
    missing.add(rawId);
  }

  console.log(`Kintone顧客: ${customerIds.size} 件`);
  console.log(`請求書に登場する顧客ID: ${allInvoices.length} 件中 ${missing.size} 件が未マッチ`);
  if (missing.size > 0) {
    console.log('--- 未マッチの顧客ID ---');
    Array.from(missing).sort().forEach((id) => console.log(id));
  } else {
    console.log('全ての請求書顧客IDが顧客マスタに存在します。');
  }
}

main().catch((error) => {
  console.error('チェック中にエラーが発生しました:', error);
  process.exit(1);
});
