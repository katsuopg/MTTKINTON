import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import MachineDetailContent from './MachineDetailContent';
import { getCurrentUserInfo } from '@/lib/auth/user-info';

interface MachineDetailPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function MachineDetailPage({ params }: MachineDetailPageProps) {
  const { locale, id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  // Supabaseから機械詳細データを取得（kintone_record_idで検索）
  const { data: machineRecord, error: machineError } = await supabase
    .from('machines')
    .select('*')
    .eq('kintone_record_id', id)
    .single();

  if (machineError || !machineRecord) {
    redirect(`/${locale}/machines`);
  }

  // 同じ顧客の他の機械を取得
  let customerMachines: any[] = [];
  if (machineRecord.customer_id) {
    const { data } = await supabase
      .from('machines')
      .select('*')
      .eq('customer_id', machineRecord.customer_id)
      .neq('kintone_record_id', id)
      .order('machine_item', { ascending: true });
    customerMachines = data || [];
  }

  // 関連する工事番号データを取得（work_ordersテーブルからmachine_itemで検索）
  let workNoRecords: any[] = [];
  if (machineRecord.machine_item) {
    const { data } = await supabase
      .from('work_orders')
      .select('*')
      .eq('machine_item', machineRecord.machine_item)
      .order('kintone_record_id', { ascending: false });
    workNoRecords = data || [];
  }

  // 関連する見積データ（quotation_historyがJSONBに保存されている場合はそこから取得）
  const quotationRecords = machineRecord.quotation_history || [];

  const pageTitle = language === 'ja' ? '機械詳細' : language === 'th' ? 'รายละเอียดเครื่องจักร' : 'Machine Details';

  const userInfo = await getCurrentUserInfo();

  return (
    <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
      <MachineDetailContent
        locale={locale}
        language={language}
        machineRecord={machineRecord as any}
        workNoRecords={workNoRecords as any}
        quotationRecords={quotationRecords as any}
        customerMachines={customerMachines as any}
      />
    </DashboardLayout>
  );
}
