import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { KintoneClient } from '../src/lib/kintone/client';
import { QuotationRecord } from '../types/kintone';
import { KINTONE_APPS } from '../types/kintone';

async function main() {
  const APP_ID = KINTONE_APPS.QUOTATION.appId;
  const API_TOKEN = process.env.KINTONE_API_TOKEN_QUOTATION || '';
  
  const client = new KintoneClient(APP_ID.toString(), API_TOKEN);
  
  try {
    const records = await client.getRecords<QuotationRecord>('order by レコード番号 desc limit 1');
    
    if (records.length > 0) {
      console.log('Sample Quotation Record Fields:');
      console.log('=====================================');
      const record = records[0];
      Object.keys(record).forEach(key => {
        const value = (record as any)[key];
        if (value && typeof value === 'object' && 'value' in value) {
          console.log(`${key}: "${value.value}" (type: ${value.type})`);
        }
      });
    }
    
  } catch (error) {
    console.error('Failed to fetch records:', error);
  }
}

main();