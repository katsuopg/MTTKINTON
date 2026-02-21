import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const KINTONE_DOMAIN = process.env.KINTONE_DOMAIN;
const KINTONE_API_TOKEN = process.env.KINTONE_API_TOKEN_SUPPLIER;
const KINTONE_APP_ID = process.env.KINTONE_APP_SUPPLIER_LIST;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface KintoneRecord {
  $id: { value: string };
  文字列__1行_: { value: string };      // 英語会社名
  会社名: { value: string };            // タイ語会社名
  TEL: { value: string };               // 電話番号
  FAX: { value: string };               // FAX
  文字列__1行__0: { value: string };    // メールアドレス
  住所: { value: string };              // 住所
}

async function fetchAllRecords(): Promise<KintoneRecord[]> {
  const allRecords: KintoneRecord[] = [];
  let offset = 0;
  const limit = 500;

  console.log(`Fetching from Kintone app ${KINTONE_APP_ID}...`);

  while (true) {
    const query = encodeURIComponent(`order by $id asc limit ${limit} offset ${offset}`);
    const url = `https://${KINTONE_DOMAIN}/k/v1/records.json?app=${KINTONE_APP_ID}&query=${query}&totalCount=true`;

    const response = await fetch(url, {
      headers: {
        'X-Cybozu-API-Token': KINTONE_API_TOKEN!,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Kintone API error:', text);
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = await response.json();
    const records = data.records as KintoneRecord[];
    const totalCount = parseInt(data.totalCount || '0');

    allRecords.push(...records);
    console.log(`Fetched ${allRecords.length} / ${totalCount} records`);

    if (records.length < limit || allRecords.length >= totalCount) {
      break;
    }

    offset += limit;
  }

  return allRecords;
}

async function migrate() {
  console.log('Starting supplier migration...\n');

  // Kintoneから全件取得
  const kintoneRecords = await fetchAllRecords();
  console.log(`\nTotal records from Kintone: ${kintoneRecords.length}`);

  // Supabase用にデータ変換
  const suppliers = kintoneRecords.map(record => ({
    supplier_id: `SP-${record.$id.value}`,
    company_name: record.会社名?.value || '',           // タイ語会社名
    company_name_en: record.文字列__1行_?.value || '',  // 英語会社名
    phone_number: record.TEL?.value || null,
    fax_number: record.FAX?.value || null,
    email: record.文字列__1行__0?.value || null,        // メールアドレス
    address: record.住所?.value || null,
    kintone_record_id: record.$id.value,
  }));

  console.log('\nSample data:');
  console.log(JSON.stringify(suppliers.slice(0, 2), null, 2));

  // Supabaseにupsert
  console.log('\nUpserting to Supabase...');
  const { error } = await supabase
    .from('suppliers')
    .upsert(suppliers, { onConflict: 'kintone_record_id' });

  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }

  // 確認
  const { count } = await supabase
    .from('suppliers')
    .select('*', { count: 'exact', head: true });

  console.log(`\nMigration completed! Total suppliers in Supabase: ${count}`);
}

migrate().catch(console.error);
