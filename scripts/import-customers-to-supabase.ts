import dotenv from 'dotenv';
import path from 'path';

// 環境変数の読み込み
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { getCustomerRecords } from '../src/lib/kintone/customer';
import { createClient } from '@supabase/supabase-js';

// Supabase クライアントの作成
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // サービスロールキーを使用
);

// 全顧客データをSupabaseに取り込む
async function importAllCustomersToSupabase() {
  console.log('=== 全顧客データのSupabaseへの取り込み開始 ===\n');
  
  try {
    // Kintoneから全顧客データを取得（500件まで）
    const allCustomers = await getCustomerRecords();
    console.log(`Kintoneから${allCustomers.length}件の顧客データを取得しました\n`);

    // 10件ずつのバッチに分割して処理
    const batchSize = 10;
    let totalImported = 0;
    let totalErrors = 0;
    
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
            totalErrors++;
          } else {
            totalImported++;
          }
        } catch (err) {
          console.error(`エラー: 顧客の処理中にエラーが発生:`, err);
          totalErrors++;
        }
      }
      
      console.log(`バッチ ${Math.floor(i / batchSize) + 1} 完了`);
    }

    console.log(`\n=== 完了 ===`);
    console.log(`成功: ${totalImported}件`);
    console.log(`エラー: ${totalErrors}件`);
    console.log(`合計: ${allCustomers.length}件\n`);

    // 取り込み後の件数確認
    const { count, error: countError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (!countError && count !== null) {
      console.log(`Supabaseの顧客テーブルには現在 ${count} 件のデータがあります`);
    }

  } catch (error) {
    console.error('エラー:', error);
  }
}

// 実行
importAllCustomersToSupabase();