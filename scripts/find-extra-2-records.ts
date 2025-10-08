import { config } from 'dotenv';
import { KintoneClient } from '../src/lib/kintone/client';
import type { InvoiceRecord } from '../src/types/kintone';

// 環境変数を読み込む
config({ path: '.env.local' });

const APP_ID = '26';
const API_TOKEN = process.env.KINTONE_API_TOKEN_INVOICE || '';

async function findExtra2Records() {
  console.log('=== 第9期の余分な2レコードを特定 ===\n');
  
  const client = new KintoneClient(APP_ID, API_TOKEN);
  
  try {
    // 第9期の全レコードを取得
    const query = '文字列__1行_ like "09-%" order by $id asc limit 500';
    const records = await client.getRecords<InvoiceRecord>(query);
    console.log(`APIで取得した第9期レコード数: ${records.length}件`);
    console.log(`Kintone W09-ALL-LISTの表示: 151件`);
    console.log(`差分: ${records.length - 151}件\n`);
    
    // 各種パターンで調査
    console.log('【調査1: ステータスによるフィルタリング】');
    const statusGroups: Record<string, InvoiceRecord[]> = {};
    records.forEach(record => {
      const status = record.ラジオボタン?.value || '未設定';
      if (!statusGroups[status]) {
        statusGroups[status] = [];
      }
      statusGroups[status].push(record);
    });
    
    Object.entries(statusGroups).forEach(([status, recs]) => {
      console.log(`${status}: ${recs.length}件`);
    });
    
    // 特殊なレコードを探す
    console.log('\n【調査2: 特殊なパターンの検出】');
    
    // CS_nameが空のレコード
    const emptyCustomerName = records.filter(r => !r.CS_name?.value || r.CS_name.value === '');
    console.log(`顧客名が空のレコード: ${emptyCustomerName.length}件`);
    if (emptyCustomerName.length > 0) {
      emptyCustomerName.forEach(r => {
        console.log(`  - レコードID: ${r.$id.value}, 工事番号: ${r.文字列__1行_?.value}`);
      });
    }
    
    // 請求書番号が空のレコード
    const emptyInvoiceNo = records.filter(r => !r.文字列__1行__0?.value || r.文字列__1行__0.value === '');
    console.log(`\n請求書番号が空のレコード: ${emptyInvoiceNo.length}件`);
    if (emptyInvoiceNo.length > 0) {
      emptyInvoiceNo.forEach(r => {
        console.log(`  - レコードID: ${r.$id.value}, 工事番号: ${r.文字列__1行_?.value}`);
      });
    }
    
    // 金額が0または空のレコード
    const zeroAmount = records.filter(r => {
      const amount = parseFloat(r.計算?.value || r.total?.value || '0');
      return amount === 0;
    });
    console.log(`\n金額が0のレコード: ${zeroAmount.length}件`);
    if (zeroAmount.length > 0) {
      zeroAmount.forEach(r => {
        console.log(`  - レコードID: ${r.$id.value}, 工事番号: ${r.文字列__1行_?.value}, 顧客: ${r.CS_name?.value}`);
      });
    }
    
    // 日付が異常なレコード
    const invalidDates = records.filter(r => {
      const date = r.日付?.value;
      if (!date) return true;
      const year = date.substring(0, 4);
      return year !== '2020' && year !== '2021';
    });
    console.log(`\n日付が2020-2021年度以外のレコード: ${invalidDates.length}件`);
    if (invalidDates.length > 0) {
      invalidDates.forEach(r => {
        console.log(`  - レコードID: ${r.$id.value}, 工事番号: ${r.文字列__1行_?.value}, 日付: ${r.日付?.value}`);
      });
    }
    
    // 最も新しい2つのレコード（最後に追加された可能性）
    console.log('\n【調査3: 最後に追加されたレコード】');
    const sortedById = [...records].sort((a, b) => parseInt(b.$id.value) - parseInt(a.$id.value));
    console.log('レコードIDが大きい順（最新順）TOP 5:');
    sortedById.slice(0, 5).forEach(r => {
      console.log(`  - ID: ${r.$id.value}, 工事番号: ${r.文字列__1行_?.value}, 請求書番号: ${r.文字列__1行__0?.value}, 作成日時: ${r.作成日時?.value}`);
    });
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

findExtra2Records();