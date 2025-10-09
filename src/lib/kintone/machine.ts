import { KintoneClient } from '@/lib/kintone/client';
import { MachineRecord } from '@/types/kintone';

const APP_ID = process.env.KINTONE_APP_MACHINE_MANAGEMENT || '89';
const API_TOKEN = process.env.KINTONE_API_TOKEN_MACHINE;

function createMachineClient() {
  if (!API_TOKEN) {
    throw new Error('KINTONE_API_TOKEN_MACHINE is not set');
  }

  return new KintoneClient(APP_ID, API_TOKEN);
}

export async function getAllMachineRecords(): Promise<MachineRecord[]> {
  const client = createMachineClient();

  const limit = 500;
  let offset = 0;
  const allRecords: MachineRecord[] = [];

  while (true) {
    const query = `order by $id desc limit ${limit} offset ${offset}`;
    const records = await client.getRecords<MachineRecord>(query);

    if (!records.length) {
      break;
    }

    allRecords.push(...records);
    offset += records.length;

    if (records.length < limit) {
      break;
    }
  }

  return allRecords;
}

export async function getMachineRecordsByCustomer(customerId: string): Promise<MachineRecord[]> {
  const client = createMachineClient();
  const query = `CsId_db = "${customerId}" order by McItem asc`;
  
  try {
    const records = await client.getRecords<MachineRecord>(query);
    return records;
  } catch (error) {
    console.error('Error fetching machine data:', error);
    return [];
  }
}
