import { createClient } from '../../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import WorkNoClient from './WorkNoClient';
import { getCurrentUserInfo } from '@/lib/auth/user-info';

// ページレベルのキャッシュ設定（5分）
export const revalidate = 300;

export interface SupabaseWorkOrder {
  id: string;
  kintone_record_id: string;
  work_no: string;
  status: string;
  start_date: string | null;
  finish_date: string | null;
  sales_date: string | null;
  sales_staff: string | null;
  customer_id: string | null;
  customer_name: string | null;
  category: string | null;
  description: string | null;
  machine_type: string | null;
  vendor: string | null;
  model: string | null;
  serial_number: string | null;
  machine_number: string | null;
  machine_item: string | null;
  invoice_no_1: string | null;
  invoice_no_2: string | null;
  invoice_no_3: string | null;
  invoice_no_4: string | null;
  invoice_date_1: string | null;
  invoice_date_2: string | null;
  invoice_date_3: string | null;
  sub_total: number | null;
  discount: number | null;
  grand_total: number | null;
  purchase_cost: number | null;
  labor_cost: number | null;
  cost_total: number | null;
  overhead_rate: number | null;
  commission_rate: number | null;
  person_in_charge: string | null;
  po_list: string | null;
  inv_list: string | null;
}

interface ProjectsPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    fiscalYear?: string;
    search?: string;
  }>;
}

export default async function ProjectsPage({ params, searchParams }: ProjectsPageProps) {
  const { locale } = await params;
  const searchParamsResolved = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  const selectedFiscalYear = searchParamsResolved.fiscalYear ? parseInt(searchParamsResolved.fiscalYear) : 14;
  const searchQuery = searchParamsResolved.search || '';

  // Supabaseからwork_ordersを取得
  let workOrders: SupabaseWorkOrder[] = [];

  try {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .ilike('work_no', `${selectedFiscalYear}-%`)
      .order('work_no', { ascending: false });

    if (error) {
      console.error('Error fetching work orders:', error);
    } else {
      workOrders = data || [];
    }
  } catch (error) {
    console.error('Error fetching work orders:', error);
  }

  // 請求書の工事番号ごとの件数を取得
  let invoiceCountMap: Record<string, number> = {};

  try {
    const { data: invoiceData, error } = await supabase
      .from('invoices')
      .select('work_no')
      .ilike('work_no', `${selectedFiscalYear}-%`);

    if (!error && invoiceData) {
      invoiceData.forEach(inv => {
        const workNo = inv.work_no || '';
        if (workNo) {
          invoiceCountMap[workNo] = (invoiceCountMap[workNo] || 0) + 1;
        }
      });
    }
  } catch (error) {
    console.error('Error fetching invoice counts:', error);
  }

  const pageTitle = language === 'ja' ? '工事番号管理' : language === 'th' ? 'จัดการหมายเลขงาน' : 'Work No. Management';

  const userInfo = await getCurrentUserInfo();

  return (
    <DashboardLayout
      locale={locale}
      userEmail={user.email}
      title={pageTitle}
      userInfo={userInfo ? {
        email: userInfo.email,
        name: userInfo.name,
        avatarUrl: userInfo.avatarUrl,
      } : undefined}
    >
      <WorkNoClient
        locale={locale}
        language={language}
        initialRecords={workOrders}
        invoiceCountMap={invoiceCountMap}
        initialFiscalYear={selectedFiscalYear}
        initialSearchQuery={searchQuery}
      />
    </DashboardLayout>
  );
}
