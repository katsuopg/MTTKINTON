import { KintoneClient } from '@/lib/kintone/client';
import { WorkNoRecord } from '@/types/kintone';
import { KINTONE_APPS } from '@/types/kintone';

const APP_ID = KINTONE_APPS.WORK_NO.appId;
const API_TOKEN = process.env.KINTONE_API_TOKEN_WORKNO || '';

export async function getWorkNoRecordsByCustomer(customerId: string, fiscalPeriod?: string): Promise<WorkNoRecord[]> {
  const client = new KintoneClient(APP_ID.toString(), API_TOKEN);
  let query = `文字列__1行__8 = "${customerId}"`;
  
  // 会計期間の指定がある場合は、工事番号でフィルタリング
  if (fiscalPeriod) {
    query += ` and WorkNo like "${fiscalPeriod}-*"`;
  }
  
  query += ` order by WorkNo desc limit 500`;
  
  try {
    const records = await client.getRecords<WorkNoRecord>(query);
    console.log(`Fetched ${records.length} work no records for customer ${customerId} (Period: ${fiscalPeriod || 'all'})`);
    return records;
  } catch (error) {
    console.error('Error fetching work no data:', error);
    return [];
  }
}