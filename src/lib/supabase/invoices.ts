import { createClient } from '@/lib/supabase/server';

export interface SupabaseInvoice {
  id: string;
  kintone_record_id: string;
  work_no: string;
  invoice_no: string;
  invoice_date: string | null;
  customer_id: string | null;
  customer_name: string | null;
  sub_total: number | null;
  discount: number | null;
  after_discount: number | null;
  vat: number | null;
  grand_total: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
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
export async function getInvoicesByCustomerFromSupabase(
  customerName: string,
  fiscalPeriod?: string
): Promise<SupabaseInvoice[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('invoices')
    .select('*')
    .eq('customer_name', customerName)
    .order('invoice_date', { ascending: false })
    .limit(500);

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
export async function getSalesSummaryByCustomersFromSupabase(
  customerNames: string[]
): Promise<Record<string, { period: string; sales: number }[]>> {
  const supabase = await createClient();
  
  if (customerNames.length === 0) {
    return {};
  }

  // 顧客名でフィルタリング
  const { data, error } = await supabase
    .from('invoices')
    .select('customer_name, work_no, grand_total')
    .in('customer_name', customerNames);

  if (error) {
    console.error('Supabaseから売上サマリーの取得に失敗しました:', error);
    return {};
  }

  // 顧客ごと、期間ごとに集計
  const summaryByCustomer: Record<string, Record<string, number>> = {};

  const records = (data || []) as { customer_name: string | null; work_no: string | null; grand_total: number | null }[];
  records.forEach(record => {
    const customerName = record.customer_name || '';
    const workNo = record.work_no || '';
    const match = workNo.match(/^(\d+)-/);
    
    if (match && customerName) {
      const period = parseInt(match[1], 10).toString(); // 09 → 9
      const amount = record.grand_total || 0;
      
      if (!summaryByCustomer[customerName]) {
        summaryByCustomer[customerName] = {};
      }
      
      if (!summaryByCustomer[customerName][period]) {
        summaryByCustomer[customerName][period] = 0;
      }
      
      summaryByCustomer[customerName][period] += amount;
    }
  });
  
  // 配列形式に変換
  const result: Record<string, { period: string; sales: number }[]> = {};
  
  Object.entries(summaryByCustomer).forEach(([customerName, periodData]) => {
    result[customerName] = Object.entries(periodData).map(([period, sales]) => ({
      period,
      sales
    }));
  });
  
  return result;
}