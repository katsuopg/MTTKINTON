import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KintoneClient } from '@/lib/kintone/client';
import { EmployeeRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import EmployeeEditContent from './EmployeeEditContent';
import { getCurrentUserInfo } from '@/lib/auth/user-info';

interface EmployeeEditPageProps {
  params: Promise<{
    locale: string;
    employeeId: string;
  }>;
}

export default async function EmployeeEditPage({ params }: EmployeeEditPageProps) {
  const { locale, employeeId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  // kintoneから従業員情報を取得
  let record: EmployeeRecord | null = null;

  try {
    const client = new KintoneClient(
      '106', // Employee managementアプリID
      process.env.KINTONE_API_TOKEN_EMPLOYEE!
    );

    const allRecords = await client.getRecords<EmployeeRecord>();
    record = allRecords?.find(r => r.$id.value === employeeId) || null;
  } catch (err) {
    console.error('Error fetching kintone data:', err);
  }

  const userInfo = await getCurrentUserInfo();

  if (!record) {
    return (
      <DashboardLayout locale={locale} userEmail={user.email} title={language === 'ja' ? '従業員編集' : 'Edit Employee'} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
        <div className="p-4 md:p-6">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <p className="text-error-600">
              {language === 'ja' ? '従業員が見つかりません' : 'Employee not found'}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const pageTitle = language === 'ja' ? '従業員編集' : language === 'th' ? 'แก้ไขพนักงาน' : 'Edit Employee';

  return (
    <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
      <EmployeeEditContent
        record={record}
        locale={locale}
      />
    </DashboardLayout>
  );
}
