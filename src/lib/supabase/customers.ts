import { createClient } from '@/lib/supabase/server';

export interface SupabaseCustomer {
  id: string;
  kintone_record_id: string;
  customer_id: string;
  company_name: string;
  customer_rank: string | null;
  country: string | null;
  phone_number: string | null;
  fax_number: string | null;
  tax_id: string | null;
  payment_terms: string | null;
  address: string | null;
  website_url: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Supabaseから顧客一覧を取得
 */
export async function getCustomersFromSupabase(): Promise<SupabaseCustomer[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('customer_id', { ascending: true });

  if (error) {
    console.error('Supabaseから顧客データの取得に失敗しました:', error);
    throw error;
  }

  return data || [];
}

/**
 * Supabaseから特定の顧客を取得
 */
export async function getCustomerByIdFromSupabase(customerId: string): Promise<SupabaseCustomer | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('customer_id', customerId)
    .single();

  if (error) {
    console.error('Supabaseから顧客データの取得に失敗しました:', error);
    return null;
  }

  return data;
}