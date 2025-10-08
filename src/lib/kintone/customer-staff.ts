import { KintoneClient } from '@/lib/kintone/client';
import { CustomerStaffRecord } from '@/types/kintone';
import { KINTONE_APPS } from '@/types/kintone';

const APP_ID = KINTONE_APPS.CUSTOMER_STAFF.appId;
const API_TOKEN = process.env.KINTONE_API_TOKEN_CUSTOMER_STAFF || '';

export async function getCustomerStaffByCustomer(customerId: string): Promise<CustomerStaffRecord[]> {
  const client = new KintoneClient(APP_ID.toString(), API_TOKEN);
  
  try {
    // 顧客情報を取得して会社名を取得
    const customerClient = new KintoneClient(KINTONE_APPS.CUSTOMER_LIST.appId.toString(), process.env.KINTONE_API_TOKEN_CUSTOMER || '');
    const customerRecords = await customerClient.getRecords(`文字列__1行_ = "${customerId}"`);
    
    if (customerRecords.length === 0) {
      console.error('Customer not found:', customerId);
      return [];
    }
    
    const customerName = customerRecords[0].会社名?.value;
    if (!customerName) {
      console.error('Customer name not found for:', customerId);
      return [];
    }
    
    // ルックアップフィールド（会社名）でフィルタリング
    const staffRecords = await client.getRecords<CustomerStaffRecord>(`ルックアップ = "${customerName}" order by レコード番号 desc limit 500`);
    
    return staffRecords;
  } catch (error) {
    console.error('Error fetching customer staff data:', error);
    return [];
  }
}