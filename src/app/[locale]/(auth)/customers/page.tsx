import { CustomerListContent } from './CustomerListContent';
import { createClient } from '../../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import { type Language } from '@/lib/kintone/field-mappings';

export interface SupabaseCustomer {
  id: string;
  kintone_record_id: string;
  customer_id: string;
  company_name: string;
  short_name: string | null;
  customer_rank: string | null;
  country: string | null;
  phone_number: string | null;
  fax_number: string | null;
  tax_id: string | null;
  payment_terms: string | null;
  address: string | null;
  postal_code: string | null;
  website_url: string | null;
  notes: string | null;
}

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

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  // Supabaseから顧客一覧を取得
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, kintone_record_id, customer_id, company_name, short_name, customer_rank, country, phone_number, fax_number, tax_id, payment_terms, address, postal_code, website_url, notes')
    .order('customer_id', { ascending: true });

  if (customersError) {
    console.error('Error fetching customers:', customersError);
  }

  // 売上サマリーをinvoicesテーブルから集計
  const customerNames = (customers || []).map(c => c.company_name);
  let salesSummary: Record<string, { period: string; sales: number }[]> = {};

  if (customerNames.length > 0) {
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('work_no, customer_name, grand_total')
      .in('customer_name', customerNames);

    if (invoiceData) {
      const summaryByCustomer: Record<string, Record<string, number>> = {};
      invoiceData.forEach(inv => {
        const customerName = inv.customer_name || '';
        const workNo = inv.work_no || '';
        const match = workNo.match(/^(\d+)-/);
        if (match && customerName) {
          const period = parseInt(match[1], 10).toString();
          const amount = inv.grand_total || 0;
          if (!summaryByCustomer[customerName]) summaryByCustomer[customerName] = {};
          if (!summaryByCustomer[customerName][period]) summaryByCustomer[customerName][period] = 0;
          summaryByCustomer[customerName][period] += amount;
        }
      });
      Object.entries(summaryByCustomer).forEach(([customerName, periodData]) => {
        salesSummary[customerName] = Object.entries(periodData).map(([period, sales]) => ({ period, sales }));
      });
    }
  }

  const pageTitle = language === 'ja' ? '顧客管理' : language === 'th' ? 'จัดการลูกค้า' : 'Customer Management';
  const userInfo = await getCurrentUserInfo();

  return (
    <DashboardLayout locale={locale} userEmail={user.email || ''} title={pageTitle} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
      <CustomerListContent
        customers={customers || []}
        locale={locale}
        salesSummary={salesSummary}
      />
    </DashboardLayout>
  );
}
