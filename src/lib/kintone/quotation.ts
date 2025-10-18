import { KintoneClient } from '@/lib/kintone/client';
import { QuotationRecord } from '@/types/kintone';
import { KINTONE_APPS } from '@/types/kintone';

const APP_ID = KINTONE_APPS.QUOTATION.appId;

// API_TOKENは関数内で都度取得するように変更
function getApiToken(): string {
  const token = process.env.KINTONE_API_TOKEN_QUOTATION || '';
  if (!token) {
    console.warn('KINTONE_API_TOKEN_QUOTATION is not set');
  }
  return token;
}

// 日付から会計期を計算する関数
// 現在第14期: 2025年7月1日〜2026年6月30日
export function getFiscalPeriodFromDate(dateStr: string): string {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 0-based to 1-based
  
  // 会計期間の計算（7月始まり）
  // 第14期: 2025年7月1日〜2026年6月30日
  let fiscalYear = year;
  if (month < 7) { // 1-6月は前年度
    fiscalYear = year - 1;
  }
  
  // 現在第14期（2025年度）から計算
  const currentFiscalYear = 2025; // 第14期の開始年
  const currentPeriod = 14;
  const fiscalPeriod = currentPeriod + (fiscalYear - currentFiscalYear);
  
  return fiscalPeriod.toString();
}

// ステータスを更新する関数
export async function updateQuotationStatus(recordId: string, newStatus: string): Promise<void> {
  const client = new KintoneClient(APP_ID.toString(), getApiToken());
  
  try {
    await client.updateRecord(recordId, {
      ドロップダウン: { value: newStatus }
    });
    console.log(`Updated quotation ${recordId} status to ${newStatus}`);
  } catch (error) {
    console.error('Error updating quotation status:', error);
    throw error;
  }
}

// 今期（第14期）のWaiting POステータスをSentに更新する関数
export async function updateCurrentPeriodWaitingPOToSent(): Promise<void> {
  const client = new KintoneClient(APP_ID.toString(), getApiToken());
  const currentPeriod = '14';
  
  try {
    // 全ての見積レコードを取得
    const query = `ドロップダウン in ("Waiting PO") order by レコード番号 desc limit 500`;
    const records = await client.getRecords<QuotationRecord>(query);
    
    // 第14期のレコードのみフィルタリング
    const targetRecords = records.filter(record => {
      const period = getFiscalPeriodFromDate(record.日付?.value || '');
      return period === currentPeriod;
    });
    
    console.log(`Found ${targetRecords.length} records with "Waiting PO" status in period ${currentPeriod}`);
    
    // 各レコードのステータスを更新
    for (const record of targetRecords) {
      await updateQuotationStatus(record.$id.value, 'Sent');
      console.log(`Updated ${record.qtno2?.value} from "Waiting PO" to "Sent"`);
    }
    
    console.log(`Successfully updated ${targetRecords.length} records`);
  } catch (error) {
    console.error('Error updating quotation statuses:', error);
    throw error;
  }
}

export async function getQuotationRecordsByCustomer(customerId: string, fiscalPeriod?: string): Promise<QuotationRecord[]> {
  const client = new KintoneClient(APP_ID.toString(), getApiToken());
  let query = `文字列__1行__10 = "${customerId}"`;
  
  query += ` order by レコード番号 desc limit 500`;
  
  try {
    let records = await client.getRecords<QuotationRecord>(query);
    console.log(`Fetched ${records.length} quotation records for customer ${customerId}`);
    
    // デバッグ: 最初のレコードの全フィールドを確認
    if (records.length > 0) {
      console.log('=== Quotation Record Debug ===');
      console.log('First record all fields:');
      Object.keys(records[0]).forEach(key => {
        const value = (records[0] as any)[key];
        if (value && typeof value === 'object' && 'value' in value) {
          console.log(`  ${key}: "${value.value}" (type: ${value.type})`);
        }
      });
      
      // 金額関連フィールドを特別にチェック
      console.log('\n金額関連フィールドの詳細:');
      const amountFields = ['grand_total', 'Grand_Total', 'GrandTotal', '合計', '総額', 'Sub_total', 'subtotal'];
      amountFields.forEach(field => {
        if ((records[0] as any)[field]) {
          console.log(`  ${field}: ${JSON.stringify((records[0] as any)[field])}`);
        }
      });
    }
    
    // 会計期間の指定がある場合は、取得後にフィルタリング
    if (fiscalPeriod) {
      // デバッグ: 最初の5件の見積番号と日付、会計期間を出力
      const sampleRecords = records.slice(0, 5);
      console.log('Sample quotation analysis (using date):');
      sampleRecords.forEach(r => {
        const qtNo = r.qtno2?.value || '';
        const date = r.日付?.value || '';
        const period = getFiscalPeriodFromDate(date);
        const status = r.ドロップダウン?.value || '';
        const amount = r.grand_total?.value || '';
        console.log(`  ${qtNo} (${date}) → Period ${period}, Status: ${status}, Amount: ${amount}`);
      });
      
      records = records.filter(record => {
        const period = getFiscalPeriodFromDate(record.日付?.value || '');
        return period === fiscalPeriod;
      });
      console.log(`Filtered to ${records.length} records for period ${fiscalPeriod}`);
    }
    
    return records;
  } catch (error) {
    console.error('Error fetching quotation data:', error);
    return [];
  }
}

export async function getAllQuotationRecords(): Promise<QuotationRecord[]> {
  const client = new KintoneClient(APP_ID.toString(), getApiToken());
  const limit = 500;
  let offset = 0;
  const allRecords: QuotationRecord[] = [];

  try {
    // ページネーションで全件取得
    // API制限で最大500件ずつなので、0件になるまで取得を続ける
    // order by を付けない方が負荷が低いため、必要であれば呼び出し側でソートする
    while (true) {
      const query = `limit ${limit} offset ${offset}`;
      const records = await client.getRecords<QuotationRecord>(query);

      if (!records || records.length === 0) {
        break;
      }

      allRecords.push(...records);
      offset += records.length;

      if (records.length < limit) {
        break;
      }
    }

    return allRecords;
  } catch (error) {
    console.error('Error fetching all quotation records:', error);
    return [];
  }
}
