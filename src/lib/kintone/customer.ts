import { KintoneClient } from '@/lib/kintone/client';
import { CustomerRecord, KintoneRecordsResponse } from '@/types/kintone';
import { KINTONE_APPS } from '@/types/kintone';

const APP_ID = KINTONE_APPS.CUSTOMER_LIST.appId;

export async function getCustomerById(id: string): Promise<CustomerRecord> {
  // 関数内で環境変数を読み込む
  const API_TOKEN = process.env.KINTONE_API_TOKEN_CUSTOMER || '';
  
  // デバッグ情報
  console.log('Customer API Debug:', {
    APP_ID,
    API_TOKEN: API_TOKEN ? 'Set' : 'Not set',
    DOMAIN: process.env.KINTONE_DOMAIN,
    searchId: id
  });
  
  const client = new KintoneClient(APP_ID.toString(), API_TOKEN);
  
  // CS ID（例：56-002-SKT）で検索する場合
  const query = `文字列__1行_ = "${id}"`;
  const records = await client.getRecords<CustomerRecord>(query);
  
  if (records.length === 0) {
    throw new Error(`Customer with CS ID ${id} not found`);
  }
  
  return records[0];
}

export async function getCustomerRecords(query: string = ''): Promise<CustomerRecord[]> {
  // 関数内で環境変数を読み込む
  const API_TOKEN = process.env.KINTONE_API_TOKEN_CUSTOMER || '';
  const client = new KintoneClient(APP_ID.toString(), API_TOKEN);
  return client.getRecords<CustomerRecord>(query);
}