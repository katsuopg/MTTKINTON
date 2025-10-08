import { config } from 'dotenv';
import { KintoneClient } from '../src/lib/kintone/client';
import type { InvoiceRecord } from '../src/types/kintone';

// 環境変数を読み込む
config({ path: '.env.local' });

const APP_ID = '26';
const API_TOKEN = process.env.KINTONE_API_TOKEN_INVOICE || '';

async function findDuplicateCombinations() {
  console.log('=== 工事番号＋請求書番号の組み合わせ重複チェック ===\n');
  
  const client = new KintoneClient(APP_ID, API_TOKEN);
  
  try {
    const records = await client.getRecords<InvoiceRecord>('文字列__1行_ like "09-%" order by 文字列__1行_ asc limit 500');
    
    // 工事番号と請求書番号の組み合わせでユニークキーを作成
    const seenCombinations = new Map<string, InvoiceRecord>();
    const duplicatePairs: Array<[InvoiceRecord, InvoiceRecord]> = [];
    
    records.forEach(record => {
      const workNo = record.文字列__1行_?.value || '';
      const invoiceNo = record.文字列__1行__0?.value || '';
      const key = `${workNo}|${invoiceNo}`;
      
      if (seenCombinations.has(key)) {
        const firstRecord = seenCombinations.get(key)!;
        duplicatePairs.push([firstRecord, record]);
      } else {
        seenCombinations.set(key, record);
      }
    });
    
    console.log(`総レコード数: ${records.length}`);
    console.log(`ユニークな工事番号＋請求書番号の組み合わせ: ${seenCombinations.size}`);
    console.log(`重複している組み合わせ: ${duplicatePairs.length}件\n`);
    
    if (duplicatePairs.length > 0) {
      console.log('【重複の詳細】');
      duplicatePairs.forEach(([first, second], index) => {
        console.log(`\n${index + 1}. 工事番号: ${first.文字列__1行_?.value}, 請求書番号: ${first.文字列__1行__0?.value}`);
        console.log('   1つ目: レコードID=' + first.$id.value + ', 日付=' + first.日付?.value);
        console.log('   2つ目: レコードID=' + second.$id.value + ', 日付=' + second.日付?.value);
      });
    }
    
    console.log('\n【結論】');
    console.log(`APIで取得: ${records.length}件`);
    console.log(`ユニークな組み合わせ: ${seenCombinations.size}件`);
    console.log(`差分: ${records.length - seenCombinations.size}件が重複`);
    console.log('\nKintoneのW09-ALL-LISTビューは、工事番号と請求書番号の組み合わせで');
    console.log('重複を除外している可能性が高いです。');
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

findDuplicateCombinations();