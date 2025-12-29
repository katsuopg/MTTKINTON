import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KintoneClient } from '@/lib/kintone/client';
import { MachineRecord, QuotationRecord, WorkNoRecord, KINTONE_APPS } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import MachineListContent from './MachineListContent';
import { getCurrentUserInfo } from '@/lib/auth/user-info';

interface MachinesPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    search?: string;
    category?: string;
    vendor?: string;
  }>;
}

export default async function MachinesPage({ params, searchParams }: MachinesPageProps) {
  const { locale } = await params;
  const searchParamsResolved = await searchParams;
  const supabase = await createClient();

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Convert locale to Language type
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  
  // kintoneから機械管理データを取得
  let machineRecords: MachineRecord[] = [];
  const machineQtCounts: Record<string, number> = {};
  const machineWnCounts: Record<string, number> = {};
  
  try {
    const machineClient = new KintoneClient(
      '89', // Machine ManagementアプリID
      'T4MEIBEiCBZ0ksOY6aL8qEHHVdRMN5nPWU4szZJj'
    );
    
    // クエリを構築
    let query = '';
    const conditions: string[] = [];
    
    if (searchParamsResolved.search) {
      const search = searchParamsResolved.search;
      conditions.push(`(CsName like "${search}" or CsId_db like "${search}" or Moldel like "${search}" or SrialNo like "${search}" or McItem like "${search}")`);
    }
    
    if (searchParamsResolved.category && searchParamsResolved.category !== 'all') {
      conditions.push(`MachineCategory = "${searchParamsResolved.category}"`);
    }
    
    if (searchParamsResolved.vendor && searchParamsResolved.vendor !== 'all') {
      conditions.push(`Vender = "${searchParamsResolved.vendor}"`);
    }
    
    if (conditions.length > 0) {
      query = conditions.join(' and ') + ' ';
    }
    
    query += 'order by Record_number desc limit 200';
    
    machineRecords = await machineClient.getRecords<MachineRecord>(query);
    console.log(`Found ${machineRecords.length} machine records`);
    
    // 見積管理アプリからQT（見積回数）を取得
    try {
      const quotationApiToken = process.env.KINTONE_API_TOKEN_QUOTATION;
      if (quotationApiToken) {
        const quotationClient = new KintoneClient(
          String(KINTONE_APPS.QUOTATION.appId), // QuotationアプリID
          quotationApiToken
        );
        
        // 各機械のMcItemごとに見積数をカウント
        for (const machine of machineRecords) {
          if (machine.McItem?.value) {
            try {
              const qtQuery = `McItem = "${machine.McItem.value}" order by レコード番号 desc`;
              const quotations = await quotationClient.getRecords<QuotationRecord>(qtQuery);
              machineQtCounts[machine.$id.value] = quotations.length;
            } catch (error) {
              console.error(`Error fetching quotations for ${machine.McItem.value}:`, error);
              machineQtCounts[machine.$id.value] = 0;
            }
          }
        }
      } else {
        console.warn('KINTONE_API_TOKEN_QUOTATION is not set');
      }
    } catch (error) {
      console.error('Error fetching quotation counts:', error);
    }
    
    // 工事番号管理アプリからWN（工事番号数）を取得
    try {
      const workNoApiToken = process.env.KINTONE_API_TOKEN_WORKNO;
      if (workNoApiToken) {
        const workNoClient = new KintoneClient(
          String(KINTONE_APPS.WORK_NO.appId), // Work Number ManagementアプリID
          workNoApiToken
        );
        
        // 各機械のMcItemごとに工事番号数をカウント
        for (const machine of machineRecords) {
          if (machine.McItem?.value) {
            try {
              const wnQuery = `McItem = "${machine.McItem.value}" order by レコード番号 desc`;
              const workNos = await workNoClient.getRecords<WorkNoRecord>(wnQuery);
              machineWnCounts[machine.$id.value] = workNos.length;
            } catch (error) {
              console.error(`Error fetching work numbers for ${machine.McItem.value}:`, error);
              machineWnCounts[machine.$id.value] = 0;
            }
          }
        }
      } else {
        console.warn('KINTONE_API_TOKEN_WORKNO is not set');
      }
    } catch (error) {
      console.error('Error fetching work number counts:', error);
    }
  } catch (error) {
    console.error('Error fetching machine data:', error);
  }

  const pageTitle = language === 'ja' ? '機械管理' : language === 'th' ? 'การจัดการเครื่องจักร' : 'Machine Management';

  const userInfo = await getCurrentUserInfo();

  return (
    <DashboardLayout
      locale={locale}
      userEmail={user.email}
      title={pageTitle}
      userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
    >
      <MachineListContent
        locale={locale}
        language={language}
        initialRecords={machineRecords}
        initialSearch={searchParamsResolved.search || ''}
        initialCategory={searchParamsResolved.category || 'all'}
        initialVendor={searchParamsResolved.vendor || 'all'}
        qtCounts={machineQtCounts}
        wnCounts={machineWnCounts}
      />
    </DashboardLayout>
  );
}