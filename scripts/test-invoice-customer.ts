import { getInvoiceRecordsByCustomer } from '../src/lib/kintone/invoice';
import dotenv from 'dotenv';

// .env.localファイルを読み込む
dotenv.config({ path: '.env.local' });

async function testInvoiceByCustomer() {
  try {
    console.log('=== 請求書データ取得テスト（顧客名ベース）===');
    
    // テスト用の顧客名（請求書データが存在する顧客）
    const testCustomerName = 'SUGINO PRESS (THAILAND) CO.,LTD.';
    console.log('\n1. 顧客名:', testCustomerName);
    
    // 全期間の請求書を取得
    console.log('\n2. 全期間の請求書データ取得中...');
    const allInvoices = await getInvoiceRecordsByCustomer(testCustomerName);
    console.log('取得件数:', allInvoices.length);
    
    if (allInvoices.length > 0) {
      console.log('\n最初の3件のデータ:');
      allInvoices.slice(0, 3).forEach((invoice, index) => {
        console.log(`\n[${index + 1}] 請求書番号: ${invoice.文字列__1行__0?.value || '-'}`);
        console.log(`    工事番号: ${invoice.文字列__1行_?.value || '-'}`);
        console.log(`    顧客名: ${invoice.CS_name?.value || '-'}`);
        console.log(`    請求日: ${invoice.日付?.value || '-'}`);
        console.log(`    合計: ${invoice.total?.value || '0'}`);
      });
    }
    
    // 第14期の請求書を取得
    console.log('\n3. 第14期の請求書データ取得中...');
    const period14Invoices = await getInvoiceRecordsByCustomer(testCustomerName, '14');
    console.log('第14期の取得件数:', period14Invoices.length);
    
    if (period14Invoices.length > 0) {
      console.log('\n第14期の最初のデータ:');
      const invoice = period14Invoices[0];
      console.log(`請求書番号: ${invoice.文字列__1行__0?.value || '-'}`);
      console.log(`工事番号: ${invoice.文字列__1行_?.value || '-'}`);
      console.log(`顧客名: ${invoice.CS_name?.value || '-'}`);
    }
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// スクリプトを実行
testInvoiceByCustomer();