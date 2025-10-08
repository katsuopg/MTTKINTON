import { config } from 'dotenv';
import { KintoneClient } from '../src/lib/kintone/client';
import type { InvoiceRecord } from '../src/types/kintone';

// 環境変数を読み込む
config({ path: '.env.local' });

const APP_ID = '26';
const API_TOKEN = process.env.KINTONE_API_TOKEN_INVOICE || '';

async function checkPeriod9Duplicates() {
  console.log('=== 第9期の重複データ詳細調査 ===\n');
  
  const client = new KintoneClient(APP_ID, API_TOKEN);
  
  try {
    // 第9期のデータを取得（09-パターン）
    const query = '文字列__1行_ like "09-%" order by 文字列__1行_ asc limit 500';
    const records = await client.getRecords<InvoiceRecord>(query);
    console.log(`第9期の総レコード数: ${records.length}件\n`);
    
    // 工事番号ごとにグループ化
    const groupedByWorkNo: Record<string, InvoiceRecord[]> = {};
    
    records.forEach(record => {
      const workNo = record.文字列__1行_?.value || '';
      if (!groupedByWorkNo[workNo]) {
        groupedByWorkNo[workNo] = [];
      }
      groupedByWorkNo[workNo].push(record);
    });
    
    // 重複している工事番号を抽出
    const duplicates = Object.entries(groupedByWorkNo)
      .filter(([_, records]) => records.length > 1)
      .sort(([a], [b]) => a.localeCompare(b));
    
    console.log(`重複している工事番号: ${duplicates.length}件\n`);
    console.log('='.repeat(120));
    
    // 重複データの詳細を表示
    duplicates.forEach(([workNo, records]) => {
      console.log(`\n工事番号: ${workNo} (${records.length}件の重複)`);
      console.log('-'.repeat(120));
      
      records.forEach((record, index) => {
        console.log(`  ${index + 1}. レコードID: ${record.$id.value}`);
        console.log(`     請求書番号: ${record.文字列__1行__0?.value || 'なし'}`);
        console.log(`     顧客名: ${record.CS_name?.value || 'なし'}`);
        console.log(`     請求日付: ${record.日付?.value || 'なし'}`);
        console.log(`     金額: ${formatAmount(record.計算?.value || record.total?.value || '0')}`);
        console.log(`     ステータス: ${record.ラジオボタン?.value || 'なし'}`);
        if (index < records.length - 1) console.log('');
      });
    });
    
    // サマリー
    console.log('\n' + '='.repeat(120));
    console.log('\nサマリー:');
    console.log(`- 第9期の総レコード数: ${records.length}件`);
    console.log(`- ユニークな工事番号数: ${Object.keys(groupedByWorkNo).length}件`);
    console.log(`- 重複している工事番号数: ${duplicates.length}件`);
    console.log(`- 重複によるレコード増加数: ${records.length - Object.keys(groupedByWorkNo).length}件`);
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

function formatAmount(value: string): string {
  const num = parseFloat(value || '0');
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' B';
}

checkPeriod9Duplicates();