import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import Link from 'next/link';
import { tableStyles } from '@/components/ui/TableStyles';
import EmployeeListClient from './EmployeeListClient';
import type { Database } from '@/types/supabase';

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

  // Convert locale to Language type
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  // Supabaseから従業員データを取得（退職者を除外）
  let employees: Employee[] = [];

  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .not('status', 'eq', '退職')
      .order('employee_number', { ascending: true });

    if (error) {
      console.error('Error fetching employees:', error);
    } else {
      employees = data || [];
    }
  } catch (error) {
    console.error('Error fetching employees:', error);
  }

  // ログインユーザーのプロフィール画像を取得
  let userProfileImage: string | null = null;
  if (user.email) {
    const { data: userEmployee } = await supabase
      .from('employees')
      .select('profile_image_url')
      .eq('email', user.email)
      .single();

    if (userEmployee?.profile_image_url) {
      userProfileImage = userEmployee.profile_image_url;
    }
  }

  const pageTitle = language === 'ja' ? '従業員管理' : language === 'th' ? 'จัดการพนักงาน' : 'Employee Management';

  return (
    <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle} userProfileImage={userProfileImage}>
      <div className="space-y-5">
        {/* ヘッダーセクション */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* 検索・フィルター */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={language === 'ja' ? '名前、ID、部署で検索...' : 'Search by name, ID, department...'}
                className={`${tableStyles.searchInput} pl-9`}
              />
            </div>

            <select className={tableStyles.select}>
              <option value="">{language === 'ja' ? '全ての部署' : 'All Departments'}</option>
            </select>

            <select className={tableStyles.select}>
              <option value="">{language === 'ja' ? '全ての状態' : 'All Status'}</option>
              <option value="在籍">{language === 'ja' ? '在籍' : 'Active'}</option>
              <option value="退職">{language === 'ja' ? '退職' : 'Inactive'}</option>
            </select>
          </div>

          {/* アクション */}
          <Link
            href={`/${locale}/employees/new`}
            className={tableStyles.buttonPrimary}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {language === 'ja' ? '新規登録' : language === 'th' ? 'เพิ่มใหม่' : 'Add New'}
          </Link>
        </div>

        {/* レコード数 */}
        <div className={tableStyles.filterBar}>
          <p className={tableStyles.recordCount}>
            {language === 'ja' ? `${employees.length}名の従業員` :
             language === 'th' ? `${employees.length} พนักงาน` :
             `${employees.length} employees`}
          </p>
        </div>

        {/* 従業員リスト */}
        <EmployeeListClient
          locale={locale}
          employees={employees}
        />
      </div>
    </DashboardLayout>
  );
}
