import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MachineRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import MachineListContent from './MachineListContent';
import { getMachinesFromSupabase } from '@/lib/supabase/machines';
import { convertSupabaseMachinesToKintone } from '@/lib/supabase/transformers';

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
  
  const machines = await getMachinesFromSupabase({
    search: searchParamsResolved.search || undefined,
    category: searchParamsResolved.category || undefined,
    vendor: searchParamsResolved.vendor || undefined,
    limit: 500,
  });

  const machineRecords: MachineRecord[] = convertSupabaseMachinesToKintone(machines);

  const machineQtCounts: Record<string, number> = {};
  const machineWnCounts: Record<string, number> = {};

  machineRecords.forEach((record, index) => {
    const source = machines[index];
    if (!source) {
      return;
    }

    const key = record.$id.value;
    machineQtCounts[key] = source.quotation_count ?? 0;
    machineWnCounts[key] = source.work_order_count ?? 0;
  });

  const pageTitle = language === 'ja' ? '機械管理' : language === 'th' ? 'การจัดการเครื่องจักร' : 'Machine Management';
  
  return (
    <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle}>
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
