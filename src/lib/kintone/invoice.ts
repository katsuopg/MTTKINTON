import { KintoneClient } from '@/lib/kintone/client';
import type { InvoiceRecord } from '@/types/kintone';
import { KINTONE_APPS } from '@/types/kintone';

const APP_ID = KINTONE_APPS.INVOICE_MANAGEMENT.appId;

/**
 * 複数の顧客の売上サマリーを取得
 */
export async function getSalesSummaryByCustomers(customerNames: string[]): Promise<Record<string, { period: string; sales: number }[]>> {
  const API_TOKEN = process.env.KINTONE_API_TOKEN_INVOICE || '';
  const client = new KintoneClient(APP_ID.toString(), API_TOKEN);
  
  // 顧客名でOR条件を作成
  if (customerNames.length === 0) {
    return {};
  }
  
  // 顧客数が多い場合は分割して取得
  const batchSize = 10; // 一度に取得する顧客数
  const batches = [];
  for (let i = 0; i < customerNames.length; i += batchSize) {
    batches.push(customerNames.slice(i, i + batchSize));
  }
  
  const allRecords: InvoiceRecord[] = [];
  
  for (const batch of batches) {
    const customerConditions = batch.map(name => `CS_name = "${name}"`).join(' or ');
    const query = `(${customerConditions}) limit 500`;
    
    try {
      const records = await client.getRecords<InvoiceRecord>(query);
      allRecords.push(...records);
    } catch (error) {
      console.error('Error fetching batch:', batch, error);
    }
  }
  
  // 顧客ごと、期間ごとに集計
  const summaryByCustomer: Record<string, Record<string, number>> = {};
  
  allRecords.forEach(record => {
      const customerName = record.CS_name?.value || '';
      const workNo = record.文字列__1行_?.value || '';
      const match = workNo.match(/^(\d+)-/);
      
      if (match && customerName) {
        const period = parseInt(match[1], 10).toString(); // 09 → 9
        const amount = parseFloat(record.計算?.value || '0');
        
        if (!summaryByCustomer[customerName]) {
          summaryByCustomer[customerName] = {};
        }
        
        if (!summaryByCustomer[customerName][period]) {
          summaryByCustomer[customerName][period] = 0;
        }
        
        summaryByCustomer[customerName][period] += amount;
      }
  });
  
  // 配列形式に変換
  const result: Record<string, { period: string; sales: number }[]> = {};
  
  Object.entries(summaryByCustomer).forEach(([customerName, periodData]) => {
    result[customerName] = Object.entries(periodData).map(([period, sales]) => ({
      period,
      sales
    }));
  });
  
  return result;
}

/**
 * 請求書レコードを取得（一覧表示用）
 */
export async function getInvoiceRecords(fiscalPeriod: string = '14', limit: number = 500): Promise<InvoiceRecord[]> {
  // ここで環境変数を読み込む
  const API_TOKEN = process.env.KINTONE_API_TOKEN_INVOICE || '';
  
  console.log('Invoice API Debug:', {
    APP_ID,
    API_TOKEN: API_TOKEN ? 'Set' : 'Not set',
    API_TOKEN_LENGTH: API_TOKEN.length,
    DOMAIN: process.env.KINTONE_DOMAIN,
    fiscalPeriod,
  });
  
  const client = new KintoneClient(APP_ID.toString(), API_TOKEN);
  
  // 会計期間でフィルタリング
  let query = '';
  if (fiscalPeriod.length === 1) {
    // 1桁の場合は両方のパターンをチェック
    query = `(文字列__1行_ like "${fiscalPeriod}-%" or 文字列__1行_ like "0${fiscalPeriod}-%")`;
  } else {
    query = `文字列__1行_ like "${fiscalPeriod}-%"`;
  }
  query += ` order by 日付 desc limit ${limit}`;
  
  try {
    const records = await client.getRecords<InvoiceRecord>(query);
    console.log(`第${fiscalPeriod}期のレコード数:`, records.length);
    return records;
  } catch (error) {
    console.error('Error fetching invoice records:', error);
    return [];
  }
}

/**
 * 顧客名から請求書レコードを取得
 */
export async function getInvoiceRecordsByCustomer(
  customerName: string,
  fiscalPeriod?: string
): Promise<InvoiceRecord[]> {
  // ここで環境変数を読み込む
  const API_TOKEN = process.env.KINTONE_API_TOKEN_INVOICE || '';
  const client = new KintoneClient(APP_ID.toString(), API_TOKEN);
  
  // CS_nameフィールド（顧客名）でフィルタリング
  let query = `CS_name = "${customerName}"`;
  
  // 会計期間が指定されている場合は、工事番号から該当期間のレコードをフィルタ
  if (fiscalPeriod) {
    // 会計期間の前ゼロ埋めパターンも考慮
    if (fiscalPeriod.length === 1) {
      query += ` and (文字列__1行_ like "${fiscalPeriod}-%" or 文字列__1行_ like "0${fiscalPeriod}-%")`;
    } else {
      query += ` and 文字列__1行_ like "${fiscalPeriod}-%"`;
    }
  }
  
  // Kintoneのlimit制限は500まで
  query += ' order by 日付 desc limit 500';
  
  console.log('=== 請求書データ取得 ===');
  console.log('顧客名:', customerName);
  console.log('会計期間:', fiscalPeriod);
  console.log('クエリ:', query);

  try {
    const records = await client.getRecords<InvoiceRecord>(query);
    console.log('取得件数:', records.length);
    
    // 工事番号から会計期間を抽出してログ出力
    if (!fiscalPeriod && records.length > 0) {
      const periodCounts: Record<string, number> = {};
      records.forEach((record) => {
        const workNo = record.文字列__1行_?.value || '';
        const match = workNo.match(/^(\d+)-/);
        if (match) {
          const period = match[1];
          periodCounts[period] = (periodCounts[period] || 0) + 1;
        }
      });
      console.log('会計期間別レコード数:', periodCounts);
    }
    
    return records;
  } catch (error) {
    console.error('Error fetching invoice records:', error);
    return [];
  }
}