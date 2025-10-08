import { config } from 'dotenv';
import { KintoneClient } from '../src/lib/kintone/client';
import type { InvoiceRecord } from '../src/types/kintone';

// 環境変数を読み込む
config({ path: '.env.local' });

const APP_ID = '26';
const API_TOKEN = process.env.KINTONE_API_TOKEN_INVOICE || '';

async function investigateRecordDiff() {
  console.log('=== レコード数相違の詳細調査 ===\n');
  
  const client = new KintoneClient(APP_ID, API_TOKEN);
  
  try {
    // 第9期のデータ調査
    console.log('【第9期の調査】');
    const records9 = await client.getRecords<InvoiceRecord>('文字列__1行_ like "09-%" order by $id asc limit 500');
    console.log(`APIで取得したレコード数: ${records9.length}件`);
    
    // レコードIDの範囲を確認
    const recordIds9 = records9.map(r => parseInt(r.$id.value)).sort((a, b) => a - b);
    console.log(`レコードIDの範囲: ${recordIds9[0]} 〜 ${recordIds9[recordIds9.length - 1]}`);
    
    // ステータス別集計
    const statusCount9: Record<string, number> = {};
    records9.forEach(record => {
      const status = record.ラジオボタン?.value || '未設定';
      statusCount9[status] = (statusCount9[status] || 0) + 1;
    });
    console.log('\nステータス別件数:');
    Object.entries(statusCount9).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}件`);
    });
    
    // 削除フラグや特殊なフィールドを確認
    console.log('\n特殊なフィールドの確認:');
    const sampleRecord = records9[0];
    Object.keys(sampleRecord).forEach(key => {
      if (key.includes('削除') || key.includes('delete') || key.includes('hidden') || key.includes('表示')) {
        console.log(`  ${key}: ${(sampleRecord as any)[key]?.value}`);
      }
    });
    
    // 第10期のデータ調査
    console.log('\n【第10期の調査】');
    const records10 = await client.getRecords<InvoiceRecord>('文字列__1行_ like "10-%" order by $id asc limit 500');
    console.log(`APIで取得したレコード数: ${records10.length}件`);
    
    // レコードIDの範囲を確認
    const recordIds10 = records10.map(r => parseInt(r.$id.value)).sort((a, b) => a - b);
    console.log(`レコードIDの範囲: ${recordIds10[0]} 〜 ${recordIds10[recordIds10.length - 1]}`);
    
    // ステータス別集計
    const statusCount10: Record<string, number> = {};
    records10.forEach(record => {
      const status = record.ラジオボタン?.value || '未設定';
      statusCount10[status] = (statusCount10[status] || 0) + 1;
    });
    console.log('\nステータス別件数:');
    Object.entries(statusCount10).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}件`);
    });
    
    // 全フィールドを確認（最初のレコード）
    console.log('\n【レコードの全フィールド（サンプル）】');
    if (records9.length > 0) {
      const fields = Object.keys(records9[0]).filter(key => !key.startsWith('$'));
      console.log('フィールド一覧:', fields.join(', '));
    }
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

investigateRecordDiff();