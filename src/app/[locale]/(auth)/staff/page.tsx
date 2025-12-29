import { fetchAllCustomerStaff } from '@/lib/kintone/api';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StaffListContent from './StaffListContent';
import { getCurrentUserInfo } from '@/lib/auth/user-info';

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
  const staffList = await fetchAllCustomerStaff();

  const userInfo = await getCurrentUserInfo();

  return (
    <StaffListContent
      staffList={staffList}
      locale={locale}
      userEmail={user.email || ''}
      userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
    />
  );
}