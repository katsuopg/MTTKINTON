'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tableStyles } from '@/components/ui/TableStyles';
import type { Database } from '@/types/supabase';

type Employee = Database['public']['Tables']['employees']['Row'];

interface Organization {
  id: string;
  name: string;
  name_en?: string;
  name_th?: string;
}

interface OrganizationMember {
  organization_id: string;
  employee_id: string;
  organizations: Organization;
}

interface EmployeeListClientProps {
  locale: string;
  employees: Employee[];
}

export default function EmployeeListClient({ locale, employees }: EmployeeListClientProps) {
  const router = useRouter();
  const [membershipMap, setMembershipMap] = useState<Record<string, Organization[]>>({});
  const language = locale === 'ja' ? 'ja' : locale === 'th' ? 'th' : 'en';

  // 全従業員の所属組織を取得
  useEffect(() => {
    const fetchMemberships = async () => {
      try {
        const res = await fetch('/api/organization-members');
        const data = await res.json();
        if (data.members) {
          const map: Record<string, Organization[]> = {};
          data.members.forEach((m: OrganizationMember) => {
            if (!map[m.employee_id]) {
              map[m.employee_id] = [];
            }
            if (m.organizations) {
              map[m.employee_id].push(m.organizations);
            }
          });
          setMembershipMap(map);
        }
      } catch (err) {
        console.error('Error fetching memberships:', err);
      }
    };
    fetchMemberships();
  }, []);

  // 組織名を取得（ロケール対応）
  const getOrgName = (org: Organization) => {
    if (language === 'en' && org.name_en) return org.name_en;
    if (language === 'th' && org.name_th) return org.name_th;
    return org.name;
  };

  // 行クリックで詳細ページへ
  const handleRowClick = (employeeId: string) => {
    router.push(`/${locale}/employees/${employeeId}`);
  };

  if (employees.length === 0) {
    return (
      <div className={tableStyles.emptyRow}>
        <svg className={tableStyles.emptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-slate-500">
          {language === 'ja' ? '従業員が登録されていません' :
           language === 'th' ? 'ไม่มีพนักงาน' :
           'No employees registered'}
        </p>
      </div>
    );
  }

  return (
    <div className={tableStyles.tableContainer}>
      <table className={tableStyles.table}>
        <thead className={tableStyles.thead}>
          <tr>
            <th className={tableStyles.th} style={{ width: '120px' }}>
              {language === 'ja' ? '社員番号' : language === 'th' ? 'รหัสพนักงาน' : 'Employee No'}
            </th>
            <th className={tableStyles.th}>
              {language === 'ja' ? '氏名' : language === 'th' ? 'ชื่อ' : 'Name'}
            </th>
            <th className={`${tableStyles.th} hidden md:table-cell`}>
              {language === 'ja' ? '所属部署' : language === 'th' ? 'แผนกที่สังกัด' : 'Department'}
            </th>
            <th className={`${tableStyles.th} hidden lg:table-cell`} style={{ width: '100px' }}>
              {language === 'ja' ? '役職' : language === 'th' ? 'ตำแหน่ง' : 'Position'}
            </th>
            <th className={tableStyles.th}>
              {language === 'ja' ? 'メール' : language === 'th' ? 'อีเมล' : 'Email'}
            </th>
            <th className={tableStyles.th} style={{ width: '90px' }}>
              {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
            </th>
          </tr>
        </thead>
        <tbody className={tableStyles.tbody}>
          {employees.map((employee) => {
            const employeeId = employee.id;
            const employeeNumber = employee.employee_number || employee.id_number || employeeId;
            const departments = membershipMap[employeeId] || [];
            const isActive = employee.status === '在籍' || employee.status === 'Active';

            return (
              <tr
                key={employeeId}
                className={tableStyles.trClickable}
                onClick={() => handleRowClick(employeeId)}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleRowClick(employeeId);
                  }
                }}
              >
                <td className={`${tableStyles.td} ${tableStyles.tdPrimary}`}>
                  <span className="font-mono">{employeeNumber}</span>
                </td>
                <td className={tableStyles.td}>
                  <div className="flex items-center gap-3">
                    {employee.profile_image_url ? (
                      <img
                        src={employee.profile_image_url}
                        alt={employee.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className={tableStyles.avatar}>
                        {employee.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <span className={tableStyles.tdPrimary}>
                        {employee.name || '-'}
                      </span>
                      {employee.nickname && (
                        <span className="ml-2 text-xs text-slate-500">({employee.nickname})</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className={`${tableStyles.td} hidden md:table-cell`}>
                  {employee.department ? (
                    <span className={tableStyles.tag}>
                      {employee.department}
                    </span>
                  ) : departments.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {departments.map((dept) => (
                        <span key={dept.id} className={tableStyles.tag}>
                          {getOrgName(dept)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className={`${tableStyles.td} hidden lg:table-cell`}>
                  {employee.position || '-'}
                </td>
                <td className={tableStyles.td}>
                  {employee.email ? (
                    <span className="text-slate-600">{employee.email}</span>
                  ) : '-'}
                </td>
                <td className={tableStyles.td}>
                  <span className={`${tableStyles.statusBadge} ${isActive ? tableStyles.statusActive : tableStyles.statusInactive}`}>
                    {employee.status || '在籍'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
