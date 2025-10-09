import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MachineRecord, WorkNoRecord, QuotationRecord, KINTONE_APPS } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import MachineDetailContent from './MachineDetailContent';
import { getMachineByIdFromSupabase, getMachinesByCustomerFromSupabase } from '@/lib/supabase/machines';
import { convertSupabaseMachinesToKintone } from '@/lib/supabase/transformers';
import { KintoneClient } from '@/lib/kintone/client';

interface MachineDetailPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function MachineDetailPage({ params }: MachineDetailPageProps) {
  const { locale, id } = await params;
  const supabase = await createClient();

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Convert locale to Language type
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  
  const machineSupabase = await getMachineByIdFromSupabase(id);

  if (!machineSupabase) {
    redirect(`/${locale}/machines`);
  }

  const [machineRecord] = convertSupabaseMachinesToKintone([machineSupabase]);

  // 同じ顧客の他機械（自身を除く）
  const otherMachinesSupabase = machineSupabase.customer_id
    ? await getMachinesByCustomerFromSupabase(machineSupabase.customer_id)
    : [];

  const customerMachines = convertSupabaseMachinesToKintone(
    otherMachinesSupabase.filter((record) => record.kintone_record_id !== machineSupabase.kintone_record_id)
  );

  // 関連する工事番号・見積データはKintone APIから取得
  let workNoRecords: WorkNoRecord[] = [];
  let quotationRecords: QuotationRecord[] = [];

  if (machineRecord.McItem?.value) {
    const mcItem = machineRecord.McItem.value;

    const workNoApiToken = process.env.KINTONE_API_TOKEN_WORKNO;
    if (workNoApiToken) {
      try {
        const workNoClient = new KintoneClient(String(KINTONE_APPS.WORK_NO.appId), workNoApiToken);
        const workNoQuery = `McItem = "${mcItem}" order by レコード番号 desc`;
        workNoRecords = await workNoClient.getRecords<WorkNoRecord>(workNoQuery);
      } catch (error) {
        console.error('Error fetching work number data:', error);
      }
    }

    const quotationApiToken = process.env.KINTONE_API_TOKEN_QUOTATION;
    if (quotationApiToken) {
      try {
        const quotationClient = new KintoneClient(String(KINTONE_APPS.QUOTATION.appId), quotationApiToken);
        const qtQuery = `McItem = "${mcItem}" order by レコード番号 desc`;
        quotationRecords = await quotationClient.getRecords<QuotationRecord>(qtQuery);
      } catch (error) {
        console.error('Error fetching quotation data:', error);
      }
    }
  }

  const pageTitle = language === 'ja' ? '機械詳細' : language === 'th' ? 'รายละเอียดเครื่องจักร' : 'Machine Details';
  
  return (
    <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle}>
      <MachineDetailContent
        locale={locale}
        language={language}
        machineRecord={machineRecord}
        workNoRecords={workNoRecords}
        quotationRecords={quotationRecords}
        customerMachines={customerMachines}
      />
    </DashboardLayout>
  );
}
