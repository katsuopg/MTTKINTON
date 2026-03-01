import { KintoneClient } from '@/lib/kintone/client';
import { MachineRecord } from '@/types/kintone';

const APP_ID = process.env.KINTONE_APP_MACHINE_MANAGEMENT || '89';
const API_TOKEN = process.env.KINTONE_API_TOKEN_MACHINE || '';

export async function getMachineRecordsByCustomer(customerId: string): Promise<MachineRecord[]> {
  const client = new KintoneClient(APP_ID, API_TOKEN);
  const query = `CsId_db = "${customerId}" order by McItem asc`;
  
  try {
    const records = await client.getRecords<MachineRecord>(query);
    return records;
  } catch (error) {
    console.error('Error fetching machine data:', error);
    return [];
  }
}