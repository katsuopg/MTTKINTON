import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { KintoneClient } from '../src/lib/kintone/client';
import { WorkNoRecord } from '../types/kintone';
import { KINTONE_APPS } from '../types/kintone';

async function updateWaitingPOToWorking() {
  // 環境変数から直接取得
  const APP_ID = process.env.KINTONE_APP_WORK_NO || '21';
  const API_TOKEN = process.env.KINTONE_API_TOKEN_WORKNO || '';
  
  console.log('デバッグ情報:');
  console.log('- WORK_NO APP_ID:', APP_ID);
  console.log('- API_TOKEN長さ:', API_TOKEN.length);
  
  const client = new KintoneClient(APP_ID, API_TOKEN);
  
  try {
    // まず「Wating PO」ステータスのレコードを取得（注意：スペルミス）
    console.log('=== 工事番号アプリで「Wating PO」ステータスのレコードを検索中... ===');
    const records = await client.getRecords<WorkNoRecord>('Status in ("Wating PO") limit 500');
    
    console.log(`対象レコード数: ${records.length}件\n`);
    
    if (records.length === 0) {
      console.log('更新対象のレコードがありません。');
      return;
    }
    
    // 確認のため最初の5件を表示
    console.log('=== 更新対象レコード（最初の5件）===');
    records.slice(0, 5).forEach(record => {
      console.log(`${record.WorkNo?.value || '-'}: Wating PO → Working`);
    });
    
    // ユーザーに確認
    console.log(`\n本当に${records.length}件のレコードを更新しますか？ (実行中...)`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待機
    
    // 更新データの準備
    const updateRecords = records.map(record => ({
      id: record.$id.value,
      record: {
        Status: { value: 'Working' }
      }
    }));
    
    // 100件ずつバッチ更新（Kintone APIの制限）
    const batchSize = 100;
    let updatedCount = 0;
    
    console.log('\n=== 更新実行中... ===');
    for (let i = 0; i < updateRecords.length; i += batchSize) {
      const batch = updateRecords.slice(i, i + batchSize);
      
      const domain = process.env.KINTONE_DOMAIN || '';
      if (!domain) {
        throw new Error('KINTONE_DOMAIN environment variable is not set');
      }
      
      const response = await fetch(`https://${domain}/k/v1/records.json`, {
        method: 'PUT',
        headers: {
          'X-Cybozu-API-Token': API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          app: APP_ID,
          records: batch
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Update failed: ${JSON.stringify(error)}`);
      }
      
      updatedCount += batch.length;
      console.log(`更新進捗: ${updatedCount}/${updateRecords.length}件`);
    }
    
    console.log(`\n✅ 更新完了: ${updatedCount}件のレコードを「Wating PO」から「Working」に変更しました。`);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

// 実行
updateWaitingPOToWorking();