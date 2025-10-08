#!/usr/bin/env node
import { config } from 'dotenv';
import { getCustomerById } from '../src/lib/kintone/customer';
import { getInvoiceRecordsByCustomer } from '../src/lib/kintone/invoice';

// 環境変数を読み込む
config({ path: '.env.local' });

async function testCustomerInfo() {
  console.log('=== 顧客情報と請求書データ確認 ===\n');
  
  try {
    // SUGINO PRESSの情報を取得
    const customerId = '57-014-SPT';
    console.log(`1. CS ID "${customerId}" の顧客情報を取得`);
    
    const customer = await getCustomerById(customerId);
    console.log('顧客名:', customer.会社名?.value);
    console.log('CS ID:', customer.文字列__1行_?.value);
    console.log('レコードID:', customer.$id?.value);
    
    // この顧客名で請求書データを検索
    console.log(`\n2. 顧客名 "${customer.会社名?.value}" で請求書データを検索`);
    
    // 全期間
    const allInvoices = await getInvoiceRecordsByCustomer(customer.会社名.value);
    console.log('全期間レコード数:', allInvoices.length);
    
    // 第14期
    const invoices14 = await getInvoiceRecordsByCustomer(customer.会社名.value, '14');
    console.log('第14期レコード数:', invoices14.length);
    
    // 第9期
    const invoices9 = await getInvoiceRecordsByCustomer(customer.会社名.value, '9');
    console.log('第9期レコード数:', invoices9.length);
    
    if (allInvoices.length > 0) {
      console.log('\n最初の請求書レコード:');
      console.log('工事番号:', allInvoices[0].文字列__1行_?.value);
      console.log('請求書番号:', allInvoices[0].文字列__1行__0?.value);
      console.log('顧客名:', allInvoices[0].CS_name?.value);
      console.log('日付:', allInvoices[0].日付?.value);
    }
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

testCustomerInfo();