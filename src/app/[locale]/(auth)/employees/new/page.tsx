import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { type Language } from '@/lib/kintone/field-mappings';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
// import EmployeeForm from '../components/EmployeeForm';

interface NewEmployeePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function NewEmployeePage({ params }: NewEmployeePageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = language === 'ja' ? '従業員新規登録' : language === 'th' ? 'เพิ่มพนักงานใหม่' : 'New Employee';

  const userInfo = await getCurrentUserInfo();

  return (
    <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            {language === 'ja' ? '従業員情報を入力' : 
             language === 'th' ? 'กรอกข้อมูลพนักงาน' : 
             'Enter Employee Information'}
          </h2>
          <div className="text-center text-gray-500">
            EmployeeForm コンポーネントは実装中です
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}