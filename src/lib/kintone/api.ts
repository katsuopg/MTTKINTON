import { getCustomerRecords } from './customer';

export async function fetchAllCustomers() {
  return getCustomerRecords();
}