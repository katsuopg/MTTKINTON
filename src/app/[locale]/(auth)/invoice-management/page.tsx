import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import InvoiceManagementClient from './InvoiceManagementClient';
import { getInvoicesFromSupabase } from '@/lib/supabase/invoices';
import { convertSupabaseInvoicesToKintone } from '@/lib/supabase/transformers';
import { InvoiceRecord } from '@/types/kintone';

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

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Convert locale to Language type
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  
  const searchQuery = searchParamsResolved.search || '';
  const period = searchParamsResolved.period || '14';

  const invoices = await getInvoicesFromSupabase(period, 500);
  const invoiceRecords: InvoiceRecord[] = convertSupabaseInvoicesToKintone(invoices);
  
  const pageTitle = language === 'ja' ? '請求書管理' : language === 'th' ? 'จัดการใบแจ้งหนี้' : 'Invoice Management';
  
  return (
    <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle}>
      <InvoiceManagementClient
        locale={locale}
        language={language}
        initialSearchQuery={searchQuery}
        initialInvoiceRecords={invoiceRecords}
      />
    </DashboardLayout>
  );
}
