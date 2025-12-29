'use client';

import { useEffect, useState } from 'react';
import { tableStyles } from '@/components/ui/TableStyles';

interface PermissionManagementProps {
  locale: string;
}

interface Role {
  id: string;
  code: string;
  name: string;
  name_en: string | null;
  name_th: string | null;
  description: string | null;
  can_manage_users: boolean;
  can_manage_organizations: boolean;
  can_manage_employees: boolean;
  can_manage_quotations: boolean;
  can_view_all_records: boolean;
  can_edit_all_records: boolean;
  can_delete_records: boolean;
  can_export_data: boolean;
  can_import_data: boolean;
  can_manage_settings: boolean;
  is_system_role: boolean;
  is_active: boolean;
  display_order: number;
}

interface UserRole {
  id: string;
  employee_id: string;
  role_id: string;
  organization_id: string | null;
  granted_at: string;
  role: Role;
  employee: {
    id: string;
    name: string;
    employee_number: string;
  };
  organization?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export default function PermissionManagement({ locale }: PermissionManagementProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const label = (ja: string, th: string, en: string) =>
    locale === 'ja' ? ja : locale === 'th' ? th : en;

  const getRoleName = (role: Role) => {
    if (locale === 'en' && role.name_en) return role.name_en;
    if (locale === 'th' && role.name_th) return role.name_th;
    return role.name;
  };

  // ロール一覧取得
  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      if (data.roles) {
        setRoles(data.roles.filter((r: Role) => r.is_active));
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  // ユーザーロール一覧取得
  const fetchUserRoles = async () => {
    try {
      const res = await fetch('/api/user-roles');
      const data = await res.json();
      if (data.userRoles) {
        setUserRoles(data.userRoles);
      }
    } catch (err) {
      console.error('Error fetching user roles:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchRoles(), fetchUserRoles()]);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(label('データの取得に失敗しました', 'ไม่สามารถดึงข้อมูลได้', 'Failed to load data'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [locale]);

  // ロールに割り当てられたユーザー数をカウント
  const getUserCountForRole = (roleId: string) => {
    return userRoles.filter((ur) => ur.role_id === roleId).length;
  };

  // 権限チェックアイコン
  const PermissionIcon = ({ enabled }: { enabled: boolean }) => (
    enabled ? (
      <svg className="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    )
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg text-sm dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {label('権限管理', 'จัดการสิทธิ์', 'Permission Management')}
        </h2>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          {label(
            'Kintoneスタイルのアクセス権限を設定します。ロールを作成し、ユーザーに割り当てることができます。',
            'ตั้งค่าสิทธิ์การเข้าถึงแบบ Kintone สร้าง Role และกำหนดให้ผู้ใช้',
            'Configure Kintone-style access permissions. Create roles and assign them to users.'
          )}
        </p>
      </div>

      {/* Roles Table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-medium text-gray-800 dark:text-white/90">
            {label('ロール一覧', 'รายการ Role', 'Roles')}
          </h3>
          <span className="text-theme-xs text-gray-500 dark:text-gray-400">
            {label(`${roles.length}件`, `${roles.length} รายการ`, `${roles.length} roles`)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>{label('ロール名', 'ชื่อ Role', 'Role Name')}</th>
                <th className={tableStyles.th}>{label('説明', 'คำอธิบาย', 'Description')}</th>
                <th className={tableStyles.th} style={{ width: '80px' }}>{label('ユーザー', 'ผู้ใช้', 'Users')}</th>
                <th className={tableStyles.th} style={{ width: '60px' }}>{label('閲覧', 'ดู', 'View')}</th>
                <th className={tableStyles.th} style={{ width: '60px' }}>{label('編集', 'แก้ไข', 'Edit')}</th>
                <th className={tableStyles.th} style={{ width: '60px' }}>{label('削除', 'ลบ', 'Delete')}</th>
                <th className={tableStyles.th} style={{ width: '60px' }}>{label('設定', 'ตั้งค่า', 'Settings')}</th>
                <th className={tableStyles.th} style={{ width: '80px' }}></th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {roles.map((role) => (
                <tr key={role.id} className={tableStyles.tr}>
                  <td className={tableStyles.td}>
                    <div className="flex items-center gap-2">
                      <span className={`${tableStyles.tdPrimary} font-medium`}>
                        {getRoleName(role)}
                      </span>
                      {role.is_system_role && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded dark:bg-gray-700 dark:text-gray-300">
                          {label('システム', 'ระบบ', 'System')}
                        </span>
                      )}
                    </div>
                    <span className="text-theme-xs text-gray-400 font-mono">{role.code}</span>
                  </td>
                  <td className={tableStyles.td}>
                    <span className="text-theme-sm text-gray-600 dark:text-gray-300">
                      {role.description || '-'}
                    </span>
                  </td>
                  <td className={tableStyles.td}>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-50 text-brand-600 font-medium text-sm dark:bg-brand-500/10 dark:text-brand-400">
                      {getUserCountForRole(role.id)}
                    </span>
                  </td>
                  <td className={tableStyles.td}>
                    <PermissionIcon enabled={role.can_view_all_records} />
                  </td>
                  <td className={tableStyles.td}>
                    <PermissionIcon enabled={role.can_edit_all_records} />
                  </td>
                  <td className={tableStyles.td}>
                    <PermissionIcon enabled={role.can_delete_records} />
                  </td>
                  <td className={tableStyles.td}>
                    <PermissionIcon enabled={role.can_manage_settings} />
                  </td>
                  <td className={tableStyles.td}>
                    <button
                      onClick={() => {
                        setSelectedRole(role);
                        setShowRoleModal(true);
                      }}
                      className="text-brand-500 hover:text-brand-600 text-theme-sm font-medium"
                    >
                      {label('詳細', 'รายละเอียด', 'Details')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Roles Section */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-medium text-gray-800 dark:text-white/90">
            {label('ユーザー別ロール割り当て', 'การกำหนด Role ตามผู้ใช้', 'User Role Assignments')}
          </h3>
          <span className="text-theme-xs text-gray-500 dark:text-gray-400">
            {label(`${userRoles.length}件の割り当て`, `${userRoles.length} การกำหนด`, `${userRoles.length} assignments`)}
          </span>
        </div>

        {userRoles.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              {label(
                'ロールが割り当てられたユーザーはいません。ユーザー管理タブからロールを割り当ててください。',
                'ยังไม่มีผู้ใช้ที่ได้รับ Role กรุณากำหนด Role จากแท็บจัดการผู้ใช้',
                'No users have been assigned roles. Assign roles from the User Management tab.'
              )}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th}>{label('従業員番号', 'รหัสพนักงาน', 'Employee No.')}</th>
                  <th className={tableStyles.th}>{label('氏名', 'ชื่อ', 'Name')}</th>
                  <th className={tableStyles.th}>{label('ロール', 'Role', 'Role')}</th>
                  <th className={tableStyles.th}>{label('組織スコープ', 'ขอบเขตองค์กร', 'Organization Scope')}</th>
                  <th className={tableStyles.th}>{label('付与日', 'วันที่กำหนด', 'Granted Date')}</th>
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
                {userRoles.map((ur) => (
                  <tr key={ur.id} className={tableStyles.tr}>
                    <td className={`${tableStyles.td} ${tableStyles.tdPrimary}`}>
                      <span className="font-mono">{ur.employee?.employee_number || '-'}</span>
                    </td>
                    <td className={tableStyles.td}>
                      {ur.employee?.name || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      <span className={tableStyles.tag}>
                        {getRoleName(ur.role)}
                      </span>
                    </td>
                    <td className={tableStyles.td}>
                      {ur.organization ? (
                        <span className="text-theme-sm">
                          {ur.organization.name}
                        </span>
                      ) : (
                        <span className="text-theme-sm text-gray-400">
                          {label('全組織', 'ทั้งหมด', 'Global')}
                        </span>
                      )}
                    </td>
                    <td className={tableStyles.td}>
                      <span className="text-theme-sm text-gray-500">
                        {new Date(ur.granted_at).toLocaleDateString(locale === 'ja' ? 'ja-JP' : locale === 'th' ? 'th-TH' : 'en-US')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Detail Modal */}
      {showRoleModal && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {getRoleName(selectedRole)}
                {selectedRole.is_system_role && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded dark:bg-gray-700 dark:text-gray-300">
                    {label('システムロール', 'Role ระบบ', 'System Role')}
                  </span>
                )}
              </h3>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {label('基本情報', 'ข้อมูลพื้นฐาน', 'Basic Information')}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-theme-xs text-gray-400">{label('コード', 'รหัส', 'Code')}</p>
                    <p className="font-mono text-gray-800 dark:text-white/90">{selectedRole.code}</p>
                  </div>
                  <div>
                    <p className="text-theme-xs text-gray-400">{label('説明', 'คำอธิบาย', 'Description')}</p>
                    <p className="text-gray-800 dark:text-white/90">{selectedRole.description || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Permissions Grid */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  {label('権限設定', 'การตั้งค่าสิทธิ์', 'Permissions')}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'can_manage_users', ja: 'ユーザー管理', th: 'จัดการผู้ใช้', en: 'Manage Users' },
                    { key: 'can_manage_organizations', ja: '組織管理', th: 'จัดการองค์กร', en: 'Manage Organizations' },
                    { key: 'can_manage_employees', ja: '従業員管理', th: 'จัดการพนักงาน', en: 'Manage Employees' },
                    { key: 'can_manage_quotations', ja: '見積管理', th: 'จัดการใบเสนอราคา', en: 'Manage Quotations' },
                    { key: 'can_view_all_records', ja: '全レコード閲覧', th: 'ดูทุกรายการ', en: 'View All Records' },
                    { key: 'can_edit_all_records', ja: '全レコード編集', th: 'แก้ไขทุกรายการ', en: 'Edit All Records' },
                    { key: 'can_delete_records', ja: 'レコード削除', th: 'ลบรายการ', en: 'Delete Records' },
                    { key: 'can_export_data', ja: 'データエクスポート', th: 'ส่งออกข้อมูล', en: 'Export Data' },
                    { key: 'can_import_data', ja: 'データインポート', th: 'นำเข้าข้อมูล', en: 'Import Data' },
                    { key: 'can_manage_settings', ja: '設定管理', th: 'จัดการการตั้งค่า', en: 'Manage Settings' },
                  ].map((perm) => (
                    <div
                      key={perm.key}
                      className={`flex items-center gap-2 p-3 rounded-lg ${
                        selectedRole[perm.key as keyof Role]
                          ? 'bg-success-50 dark:bg-success-500/10'
                          : 'bg-gray-50 dark:bg-gray-700/50'
                      }`}
                    >
                      <PermissionIcon enabled={selectedRole[perm.key as keyof Role] as boolean} />
                      <span className={`text-theme-sm ${
                        selectedRole[perm.key as keyof Role]
                          ? 'text-success-700 dark:text-success-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {label(perm.ja, perm.th, perm.en)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assigned Users */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {label('割り当て済みユーザー', 'ผู้ใช้ที่ได้รับ', 'Assigned Users')}
                </h4>
                <div className="space-y-2">
                  {userRoles
                    .filter((ur) => ur.role_id === selectedRole.id)
                    .map((ur) => (
                      <div
                        key={ur.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-medium">
                          {ur.employee?.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {ur.employee?.name}
                          </p>
                          <p className="text-theme-xs text-gray-500 font-mono">
                            {ur.employee?.employee_number}
                          </p>
                        </div>
                        {ur.organization && (
                          <span className="text-theme-xs text-gray-500 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                            {ur.organization.name}
                          </span>
                        )}
                      </div>
                    ))}
                  {userRoles.filter((ur) => ur.role_id === selectedRole.id).length === 0 && (
                    <p className="text-theme-sm text-gray-400 text-center py-4">
                      {label('このロールに割り当てられたユーザーはいません', 'ยังไม่มีผู้ใช้ที่ได้รับ Role นี้', 'No users assigned to this role')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                {label('閉じる', 'ปิด', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
