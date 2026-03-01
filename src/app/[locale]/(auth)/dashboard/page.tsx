import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardContent from './DashboardContent';
import { getCurrentUserInfo } from '@/lib/auth/user-info';

export interface SupabaseDashboardWorkOrder {
  kintone_record_id: string;
  work_no: string;
  status: string;
  sales_date: string | null;
  customer_id: string | null;
  customer_name: string | null;
  category: string | null;
  description: string | null;
  grand_total: number | null;
}

export interface SupabaseDashboardInvoice {
  invoice_date: string | null;
  sub_total: number | null;
}

interface DashboardPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const supabase = await createClient();
  const { locale } = await params;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  let workNoCount = 0;
  let projectCount = 0;
  let recentWorkNos: SupabaseDashboardWorkOrder[] = [];
  let fiscalYearWorkNos: SupabaseDashboardWorkOrder[] = [];
  let fiscalYearInvoices: SupabaseDashboardInvoice[] = [];

  try {
    // 並列でSupabaseクエリを実行
    const [wipResult, projectResult, fiscalWoResult, fiscalInvResult] = await Promise.all([
      // WIP工事番号（Working/WIPステータス）
      supabase
        .from('work_orders')
        .select('kintone_record_id, work_no, status, sales_date, customer_id, customer_name, category, description, grand_total')
        .in('status', ['Working', 'WIP', 'Wating PO', 'Pending', 'Stock'])
        .order('kintone_record_id', { ascending: false })
        .limit(200),
      // プロジェクト件数
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true }),
      // 第14期の工事番号（月別売上チャート用）
      supabase
        .from('work_orders')
        .select('kintone_record_id, work_no, status, sales_date, customer_id, customer_name, category, description, grand_total')
        .ilike('work_no', '14-%')
        .order('work_no', { ascending: false })
        .limit(500),
      // 第14期の請求書（実績用）
      supabase
        .from('invoices')
        .select('invoice_date, sub_total')
        .ilike('work_no', '14-%')
        .order('invoice_date', { ascending: false })
        .limit(500),
    ]);

    if (!wipResult.error) {
      recentWorkNos = wipResult.data || [];
      workNoCount = recentWorkNos.filter(r => r.status === 'Working' || r.status === 'WIP').length;
    }

    projectCount = projectResult.count || 0;

    if (!fiscalWoResult.error) {
      fiscalYearWorkNos = fiscalWoResult.data || [];
    }

    if (!fiscalInvResult.error) {
      fiscalYearInvoices = fiscalInvResult.data || [];
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }

  const currentUserInfo = await getCurrentUserInfo();

  const userInfo = currentUserInfo ? {
    email: currentUserInfo.email,
    name: currentUserInfo.name,
    avatarUrl: currentUserInfo.avatarUrl,
  } : {
    email: user?.email || '',
    name: user?.user_metadata?.nickname || '',
    avatarUrl: user?.user_metadata?.avatar_url || '',
  };

  return (
    <DashboardLayout locale={locale} userEmail={user?.email || ''} userInfo={userInfo}>
      <DashboardContent
        locale={locale}
        workNoCount={workNoCount}
        projectCount={projectCount}
        recentWorkNos={recentWorkNos}
        fiscalYearWorkNos={fiscalYearWorkNos}
        fiscalYearInvoices={fiscalYearInvoices}
      />
    </DashboardLayout>
  );
}
