import * as dotenv from 'dotenv';
import * as path from 'path';

// 環境変数を読み込む
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { KintoneClient } from '../src/lib/kintone/client';
import { QuotationRecord } from '../types/kintone';
import { KINTONE_APPS } from '../types/kintone';

async function main() {
  console.log('Checking quotation statuses...');
  
  const APP_ID = KINTONE_APPS.QUOTATION.appId;
  const API_TOKEN = process.env.KINTONE_API_TOKEN_QUOTATION || '';
  
  const client = new KintoneClient(APP_ID.toString(), API_TOKEN);
  
  try {
    // すべての見積レコードを取得（最大100件）
    const records = await client.getRecords<QuotationRecord>('order by レコード番号 desc limit 100');
    
    // ステータスの種類を収集
    const statuses = new Set<string>();
    records.forEach(record => {
      if (record.ドロップダウン?.value) {
        statuses.add(record.ドロップダウン.value);
      }
    });
    
    console.log('\nFound statuses:');
    Array.from(statuses).sort().forEach(status => {
      console.log(`- "${status}"`);
    });
    
    // Waiting POのレコードを確認
    const waitingPORecords = records.filter(r => r.ドロップダウン?.value === 'Waiting PO');
    console.log(`\nWaiting PO records: ${waitingPORecords.length}`);
    
    if (waitingPORecords.length > 0) {
      console.log('Sample record:', {
        id: waitingPORecords[0].$id.value,
        qtno: waitingPORecords[0].qtno2?.value,
        status: waitingPORecords[0].ドロップダウン?.value
      });
    }
    
  } catch (error) {
    console.error('Failed to fetch records:', error);
  }
}

main();