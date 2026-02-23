'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tableStyles } from '@/components/ui/TableStyles';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';

interface UserManagementProps {
  locale: string;
}

interface EmployeeUser {
  id: string;
  employee_number: string;
  name: string;
  company_email: string;
  department: string;
  status: string;
  profile_image_url: string | null;
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
  employee_uuid: string | null;
}

interface Role {
  id: string;
  code: string;
  name: string;
  name_en: string | null;
  name_th: string | null;
}

interface UserRole {
  id: string;
  employee_id: string;
  role_id: string;
  organization_id: string | null;
  role: Role;
}

export default function UserManagement({ locale }: UserManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { confirmDialog } = useConfirmDialog();
  const [users, setUsers] = useState<EmployeeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [membershipMap, setMembershipMap] = useState<Record<string, string[]>>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRolesMap, setUserRolesMap] = useState<Record<string, UserRole[]>>({});

  // ロールモーダル関連
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EmployeeUser | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // 組織モーダル関連
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [orgModalUser, setOrgModalUser] = useState<EmployeeUser | null>(null);
  const [selectedOrgIds, setSelectedOrgIds] = useState<Set<string>>(new Set());
  const [savingOrgs, setSavingOrgs] = useState(false);

  const label = (ja: string, th: string, en: string) =>
    locale === 'ja' ? ja : locale === 'th' ? th : en;

  const getRoleName = (role: Role) => {
    if (locale === 'en' && role.name_en) return role.name_en;
    if (locale === 'th' && role.name_th) return role.name_th;
    return role.name;
  };

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
          // employee_uuid（employees.id）をキーに使用
          const key = m.employee_uuid || m.employee_id;
          if (!map[key]) {
            map[key] = [];
          }
          map[key].push(m.organization_id);
        });
        setMembershipMap(map);
      }
    } catch (err) {
      console.error('Error fetching memberships:', err);
    }
  };

  // ロール一覧を取得
  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      if (data.roles) {
        setRoles(data.roles.filter((r: Role & { is_active?: boolean }) => r.is_active !== false));
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  // ユーザーロール一覧を取得
  const fetchUserRoles = async () => {
    try {
      const res = await fetch('/api/user-roles');
      const data = await res.json();
      if (data.userRoles) {
        const map: Record<string, UserRole[]> = {};
        data.userRoles.forEach((ur: UserRole) => {
          if (!map[ur.employee_id]) {
            map[ur.employee_id] = [];
          }
          map[ur.employee_id].push(ur);
        });
        setUserRolesMap(map);
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
        // 並列で取得
        await Promise.all([
          fetchOrganizations(),
          fetchAllMemberships(),
          fetchRoles(),
          fetchUserRoles(),
        ]);

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

  // 組織編集モーダルを開く
  const openOrgModal = (user: EmployeeUser, e: React.MouseEvent) => {
    e.stopPropagation();
    setOrgModalUser(user);
    const currentOrgIds = membershipMap[user.id] || [];
    setSelectedOrgIds(new Set(currentOrgIds));
    setShowOrgModal(true);
  };

  // 組織の所属を保存
  const handleSaveOrgs = async () => {
    if (!orgModalUser) return;

    setSavingOrgs(true);
    try {
      const res = await fetch('/api/organization-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_uuid: orgModalUser.id,
          organization_ids: Array.from(selectedOrgIds),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update organizations');
      }

      await fetchAllMemberships();
      setShowOrgModal(false);
      toast({ type: 'success', title: label('所属組織を更新しました', 'อัปเดตองค์กรสำเร็จ', 'Organizations updated successfully') });
    } catch (err) {
      console.error('Error updating organizations:', err);
      toast({
        type: 'error',
        title: err instanceof Error
          ? err.message
          : label('所属組織の更新に失敗しました', 'ไม่สามารถอัปเดตองค์กรได้', 'Failed to update organizations'),
      });
    } finally {
      setSavingOrgs(false);
    }
  };

  // 組織チェックボックスのトグル
  const toggleOrgSelection = (orgId: string) => {
    setSelectedOrgIds((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) {
        next.delete(orgId);
      } else {
        next.add(orgId);
      }
      return next;
    });
  };

  // ロール割り当てモーダルを開く
  const openRoleModal = (user: EmployeeUser, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUser(user);
    setSelectedRoleId('');
    setSelectedOrgId('');
    setAssignError(null);
    setShowRoleModal(true);
  };

  // ロールを割り当て
  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleId) return;

    setAssigning(true);
    setAssignError(null);

    try {
      const res = await fetch('/api/user-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: selectedUser.id,
          role_id: selectedRoleId,
          organization_id: selectedOrgId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to assign role');
      }

      // 成功したらリロード
      await fetchUserRoles();
      setShowRoleModal(false);
      toast({ type: 'success', title: label('ロールを割り当てました', 'กำหนด Role สำเร็จ', 'Role assigned successfully') });
    } catch (err) {
      console.error('Error assigning role:', err);
      setAssignError(
        err instanceof Error
          ? err.message
          : label('ロールの割り当てに失敗しました', 'ไม่สามารถกำหนด Role ได้', 'Failed to assign role')
      );
    } finally {
      setAssigning(false);
    }
  };

  // ロールを削除
  const handleRemoveRole = async (userRoleId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmed = await confirmDialog({
      title: label('ロール削除', 'ลบ Role', 'Remove Role'),
      message: label('このロールを削除しますか？', 'ลบ Role นี้หรือไม่?', 'Remove this role?'),
      variant: 'danger',
      confirmLabel: label('削除', 'ลบ', 'Remove'),
      cancelLabel: label('キャンセル', 'ยกเลิก', 'Cancel'),
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/user-roles?id=${userRoleId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to remove role');
      }

      await fetchUserRoles();
      toast({ type: 'success', title: label('ロールを削除しました', 'ลบ Role สำเร็จ', 'Role removed successfully') });
    } catch (err) {
      console.error('Error removing role:', err);
      toast({ type: 'error', title: label('ロールの削除に失敗しました', 'ไม่สามารถลบ Role ได้', 'Failed to remove role') });
    }
  };

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
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {label('ユーザー管理', 'จัดการผู้ใช้', 'User Management')}
        </h2>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          {label(
            '従業員管理のデータを基に、アプリケーションのユーザーを管理します。ロールを割り当てて権限を設定できます。',
            'จัดการผู้ใช้แอปโดยอ้างอิงจากข้อมูลพนักงาน กำหนด Role เพื่อตั้งค่าสิทธิ์',
            'Manage application users based on employee records. Assign roles to configure permissions.'
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
                {label('所属組織', 'องค์กรที่สังกัด', 'Organizations')}
              </th>
              <th className={tableStyles.th}>
                {label('ロール', 'Role', 'Roles')}
              </th>
              <th className={tableStyles.th} style={{ width: '160px' }}>
                {label('操作', 'การดำเนินการ', 'Actions')}
              </th>
            </tr>
          </thead>
          <tbody className={tableStyles.tbody}>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className={tableStyles.emptyRow}>
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
                    <span className="font-mono">{user.employee_number || '-'}</span>
                  </td>
                  <td className={tableStyles.td}>
                    <div className="flex items-center gap-3">
                      {user.profile_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.profile_image_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className={tableStyles.avatar}>
                          {user.name?.charAt(0) || '?'}
                        </div>
                      )}
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
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className={tableStyles.td}>
                    {(userRolesMap[user.id] || []).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {userRolesMap[user.id].map((ur) => (
                          <span
                            key={ur.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-50 text-brand-700 rounded text-xs font-medium dark:bg-brand-500/10 dark:text-brand-400"
                          >
                            {getRoleName(ur.role)}
                            <button
                              onClick={(e) => handleRemoveRole(ur.id, e)}
                              className="text-brand-400 hover:text-brand-600 dark:text-brand-500 dark:hover:text-brand-300"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className={tableStyles.td}>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => openOrgModal(user, e)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {label('組織', 'องค์กร', 'Org')}
                      </button>
                      <button
                        onClick={(e) => openRoleModal(user, e)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        {label('ロール', 'Role', 'Role')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Organization Edit Modal */}
      {showOrgModal && orgModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {label('所属組織の編集', 'แก้ไของค์กรที่สังกัด', 'Edit Organizations')}
              </h3>
              <p className="mt-1 text-theme-sm text-gray-500">
                {orgModalUser.name} ({orgModalUser.employee_number})
              </p>
            </div>

            <div className="p-6">
              {organizations.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {label('組織が登録されていません', 'ไม่มีองค์กรที่ลงทะเบียน', 'No organizations registered')}
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {organizations.map((org) => (
                    <label
                      key={org.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedOrgIds.has(org.id)}
                        onChange={() => toggleOrgSelection(org.id)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {getOrgName(org.id)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowOrgModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                {label('キャンセル', 'ยกเลิก', 'Cancel')}
              </button>
              <button
                onClick={handleSaveOrgs}
                disabled={savingOrgs}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingOrgs
                  ? label('保存中...', 'กำลังบันทึก...', 'Saving...')
                  : label('保存', 'บันทึก', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {label('ロール割り当て', 'กำหนด Role', 'Assign Role')}
              </h3>
              <p className="mt-1 text-theme-sm text-gray-500">
                {selectedUser.name} ({selectedUser.employee_number})
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* 現在のロール */}
              {(userRolesMap[selectedUser.id] || []).length > 0 && (
                <div>
                  <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label('現在のロール', 'Role ปัจจุบัน', 'Current Roles')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {userRolesMap[selectedUser.id].map((ur) => (
                      <span
                        key={ur.id}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                      >
                        {getRoleName(ur.role)}
                        {ur.organization_id && (
                          <span className="text-gray-500 text-xs">
                            ({getOrgName(ur.organization_id)})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ロール選択 */}
              <div>
                <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {label('割り当てるロール', 'Role ที่จะกำหนด', 'Role to Assign')} *
                </label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full h-11 rounded-lg border border-gray-200 bg-white px-4 text-theme-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10"
                >
                  <option value="">{label('選択してください', 'เลือก', 'Select a role')}</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {getRoleName(role)}
                    </option>
                  ))}
                </select>
              </div>

              {/* 組織スコープ（オプション） */}
              <div>
                <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {label('組織スコープ（任意）', 'ขอบเขตองค์กร (ตัวเลือก)', 'Organization Scope (Optional)')}
                </label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full h-11 rounded-lg border border-gray-200 bg-white px-4 text-theme-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10"
                >
                  <option value="">{label('全組織（グローバル）', 'ทั้งหมด (Global)', 'All Organizations (Global)')}</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {getOrgName(org.id)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-theme-xs text-gray-400">
                  {label(
                    '空欄の場合、全組織に対して権限が付与されます。',
                    'หากปล่อยว่างไว้ สิทธิ์จะมีผลกับทุกองค์กร',
                    'If left empty, permissions will apply to all organizations.'
                  )}
                </p>
              </div>

              {assignError && (
                <div className="p-3 bg-error-50 border border-error-200 text-error-700 rounded-lg text-sm dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
                  {assignError}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                {label('キャンセル', 'ยกเลิก', 'Cancel')}
              </button>
              <button
                onClick={handleAssignRole}
                disabled={!selectedRoleId || assigning}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigning
                  ? label('割り当て中...', 'กำลังกำหนด...', 'Assigning...')
                  : label('割り当て', 'กำหนด', 'Assign')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
