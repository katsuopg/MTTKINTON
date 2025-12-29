import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KintoneClient } from '@/lib/kintone/client';
import { MachineRecord, WorkNoRecord, QuotationRecord, KINTONE_APPS } from '@/types/kintone';
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

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Convert locale to Language type
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  
  // kintoneから機械詳細データを取得
  let machineRecord: MachineRecord | null = null;
  let workNoRecords: WorkNoRecord[] = [];
  let quotationRecords: QuotationRecord[] = [];
  let customerMachines: MachineRecord[] = [];
  
  try {
    const machineClient = new KintoneClient(
      '89', // Machine ManagementアプリID
      'T4MEIBEiCBZ0ksOY6aL8qEHHVdRMN5nPWU4szZJj'
    );
    
    machineRecord = await machineClient.getRecord<MachineRecord>(id);
    if (machineRecord) {
      console.log('Found machine record:', machineRecord.$id.value);
      
      // 同じ顧客の他の機械を取得
      if (machineRecord.CsId_db?.value) {
        try {
          const customerMachineQuery = `CsId_db = "${machineRecord.CsId_db.value}" and $id != "${id}" order by McItem asc`;
          customerMachines = await machineClient.getRecords<MachineRecord>(customerMachineQuery);
          console.log(`Found ${customerMachines.length} other machines for customer: ${machineRecord.CsId_db.value}`);
        } catch (error) {
          console.error('Error fetching customer machines:', error);
        }
      }
      
      // 関連する工事番号データを取得（McItemで検索）
      const workNoApiToken = process.env.KINTONE_API_TOKEN_WORKNO;
      if (workNoApiToken && machineRecord.McItem?.value) {
        try {
          const workNoClient = new KintoneClient(
            String(KINTONE_APPS.WORK_NO.appId), // Work Number ManagementアプリID
            workNoApiToken
          );
          
          const workNoQuery = `McItem = "${machineRecord.McItem.value}" order by レコード番号 desc`;
          workNoRecords = await workNoClient.getRecords<WorkNoRecord>(workNoQuery);
          console.log(`Found ${workNoRecords.length} work number records for McItem: ${machineRecord.McItem.value}`);
        } catch (error) {
          console.error('Error fetching work number data:', error);
        }
      }
      
      // 関連する見積データを取得（McItemで検索）
      const quotationApiToken = process.env.KINTONE_API_TOKEN_QUOTATION;
      if (quotationApiToken && machineRecord.McItem?.value) {
        try {
          const quotationClient = new KintoneClient(
            String(KINTONE_APPS.QUOTATION.appId), // QuotationアプリID
            quotationApiToken
          );
          
          const qtQuery = `McItem = "${machineRecord.McItem.value}" order by レコード番号 desc`;
          quotationRecords = await quotationClient.getRecords<QuotationRecord>(qtQuery);
          console.log(`Found ${quotationRecords.length} quotation records for McItem: ${machineRecord.McItem.value}`);
        } catch (error) {
          console.error('Error fetching quotation data:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching machine detail:', error);
  }

  if (!machineRecord) {
    redirect(`/${locale}/machines`);
  }

  const pageTitle = language === 'ja' ? '機械詳細' : language === 'th' ? 'รายละเอียดเครื่องจักร' : 'Machine Details';

  const userInfo = await getCurrentUserInfo();

  return (
    <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
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