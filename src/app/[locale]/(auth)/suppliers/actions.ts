'use server';

import { KintoneClient } from '@/lib/kintone/client';

export interface SupplierRecord {
  $id: { value: string };
  レコード番号: { value: string };
  文字列__1行_: { value: string }; // Supplier ID
  会社名: { value: string };
  TEL: { value: string };
  TEL_0: { value: string };
  FAX: { value: string };
  リンク: { value: string };
  MAIL: { value: string };
  文字列__複数行_: { value: string }; // 住所
  文字列__複数行__0: { value: string }; // メモ
  更新日時: { value: string };
  作成日時: { value: string };
}

export async function getSuppliers() {
  try {
    const appId = process.env.KINTONE_APP_SUPPLIER_LIST || '121';
    const apiToken = process.env.KINTONE_API_TOKEN_SUPPLIER;
    
    if (!apiToken) {
      throw new Error('Supplier API token is not configured');
    }
    
    const client = new KintoneClient(appId, apiToken);
    const suppliers = await client.getRecords<SupplierRecord>(
      'order by レコード番号 asc limit 100'
    );

    return { suppliers, error: null };
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return { 
      suppliers: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred')
    };
  }
}

export async function getSupplierDetail(id: string) {
  try {
    const appId = process.env.KINTONE_APP_SUPPLIER_LIST || '121';
    const apiToken = process.env.KINTONE_API_TOKEN_SUPPLIER;
    
    if (!apiToken) {
      throw new Error('Supplier API token is not configured');
    }
    
    const client = new KintoneClient(appId, apiToken);
    const supplier = await client.getRecord<SupplierRecord>(id);

    return { supplier, error: null };
  } catch (error) {
    console.error('Error fetching supplier detail:', error);
    return { 
      supplier: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred')
    };
  }
}