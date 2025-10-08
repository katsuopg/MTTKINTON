import dotenv from 'dotenv';
import path from 'path';

// 環境変数の読み込み
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { getCustomerRecords } from '../src/lib/kintone/customer';

// 全顧客データを取得してバッチ処理用のSQL生成
async function generateCustomerMigrationSQL() {
  console.log('=== 全顧客データの移行準備 ===\n');
  
  try {
    // Kintoneから全顧客データを取得（500件まで）
    const allCustomers = await getCustomerRecords();
    console.log(`Kintoneから${allCustomers.length}件の顧客データを取得しました\n`);

    // 10件ずつのバッチに分割
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < allCustomers.length; i += batchSize) {
      batches.push(allCustomers.slice(i, i + batchSize));
    }
    
    console.log(`${batches.length}個のバッチに分割しました（各バッチ最大${batchSize}件）\n`);

    // 各バッチのSQLを生成
    batches.forEach((batch, index) => {
      console.log(`-- バッチ ${index + 1}/${batches.length} (${batch.length}件)`);
      
      const values = batch.map(customer => {
        const kintone_record_id = customer.$id.value;
        const customer_id = customer.文字列__1行_.value.replace(/'/g, "''");
        const company_name = customer.会社名.value.replace(/'/g, "''");
        const customer_rank = customer.顧客ランク?.value || 'NULL';
        const country = customer.文字列__1行__4?.value ? `'${customer.文字列__1行__4.value.replace(/'/g, "''")}'` : 'NULL';
        const phone_number = customer.TEL?.value ? `'${customer.TEL.value.replace(/'/g, "''")}'` : 'NULL';
        const fax_number = customer.FAX?.value ? `'${customer.FAX.value.replace(/'/g, "''")}'` : 'NULL';
        const tax_id = customer.文字列__1行__11?.value ? `'${customer.文字列__1行__11.value.replace(/'/g, "''")}'` : 'NULL';
        const payment_terms = customer.ドロップダウン?.value ? `'${customer.ドロップダウン.value.replace(/'/g, "''")}'` : 'NULL';
        const address = customer.複数行__0?.value ? `'${customer.複数行__0.value.replace(/'/g, "''").replace(/\n/g, '\\n')}'` : 'NULL';
        const website_url = customer.リンク_ウェブサイト?.value ? `'${customer.リンク_ウェブサイト.value.replace(/'/g, "''")}'` : 'NULL';
        const notes = customer.文字列__複数行_?.value ? `'${customer.文字列__複数行_.value.replace(/'/g, "''").replace(/\n/g, '\\n')}'` : 'NULL';
        const created_by = customer.作成者?.value?.name ? `'${customer.作成者.value.name.replace(/'/g, "''")}'` : 'NULL';
        const updated_by = customer.更新者?.value?.name ? `'${customer.更新者.value.name.replace(/'/g, "''")}'` : 'NULL';
        
        return `('${kintone_record_id}', '${customer_id}', '${company_name}', ${customer_rank ? `'${customer_rank}'` : 'NULL'}, ${country}, ${phone_number}, ${fax_number}, ${tax_id}, ${payment_terms}, ${address}, ${website_url}, ${notes}, ${created_by}, ${updated_by})`;
      }).join(',\n  ');

      const sql = `INSERT INTO customers (
  kintone_record_id, customer_id, company_name, customer_rank,
  country, phone_number, fax_number, tax_id, payment_terms,
  address, website_url, notes, created_by, updated_by
) VALUES 
  ${values}
ON CONFLICT (kintone_record_id) DO UPDATE SET
  customer_id = EXCLUDED.customer_id,
  company_name = EXCLUDED.company_name,
  customer_rank = EXCLUDED.customer_rank,
  country = EXCLUDED.country,
  phone_number = EXCLUDED.phone_number,
  fax_number = EXCLUDED.fax_number,
  tax_id = EXCLUDED.tax_id,
  payment_terms = EXCLUDED.payment_terms,
  address = EXCLUDED.address,
  website_url = EXCLUDED.website_url,
  notes = EXCLUDED.notes,
  updated_by = EXCLUDED.updated_by,
  updated_at = NOW();`;

      console.log(sql);
      console.log('\n');
    });

    console.log(`-- 完了: 全${allCustomers.length}件の顧客データの移行SQLを生成しました`);
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

// 実行
generateCustomerMigrationSQL();