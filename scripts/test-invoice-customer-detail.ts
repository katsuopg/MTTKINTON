import { config } from 'dotenv';
import { getCustomerById } from '../src/lib/kintone/customer';
import { getInvoiceRecordsByCustomer } from '../src/lib/kintone/invoice';

// 環境変数を読み込む
config({ path: '.env.local' });

// 環境変数が正しく読み込まれているか確認
console.log('環境変数チェック:');
console.log('KINTONE_DOMAIN:', process.env.KINTONE_DOMAIN);
console.log('KINTONE_API_TOKEN_CUSTOMER:', process.env.KINTONE_API_TOKEN_CUSTOMER ? 'Set' : 'Not set');
console.log('KINTONE_API_TOKEN_INVOICE:', process.env.KINTONE_API_TOKEN_INVOICE ? 'Set' : 'Not set');

async function testInvoiceCustomerDetail() {
  console.log('=== 顧客詳細ページの請求書データ取得テスト ===\n');
  
  try {
    // SUGINO PRESS (64-001) のデータで確認
    const customerId = '125'; // SUGINO PRESSのレコードID
    
    console.log('1. 顧客情報を取得');
    const customerRecord = await getCustomerById(customerId);
    console.log('顧客名:', customerRecord.会社名?.value);
    console.log('CS ID:', customerRecord.文字列__1行_?.value);
    
    console.log('\n2. 第14期の請求書データを取得');
    const invoice14 = await getInvoiceRecordsByCustomer(customerRecord.会社名.value, '14');
    console.log('第14期レコード数:', invoice14.length);
    if (invoice14.length > 0) {
      console.log('最初のレコード:', {
        工事番号: invoice14[0].文字列__1行_?.value,
        請求書番号: invoice14[0].文字列__1行__0?.value,
        顧客名: invoice14[0].CS_name?.value
      });
    }
    
    console.log('\n3. 第9期の請求書データを取得');
    const invoice9 = await getInvoiceRecordsByCustomer(customerRecord.会社名.value, '9');
    console.log('第9期レコード数:', invoice9.length);
    if (invoice9.length > 0) {
      console.log('最初のレコード:', {
        工事番号: invoice9[0].文字列__1行_?.value,
        請求書番号: invoice9[0].文字列__1行__0?.value,
        顧客名: invoice9[0].CS_name?.value
      });
    }
    
    console.log('\n4. 全期間の請求書データを取得');
    const invoiceAll = await getInvoiceRecordsByCustomer(customerRecord.会社名.value);
    console.log('全期間レコード数:', invoiceAll.length);
    
    // 期間別に集計
    const periodCounts: Record<string, number> = {};
    invoiceAll.forEach((invoice) => {
      const workNo = invoice.文字列__1行_?.value || '';
      const match = workNo.match(/^(\d+)-/);
      if (match) {
        const period = match[1];
        periodCounts[period] = (periodCounts[period] || 0) + 1;
      }
    });
    
    console.log('\n期間別レコード数:');
    Object.keys(periodCounts).sort((a, b) => parseInt(a) - parseInt(b)).forEach(period => {
      console.log(`  第${period}期: ${periodCounts[period]}件`);
    });
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

testInvoiceCustomerDetail();