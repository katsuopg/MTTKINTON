import { config } from 'dotenv';
import { KintoneClient } from '../src/lib/kintone/client';
import type { CustomerRecord, InvoiceRecord } from '../src/types/kintone';

// 環境変数を読み込む
config({ path: '.env.local' });

async function testInvoiceApiDirect() {
  console.log('=== 顧客詳細ページの請求書データ取得テスト（直接API） ===\n');
  
  try {
    // 1. 顧客情報を直接取得
    console.log('1. 顧客情報を取得（最初の10件）');
    const customerClient = new KintoneClient('7', process.env.KINTONE_API_TOKEN_CUSTOMER || '');
    // まず最初の10件を取得して確認
    const allCustomers = await customerClient.getRecords<CustomerRecord>('order by $id asc limit 10');
    
    console.log('取得した顧客数:', allCustomers.length);
    console.log('\n顧客一覧:');
    allCustomers.forEach((customer, index) => {
      console.log(`${index + 1}. CS ID: ${customer.文字列__1行_?.value}, 会社名: ${customer.会社名?.value}`);
    });
    
    if (allCustomers.length === 0) {
      console.error('顧客が見つかりません');
      return;
    }
    
    // 最初の顧客でテスト
    const customerRecords = [allCustomers[0]];
    
    const customerRecord = customerRecords[0];
    console.log('顧客名:', customerRecord.会社名?.value);
    console.log('CS ID:', customerRecord.文字列__1行_?.value);
    
    // 2. 請求書データを取得（第14期）
    console.log('\n2. 第14期の請求書データを取得');
    const invoiceClient = new KintoneClient('26', process.env.KINTONE_API_TOKEN_INVOICE || '');
    const query14 = `CS_name = "${customerRecord.会社名.value}" and 文字列__1行_ like "14-%"`;
    const invoices14 = await invoiceClient.getRecords<InvoiceRecord>(query14);
    console.log('第14期レコード数:', invoices14.length);
    
    if (invoices14.length > 0) {
      console.log('最初のレコード:', {
        工事番号: invoices14[0].文字列__1行_?.value,
        請求書番号: invoices14[0].文字列__1行__0?.value,
        顧客名: invoices14[0].CS_name?.value
      });
    }
    
    // 3. 第9期の請求書データを取得
    console.log('\n3. 第9期の請求書データを取得');
    const query9 = `CS_name = "${customerRecord.会社名.value}" and 文字列__1行_ like "09-%"`;
    const invoices9 = await invoiceClient.getRecords<InvoiceRecord>(query9);
    console.log('第9期レコード数:', invoices9.length);
    
    if (invoices9.length > 0) {
      console.log('最初のレコード:', {
        工事番号: invoices9[0].文字列__1行_?.value,
        請求書番号: invoices9[0].文字列__1行__0?.value,
        顧客名: invoices9[0].CS_name?.value
      });
    }
    
    // 4. 全期間の請求書データを取得
    console.log('\n4. 全期間の請求書データを取得');
    const queryAll = `CS_name = "${customerRecord.会社名.value}"`;
    const invoicesAll = await invoiceClient.getRecords<InvoiceRecord>(queryAll);
    console.log('全期間レコード数:', invoicesAll.length);
    
    // 期間別に集計
    const periodCounts: Record<string, number> = {};
    invoicesAll.forEach((invoice) => {
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
    
    // 5. API経由でデータを取得（実際のAPIエンドポイントをシミュレート）
    console.log('\n5. APIエンドポイントの動作確認');
    console.log(`APIリクエスト: /api/customer/${customerRecord.文字列__1行_.value}/data?period=14&type=invoice`);
    console.log('期待される結果: 第14期の請求書データが返される');
    console.log(`実際のクエリ: CS_name = "${customerRecord.会社名.value}" and 文字列__1行_ like "14-%"`);
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

testInvoiceApiDirect();