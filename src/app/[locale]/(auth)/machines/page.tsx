import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import MachineListContent from './MachineListContent';
import { getCurrentUserInfo } from '@/lib/auth/user-info';

export interface SupabaseMachine {
  id: string;
  kintone_record_id: string;
  customer_id: string;
  customer_name: string | null;
  machine_category: string | null;
  machine_type: string | null;
  vendor: string | null;
  model: string | null;
  serial_number: string | null;
  machine_number: string | null;
  machine_item: string | null;
  install_date: string | null;
  manufacture_date: string | null;
  remarks: string | null;
  quotation_count: number | null;
  work_order_count: number | null;
  report_count: number | null;
  quotation_history: any | null;
}

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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  // Supabaseから機械データを取得
  let machineRecords: SupabaseMachine[] = [];

  try {
    let query = supabase
      .from('machines')
      .select('id, kintone_record_id, customer_id, customer_name, machine_category, machine_type, vendor, model, serial_number, machine_number, machine_item, install_date, manufacture_date, remarks, quotation_count, work_order_count, report_count, quotation_history')
      .order('kintone_record_id', { ascending: false })
      .limit(200);

    // サーバーサイド検索
    if (searchParamsResolved.search) {
      const search = searchParamsResolved.search;
      query = query.or(`customer_name.ilike.%${search}%,customer_id.ilike.%${search}%,model.ilike.%${search}%,serial_number.ilike.%${search}%,machine_item.ilike.%${search}%`);
    }

    if (searchParamsResolved.category && searchParamsResolved.category !== 'all') {
      query = query.eq('machine_category', searchParamsResolved.category);
    }

    if (searchParamsResolved.vendor && searchParamsResolved.vendor !== 'all') {
      query = query.eq('vendor', searchParamsResolved.vendor);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching machines from Supabase:', error);
    } else {
      machineRecords = data || [];
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
      />
    </DashboardLayout>
  );
}
