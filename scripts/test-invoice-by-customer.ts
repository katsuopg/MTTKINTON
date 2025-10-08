import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { getInvoiceRecordsByCustomer } from '../src/lib/kintone/invoice';

async function testInvoiceByCustomer() {
  console.log('=== Invoice by Customer API Test ===');
  
  // 顧客ID（CS ID）のサンプル
  const customerId = '57-014-SPT';
  const period = '14';
  
  try {
    console.log(`Testing with Customer ID: ${customerId}, Period: ${period}`);
    
    const records = await getInvoiceRecordsByCustomer(customerId, period);
    
    console.log(`\n=== Results ===`);
    console.log(`Records found: ${records.length}`);
    
    if (records.length > 0) {
      console.log(`\n=== First Record ===`);
      const first = records[0];
      console.log(`Work No: ${first.文字列__1行_?.value}`);
      console.log(`Invoice No: ${first.文字列__1行__0?.value}`);
      console.log(`Date: ${first.日付?.value}`);
      console.log(`CS ID: ${first.文字列__1行__3?.value}`);
      console.log(`Total: ${first.total?.value}`);
      console.log(`Final Amount: ${first.計算?.value}`);
    } else {
      console.log('\nNo records found for this customer/period combination.');
    }
  } catch (error) {
    console.error('Error testing invoice API:', error);
  }
}

testInvoiceByCustomer();
