import { KINTONE_APPS, WorkNoRecord, CustomerRecord, CustomerStaffRecord, QuotationRecord } from '@/types/kintone';
import { KintoneClient } from './client';

/**
 * 工事番号の詳細を取得
 */
export async function fetchWorkNo(workNo: string): Promise<WorkNoRecord | null> {
  try {
    const apiToken = process.env.KINTONE_API_TOKEN_WORKNO;
    if (!apiToken) {
      throw new Error('KINTONE_API_TOKEN_WORKNO is not set');
    }

    const client = new KintoneClient(String(KINTONE_APPS.WORK_NO.appId), apiToken);
    const records = await client.getRecords<WorkNoRecord>(`WorkNo = "${workNo}"`);

    if (records && records.length > 0) {
      return records[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching work no detail:', error);
    return null;
  }
}

/**
 * CS IDで顧客情報を取得
 */
export async function fetchCustomer(csId: string): Promise<CustomerRecord | null> {
  try {
    const apiToken = process.env.KINTONE_API_TOKEN_CUSTOMER;
    if (!apiToken) {
      throw new Error('KINTONE_API_TOKEN_CUSTOMER is not set');
    }

    const client = new KintoneClient(String(KINTONE_APPS.CUSTOMER_LIST.appId), apiToken);
    
    // CS IDの正規化（スペースの処理）
    const normalizedCsId = csId.trim();
    console.log('Fetching customer with CS ID:', normalizedCsId);
    
    const records = await client.getRecords<CustomerRecord>(`文字列__1行_ = "${normalizedCsId}"`);
    console.log('Customer records found:', records?.length || 0);

    if (records && records.length > 0) {
      return records[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

/**
 * 全ての顧客情報を取得（ページネーション対応）
 */
export async function fetchAllCustomers(): Promise<CustomerRecord[]> {
  try {
    const apiToken = process.env.KINTONE_API_TOKEN_CUSTOMER;
    if (!apiToken) {
      throw new Error('KINTONE_API_TOKEN_CUSTOMER is not set');
    }

    const client = new KintoneClient(String(KINTONE_APPS.CUSTOMER_LIST.appId), apiToken);
    
    // kintone APIは一度に最大500件まで取得可能
    const limit = 500;
    let offset = 0;
    let allRecords: CustomerRecord[] = [];
    let hasMore = true;

    while (hasMore) {
      const query = `limit ${limit} offset ${offset}`;
      const records = await client.getRecords<CustomerRecord>(query);
      
      if (records && records.length > 0) {
        allRecords = [...allRecords, ...records];
        offset += records.length;
        hasMore = records.length === limit;
      } else {
        hasMore = false;
      }
    }

    return allRecords;
  } catch (error) {
    console.error('Error fetching all customers:', error);
    return [];
  }
}

/**
 * CS IDで関連する工事番号を取得
 */
export async function fetchWorkNosByCustomer(csId: string): Promise<WorkNoRecord[]> {
  try {
    const apiToken = process.env.KINTONE_API_TOKEN_WORKNO;
    if (!apiToken) {
      throw new Error('KINTONE_API_TOKEN_WORKNO is not set');
    }

    const client = new KintoneClient(String(KINTONE_APPS.WORK_NO.appId), apiToken);
    const records = await client.getRecords<WorkNoRecord>(`文字列__1行__8 = "${csId}"`);

    return records || [];
  } catch (error) {
    console.error('Error fetching work nos by customer:', error);
    return [];
  }
}

/**
 * 全ての顧客担当者を取得
 */
export async function fetchAllCustomerStaff(): Promise<CustomerStaffRecord[]> {
  try {
    const apiToken = process.env.KINTONE_API_TOKEN_CUSTOMER_STAFF;
    if (!apiToken) {
      throw new Error('KINTONE_API_TOKEN_CUSTOMER_STAFF is not set');
    }

    const client = new KintoneClient(String(KINTONE_APPS.CUSTOMER_STAFF.appId), apiToken);
    
    // ページネーション対応
    const limit = 500;
    let offset = 0;
    let allRecords: CustomerStaffRecord[] = [];
    let hasMore = true;

    while (hasMore) {
      const query = `limit ${limit} offset ${offset}`;
      const records = await client.getRecords<CustomerStaffRecord>(query);
      
      if (records && records.length > 0) {
        allRecords = [...allRecords, ...records];
        offset += records.length;
        hasMore = records.length === limit;
      } else {
        hasMore = false;
      }
    }

    return allRecords;
  } catch (error) {
    console.error('Error fetching all customer staff:', error);
    return [];
  }
}

/**
 * CS IDで関連する顧客担当者を取得
 */
export async function fetchCustomerStaffByCustomer(csId: string): Promise<CustomerStaffRecord[]> {
  try {
    const apiToken = process.env.KINTONE_API_TOKEN_CUSTOMER_STAFF;
    if (!apiToken) {
      throw new Error('KINTONE_API_TOKEN_CUSTOMER_STAFF is not set');
    }

    const client = new KintoneClient(String(KINTONE_APPS.CUSTOMER_STAFF.appId), apiToken);
    
    // 全レコードを取得してフィルタリング（ページネーション対応）
    const limit = 500;
    let offset = 0;
    let allRecords: CustomerStaffRecord[] = [];
    let hasMore = true;

    while (hasMore) {
      const query = `limit ${limit} offset ${offset}`;
      const records = await client.getRecords<CustomerStaffRecord>(query);
      
      if (records && records.length > 0) {
        allRecords = [...allRecords, ...records];
        offset += records.length;
        hasMore = records.length === limit;
      } else {
        hasMore = false;
      }
    }
    
    // ルックアップフィールドに会社名が入っているため、CS IDではなく会社名でフィルタリング
    // まずはCSIDで顧客情報を取得して会社名を取得する必要がある
    const customer = await fetchCustomer(csId);
    const companyName = customer?.会社名?.value;
    
    const filteredRecords = allRecords?.filter(record => {
      // 空白を正規化して比較
      const staffCompanyName = record.ルックアップ?.value?.replace(/\s+/g, ' ').trim() || '';
      const normalizedCompanyName = companyName?.replace(/\s+/g, ' ').trim() || '';
      return staffCompanyName === normalizedCompanyName;
    }) || [];

    return filteredRecords;
  } catch (error) {
    console.error('Error fetching customer staff:', error);
    return [];
  }
}

/**
 * 全ての見積もり情報を取得（ページネーション対応）
 */
export async function fetchAllQuotations(): Promise<QuotationRecord[]> {
  try {
    const apiToken = process.env.KINTONE_API_TOKEN_QUOTATION;
    if (!apiToken) {
      throw new Error('KINTONE_API_TOKEN_QUOTATION is not set');
    }

    console.log('Quotation App ID:', KINTONE_APPS.QUOTATION.appId);
    console.log('API Token exists:', !!apiToken);

    const client = new KintoneClient(String(KINTONE_APPS.QUOTATION.appId), apiToken);
    
    // ページネーション対応
    const limit = 500;
    let offset = 0;
    let allRecords: QuotationRecord[] = [];
    let hasMore = true;

    while (hasMore) {
      const query = `limit ${limit} offset ${offset}`;
      console.log('Fetching quotations with query:', query);
      const records = await client.getRecords<QuotationRecord>(query);
      console.log('Fetched records count:', records?.length || 0);
      
      if (records && records.length > 0) {
        allRecords = [...allRecords, ...records];
        offset += records.length;
        hasMore = records.length === limit;
      } else {
        hasMore = false;
      }
    }

    console.log('Total quotations fetched:', allRecords.length);
    return allRecords;
  } catch (error) {
    console.error('Error fetching all quotations:', error);
    return [];
  }
}

/**
 * 見積もり番号で見積もり情報を取得
 */
export async function fetchQuotation(qtNo: string): Promise<QuotationRecord | null> {
  try {
    const apiToken = process.env.KINTONE_API_TOKEN_QUOTATION;
    if (!apiToken) {
      throw new Error('KINTONE_API_TOKEN_QUOTATION is not set');
    }

    const client = new KintoneClient(String(KINTONE_APPS.QUOTATION.appId), apiToken);
    const records = await client.getRecords<QuotationRecord>(`qtno2 = "${qtNo}"`);

    return records && records.length > 0 ? records[0] : null;
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return null;
  }
}

/**
 * CS IDで関連する見積もりを取得
 */
export async function fetchQuotationsByCustomer(csId: string): Promise<QuotationRecord[]> {
  try {
    const apiToken = process.env.KINTONE_API_TOKEN_QUOTATION;
    if (!apiToken) {
      throw new Error('KINTONE_API_TOKEN_QUOTATION is not set');
    }

    const client = new KintoneClient(String(KINTONE_APPS.QUOTATION.appId), apiToken);
    const records = await client.getRecords<QuotationRecord>(`文字列__1行__10 = "${csId}"`);

    return records || [];
  } catch (error) {
    console.error('Error fetching quotations by customer:', error);
    return [];
  }
}