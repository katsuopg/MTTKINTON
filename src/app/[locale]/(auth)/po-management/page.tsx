import { createClient } from '../../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import POManagementContent from './POManagementContent';
import type { SupabasePORecord } from './POManagementContent';
import { getCurrentUserInfo } from '@/lib/auth/user-info';

interface POManagementPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    fiscalYear?: string;
  }>;
}

export default async function POManagementPage({ params, searchParams }: POManagementPageProps) {
  const { locale } = await params;
  const searchParamsResolved = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = language === 'ja' ? '発注管理' : language === 'th' ? 'การจัดการใบสั่งซื้อ' : 'PO Management';
  const selectedFiscalYear = searchParamsResolved.fiscalYear ? parseInt(searchParamsResolved.fiscalYear) : 14;

  let poRecords: SupabasePORecord[] = [];

  try {
    const { data, error } = await supabase
      .from('po_records')
      .select('*')
      .ilike('work_no', `${selectedFiscalYear}-%`)
      .order('po_date', { ascending: false });

    if (error) {
      console.error('Error fetching PO data from Supabase:', error);
    } else {
      poRecords = (data || []) as SupabasePORecord[];
    }
  } catch (error) {
    console.error('Error fetching PO data:', error);
  }

  const userInfo = await getCurrentUserInfo();

  return (
    <DashboardLayout
      locale={locale}
      userEmail={user.email}
      title={pageTitle}
      userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
    >
      <POManagementContent
        poRecords={poRecords}
        locale={locale}
        language={language}
        selectedFiscalYear={selectedFiscalYear}
      />
    </DashboardLayout>
  );
}
