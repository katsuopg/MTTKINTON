import { config } from 'dotenv';
import { KintoneClient } from '../src/lib/kintone/client';
import type { InvoiceRecord } from '../src/types/kintone';

// 環境変数を読み込む
config({ path: '.env.local' });

const APP_ID = '26';
const API_TOKEN = process.env.KINTONE_API_TOKEN_INVOICE || '';

async function checkKintoneView() {
  console.log('=== Kintoneビューとの相違調査 ===\n');
  
  const client = new KintoneClient(APP_ID, API_TOKEN);
  
  try {
    // スクリーンショットで見えている第9期の最初のレコード（W10-ALL-LIST）を探す
    console.log('【画像で見えているレコードの検索】');
    console.log('工事番号: 10-0135, 請求書番号: APM-6502...');
    
    // 特定のレコードを検索
    const searchQuery = '文字列__1行_ = "10-0135" and 文字列__1行__0 like "APM-65%"';
    const searchResult = await client.getRecords<InvoiceRecord>(searchQuery);
    console.log(`\n該当レコード数: ${searchResult.length}件`);
    
    if (searchResult.length > 0) {
      searchResult.forEach(record => {
        console.log(`\nレコードID: ${record.$id.value}`);
        console.log(`工事番号: ${record.文字列__1行_?.value}`);
        console.log(`請求書番号: ${record.文字列__1行__0?.value}`);
        console.log(`CS ID: ${record.文字列__1行__3?.value}`);
        console.log(`顧客名: ${record.CS_name?.value}`);
        console.log(`日付: ${record.日付?.value}`);
      });
    }
    
    // 第9期と第10期の境界を確認
    console.log('\n【会計期間の境界付近のレコード】');
    
    // 09-で始まる最後の方のレコード
    const last9Query = '文字列__1行_ like "09-%" order by 文字列__1行_ desc limit 5';
    const last9Records = await client.getRecords<InvoiceRecord>(last9Query);
    console.log('\n第9期の最後の方のレコード:');
    last9Records.forEach(record => {
      console.log(`  ${record.文字列__1行_?.value} - ${record.文字列__1行__0?.value} - ${record.日付?.value}`);
    });
    
    // 10-で始まる最初の方のレコード
    const first10Query = '文字列__1行_ like "10-%" order by 文字列__1行_ asc limit 5';
    const first10Records = await client.getRecords<InvoiceRecord>(first10Query);
    console.log('\n第10期の最初の方のレコード:');
    first10Records.forEach(record => {
      console.log(`  ${record.文字列__1行_?.value} - ${record.文字列__1行__0?.value} - ${record.日付?.value}`);
    });
    
    // Kintoneのビュー名「W10-ALL-LIST」から推測
    console.log('\n【推測】');
    console.log('スクリーンショットのビュー名が「W10-ALL-LIST」となっているため、');
    console.log('このビューが第10期専用で、何らかのフィルター条件が適用されている可能性があります。');
    console.log('また、第9期は別のビュー（例：W09-ALL-LIST）で管理されている可能性があります。');
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

checkKintoneView();