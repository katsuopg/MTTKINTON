'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Database } from '@/types/supabase';
import { tableStyles } from '@/components/ui/TableStyles';
import { type Language } from '@/lib/kintone/field-mappings';

type Employee = Database['public']['Tables']['employees']['Row'];

interface EmployeesClientProps {
  locale: string;
  language: Language;
  employees: Employee[];
  currentUserAvatarUrl?: string;
  currentUserEmployeeNumber?: string;
}

export default function EmployeesClient({ locale, language, employees, currentUserAvatarUrl, currentUserEmployeeNumber }: EmployeesClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('在籍'); // デフォルトで在籍のみ表示

  // 部署リストを抽出
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    employees.forEach(emp => {
      const dept = emp.department;
      if (dept) deptSet.add(dept);
    });
    return Array.from(deptSet).sort();
  }, [employees]);

  // フィルタリングされた従業員リスト
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // 検索クエリフィルター
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = emp.name?.toLowerCase() || '';
        const id = emp.employee_number?.toLowerCase() || '';
        const dept = emp.department?.toLowerCase() || '';
        if (!name.includes(query) && !id.includes(query) && !dept.includes(query)) {
          return false;
        }
      }

      // 部署フィルター
      if (departmentFilter) {
        if (emp.department !== departmentFilter) {
          return false;
        }
      }

      // ステータスフィルター
      if (statusFilter) {
        const status = emp.status || '在籍';
        if (statusFilter === '在籍') {
          if (status !== '在籍' && status !== 'Active') {
            return false;
          }
        } else if (statusFilter === '退職') {
          if (status !== '退職' && status !== 'Resigned' && status !== 'Inactive') {
            return false;
          }
        }
      }

      return true;
    });
  }, [employees, searchQuery, departmentFilter, statusFilter]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Search and Filter Section - TailAdmin Style */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ja' ? '名前、ID、部署で検索...' : 'Search by name, ID, department...'}
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-200 bg-transparent text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10"
              />
            </div>

            {/* Filters and Add Button */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="h-11 rounded-lg border border-gray-200 bg-white px-4 text-theme-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10"
              >
                <option value="">{language === 'ja' ? '全ての部署' : 'All Departments'}</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 rounded-lg border border-gray-200 bg-white px-4 text-theme-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10"
              >
                <option value="">{language === 'ja' ? '全ての状態' : 'All Status'}</option>
                <option value="在籍">{language === 'ja' ? '在籍' : 'Active'}</option>
                <option value="退職">{language === 'ja' ? '退職' : 'Resigned'}</option>
              </select>

              <Link
                href={`/${locale}/employees/new`}
                className="inline-flex items-center h-11 px-5 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors shadow-theme-xs"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {language === 'ja' ? '新規登録' : language === 'th' ? 'เพิ่มใหม่' : 'Add New'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Count */}
      <p className="text-theme-sm text-gray-500 dark:text-gray-400">
        {language === 'ja' ? `${filteredEmployees.length}名の従業員` :
         language === 'th' ? `${filteredEmployees.length} พนักงาน` :
         `${filteredEmployees.length} employees`}
        {statusFilter && (
          <span className="ml-2 text-gray-400">
            ({language === 'ja' ? `全${employees.length}名中` : `of ${employees.length} total`})
          </span>
        )}
      </p>

      {/* Employee Table - TailAdmin Style */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {filteredEmployees.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              {searchQuery || departmentFilter || statusFilter
                ? (language === 'ja' ? '条件に一致する従業員がいません' : 'No employees match the filters')
                : (language === 'ja' ? '従業員が登録されていません' : 'No employees registered')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '従業員ID' : language === 'th' ? 'รหัสพนักงาน' : 'Employee ID'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '氏名' : language === 'th' ? 'ชื่อ' : 'Name'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '氏名（タイ語）' : language === 'th' ? 'ชื่อ (ไทย)' : 'Name (Thai)'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '部署' : language === 'th' ? 'แผนก' : 'Department'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '役職' : language === 'th' ? 'ตำแหน่ง' : 'Position'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '社内メール' : language === 'th' ? 'อีเมลบริษัท' : 'Company Email'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                  </th>
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
                {filteredEmployees.map((emp) => {
                  const isActive = emp.status === '在籍' || emp.status === 'Active';
                  const isResigned = emp.status === '退職' || emp.status === 'Resigned' || emp.status === 'Inactive';
                  // 社内メールアドレスを取得（company_emailを優先、なければemailから@megatechを検索）
                  const companyEmail = emp.company_email || (emp.email?.includes('@megatech') ? emp.email : null);

                  return (
                    <tr
                      key={emp.id}
                      className={`${tableStyles.tr} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
                      onClick={() => router.push(`/${locale}/employees/${emp.id}`)}
                    >
                      <td className={tableStyles.td}>
                        <span className="font-medium text-brand-500">
                          {emp.employee_number}
                        </span>
                      </td>
                      <td className={tableStyles.td}>
                        <div className="flex items-center gap-3">
                          {/* アバター：現在のユーザーなら設定したプロフ画像を表示、それ以外は従業員データのprofile_image_url */}
                          {(() => {
                            const isCurrentUser = emp.employee_number?.toLowerCase() === currentUserEmployeeNumber?.toLowerCase();
                            const avatarUrl = isCurrentUser ? currentUserAvatarUrl : emp.profile_image_url;
                            return avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={avatarUrl}
                                alt={emp.name || ''}
                                className="flex-shrink-0 w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-medium">
                                {emp.name?.charAt(0) || '?'}
                              </div>
                            );
                          })()}
                          <span className="font-medium text-gray-800 dark:text-white/90">
                            {emp.name || '-'}
                          </span>
                        </div>
                      </td>
                      <td className={tableStyles.td}>
                        {emp.name_th || '-'}
                      </td>
                      <td className={tableStyles.td}>
                        {emp.department || '-'}
                      </td>
                      <td className={tableStyles.td}>
                        {emp.position || '-'}
                      </td>
                      <td className={tableStyles.td}>
                        {companyEmail ? (
                          <span
                            className="text-brand-500 hover:text-brand-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `mailto:${companyEmail}`;
                            }}
                          >
                            {companyEmail}
                          </span>
                        ) : '-'}
                      </td>
                      <td className={tableStyles.td}>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isActive
                            ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500'
                            : isResigned
                            ? 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500'
                            : 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500'
                        }`}>
                          {isActive ? (language === 'ja' ? '在籍' : 'Active') :
                           isResigned ? (language === 'ja' ? '退職' : 'Resigned') :
                           (emp.status || '在籍')}
                        </span>
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
  );
}
