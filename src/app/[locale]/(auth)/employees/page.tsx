import { createClient } from '../../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import EmployeesClient from './EmployeesClient';
import { Database } from '@/types/supabase';
import { getCurrentUserInfo } from '@/lib/auth/user-info';

type Employee = Database['public']['Tables']['employees']['Row'];

interface EmployeesPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function EmployeesPage({ params }: EmployeesPageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // ユーザー情報を取得（ニックネーム、アバター含む）
  const userInfo = await getCurrentUserInfo();

  // Convert locale to Language type
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  // Supabaseから従業員データを取得
  const { data: employees, error } = await supabase
    .from('employees')
    .select('*')
    .order('employee_number', { ascending: true });

  if (error) {
    console.error('Error fetching employees:', error);
  }

  const pageTitle = language === 'ja' ? '従業員管理' : language === 'th' ? 'จัดการพนักงาน' : 'Employee Management';

  return (
    <DashboardLayout
      locale={locale}
      userEmail={user.email}
      title={pageTitle}
      userInfo={userInfo ? {
        email: userInfo.email,
        name: userInfo.name,
        avatarUrl: userInfo.avatarUrl,
      } : undefined}
    >
      <EmployeesClient
        locale={locale}
        language={language}
        employees={employees || []}
        currentUserAvatarUrl={userInfo?.avatarUrl}
        currentUserEmployeeNumber={userInfo?.employeeNumber}
      />
    </DashboardLayout>
  );
}
