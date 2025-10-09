import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { getAllCustomerRecords } from '../src/lib/kintone/customer';
import { getAllInvoiceRecords } from '../src/lib/kintone/invoice';

const TARGET_COMPANY = process.argv[2] || 'Bangkok Pacific Steel Co.,Ltd.';

async function main() {
  const customers = await getAllCustomerRecords();
  const invoices = await getAllInvoiceRecords();

  const customerMatches = customers.filter((record) => record['会社名']?.value === TARGET_COMPANY);
  console.log(`顧客側の一致件数: ${customerMatches.length}`);
  customerMatches.forEach((record) => {
    console.log(' - customer_id:', record['文字列__1行_']?.value);
  });

  const invoiceMatches = invoices.filter((record) => record['CS_name']?.value === TARGET_COMPANY);
  console.log(`請求書側の一致件数: ${invoiceMatches.length}`);
  invoiceMatches.slice(0, 5).forEach((record, index) => {
    console.log(` - invoice[${index}] customer_id:`, record['文字列__1行__3']?.value);
  });
}

main().catch((error) => {
  console.error('調査中にエラーが発生しました:', error);
  process.exit(1);
});
