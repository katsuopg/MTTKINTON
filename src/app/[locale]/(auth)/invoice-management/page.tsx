import { createClient } from '../../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import InvoiceManagementClient from './InvoiceManagementClient';
import { getCurrentUserInfo } from '@/lib/auth/user-info';

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
  po_no: string | null;
  tax_rate: number | null;
  vat_price: number | null;
  wht: string | null;
  wht_rate: number | null;
  wht_price: number | null;
  payment_terms: string | null;
  due_date: string | null;
  payment_date: string | null;
  repair_description: string | null;
  detail: string | null;
}

interface InvoiceManagementPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    search?: string;
  }>;
}

export default async function InvoiceManagementPage({ params, searchParams }: InvoiceManagementPageProps) {
  const { locale } = await params;
  const searchParamsResolved = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const searchQuery = searchParamsResolved.search || '';

  // Supabaseから第14期の請求書データを取得（work_noが14-で始まるもの）
  let invoiceRecords: SupabaseInvoice[] = [];

  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('id, kintone_record_id, work_no, invoice_no, invoice_date, customer_id, customer_name, sub_total, discount, after_discount, vat, grand_total, status, po_no, tax_rate, vat_price, wht, wht_rate, wht_price, payment_terms, due_date, payment_date, repair_description, detail')
      .ilike('work_no', '14-%')
      .order('invoice_date', { ascending: false })
      .limit(500);

    if (error) {
      console.error('Error fetching invoices from Supabase:', error);
    } else {
      invoiceRecords = data || [];
    }
  } catch (error) {
    console.error('Error fetching invoice records:', error);
  }

  const pageTitle = language === 'ja' ? '請求書管理' : language === 'th' ? 'จัดการใบแจ้งหนี้' : 'Invoice Management';

  const userInfo = await getCurrentUserInfo();

  return (
    <DashboardLayout
      locale={locale}
      userEmail={user.email}
      title={pageTitle}
      userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
    >
      <InvoiceManagementClient
        locale={locale}
        language={language}
        initialSearchQuery={searchQuery}
        initialInvoiceRecords={invoiceRecords}
      />
    </DashboardLayout>
  );
}
