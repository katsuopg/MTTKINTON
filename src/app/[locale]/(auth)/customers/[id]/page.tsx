import { Metadata } from 'next';
import { CustomerDetailContent } from './CustomerDetailContent';
import type { Language } from '@/lib/kintone/field-mappings';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { detailStyles } from '@/components/ui/DetailStyles';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

export const metadata: Metadata = {
  title: 'Customer Detail - MTT KINTON',
  description: 'Customer detail page',
};

// Supabase Row types
export type SupabaseCustomer = Database['public']['Tables']['customers']['Row'];
export type SupabaseWorkOrder = Database['public']['Tables']['work_orders']['Row'];
export type SupabaseInvoice = Database['public']['Tables']['invoices']['Row'];
export type SupabaseMachine = Database['public']['Tables']['machines']['Row'];
export type SupabaseCustomerStaff = Database['public']['Tables']['customer_staff']['Row'];
export type SupabasePORecord = Database['public']['Tables']['po_records']['Row'];
export type SupabaseQuoteRequest = {
  id: string;
  request_no: string;
  work_no: string | null;
  status_id: string;
  requester_name: string | null;
  desired_delivery_date: string | null;
  created_at: string | null;
  status: { code: string; name: string } | null;
};

interface CustomerDetailPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { locale, id } = await params;
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = language === 'ja' ? '顧客詳細' : language === 'th' ? 'รายละเอียดลูกค้า' : 'Customer Detail';
  const userInfo = await getCurrentUserInfo();

  try {
    const supabase = await createClient();
    const currentPeriod = '14';

    // 顧客データ取得
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('customer_id', id)
      .single();

    if (customerError || !customer) {
      throw new Error(`Customer not found: ${id}`);
    }

    // 並列取得: 現期データ + 全期データ（SalesChart用）+ 機械・担当者
    const [
      workOrdersRes,
      invoicesRes,
      poRecordsRes,
      machinesRes,
      staffRes,
      quoteRequestsRes,
      allWorkOrdersRes,
      allInvoicesRes,
      allQuoteRequestsRes,
    ] = await Promise.all([
      // 現期: 工事番号
      supabase
        .from('work_orders')
        .select('*')
        .eq('customer_id', customer.customer_id)
        .like('work_no', `${currentPeriod}-%`)
        .order('work_no', { ascending: false }),
      // 現期: 請求書
      supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', customer.customer_id)
        .eq('period', currentPeriod)
        .order('invoice_date', { ascending: false }),
      // 現期: PO
      supabase
        .from('po_records')
        .select('*')
        .like('work_no', `${currentPeriod}-%`)
        .eq('cs_id', customer.customer_id)
        .order('po_date', { ascending: false }),
      // 機械（期間なし）
      supabase
        .from('machines')
        .select('*')
        .eq('customer_id', customer.customer_id)
        .order('machine_item'),
      // 担当者（期間なし）
      supabase
        .from('customer_staff')
        .select('*')
        .eq('customer_id', customer.customer_id)
        .order('staff_name'),
      // 現期: 見積依頼（work_noで紐付け）
      supabase
        .from('quote_requests')
        .select('id, request_no, work_no, status_id, requester_name, desired_delivery_date, created_at, status:quote_request_statuses(code, name)')
        .like('work_no', `${currentPeriod}-%`)
        .order('created_at', { ascending: false }),
      // 全期: 工事番号（SalesChart用）
      supabase
        .from('work_orders')
        .select('*')
        .eq('customer_id', customer.customer_id)
        .order('work_no', { ascending: false }),
      // 全期: 請求書（SalesChart用）
      supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', customer.customer_id)
        .order('invoice_date', { ascending: false }),
      // 全期: 見積依頼（SalesChart用）
      supabase
        .from('quote_requests')
        .select('id, request_no, work_no, status_id, requester_name, desired_delivery_date, created_at, status:quote_request_statuses(code, name)')
        .order('created_at', { ascending: false }),
    ]);

    // 見積依頼は顧客のwork_noでフィルタ
    const customerWorkNos = (allWorkOrdersRes.data || []).map(w => w.work_no);
    const quoteRequests = (quoteRequestsRes.data || []).filter(
      qr => qr.work_no && customerWorkNos.includes(qr.work_no)
    );
    const allQuoteRequests = (allQuoteRequestsRes.data || []).filter(
      qr => qr.work_no && customerWorkNos.includes(qr.work_no)
    );

    return (
      <DashboardLayout
        locale={locale}
        title={pageTitle}
        userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
      >
        <CustomerDetailContent
          locale={locale}
          language={language}
          customer={customer}
          workOrders={workOrdersRes.data || []}
          invoices={invoicesRes.data || []}
          poRecords={poRecordsRes.data || []}
          machines={machinesRes.data || []}
          customerStaff={staffRes.data || []}
          quoteRequests={quoteRequests as SupabaseQuoteRequest[]}
          allWorkOrders={allWorkOrdersRes.data || []}
          allInvoices={allInvoicesRes.data || []}
          allQuoteRequests={allQuoteRequests as SupabaseQuoteRequest[]}
        />
      </DashboardLayout>
    );
  } catch (error) {
    console.error('Error fetching customer data:', error);

    return (
      <DashboardLayout
        locale={locale}
        title={pageTitle}
        userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
      >
        <div className={detailStyles.pageWrapper}>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">
              {language === 'ja' ? 'エラーが発生しました' : language === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred'}
            </p>
            <Link href={`/${locale}/customers`} className={`mt-4 inline-block ${detailStyles.link}`}>
              {language === 'ja' ? '一覧に戻る' : language === 'th' ? 'กลับไปที่รายการ' : 'Back to List'}
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }
}
