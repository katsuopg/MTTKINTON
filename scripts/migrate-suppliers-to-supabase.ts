import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { KintoneClient } from '../src/lib/kintone/client';

dotenv.config({ path: '.env.local' });

interface SupplierRecord {
  $id: { value: string };
  レコード番号: { value: string };
  文字列__1行_: { value: string }; // 英語名
  会社名: { value: string }; // タイ語名
  TEL: { value: string };
  FAX?: { value: string };
  MAIL?: { value: string };
  文字列__複数行_?: { value: string }; // 住所
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function migrateSuppliers() {
  console.log('Starting supplier migration from Kintone to Supabase...');
  
  try {
    // Kintoneから仕入業者データを取得
    const kintoneClient = new KintoneClient(
      process.env.KINTONE_APP_SUPPLIER_LIST!,
      process.env.KINTONE_API_TOKEN_SUPPLIER!
    );
    
    const suppliers = await kintoneClient.getRecords<SupplierRecord>('order by レコード番号 asc limit 500');
    console.log(`Found ${suppliers.length} suppliers in Kintone`);
    
    // Supabaseに挿入するデータを準備
    const suppliersToInsert = suppliers.map((supplier, index) => ({
      supplier_id: `SUP-${(index + 1).toString().padStart(3, '0')}`, // SUP-001形式
      company_name: supplier.会社名.value,
      company_name_en: supplier.文字列__1行_.value || null,
      phone_number: supplier.TEL.value || null,
      fax_number: supplier.FAX?.value || null,
      email: supplier.MAIL?.value || null,
      address: supplier.文字列__複数行_?.value || null,
      kintone_record_id: supplier.$id.value
    }));
    
    // バッチで挿入（既存のレコードはスキップ）
    const batchSize = 50;
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < suppliersToInsert.length; i += batchSize) {
      const batch = suppliersToInsert.slice(i, i + batchSize);
      
      for (const supplier of batch) {
        const { data: existing } = await supabase
          .from('suppliers')
          .select('id')
          .eq('kintone_record_id', supplier.kintone_record_id)
          .single();
        
        if (existing) {
          console.log(`Skipping existing supplier: ${supplier.company_name_en || supplier.company_name}`);
          skippedCount++;
          continue;
        }
        
        const { error } = await supabase
          .from('suppliers')
          .insert(supplier);
        
        if (error) {
          console.error(`Error inserting supplier ${supplier.company_name_en || supplier.company_name}:`, error);
        } else {
          console.log(`Inserted: ${supplier.company_name_en || supplier.company_name}`);
          insertedCount++;
        }
      }
    }
    
    console.log(`Migration completed!`);
    console.log(`- Total suppliers: ${suppliers.length}`);
    console.log(`- Inserted: ${insertedCount}`);
    console.log(`- Skipped (already exist): ${skippedCount}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// 実行
migrateSuppliers();