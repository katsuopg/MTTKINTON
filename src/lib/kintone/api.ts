import { getCustomerRecords, getCustomerById } from './customer';
import { getWorkNoRecordByCode } from './workno';
import type { CustomerRecord, WorkNoRecord } from '@/types/kintone';

export async function fetchAllCustomers() {
  return getCustomerRecords();
}

export async function fetchCustomer(customerId: string): Promise<CustomerRecord | null> {
  try {
    return await getCustomerById(customerId);
  } catch (error) {
    console.error('Failed to fetch customer from kintone:', error);
    return null;
  }
}

export async function fetchWorkNo(workNo: string): Promise<WorkNoRecord | null> {
  try {
    return await getWorkNoRecordByCode(workNo);
  } catch (error) {
    console.error('Failed to fetch work no record from kintone:', error);
    return null;
  }
}
