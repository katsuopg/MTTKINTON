import { CustomerListContent } from './CustomerListContent';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCustomersFromSupabase } from '@/lib/supabase/customers';
import { getSalesSummaryByCustomersFromSupabase } from '@/lib/supabase/invoices';
import { convertSupabaseCustomersToKintone } from '@/lib/supabase/transformers';

interface CustomerListPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function CustomerListPage({ params }: CustomerListPageProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  // Supabaseから顧客一覧を取得
  const customers = await getCustomersFromSupabase();

  // Kintone形式に変換
  const kintoneCustomers = convertSupabaseCustomersToKintone(customers);

  // 売上サマリーを取得
  const customerIds = customers.map((customer) => customer.customer_id);
  const salesSummary = await getSalesSummaryByCustomersFromSupabase(customerIds);

  return (
    <CustomerListContent 
      customers={kintoneCustomers} 
      locale={locale} 
      userEmail={user.email || ''} 
      salesSummary={salesSummary}
    />
  );
}
