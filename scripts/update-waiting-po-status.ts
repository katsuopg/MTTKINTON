import * as dotenv from 'dotenv';
import * as path from 'path';

// 環境変数を読み込む
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { updateCurrentPeriodWaitingPOToSent } from '../src/lib/kintone/quotation';

async function main() {
  console.log('Starting to update Waiting PO status to Sent for period 14...');
  
  // 環境変数の確認
  console.log('Environment check:');
  console.log('- KINTONE_DOMAIN:', process.env.KINTONE_DOMAIN ? 'Set' : 'Not set');
  console.log('- KINTONE_API_TOKEN_QUOTATION:', process.env.KINTONE_API_TOKEN_QUOTATION ? 'Set' : 'Not set');
  
  if (!process.env.KINTONE_DOMAIN || !process.env.KINTONE_API_TOKEN_QUOTATION) {
    console.error('Required environment variables are not set');
    process.exit(1);
  }
  
  try {
    await updateCurrentPeriodWaitingPOToSent();
    console.log('Update completed successfully!');
  } catch (error) {
    console.error('Failed to update statuses:', error);
    process.exit(1);
  }
}

main();