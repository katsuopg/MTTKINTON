import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { getCustomerRecords } from '@/lib/kintone/customer';

// 全顧客データをSupabaseに取り込むAPIルート
export async function POST() {
  const supabase = await createClient();

  // ユーザー認証チェック
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    // Kintoneから全顧客データを取得
    const allCustomers = await getCustomerRecords();
    console.log(`Kintoneから${allCustomers.length}件の顧客データを取得しました`);

    // 10件ずつのバッチに分割して処理
    const batchSize = 10;
    let totalImported = 0;
    let totalErrors = 0;
    const errors: any[] = [];
    
    for (let i = 0; i < allCustomers.length; i += batchSize) {
      const batch = allCustomers.slice(i, i + batchSize);
      console.log(`バッチ ${Math.floor(i / batchSize) + 1}/${Math.ceil(allCustomers.length / batchSize)} (${batch.length}件) を処理中...`);
      
      // バッチ内の各顧客を処理
      for (const customer of batch) {
        try {
          const data = {
            kintone_record_id: customer.$id.value,
            customer_id: customer.文字列__1行_.value,
            company_name: customer.会社名.value,
            customer_rank: customer.顧客ランク?.value || null,
            country: customer.文字列__1行__4?.value || null,
            phone_number: customer.TEL?.value || null,
            fax_number: customer.FAX?.value || null,
            tax_id: customer.文字列__1行__11?.value || null,
            payment_terms: customer.ドロップダウン?.value || null,
            address: customer.複数行__0?.value || null,
            website_url: customer.リンク_ウェブサイト?.value || null,
            notes: customer.文字列__複数行_?.value || null,
            created_by: customer.作成者?.value?.name || null,
            updated_by: customer.更新者?.value?.name || null,
          };

          // Supabaseにupsert（存在する場合は更新、存在しない場合は挿入）
          const { error } = await supabase
            .from('customers')
            .upsert(data, {
              onConflict: 'kintone_record_id'
            });

          if (error) {
            console.error(`エラー: 顧客ID ${data.customer_id} の取り込みに失敗:`, error.message);
            errors.push({ customer_id: data.customer_id, error: error.message });
            totalErrors++;
          } else {
            totalImported++;
          }
        } catch (err) {
          console.error(`エラー: 顧客の処理中にエラーが発生:`, err);
          errors.push({ customer: customer.$id.value, error: String(err) });
          totalErrors++;
        }
      }
    }

    // 取り込み後の件数確認
    const { count, error: countError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    const result = {
      success: true,
      totalRecords: allCustomers.length,
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