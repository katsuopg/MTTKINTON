import { WorkNoDetailContent } from './WorkNoDetailContent';
import { fetchWorkNo, fetchCustomer } from '@/lib/kintone/api';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KintoneClient } from '@/lib/kintone/client';
import { QuotationRecord, InvoiceRecord } from '@/types/kintone';
import { getInvoiceRecordsByWorkNo } from '@/lib/kintone/invoice';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getFieldLabel, type Language } from '@/lib/kintone/field-mappings';

interface WorkNoDetailPageProps {
  params: {
    locale: string;
    workNo: string;
  };
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

  // 工事番号の詳細を取得
  const record = await fetchWorkNo(workNo);

  if (!record) {
    return (
      <DashboardLayout locale={locale} title={pageTitle} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">工事番号が見つかりません</h1>
            <p className="text-gray-600 dark:text-gray-400">工事番号: {workNo}</p>
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

  // CS IDから顧客情報を取得（URLデコードして検索）
  let customer = null;
  if (record.文字列__1行__8?.value) {
    const decodedCsId = decodeURIComponent(record.文字列__1行__8.value);
    customer = await fetchCustomer(decodedCsId);
  }

  // 工事番号に関連するPOをSupabaseから取得
  let poRecords: any[] = [];
  try {
    const { data, error: poError } = await supabase
      .from('po_records')
      .select('*')
      .eq('work_no', workNo)
      .order('po_date', { ascending: false });

    if (poError) {
      console.error('Error fetching PO data from Supabase:', poError);
    } else {
      poRecords = data || [];
    }
  } catch (error) {
    console.error('Error fetching PO data:', error);
  }

  // 工事番号に関連する見積もりを取得
  let quotationRecords: QuotationRecord[] = [];
  try {
    const quotationClient = new KintoneClient(
      '8',
      process.env.KINTONE_API_TOKEN_QUOTATION!
    );
    if (record.ルックアップ_0?.value) {
      const quotationQuery = `qtno2 = "${record.ルックアップ_0.value}" order by 日付 desc`;
      quotationRecords = await quotationClient.getRecords<QuotationRecord>(quotationQuery);
    }
  } catch (error) {
    console.error('Error fetching Quotation data:', error);
  }

  // 工事番号に関連するコストデータをSupabaseから取得
  let costRecords: any[] = [];
  try {
    const { data, error: costError } = await supabase
      .from('cost_records')
      .select('*')
      .eq('work_no', workNo)
      .order('kintone_record_id', { ascending: false });

    if (costError) {
      console.error('Error fetching Cost data from Supabase:', costError);
    } else {
      costRecords = data || [];
    }
  } catch (error) {
    console.error('Error fetching Cost data:', error);
  }

  // 工事番号に関連する請求書データを取得
  let invoiceRecords: InvoiceRecord[] = [];
  try {
    invoiceRecords = await getInvoiceRecordsByWorkNo(workNo);
  } catch (error) {
    console.error('Error fetching Invoice data:', error);
  }

  return (
    <DashboardLayout locale={locale} title={pageTitle} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
      <WorkNoDetailContent
        record={record}
        customer={customer}
        poRecords={poRecords}
        quotationRecords={quotationRecords}
        costRecords={costRecords}
        invoiceRecords={invoiceRecords}
        locale={locale}
      />
    </DashboardLayout>
  );
}
