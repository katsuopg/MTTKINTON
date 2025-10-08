import { createClient } from '../../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import { KintoneClient } from '@/lib/kintone/client';
import { EmployeeRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import { getStatusColor } from '@/lib/kintone/utils';
import Link from 'next/link';
import { tableStyles } from '@/components/ui/TableStyles';

interface EmployeesPageProps {
  params: {
    locale: string;
  };
}

export default async function EmployeesPage({ params: { locale } }: EmployeesPageProps) {
  const supabase = await createClient();

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Convert locale to Language type
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  
  // kintoneから従業員レコードを取得
  let employeeRecords: EmployeeRecord[] = [];
  
  try {
    const employeeClient = new KintoneClient(
      '106', // Employee managementアプリID
      process.env.KINTONE_API_TOKEN_EMPLOYEE!
    );
    employeeRecords = await employeeClient.getRecords<EmployeeRecord>();
    
    // デバッグ: 最初のレコードのフィールドを確認
    if (employeeRecords.length > 0) {
      console.log('Employee record sample:', JSON.stringify(employeeRecords[0], null, 2));
    } else {
      console.log('No employee records found');
    }
  } catch (error) {
    console.error('Error fetching kintone data:', error);
  }

  const pageTitle = language === 'ja' ? '従業員管理' : language === 'th' ? 'จัดการพนักงาน' : 'Employee Management';
  
  return (
    <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle}>
      <div className={tableStyles.contentWrapper}>
        {/* 検索バー */}
        <div className={tableStyles.searchWrapper}>
          <div className={tableStyles.searchForm}>
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={language === 'ja' ? '名前、ID、部署で検索...' : 'Search by name, ID, department...'}
                className={`${tableStyles.searchInput} pl-10`}
              />
            </div>
            
            <select className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <option value="">{language === 'ja' ? '全ての部署' : 'All Departments'}</option>
              <option value="engineering">{language === 'ja' ? 'エンジニアリング' : 'Engineering'}</option>
              <option value="sales">{language === 'ja' ? '営業' : 'Sales'}</option>
              <option value="hr">{language === 'ja' ? '人事' : 'HR'}</option>
            </select>
            
            <select className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <option value="">{language === 'ja' ? '全ての状態' : 'All Status'}</option>
              <option value="active">{language === 'ja' ? '在籍' : 'Active'}</option>
              <option value="inactive">{language === 'ja' ? '退職' : 'Inactive'}</option>
            </select>

            <Link
              href={`/${locale}/employees/new`}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {language === 'ja' ? '新規登録' : language === 'th' ? 'เพิ่มใหม่' : 'Add New'}
            </Link>
          </div>
        </div>

        {/* フィルターバー */}
        <div className={tableStyles.filterBar}>
          <p className={tableStyles.recordCount}>
            {language === 'ja' ? `${employeeRecords.length}名の従業員` : 
             language === 'th' ? `${employeeRecords.length} พนักงาน` : 
             `${employeeRecords.length} employees`}
          </p>
        </div>

        {/* 従業員リスト */}
        <div className={tableStyles.tableContainer}>
          {employeeRecords.length === 0 ? (
            <div className={tableStyles.emptyRow}>
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-2 text-gray-500">
                {language === 'ja' ? '従業員が登録されていません' : 
                 language === 'th' ? 'ไม่มีพนักงาน' : 
                 'No employees registered'}
              </p>
            </div>
          ) : (
            <div className="max-w-6xl overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      {language === 'ja' ? '従業員ID' : language === 'th' ? 'รหัสพนักงาน' : 'Employee ID'}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      {language === 'ja' ? '氏名' : language === 'th' ? 'ชื่อ' : 'Name'}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 hidden md:table-cell">
                      {language === 'ja' ? '部署' : language === 'th' ? 'แผนก' : 'Department'}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 hidden lg:table-cell">
                      {language === 'ja' ? '役職' : language === 'th' ? 'ตำแหน่ง' : 'Position'}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      {language === 'ja' ? 'メール' : language === 'th' ? 'อีเมล' : 'Email'}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employeeRecords.map((record) => {
                    const employeeId = record.$id.value;
                    return (
                      <tr key={employeeId} className="hover:bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <Link
                            href={`/${locale}/employees/${employeeId}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {record.ID_No?.value || record.社員証番号?.value || employeeId}
                          </Link>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                                {record.氏名?.value?.charAt(0) || '?'}
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="font-medium text-gray-900">
                                {record.氏名?.value || '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                          {record.配属?.value?.split('\n')[0] || '-'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                          {record.役職?.value || '-'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.メールアドレス?.value ? (
                            <a href={`mailto:${record.メールアドレス.value}`} className="text-indigo-600 hover:text-indigo-900">
                              {record.メールアドレス.value}
                            </a>
                          ) : '-'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.在籍状況?.value === '在籍' || record.在籍状況?.value === 'Active' 
                              ? 'bg-green-100 text-green-800'
                              : record.在籍状況?.value === '退職' || record.在籍状況?.value === 'Inactive'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {record.在籍状況?.value || '在籍'}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/${locale}/employees/${employeeId}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {language === 'ja' ? '詳細' : language === 'th' ? 'รายละเอียด' : 'View'}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}