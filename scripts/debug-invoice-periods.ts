import { config } from 'dotenv';
import { KintoneClient } from '../src/lib/kintone/client';
import type { InvoiceRecord } from '../src/types/kintone';

// 環境変数を読み込む
config({ path: '.env.local' });

const APP_ID = '26';
const API_TOKEN = process.env.KINTONE_API_TOKEN_INVOICE || '';

async function debugInvoicePeriods() {
  console.log('=== 請求書データ取得デバッグ ===');
  console.log('APP_ID:', APP_ID);
  console.log('API_TOKEN:', API_TOKEN ? 'Set' : 'Not set');
  
  const client = new KintoneClient(APP_ID, API_TOKEN);
  
  try {
    // まず全データを取得（制限なし）
    console.log('\n1. 全データ取得テスト（limit 5000）');
    const allRecordsQuery = 'order by 文字列__1行_ asc limit 5000';
    const allRecords = await client.getRecords<InvoiceRecord>(allRecordsQuery);
    console.log('総レコード数:', allRecords.length);
    
    // 会計期間別に集計
    const periodCounts: Record<string, number> = {};
    const periodExamples: Record<string, string[]> = {};
    
    allRecords.forEach((record) => {
      const workNo = record.文字列__1行_?.value || '';
      const match = workNo.match(/^(\d+)-/);
      if (match) {
        const period = match[1];
        periodCounts[period] = (periodCounts[period] || 0) + 1;
        
        // 各期間の最初の5件を記録
        if (!periodExamples[period]) {
          periodExamples[period] = [];
        }
        if (periodExamples[period].length < 5) {
          periodExamples[period].push(workNo);
        }
      } else {
        console.log('パターンにマッチしない工事番号:', workNo);
      }
    });
    
    console.log('\n会計期間別レコード数:');
    Object.keys(periodCounts).sort((a, b) => parseInt(a) - parseInt(b)).forEach(period => {
      console.log(`第${period}期: ${periodCounts[period]}件`);
      console.log(`  例:`, periodExamples[period].join(', '));
    });
    
    // 第9期のデータを特定して取得
    console.log('\n2. 第9期データ検索テスト');
    const period9Query = '文字列__1行_ like "9-%" order by 文字列__1行_ asc limit 500';
    const period9Records = await client.getRecords<InvoiceRecord>(period9Query);
    console.log('第9期レコード数（9-で始まる）:', period9Records.length);
    
    // 09-パターンも試す
    const period09Query = '文字列__1行_ like "09-%" order by 文字列__1行_ asc limit 500';
    const period09Records = await client.getRecords<InvoiceRecord>(period09Query);
    console.log('第9期レコード数（09-で始まる）:', period09Records.length);
    
    // 特定の顧客で第9期データをテスト
    console.log('\n3. SUGINO PRESS社の第9期データ検索');
    const suginoQuery = 'CS_name = "SUGINO PRESS" and (文字列__1行_ like "9-%" or 文字列__1行_ like "09-%") limit 500';
    const suginoRecords = await client.getRecords<InvoiceRecord>(suginoQuery);
    console.log('SUGINO PRESS第9期レコード数:', suginoRecords.length);
    
    if (suginoRecords.length > 0) {
      console.log('\n最初の3件:');
      suginoRecords.slice(0, 3).forEach((record, index) => {
        console.log(`${index + 1}. 工事番号: ${record.文字列__1行_?.value}, 請求書番号: ${record.文字列__1行__0?.value}`);
      });
    }
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

debugInvoicePeriods();