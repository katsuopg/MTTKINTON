import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StaffListContent from './StaffListContent';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';

export interface SupabaseCustomerStaff {
  id: string;
  kintone_record_id: string;
  customer_id: string | null;
  company_name: string | null;
  staff_name: string;
  division: string | null;
  position: string | null;
  email: string | null;
  telephone: string | null;
  line_id: string | null;
  notes: string | null;
}

interface StaffListPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function StaffListPage({ params }: StaffListPageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  // Supabaseから全ての顧客担当者を取得
  const { data: staffList, error: staffError } = await supabase
    .from('customer_staff')
    .select('id, kintone_record_id, customer_id, company_name, staff_name, division, position, email, telephone, line_id, notes')
    .order('company_name', { ascending: true });

  if (staffError) {
    console.error('Error fetching customer staff:', staffError);
  }

  const userInfo = await getCurrentUserInfo();
  const pageTitle = language === 'ja' ? '顧客担当者管理' : language === 'th' ? 'จัดการผู้ติดต่อ' : 'Staff Management';

  return (
    <DashboardLayout locale={locale} userEmail={user.email || ''} title={pageTitle} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
      <StaffListContent
        staffList={staffList || []}
        locale={locale}
      />
    </DashboardLayout>
  );
}
