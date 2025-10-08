import { config } from 'dotenv';
import { KintoneClient } from '../src/lib/kintone/client';
import type { InvoiceRecord } from '../src/types/kintone';

// 環境変数を読み込む
config({ path: '.env.local' });

const APP_ID = '26';
const API_TOKEN = process.env.KINTONE_API_TOKEN_INVOICE || '';

async function finalCheckPeriod9() {
  console.log('=== 第9期の最終確認 ===\n');
  
  const client = new KintoneClient(APP_ID, API_TOKEN);
  
  try {
    const records = await client.getRecords<InvoiceRecord>('文字列__1行_ like "09-%" order by $id asc limit 500');
    
    console.log('【サマリー】');
    console.log(`APIで取得した総レコード数: ${records.length}件`);
    console.log(`Kintone W09-ALL-LISTの表示: 151件`);
    console.log(`差分: ${records.length - 151}件\n`);
    
    // 請求書番号でユニークカウント
    const uniqueInvoiceNos = new Set(records.map(r => r.文字列__1行__0?.value));
    console.log(`ユニークな請求書番号数: ${uniqueInvoiceNos.size}件`);
    
    // 工事番号でユニークカウント
    const uniqueWorkNos = new Set(records.map(r => r.文字列__1行_?.value));
    console.log(`ユニークな工事番号数: ${uniqueWorkNos.size}件`);
    
    // 工事番号＋請求書番号でユニークカウント
    const uniqueCombinations = new Set(records.map(r => 
      `${r.文字列__1行_?.value}|${r.文字列__1行__0?.value}`
    ));
    console.log(`ユニークな工事番号＋請求書番号の組み合わせ: ${uniqueCombinations.size}件`);
    
    // テストキャンセルされたレコードがあるか確認
    console.log('\n【特殊なステータスチェック】');
    
    // Paymentフィールドをチェック
    const paymentValues = new Set<string>();
    records.forEach(r => {
      if (r.Payment?.value) {
        paymentValues.add(r.Payment.value);
      }
    });
    console.log('Paymentフィールドの値:', Array.from(paymentValues).join(', ') || 'なし');
    
    // 文字列__1行__1（備考欄？）をチェック
    const remarksCount = records.filter(r => r.文字列__1行__1?.value).length;
    console.log(`文字列__1行__1（備考？）に値があるレコード: ${remarksCount}件`);
    
    // 添付ファイルの有無をチェック
    const withAttachment = records.filter(r => 
      r.添付ファイル_0?.value?.length > 0 || r.添付ファイル_1?.value?.length > 0
    ).length;
    console.log(`添付ファイルがあるレコード: ${withAttachment}件`);
    
    console.log('\n【結論】');
    console.log('1. 09-0099のAPM-6406015が重複（1件の差）');
    console.log('2. もう1件の差は、Kintoneビューの特殊なフィルター条件による可能性');
    console.log('3. または、ユニークな請求書番号でカウントしている可能性（152件）');
    console.log('4. Kintoneビューの正確な設定を確認する必要があります');
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

finalCheckPeriod9();