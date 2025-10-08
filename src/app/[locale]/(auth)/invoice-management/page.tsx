import { createClient } from '../../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import InvoiceManagementClient from './InvoiceManagementClient';
import { getInvoiceRecords } from '@/lib/kintone/invoice';
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
  
  // デフォルトは第14期のデータを取得
  let invoiceRecords: InvoiceRecord[] = [];
  
  try {
    console.log('=== Invoice Management Page: Fetching invoice records ===');
    invoiceRecords = await getInvoiceRecords('14', 500); // デフォルトで第14期を取得
    console.log('Fetched invoice records count:', invoiceRecords.length);
    if (invoiceRecords.length > 0) {
      console.log('First invoice record:', invoiceRecords[0]);
    }
  } catch (error) {
    console.error('Error fetching invoice records:', error);
    // エラーの場合は空配列のまま
  }
  
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