import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import OrderManagementContent from './OrderManagementContent';

interface OrderManagementPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    fiscalYear?: string;
    keyword?: string;
  }>;
}

export default async function OrderManagementPage({ params, searchParams }: OrderManagementPageProps) {
  const { locale } = await params;
  const { fiscalYear: fiscalYearParam, keyword: keywordParam } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = language === 'ja' ? '注文書管理' : language === 'th' ? 'จัดการใบสั่งซื้อ' : 'Order Management';

  const selectedFiscalYear = fiscalYearParam ? parseInt(fiscalYearParam) : 14;
  const keyword = keywordParam || '';

  let query = (supabase.from('customer_orders') as any)
    .select('*')
    .ilike('work_no', `${selectedFiscalYear}-%`);

  if (keyword) {
    query = query.or(
      `po_number.ilike.%${keyword}%,customer_name.ilike.%${keyword}%,work_no.ilike.%${keyword}%,quotation_no.ilike.%${keyword}%`
    );
  }

  const { data: orderRecords } = await query.order('order_date', { ascending: false }).limit(200);

  const userInfo = await getCurrentUserInfo();

  return (
    <DashboardLayout
      locale={locale}
      title={pageTitle}
      userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
    >
      <OrderManagementContent
        orderRecords={orderRecords || []}
        locale={locale}
        language={language}
        currentFiscalYear={selectedFiscalYear}
        initialKeyword={keyword}
      />
    </DashboardLayout>
  );
}
