import { getAllCustomerStaff } from '@/lib/kintone/customer-staff';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StaffListContent from './StaffListContent';

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
    redirect(`/${locale}/login`);
  }

  // 全ての顧客担当者を取得
  const staffList = await getAllCustomerStaff();

  return (
    <StaffListContent
      staffList={staffList}
      locale={locale}
      userEmail={user.email || ''}
    />
  );
}
