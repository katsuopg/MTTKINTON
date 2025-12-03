import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EmployeeDetailContent from './EmployeeDetailContent';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import type { Database } from '@/types/supabase';
import { getUserProfile } from '@/lib/auth/get-user-profile';

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

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  // Supabaseから従業員情報を取得
  let employee: Employee | null = null;
  let error = false;

  try {
    const { data, error: fetchError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (fetchError) {
      console.error('Error fetching employee:', fetchError);
      error = true;
    } else {
      employee = data;
    }
  } catch (err) {
    console.error('Error fetching employee data:', err);
    error = true;
  }

  // ログインユーザーのプロファイルを取得
  const userProfile = await getUserProfile();

  if (!employee) {
    const pageTitle = language === 'ja' ? '従業員詳細' : language === 'th' ? 'รายละเอียดพนักงาน' : 'Employee Details';
    return (
      <DashboardLayout
        locale={locale}
        userEmail={user.email}
        userName={userProfile?.name}
        userNickname={userProfile?.nickname}
        title={pageTitle}
        userProfileImage={userProfile?.profileImage}
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

  return (
    <DashboardLayout
      locale={locale}
      userEmail={user.email}
      userName={userProfile?.name}
      userNickname={userProfile?.nickname}
      title={pageTitle}
      userProfileImage={userProfile?.profileImage}
    >
      <EmployeeDetailContent
        employee={employee}
        locale={locale}
      />
    </DashboardLayout>
  );
}
