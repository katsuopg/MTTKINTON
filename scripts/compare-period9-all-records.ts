import { config } from 'dotenv';
import { KintoneClient } from '../src/lib/kintone/client';
import type { InvoiceRecord } from '../src/types/kintone';

// 環境変数を読み込む
config({ path: '.env.local' });

const APP_ID = '26';
const API_TOKEN = process.env.KINTONE_API_TOKEN_INVOICE || '';

async function comparePeriod9AllRecords() {
  console.log('=== 第9期 全レコード比較 (Kintone vs API) ===\n');
  
  const client = new KintoneClient(APP_ID, API_TOKEN);
  
  try {
    // 第9期の全レコードを取得（レコード番号順）
    const records = await client.getRecords<InvoiceRecord>('文字列__1行_ like "09-%" order by レコード番号 asc limit 500');
    
    console.log(`APIで取得した総レコード数: ${records.length}件`);
    console.log(`Kintone W09-ALL-LISTの表示: 151件`);
    console.log(`差分: ${records.length - 151}件\n`);
    
    console.log('レコード番号 | レコードID | 工事番号    | 請求書番号      | 顧客名                              | 日付       | 備考');
    console.log('=' .repeat(140));
    
    // 重複をチェックするためのマップ
    const seenInvoiceNos = new Set<string>();
    const seenCombinations = new Set<string>();
    let recordCount = 0;
    
    records.forEach((record, index) => {
      recordCount++;
      const recordNo = record.レコード番号?.value || '';
      const recordId = record.$id.value;
      const workNo = record.文字列__1行_?.value || '';
      const invoiceNo = record.文字列__1行__0?.value || '';
      const customerName = record.CS_name?.value || '';
      const date = record.日付?.value || '';
      const combination = `${workNo}|${invoiceNo}`;
      
      let mark = '';
      
      // 請求書番号の重複チェック
      if (seenInvoiceNos.has(invoiceNo)) {
        mark = '【重複請求書番号】';
      }
      seenInvoiceNos.add(invoiceNo);
      
      // 工事番号＋請求書番号の組み合わせ重複チェック
      if (seenCombinations.has(combination)) {
        mark = '【完全重複】';
      }
      seenCombinations.add(combination);
      
      // 特定のレコードをハイライト
      if (workNo === '09-0099' && invoiceNo === 'APM-6406015') {
        mark = mark || '【要確認】';
      }
      
      // 出力フォーマット
      const recordNoStr = recordNo.padEnd(12, ' ');
      const recordIdStr = recordId.padEnd(10, ' ');
      const workNoStr = workNo.padEnd(12, ' ');
      const invoiceNoStr = invoiceNo.padEnd(16, ' ');
      const customerNameStr = (customerName.length > 35 ? customerName.substring(0, 32) + '...' : customerName).padEnd(35, ' ');
      const dateStr = date.padEnd(10, ' ');
      
      console.log(`${recordNoStr} | ${recordIdStr} | ${workNoStr} | ${invoiceNoStr} | ${customerNameStr} | ${dateStr} | ${mark}`);
      
      // 151件目と152件目を特別にマーク
      if (recordCount === 151) {
        console.log('-'.repeat(140) + ' ← Kintone表示はここまで（151件）');
      }
    });
    
    console.log('=' .repeat(140));
    console.log('\n【重複の詳細】');
    
    // 重複レコードの詳細を表示
    const invoiceNoCounts: Record<string, number> = {};
    const invoiceNoRecords: Record<string, InvoiceRecord[]> = {};
    
    records.forEach(record => {
      const invoiceNo = record.文字列__1行__0?.value || '';
      invoiceNoCounts[invoiceNo] = (invoiceNoCounts[invoiceNo] || 0) + 1;
      if (!invoiceNoRecords[invoiceNo]) {
        invoiceNoRecords[invoiceNo] = [];
      }
      invoiceNoRecords[invoiceNo].push(record);
    });
    
    Object.entries(invoiceNoCounts)
      .filter(([_, count]) => count > 1)
      .forEach(([invoiceNo, count]) => {
        console.log(`\n請求書番号 ${invoiceNo} が ${count} 件重複:`);
        invoiceNoRecords[invoiceNo].forEach(r => {
          console.log(`  - レコード番号: ${r.レコード番号?.value}, レコードID: ${r.$id.value}, 工事番号: ${r.文字列__1行_?.value}, 日付: ${r.日付?.value}`);
        });
      });
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

comparePeriod9AllRecords();