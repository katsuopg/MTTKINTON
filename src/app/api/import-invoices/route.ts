import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getInvoiceRecords } from '@/lib/kintone/invoice';

// 全請求書データをSupabaseに取り込むAPIルート
export async function POST() {
  const supabase = await createClient();

  // ユーザー認証チェック
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    // Kintoneから全請求書データを取得
    const allInvoices = await getInvoiceRecords();
    console.log(`Kintoneから${allInvoices.length}件の請求書データを取得しました`);

    // 10件ずつのバッチに分割して処理
    const batchSize = 10;
    let totalImported = 0;
    let totalErrors = 0;
    const errors: any[] = [];
    
    for (let i = 0; i < allInvoices.length; i += batchSize) {
      const batch = allInvoices.slice(i, i + batchSize);
      console.log(`バッチ ${Math.floor(i / batchSize) + 1}/${Math.ceil(allInvoices.length / batchSize)} (${batch.length}件) を処理中...`);
      
      // バッチ内の各請求書を処理
      for (const invoice of batch) {
        try {
          const data = {
            kintone_record_id: invoice.$id.value,
            work_no: invoice.WORK_NO.value,
            invoice_no: invoice.INVOICE_NO?.value || null,
            invoice_date: invoice.INVOICE_DATE?.value || null,
            delivery_date: invoice.DELIVERY_DATE?.value || null,
            customer_name: invoice.会社名.value,
            customer_ref_no: invoice.客先管理番号?.value || null,
            description: invoice.DESCRIPTION?.value || null,
            tax_rate: parseFloat(invoice.税率?.value || '0') / 100, // パーセントから小数に変換
            total_amount: parseFloat(invoice.合計金額.value || '0'),
            tax_amount: parseFloat(invoice.消費税金額?.value || '0'),
            grand_total: parseFloat(invoice.TOTAL.value || '0'),
            period: invoice.PERIOD?.value || null,
            status: invoice.処理状況?.value || null,
            created_by: invoice.作成者?.value?.name || null,
            updated_by: invoice.更新者?.value?.name || null,
          };

          // Supabaseにupsert（存在する場合は更新、存在しない場合は挿入）
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await supabase
            .from('invoices')
            .upsert(data as any, {
              onConflict: 'kintone_record_id'
            });

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

    // 取り込み後の件数確認
    const { count, error: countError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    const result = {
      success: true,
      totalRecords: allInvoices.length,
      imported: totalImported,
      errors: totalErrors,
      errorDetails: errors.slice(0, 10), // 最初の10件のエラーのみ返す
      supabaseCount: count
    };

    console.log(`完了: 成功 ${totalImported}件、エラー ${totalErrors}件`);
    return NextResponse.json(result);

  } catch (error) {
    console.error('取り込みエラー:', error);
    return NextResponse.json({ 
      error: '取り込み中にエラーが発生しました', 
      details: String(error) 
    }, { status: 500 });
  }
}