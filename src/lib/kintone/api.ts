import { getCustomerRecords, getCustomerById } from './customer';
import { getWorkNoById } from './workno';
import { KintoneClient } from '@/lib/kintone/client';
import { CustomerStaffRecord, QuotationRecord, KINTONE_APPS } from '@/types/kintone';

export async function fetchAllCustomers() {
  return getCustomerRecords();
}

export async function fetchWorkNo(workNo: string) {
  return getWorkNoById(workNo);
}

export async function fetchCustomer(csId: string) {
  try {
    return await getCustomerById(csId);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

export async function fetchAllCustomerStaff(): Promise<CustomerStaffRecord[]> {
  const client = new KintoneClient(
    KINTONE_APPS.CUSTOMER_STAFF.appId.toString(),
    process.env.KINTONE_API_TOKEN_CUSTOMER_STAFF || ''
  );

  try {
    const records = await client.getRecords<CustomerStaffRecord>('order by レコード番号 desc limit 500');
    return records;
  } catch (error) {
    console.error('Error fetching customer staff:', error);
    return [];
  }
}

export async function fetchAllQuotations(): Promise<QuotationRecord[]> {
  const client = new KintoneClient(
    KINTONE_APPS.QUOTATION.appId.toString(),
    process.env.KINTONE_API_TOKEN_QUOTATION || ''
  );

  try {
    const records = await client.getRecords<QuotationRecord>('order by レコード番号 desc limit 500');
    return records;
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return [];
  }
}