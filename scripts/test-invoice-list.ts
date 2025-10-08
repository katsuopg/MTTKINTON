import { getInvoiceRecords } from '../src/lib/kintone/invoice';
import dotenv from 'dotenv';

// .env.localファイルを読み込む
dotenv.config({ path: '.env.local' });

async function testInvoiceList() {
  try {
    console.log('=== 請求書一覧取得テスト ===');
    
    // 請求書一覧を取得（最初の10件）
    const invoices = await getInvoiceRecords(10);
    console.log('取得件数:', invoices.length);
    
    if (invoices.length > 0) {
      console.log('\n取得した請求書データ:');
      invoices.forEach((invoice, index) => {
        console.log(`\n[${index + 1}] 請求書番号: ${invoice.文字列__1行__0?.value || '-'}`);
        console.log(`    工事番号: ${invoice.文字列__1行_?.value || '-'}`);
        console.log(`    顧客名: ${invoice.CS_name?.value || '-'}`);
        console.log(`    CS ID: ${invoice.文字列__1行__3?.value || '-'}`);
        console.log(`    請求日: ${invoice.日付?.value || '-'}`);
      });
      
      // 顧客名のユニークリストを作成
      const uniqueCustomers = [...new Set(invoices.map(inv => inv.CS_name?.value).filter(Boolean))];
      console.log('\n=== 顧客名リスト ===');
      uniqueCustomers.forEach((name, index) => {
        console.log(`${index + 1}. ${name}`);
      });
    }
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// スクリプトを実行
testInvoiceList();