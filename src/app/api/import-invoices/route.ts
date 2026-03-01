import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getInvoiceRecords } from '@/lib/kintone/invoice';
import { requirePermission } from '@/lib/auth/permissions';

const toDateOrNull = (val: string | undefined): string | null => {
  if (!val || val.trim() === '') return null;
  return val;
};

const toNumberOrNull = (val: string | undefined): number | null => {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

export async function POST() {
  const permCheck = await requirePermission('import_data');
  if (!permCheck.allowed) {
    return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
  }

  const supabase = await createClient();

  try {
    const allInvoices = await getInvoiceRecords();
    console.log(`Kintoneから${allInvoices.length}件の請求書データを取得しました`);

    const batchSize = 10;
    let totalImported = 0;
    let totalErrors = 0;
    const errors: any[] = [];

    for (let i = 0; i < allInvoices.length; i += batchSize) {
      const batch = allInvoices.slice(i, i + batchSize);

      for (const invoice of batch) {
        try {
          const data = {
            kintone_record_id: invoice.$id.value,
            work_no: invoice.文字列__1行_?.value || '',
            invoice_no: invoice.文字列__1行__0?.value || '',
            invoice_date: toDateOrNull(invoice.日付?.value),
            customer_id: invoice.文字列__1行__3?.value || null,
            customer_name: invoice.CS_name?.value || null,
            sub_total: toNumberOrNull(invoice.subtotal?.value),
            discount: toNumberOrNull(invoice.discont?.value),
            after_discount: toNumberOrNull(invoice.total?.value),
            vat: toNumberOrNull(invoice.計算?.value),
            grand_total: toNumberOrNull(invoice.計算?.value || invoice.total?.value),
            status: invoice.ラジオボタン?.value || null,
            po_no: invoice.PO_no?.value || null,
            tax_rate: toNumberOrNull(invoice.Tax_rate?.value),
            vat_price: toNumberOrNull(invoice.vatprice?.value),
            wht: invoice.WHT?.value || null,
            wht_rate: toNumberOrNull(invoice.WHT_rate?.value),
            wht_price: toNumberOrNull(invoice.WHTprice?.value),
            payment_terms: invoice.Payment?.value || null,
            due_date: toDateOrNull(invoice.日付_0?.value),
            payment_date: toDateOrNull(invoice.日付_1?.value),
            repair_description: invoice.文字列__1行__5?.value || null,
            detail: invoice.文字列__1行__6?.value || null,
            created_by: invoice.作成者?.value?.name || null,
            updated_by: invoice.更新者?.value?.name || null,
          };

          const { error } = await supabase
            .from('invoices')
            .upsert(data as any, { onConflict: 'kintone_record_id' });

          if (error) {
            console.error(`エラー: 請求書 ${data.work_no} の取り込みに失敗:`, error.message);
            errors.push({ work_no: data.work_no, error: error.message });
            totalErrors++;
          } else {
            totalImported++;
          }
        } catch (err) {
          console.error(`エラー: 請求書の処理中にエラーが発生:`, err);
          errors.push({ invoice: invoice.$id.value, error: String(err) });
          totalErrors++;
        }
      }
    }

    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      totalRecords: allInvoices.length,
      imported: totalImported,
      errors: totalErrors,
      errorDetails: errors.slice(0, 10),
      supabaseCount: count
    });
  } catch (error) {
    console.error('取り込みエラー:', error);
    return NextResponse.json({
      error: '取り込み中にエラーが発生しました',
      details: String(error)
    }, { status: 500 });
  }
}
