import { KintoneClient } from '@/lib/kintone/client';
import { PORecord } from '@/types/kintone';
import { KINTONE_APPS } from '@/types/kintone';

const APP_ID = KINTONE_APPS.PO_MANAGEMENT.appId;
const API_TOKEN = process.env.KINTONE_API_TOKEN_PO || '';

export async function getPORecordsByCustomer(customerId: string, fiscalPeriod?: string): Promise<PORecord[]> {
  const client = new KintoneClient(APP_ID.toString(), API_TOKEN);
  let query = `文字列__1行__2 = "${customerId}"`;
  
  // 会計期間の指定がある場合は、WorkNoでフィルタリング
  if (fiscalPeriod) {
    query += ` and ルックアップ like "${fiscalPeriod}-*"`;
  }
  
  query += ` order by レコード番号 desc limit 500`;
  
  try {
    const records = await client.getRecords<PORecord>(query);
    console.log(`Fetched ${records.length} PO records for customer ${customerId} (Period: ${fiscalPeriod || 'all'})`);
    return records;
  } catch (error) {
    console.error('Error fetching PO data:', error);
    return [];
  }
}