'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tableStyles } from '@/components/ui/TableStyles';

interface UserManagementProps {
  locale: string;
}

interface EmployeeUser {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  department: string;
  status: string;
}

interface Organization {
  id: string;
  code: string;
  name: string;
  name_en?: string;
  name_th?: string;
}

interface OrganizationMember {
  organization_id: string;
  employee_id: string;
}

export default function UserManagement({ locale }: UserManagementProps) {
  const router = useRouter();
  const [users, setUsers] = useState<EmployeeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [membershipMap, setMembershipMap] = useState<Record<string, string[]>>({});

  const label = (ja: string, th: string, en: string) =>
    locale === 'ja' ? ja : locale === 'th' ? th : en;

  // 組織一覧を取得
  const fetchOrganizations = async () => {
    try {
      const res = await fetch('/api/organizations');
      const data = await res.json();
      if (data.organizations) {
        setOrganizations(
          data.organizations.filter((org: Organization & { is_active?: boolean }) => org.is_active !== false)
        );
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  };

  // 全従業員の所属組織を取得
  const fetchAllMemberships = async () => {
    try {
      const res = await fetch('/api/organization-members');
      const data = await res.json();
      if (data.members) {
        const map: Record<string, string[]> = {};
        data.members.forEach((m: OrganizationMember) => {
          if (!map[m.employee_id]) {
            map[m.employee_id] = [];
          }
          map[m.employee_id].push(m.organization_id);
        });
        setMembershipMap(map);
      }
    } catch (err) {
      console.error('Error fetching memberships:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 並列で取得
        await Promise.all([fetchOrganizations(), fetchAllMemberships()]);

        const res = await fetch('/api/employees');
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to load users (${res.status})`);
        }
        const data = await res.json();
        // 在籍者のみ表示（退職者は非表示）
        const activeEmployees = (data.employees || []).filter(
          (emp: EmployeeUser) => emp.status === '在籍' || emp.status === 'Active'
        );
        setUsers(activeEmployees);
      } catch (err) {
        console.error('Error fetching users for settings:', err);
        const errorMsg = locale === 'ja' ? 'ユーザー一覧の取得に失敗しました' :
                         locale === 'th' ? 'ไม่สามารถดึงรายการผู้ใช้ได้' :
                         'Failed to load users';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locale]);

  // 組織名を取得（ロケール対応）
  const getOrgName = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (!org) return '';
    if (locale === 'en' && org.name_en) return org.name_en;
    if (locale === 'th' && org.name_th) return org.name_th;
    return org.name;
  };

  // 行クリックで従業員詳細ページへ
  const handleRowClick = (employeeId: string) => {
    router.push(`/${locale}/employees/${employeeId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {label('ユーザー管理', 'จัดการผู้ใช้', 'User Management')}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {label(
            '従業員管理のデータを基に、アプリケーションのユーザーを管理します。部署は従業員管理で設定できます。',
            'จัดการผู้ใช้แอปโดยอ้างอิงจากข้อมูลพนักงาน สามารถตั้งค่าแผนกได้ในการจัดการพนักงาน',
            'Manage application users based on employee records. Departments can be set in Employee Management.'
          )}
        </p>
      </div>

      <div className={tableStyles.filterBar}>
        <p className={tableStyles.recordCount}>
          {label(
            `${users.length}名のユーザー`,
            `${users.length} ผู้ใช้`,
            `${users.length} users`
          )}
        </p>
      </div>

      <div className={tableStyles.tableContainer}>
        <table className={tableStyles.table}>
          <thead className={tableStyles.thead}>
            <tr>
              <th className={tableStyles.th} style={{ width: '120px' }}>
                {label('社員番号', 'รหัสพนักงาน', 'Employee No')}
              </th>
              <th className={tableStyles.th}>
                {label('氏名', 'ชื่อ', 'Name')}
              </th>
              <th className={tableStyles.th}>
                {label('所属部署', 'แผนกที่สังกัด', 'Departments')}
              </th>
              <th className={tableStyles.th}>
                {label('メール', 'อีเมล', 'Email')}
              </th>
            </tr>
          </thead>
          <tbody className={tableStyles.tbody}>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className={tableStyles.emptyRow}>
                  {label(
                    '従業員データがありません',
                    'ไม่มีข้อมูลพนักงาน',
                    'No employees found'
                  )}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className={tableStyles.trClickable}
                  onClick={() => handleRowClick(user.id)}
                  role="link"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleRowClick(user.id);
                    }
                  }}
                >
                  <td className={`${tableStyles.td} ${tableStyles.tdPrimary}`}>
                    <span className="font-mono">{user.employeeNumber || '-'}</span>
                  </td>
                  <td className={tableStyles.td}>
                    <div className="flex items-center gap-3">
                      <div className={tableStyles.avatar}>
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <span className={tableStyles.tdPrimary}>{user.name || '-'}</span>
                    </div>
                  </td>
                  <td className={tableStyles.td}>
                    {(membershipMap[user.id] || []).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {membershipMap[user.id].map((orgId) => (
                          <span key={orgId} className={tableStyles.tag}>
                            {getOrgName(orgId)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </td>
                  <td className={tableStyles.td}>
                    {user.email ? (
                      <span className="text-slate-600">{user.email}</span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
