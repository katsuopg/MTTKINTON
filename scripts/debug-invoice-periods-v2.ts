import { config } from 'dotenv';
import { KintoneClient } from '../src/lib/kintone/client';
import type { InvoiceRecord } from '../src/types/kintone';

// 環境変数を読み込む
config({ path: '.env.local' });

const APP_ID = '26';
const API_TOKEN = process.env.KINTONE_API_TOKEN_INVOICE || '';

async function getAllRecords(client: KintoneClient): Promise<InvoiceRecord[]> {
  const allRecords: InvoiceRecord[] = [];
  let offset = 0;
  const limit = 500;
  
  while (true) {
    const query = `order by $id asc limit ${limit} offset ${offset}`;
    console.log(`取得中... offset: ${offset}`);
    
    try {
      const records = await client.getRecords<InvoiceRecord>(query);
      allRecords.push(...records);
      
      if (records.length < limit) {
        break;
      }
      offset += limit;
    } catch (error) {
      console.error('エラー at offset', offset, error);
      break;
    }
  }
  
  return allRecords;
}

async function debugInvoicePeriods() {
  console.log('=== 請求書データ取得デバッグ ===');
  console.log('APP_ID:', APP_ID);
  console.log('API_TOKEN:', API_TOKEN ? 'Set' : 'Not set');
  
  const client = new KintoneClient(APP_ID, API_TOKEN);
  
  try {
    // 全データを取得
    console.log('\n1. 全データ取得（オフセット使用）');
    const allRecords = await getAllRecords(client);
    console.log('総レコード数:', allRecords.length);
    
    // 会計期間別に集計
    const periodCounts: Record<string, number> = {};
    const periodExamples: Record<string, string[]> = {};
    const unmatchedExamples: string[] = [];
    
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
      } else if (workNo && unmatchedExamples.length < 10) {
        unmatchedExamples.push(workNo);
      }
    });
    
    console.log('\n会計期間別レコード数:');
    Object.keys(periodCounts).sort((a, b) => parseInt(a) - parseInt(b)).forEach(period => {
      console.log(`第${period}期: ${periodCounts[period]}件`);
      console.log(`  例:`, periodExamples[period].join(', '));
    });
    
    if (unmatchedExamples.length > 0) {
      console.log('\nパターンにマッチしない工事番号の例:');
      unmatchedExamples.forEach(workNo => console.log(`  - ${workNo}`));
    }
    
    // 特定の顧客で第9期データをテスト
    console.log('\n2. SUGINO PRESS社のデータ検索');
    const suginoAllQuery = 'CS_name = "SUGINO PRESS" order by 文字列__1行_ asc limit 500';
    const suginoAllRecords = await client.getRecords<InvoiceRecord>(suginoAllQuery);
    console.log('SUGINO PRESS全レコード数:', suginoAllRecords.length);
    
    // SUGINO PRESSの会計期間別集計
    const suginoPeriods: Record<string, number> = {};
    suginoAllRecords.forEach((record) => {
      const workNo = record.文字列__1行_?.value || '';
      const match = workNo.match(/^(\d+)-/);
      if (match) {
        const period = match[1];
        suginoPeriods[period] = (suginoPeriods[period] || 0) + 1;
      }
    });
    
    console.log('SUGINO PRESS会計期間別:');
    Object.keys(suginoPeriods).sort((a, b) => parseInt(a) - parseInt(b)).forEach(period => {
      console.log(`  第${period}期: ${suginoPeriods[period]}件`);
    });
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

debugInvoicePeriods();