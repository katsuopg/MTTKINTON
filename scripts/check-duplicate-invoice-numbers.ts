import { config } from 'dotenv';
import { KintoneClient } from '../src/lib/kintone/client';
import type { InvoiceRecord } from '../src/types/kintone';

// 環境変数を読み込む
config({ path: '.env.local' });

const APP_ID = '26';
const API_TOKEN = process.env.KINTONE_API_TOKEN_INVOICE || '';

async function checkDuplicateInvoiceNumbers() {
  console.log('=== 請求書番号の重複チェック ===\n');
  
  const client = new KintoneClient(APP_ID, API_TOKEN);
  
  try {
    // 第9期の全レコードを取得
    const query = '文字列__1行_ like "09-%" order by 文字列__1行__0 asc limit 500';
    const records = await client.getRecords<InvoiceRecord>(query);
    
    // 請求書番号でグループ化
    const invoiceNoGroups: Record<string, InvoiceRecord[]> = {};
    records.forEach(record => {
      const invoiceNo = record.文字列__1行__0?.value || '';
      if (!invoiceNoGroups[invoiceNo]) {
        invoiceNoGroups[invoiceNo] = [];
      }
      invoiceNoGroups[invoiceNo].push(record);
    });
    
    // 請求書番号が重複しているものを探す
    const duplicateInvoiceNos = Object.entries(invoiceNoGroups)
      .filter(([invoiceNo, recs]) => invoiceNo && recs.length > 1);
    
    console.log(`請求書番号が重複しているケース: ${duplicateInvoiceNos.length}件\n`);
    
    if (duplicateInvoiceNos.length > 0) {
      duplicateInvoiceNos.forEach(([invoiceNo, recs]) => {
        console.log(`請求書番号: ${invoiceNo} (${recs.length}件の重複)`);
        recs.forEach(r => {
          console.log(`  - レコードID: ${r.$id.value}`);
          console.log(`    工事番号: ${r.文字列__1行_?.value}`);
          console.log(`    顧客名: ${r.CS_name?.value}`);
          console.log(`    日付: ${r.日付?.value}`);
          console.log(`    作成日時: ${r.作成日時?.value}`);
        });
        console.log('');
      });
    }
    
    // レコードIDの連続性をチェック
    console.log('【レコードIDの飛び番チェック】');
    const recordIds = records.map(r => parseInt(r.$id.value)).sort((a, b) => a - b);
    const gaps: number[] = [];
    
    for (let i = 1; i < recordIds.length; i++) {
      if (recordIds[i] - recordIds[i-1] > 1) {
        gaps.push(recordIds[i-1] + 1);
      }
    }
    
    if (gaps.length > 0) {
      console.log(`レコードIDに飛び番があります: ${gaps.length}箇所`);
      console.log('飛び番のID例:', gaps.slice(0, 5).join(', '));
    }
    
    console.log('\n【推測】');
    console.log('可能性1: 同じ請求書番号で複数のレコードが作成され、Kintone側では重複を除外している');
    console.log('可能性2: KintoneのビューでレコードIDによる除外フィルターが設定されている');
    console.log('可能性3: 作成日時やその他の非表示フィールドによるフィルタリング');
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

checkDuplicateInvoiceNumbers();