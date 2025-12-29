import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EmployeeDetailContent from './EmployeeDetailContent';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import { Database } from '@/types/supabase';
import { getCurrentUserInfo } from '@/lib/auth/user-info';

type Employee = Database['public']['Tables']['employees']['Row'];

interface EmployeeDetailPageProps {
  params: Promise<{
    locale: string;
    employeeId: string;
  }>;
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const { locale, employeeId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // ユーザー情報を取得（ニックネーム、アバター含む）
  const userInfo = await getCurrentUserInfo();

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  // Supabaseから従業員情報を取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const employeesTable = supabase.from('employees') as any;
  const { data: employee, error } = await employeesTable
    .select('*')
    .eq('id', employeeId)
    .single();

  if (error || !employee) {
    return (
      <DashboardLayout
        locale={locale}
        userEmail={user.email}
        title={language === 'ja' ? '従業員詳細' : language === 'th' ? 'รายละเอียดพนักงาน' : 'Employee Details'}
        userInfo={userInfo ? {
          email: userInfo.email,
          name: userInfo.name,
          avatarUrl: userInfo.avatarUrl,
        } : undefined}
      >
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <p className="text-red-600">
              {error
                ? (language === 'ja' ? 'エラーが発生しました' : language === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred')
                : (language === 'ja' ? '従業員が見つかりません' : language === 'th' ? 'ไม่พบพนักงาน' : 'Employee not found')
              }
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const pageTitle = language === 'ja' ? '従業員詳細' : language === 'th' ? 'รายละเอียดพนักงาน' : 'Employee Details';

  // 詳細表示中の従業員が現在のユーザーかどうか（大文字小文字を無視）
  const isCurrentUser = employee.employee_number?.toLowerCase() === userInfo?.employeeNumber?.toLowerCase();
  // 現在のユーザーの場合は設定したアバターURLを使用
  const employeeAvatarUrl = isCurrentUser ? userInfo?.avatarUrl : employee.avatar_url;

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
      <EmployeeDetailContent
        employee={{ ...employee, avatar_url: employeeAvatarUrl || employee.avatar_url } as Employee}
        locale={locale}
      />
    </DashboardLayout>
  );
}