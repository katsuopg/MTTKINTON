import { config } from 'dotenv';
import { KintoneClient } from '../src/lib/kintone/client';
import type { InvoiceRecord } from '../src/types/kintone';

// 環境変数を読み込む
config({ path: '.env.local' });

const APP_ID = '26';
const API_TOKEN = process.env.KINTONE_API_TOKEN_INVOICE || '';

async function checkMissingRecords() {
  console.log('=== 欠番レコードの調査 ===\n');
  
  const client = new KintoneClient(APP_ID, API_TOKEN);
  
  try {
    // 画像で見えている10-0135を別の方法で検索
    console.log('【10-0135の検索（別アプローチ）】');
    
    // CS IDで検索
    const csIdQuery = '文字列__1行__3 = "55-0135"';
    const csIdResult = await client.getRecords<InvoiceRecord>(csIdQuery);
    console.log(`CS ID "55-0135"での検索結果: ${csIdResult.length}件`);
    
    // 部分一致で検索
    const partialQuery = '文字列__1行_ like "%0135%"';
    const partialResult = await client.getRecords<InvoiceRecord>(partialQuery);
    console.log(`\n"0135"を含む工事番号: ${partialResult.length}件`);
    partialResult.forEach(record => {
      console.log(`  ${record.文字列__1行_?.value} - ${record.文字列__1行__0?.value} - ${record.CS_name?.value}`);
    });
    
    // 第9期の欠番確認
    console.log('\n【第9期の工事番号連番確認】');
    const all9Records = await client.getRecords<InvoiceRecord>('文字列__1行_ like "09-%" order by 文字列__1行_ asc limit 500');
    const workNos9 = [...new Set(all9Records.map(r => r.文字列__1行_?.value))].sort();
    
    // 連番の欠番をチェック
    const missing9: string[] = [];
    for (let i = 1; i <= 143; i++) {
      const workNo = `09-${String(i).padStart(4, '0')}`;
      if (!workNos9.includes(workNo)) {
        missing9.push(workNo);
      }
    }
    console.log(`第9期の欠番数: ${missing9.length}件`);
    if (missing9.length > 0 && missing9.length <= 10) {
      console.log('欠番リスト:', missing9.join(', '));
    }
    
    // 第10期の欠番確認
    console.log('\n【第10期の工事番号連番確認】');
    const all10Records = await client.getRecords<InvoiceRecord>('文字列__1行_ like "10-%" order by 文字列__1行_ asc limit 500');
    const workNos10 = [...new Set(all10Records.map(r => r.文字列__1行_?.value))].sort();
    
    // 10-0135が含まれているか確認
    console.log(`\n10-0135は存在する？: ${workNos10.includes('10-0135') ? 'はい' : 'いいえ'}`);
    
    // 連番の欠番をチェック（最初の20件のみ）
    const missing10: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const workNo = `10-${String(i).padStart(4, '0')}`;
      if (!workNos10.includes(workNo)) {
        missing10.push(workNo);
      }
    }
    console.log(`第10期の欠番（1-20）: ${missing10.length}件`);
    if (missing10.length > 0) {
      console.log('欠番リスト:', missing10.join(', '));
    }
    
    console.log('\n【結論】');
    console.log('Kintone側のビューには別のフィルター条件があるか、');
    console.log('または異なるアプリケーションのデータを表示している可能性があります。');
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

checkMissingRecords();