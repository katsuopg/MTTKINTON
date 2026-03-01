'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Database } from '@/types/supabase';
import { tableStyles } from '@/components/ui/TableStyles';
import { ListPageHeader } from '@/components/ui/ListPageHeader';
import { type Language } from '@/lib/kintone/field-mappings';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/Pagination';
import { useNavPermissions } from '@/hooks/useNavPermissions';
import { Plus, Users } from 'lucide-react';

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
  const { canManageApp } = useNavPermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('在籍');

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

  const { paginatedItems: paginatedEmployees, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredEmployees);

  const searchPlaceholder = language === 'ja'
    ? '名前、ID、部署で検索...'
    : language === 'th'
    ? 'ค้นหาด้วยชื่อ, รหัส, แผนก...'
    : 'Search by name, ID, department...';

  const countLabel = language === 'ja'
    ? '名の従業員'
    : language === 'th'
    ? ' พนักงาน'
    : ' employees';

  return (
    <div className={tableStyles.contentWrapper}>
      <div className={tableStyles.tableContainer}>
        <ListPageHeader
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={searchPlaceholder}
          totalCount={filteredEmployees.length}
          countLabel={countLabel}
          filters={
            <>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="h-9 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
              >
                <option value="">{language === 'ja' ? '全ての部署' : language === 'th' ? 'ทุกแผนก' : 'All Departments'}</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
              >
                <option value="">{language === 'ja' ? '全ての状態' : language === 'th' ? 'ทุกสถานะ' : 'All Status'}</option>
                <option value="在籍">{language === 'ja' ? '在籍' : language === 'th' ? 'ทำงานอยู่' : 'Active'}</option>
                <option value="退職">{language === 'ja' ? '退職' : language === 'th' ? 'ลาออก' : 'Resigned'}</option>
              </select>
            </>
          }
          addButton={{
            label: language === 'ja' ? '新規登録' : language === 'th' ? 'เพิ่มใหม่' : 'Add New',
            onClick: () => router.push(`/${locale}/employees/new`),
            icon: <Plus size={16} className="mr-1.5" />,
          }}
          settingsHref={canManageApp('employees') ? `/${locale}/settings/apps/employees` : undefined}
        />

        {filteredEmployees.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
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
                {paginatedEmployees.map((emp) => {
                  const isActive = emp.status === '在籍' || emp.status === 'Active';
                  const isResigned = emp.status === '退職' || emp.status === 'Resigned' || emp.status === 'Inactive';
                  const companyEmail = emp.company_email || (emp.email?.includes('@megatech') ? emp.email : null);

                  return (
                    <tr
                      key={emp.id}
                      className={tableStyles.trClickable}
                      onClick={() => router.push(`/${locale}/employees/${emp.id}`)}
                    >
                      <td className={tableStyles.td}>
                        <span className="font-medium text-brand-500">
                          {emp.employee_number}
                        </span>
                      </td>
                      <td className={tableStyles.td}>
                        <div className="flex items-center gap-3">
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
                        <span className={`${tableStyles.statusBadge} ${
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
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={goToPage}
          locale={locale}
        />
      </div>
    </div>
  );
}
