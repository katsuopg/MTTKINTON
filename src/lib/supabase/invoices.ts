import { createClient } from '@/lib/supabase/server';

export interface SupabaseInvoice {
  id: string;
  kintone_record_id: string;
  work_no: string;
  invoice_no: string;
  invoice_date: string | null;
  customer_id: string | null;
  customer_name: string | null;
  sub_total: number;
  discount: number;
  after_discount: number;
  vat: number;
  grand_total: number;
  status: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Supabaseから請求書一覧を取得
 */
export async function getInvoicesFromSupabase(fiscalPeriod?: string, limit: number = 500): Promise<SupabaseInvoice[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('invoices')
    .select('*')
    .order('invoice_date', { ascending: false })
    .limit(limit);

  // 会計期間でフィルタリング
  if (fiscalPeriod) {
    if (fiscalPeriod.length === 1) {
      // 1桁の場合は両方のパターンをチェック
      query = query.or(`work_no.ilike.${fiscalPeriod}-%,work_no.ilike.0${fiscalPeriod}-%`);
    } else {
      query = query.ilike('work_no', `${fiscalPeriod}-%`);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabaseから請求書データの取得に失敗しました:', error);
    throw error;
  }

  return data || [];
}

/**
 * Supabaseから顧客別の請求書を取得
 */
type CustomerIdentifier =
  | string
  | {
      customerId?: string | null;
      customerName?: string | null;
    };

export async function getInvoicesByCustomerFromSupabase(
  customer: CustomerIdentifier,
  fiscalPeriod?: string
): Promise<SupabaseInvoice[]> {
  const supabase = await createClient();
  
  const identifier = typeof customer === 'string'
    ? { customerName: customer }
    : {
        customerId: customer.customerId ?? null,
        customerName: customer.customerName ?? null,
      };

  const customerId = identifier.customerId?.trim();
  const customerName = identifier.customerName?.trim();

  let query = supabase
    .from('invoices')
    .select('*')
    .order('invoice_date', { ascending: false })
    .limit(500);

  if (customerId) {
    query = query.eq('customer_id', customerId);
  } else if (customerName) {
    query = query.eq('customer_name', customerName);
  } else {
    console.warn('getInvoicesByCustomerFromSupabase: No customer identifier provided');
    return [];
  }

  // 会計期間でフィルタリング
  if (fiscalPeriod) {
    if (fiscalPeriod.length === 1) {
      query = query.or(`work_no.ilike.${fiscalPeriod}-%,work_no.ilike.0${fiscalPeriod}-%`);
    } else {
      query = query.ilike('work_no', `${fiscalPeriod}-%`);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabaseから請求書データの取得に失敗しました:', error);
    return [];
  }

  return data || [];
}

/**
 * 複数の顧客の売上サマリーを取得
 */
export interface CustomerSalesMetrics {
  summary: { period: string; sales: number }[];
  totalSales: number;
  lastInvoiceDate: string | null;
}

export async function getSalesSummaryByCustomersFromSupabase(
  customerIds: string[]
): Promise<Record<string, CustomerSalesMetrics>> {
  const supabase = await createClient();
  
  if (customerIds.length === 0) {
    return {};
  }

  // 顧客IDでフィルタリング
  const { data, error } = await supabase
    .from('invoices')
    .select('customer_id, work_no, grand_total, invoice_date')
    .in('customer_id', customerIds);

  if (error) {
    console.error('Supabaseから売上サマリーの取得に失敗しました:', error);
    return {};
  }

  // 顧客ごと、期間ごとに集計
  const summaryByCustomer: Record<string, Record<string, number>> = {};
  const lastInvoiceDateByCustomer: Record<string, string> = {};
  
  (data || []).forEach(record => {
    const customerId = record.customer_id || '';
    const workNo = record.work_no || '';
    const match = workNo.match(/^(\d+)-/);
    
    if (!customerId) {
      return;
    }

    if (record.invoice_date) {
      const currentMax = lastInvoiceDateByCustomer[customerId];
      if (!currentMax || record.invoice_date > currentMax) {
        lastInvoiceDateByCustomer[customerId] = record.invoice_date;
      }
    }

    if (match) {
      const period = parseInt(match[1], 10).toString(); // 09 → 9
      const amount = record.grand_total || 0;
      
      if (!summaryByCustomer[customerId]) {
        summaryByCustomer[customerId] = {};
      }
      
      if (!summaryByCustomer[customerId][period]) {
        summaryByCustomer[customerId][period] = 0;
      }
      
      summaryByCustomer[customerId][period] += amount;
    }
  });
  
  // 配列形式に変換
  const result: Record<string, CustomerSalesMetrics> = {};
  const fiscalPeriods = ['9', '10', '11', '12', '13', '14'];
  
  customerIds.forEach((customerId) => {
    const periodData = summaryByCustomer[customerId] || {};
    const summary = fiscalPeriods.map((period) => ({
      period,
      sales: periodData[period] ?? 0,
    }));
    const totalSales = summary.reduce((sum, item) => sum + item.sales, 0);
    result[customerId] = {
      summary,
      totalSales,
      lastInvoiceDate: lastInvoiceDateByCustomer[customerId] ?? null,
    };
  });
  
  return result;
}
