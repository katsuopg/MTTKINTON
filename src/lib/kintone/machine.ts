import { KintoneClient } from '@/lib/kintone/client';
import { MachineRecord } from '@/types/kintone';

const APP_ID = process.env.KINTONE_APP_MACHINE_MANAGEMENT || '89';
const API_TOKEN = process.env.KINTONE_API_TOKEN_MACHINE || '';

export async function getMachineRecordsByCustomer(customerId: string): Promise<MachineRecord[]> {
  // 既知の機械管理APIトークン
  const MACHINE_API_TOKEN = 'T4MEIBEiCBZ0ksOY6aL8qEHHVdRMN5nPWU4szZJj';
  
  const client = new KintoneClient(APP_ID, MACHINE_API_TOKEN);
  const query = `CsId_db = "${customerId}" order by McItem asc`;
  
  try {
    const records = await client.getRecords<MachineRecord>(query);
    return records;
  } catch (error) {
    console.error('Error fetching machine data:', error);
    return [];
  }
}