import { WorkNoDetailContent } from './WorkNoDetailContent';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getFieldLabel, type Language } from '@/lib/kintone/field-mappings';
import type { SupabaseWorkOrder } from '../page';

export interface SupabaseInvoiceForDetail {
  id: string;
  kintone_record_id: string;
  work_no: string | null;
  invoice_no: string | null;
  invoice_date: string | null;
  customer_name: string | null;
  sub_total: number | null;
  grand_total: number | null;
  status: string | null;
}

export interface SupabaseCustomerForDetail {
  id: string;
  customer_id: string;
  company_name: string;
  short_name: string | null;
  phone_number: string | null;
  address: string | null;
}

export interface SupabaseQuoteRequestForDetail {
  id: string;
  request_no: string;
  work_no: string | null;
  status_id: string;
  requester_name: string | null;
  desired_delivery_date: string | null;
  created_at: string | null;
  status: { code: string; name: string; name_en: string | null } | null;
  items: {
    id: string;
    model_number: string;
    manufacturer: string;
    quantity: number;
    offers: {
      id: string;
      supplier_name: string | null;
      quoted_price: number | null;
      quoted_unit_price: number | null;
      is_awarded: boolean;
    }[];
  }[];
}

interface WorkNoDetailPageProps {
  params: Promise<{
    locale: string;
    workNo: string;
  }>;
}

export default async function WorkNoDetailPage({ params }: WorkNoDetailPageProps) {
  const { locale, workNo } = await params;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = getFieldLabel('WorkNo', language);
  const userInfo = await getCurrentUserInfo();

  // 工事番号の詳細をSupabaseから取得
  const decodedWorkNo = decodeURIComponent(workNo);
  const { data: record, error: recordError } = await supabase
    .from('work_orders')
    .select('*')
    .eq('work_no', decodedWorkNo)
    .single();

  if (recordError || !record) {
    return (
      <DashboardLayout locale={locale} title={pageTitle} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">工事番号が見つかりません</h1>
            <p className="text-gray-600 dark:text-gray-400">工事番号: {decodedWorkNo}</p>
            <a
              href={`/${locale}/dashboard`}
              className="mt-4 inline-block text-brand-500 hover:text-brand-600"
            >
              ダッシュボードに戻る
            </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 顧客情報をSupabaseから取得
  let customer: SupabaseCustomerForDetail | null = null;
  if (record.customer_id) {
    const { data } = await supabase
      .from('customers')
      .select('id, customer_id, company_name, short_name, phone_number, address')
      .eq('customer_id', record.customer_id)
      .single();
    customer = data;
  }

  // 工事番号に関連するPOをSupabaseから取得
  let poRecords: any[] = [];
  try {
    const { data, error: poError } = await supabase
      .from('po_records')
      .select('*')
      .eq('work_no', decodedWorkNo)
      .order('po_date', { ascending: false });

    if (!poError) {
      poRecords = data || [];
    }
  } catch (err) {
    console.error('Error fetching PO data:', err);
  }

  // 工事番号に関連する見積依頼をSupabaseから取得
  let quoteRequests: SupabaseQuoteRequestForDetail[] = [];
  try {
    const { data, error: qrError } = await supabase
      .from('quote_requests')
      .select(`
        id, request_no, work_no, status_id, requester_name, desired_delivery_date, created_at,
        status:quote_request_statuses(code, name, name_en),
        items:quote_request_items(
          id, model_number, manufacturer, quantity,
          offers:quote_request_item_offers(id, supplier_name, quoted_price, quoted_unit_price, is_awarded)
        )
      `)
      .eq('work_no', decodedWorkNo)
      .order('created_at', { ascending: false });

    if (!qrError) {
      quoteRequests = (data || []) as unknown as SupabaseQuoteRequestForDetail[];
    }
  } catch (err) {
    console.error('Error fetching Quote Request data:', err);
  }

  // 工事番号に関連するコストデータをSupabaseから取得
  let costRecords: any[] = [];
  try {
    const { data, error: costError } = await supabase
      .from('cost_records')
      .select('*')
      .eq('work_no', decodedWorkNo)
      .order('kintone_record_id', { ascending: false });

    if (!costError) {
      costRecords = data || [];
    }
  } catch (err) {
    console.error('Error fetching Cost data:', err);
  }

  // 工事番号に関連する請求書データをSupabaseから取得
  let invoiceRecords: SupabaseInvoiceForDetail[] = [];
  try {
    const { data, error: invError } = await supabase
      .from('invoices')
      .select('id, kintone_record_id, work_no, invoice_no, invoice_date, customer_name, sub_total, grand_total, status')
      .eq('work_no', decodedWorkNo)
      .order('invoice_date', { ascending: false });

    if (!invError) {
      invoiceRecords = data || [];
    }
  } catch (err) {
    console.error('Error fetching Invoice data:', err);
  }

  return (
    <DashboardLayout locale={locale} title={pageTitle} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
      <WorkNoDetailContent
        record={record as SupabaseWorkOrder}
        customer={customer}
        poRecords={poRecords}
        quoteRequests={quoteRequests}
        costRecords={costRecords}
        invoiceRecords={invoiceRecords}
        locale={locale}
      />
    </DashboardLayout>
  );
}
