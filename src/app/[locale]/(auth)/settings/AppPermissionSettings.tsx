'use client';

import { useEffect, useState, useCallback } from 'react';
import { tableStyles } from '@/components/ui/TableStyles';

interface AppPermissionSettingsProps {
  locale: string;
}

interface App {
  id: string;
  code: string;
  name: string;
  name_en: string | null;
  name_th: string | null;
  description: string | null;
  table_name: string;
  display_order: number;
}

interface AppPermission {
  id: string;
  app_id: string;
  target_type: 'user' | 'organization' | 'role' | 'everyone';
  target_id: string | null;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_manage: boolean;
  can_export: boolean;
  can_import: boolean;
  priority: number;
  include_sub_organizations: boolean;
  app?: { code: string; name: string };
  target_employee?: { id: string; name: string; employee_number: string } | null;
  target_organization?: { id: string; code: string; name: string } | null;
  target_role?: { id: string; code: string; name: string } | null;
}

interface Role {
  id: string;
  code: string;
  name: string;
  name_en: string | null;
  name_th: string | null;
}

interface Organization {
  id: string;
  code: string;
  name: string;
  name_en: string | null;
  name_th: string | null;
}

interface Employee {
  id: string;
  name: string;
  employee_number: string;
}

export default function AppPermissionSettings({ locale }: AppPermissionSettingsProps) {
  const [apps, setApps] = useState<App[]>([]);
  const [permissions, setPermissions] = useState<AppPermission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    target_type: 'role' as 'user' | 'organization' | 'role' | 'everyone',
    target_id: '',
    can_view: true,
    can_add: false,
    can_edit: false,
    can_delete: false,
    can_manage: false,
    can_export: false,
    can_import: false,
    priority: 0,
    include_sub_organizations: true,
  });

  const label = (ja: string, th: string, en: string) =>
    locale === 'ja' ? ja : locale === 'th' ? th : en;

  const getAppName = (app: App) => {
    if (locale === 'en' && app.name_en) return app.name_en;
    if (locale === 'th' && app.name_th) return app.name_th;
    return app.name;
  };

  const getRoleName = (role: Role) => {
    if (locale === 'en' && role.name_en) return role.name_en;
    if (locale === 'th' && role.name_th) return role.name_th;
    return role.name;
  };

  const getOrgName = (org: Organization) => {
    if (locale === 'en' && org.name_en) return org.name_en;
    if (locale === 'th' && org.name_th) return org.name_th;
    return org.name;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [appsRes, rolesRes, orgsRes, empsRes] = await Promise.all([
        fetch('/api/apps'),
        fetch('/api/roles'),
        fetch('/api/organizations'),
        fetch('/api/employees'),
      ]);

      const [appsData, rolesData, orgsData, empsData] = await Promise.all([
        appsRes.json(),
        rolesRes.json(),
        orgsRes.json(),
        empsRes.json(),
      ]);

      setApps(appsData.apps || []);
      setRoles(rolesData.roles || []);
      setOrganizations(orgsData.organizations || []);
      setEmployees(empsData.employees || []);

      if (appsData.apps?.length > 0) {
        setSelectedApp(appsData.apps[0]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    if (!selectedApp) return;
    try {
      const res = await fetch(`/api/app-permissions?app_id=${selectedApp.id}`);
      const data = await res.json();
      setPermissions(data.permissions || []);
    } catch (err) {
      console.error('Error fetching permissions:', err);
    }
  }, [selectedApp]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedApp) {
      fetchPermissions();
    }
  }, [selectedApp, fetchPermissions]);

  const handleAddPermission = async () => {
    if (!selectedApp) return;

    try {
      const res = await fetch('/api/app-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: selectedApp.id,
          ...formData,
          target_id: formData.target_type === 'everyone' ? null : formData.target_id || null,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          target_type: 'role',
          target_id: '',
          can_view: true,
          can_add: false,
          can_edit: false,
          can_delete: false,
          can_manage: false,
          can_export: false,
          can_import: false,
          priority: 0,
          include_sub_organizations: true,
        });
        fetchPermissions();
      }
    } catch (err) {
      console.error('Error adding permission:', err);
    }
  };

  const handleDeletePermission = async (id: string) => {
    if (!confirm(label('この権限設定を削除しますか？', 'ลบการตั้งค่าสิทธิ์นี้?', 'Delete this permission setting?'))) {
      return;
    }

    try {
      await fetch('/api/app-permissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchPermissions();
    } catch (err) {
      console.error('Error deleting permission:', err);
    }
  };

  const getTargetName = (perm: AppPermission) => {
    switch (perm.target_type) {
      case 'everyone':
        return label('全員', 'ทุกคน', 'Everyone');
      case 'user':
        return perm.target_employee?.name || '-';
      case 'organization':
        return perm.target_organization?.name || '-';
      case 'role':
        return perm.target_role?.name || '-';
      default:
        return '-';
    }
  };

  const PermissionBadge = ({ enabled, text }: { enabled: boolean; text: string }) => (
    <span
      className={`px-2 py-0.5 text-xs rounded ${
        enabled
          ? 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400'
          : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
      }`}
    >
      {text}
    </span>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* App Selection */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label('アプリ', 'แอป', 'App')}:
        </label>
        <select
          value={selectedApp?.id || ''}
          onChange={(e) => {
            const app = apps.find((a) => a.id === e.target.value);
            setSelectedApp(app || null);
          }}
          className="flex-1 max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
        >
          {apps.map((app) => (
            <option key={app.id} value={app.id}>
              {getAppName(app)} ({app.code})
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 text-sm font-medium"
        >
          {label('権限を追加', 'เพิ่มสิทธิ์', 'Add Permission')}
        </button>
      </div>

      {/* Permissions Table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-800 dark:text-white/90">
            {selectedApp && getAppName(selectedApp)} - {label('アプリ権限', 'สิทธิ์แอป', 'App Permissions')}
          </h3>
        </div>

        {permissions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {label('権限設定がありません', 'ยังไม่มีการตั้งค่าสิทธิ์', 'No permissions configured')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th}>{label('対象種別', 'ประเภท', 'Target Type')}</th>
                  <th className={tableStyles.th}>{label('対象', 'เป้าหมาย', 'Target')}</th>
                  <th className={tableStyles.th}>{label('権限', 'สิทธิ์', 'Permissions')}</th>
                  <th className={tableStyles.th}>{label('優先度', 'ลำดับ', 'Priority')}</th>
                  <th className={tableStyles.th} style={{ width: '80px' }}></th>
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
                {permissions.map((perm) => (
                  <tr key={perm.id} className={tableStyles.tr}>
                    <td className={tableStyles.td}>
                      <span className={tableStyles.tag}>
                        {perm.target_type === 'everyone' && label('全員', 'ทุกคน', 'Everyone')}
                        {perm.target_type === 'user' && label('ユーザー', 'ผู้ใช้', 'User')}
                        {perm.target_type === 'organization' && label('組織', 'องค์กร', 'Organization')}
                        {perm.target_type === 'role' && label('ロール', 'Role', 'Role')}
                      </span>
                    </td>
                    <td className={`${tableStyles.td} ${tableStyles.tdPrimary}`}>
                      {getTargetName(perm)}
                    </td>
                    <td className={tableStyles.td}>
                      <div className="flex flex-wrap gap-1">
                        <PermissionBadge enabled={perm.can_view} text={label('閲覧', 'ดู', 'View')} />
                        <PermissionBadge enabled={perm.can_add} text={label('追加', 'เพิ่ม', 'Add')} />
                        <PermissionBadge enabled={perm.can_edit} text={label('編集', 'แก้ไข', 'Edit')} />
                        <PermissionBadge enabled={perm.can_delete} text={label('削除', 'ลบ', 'Delete')} />
                        <PermissionBadge enabled={perm.can_manage} text={label('管理', 'จัดการ', 'Manage')} />
                        <PermissionBadge enabled={perm.can_export} text={label('出力', 'ส่งออก', 'Export')} />
                        <PermissionBadge enabled={perm.can_import} text={label('入力', 'นำเข้า', 'Import')} />
                      </div>
                    </td>
                    <td className={tableStyles.td}>
                      <span className="text-gray-500">{perm.priority}</span>
                    </td>
                    <td className={tableStyles.td}>
                      <button
                        onClick={() => handleDeletePermission(perm.id)}
                        className="text-error-500 hover:text-error-600 text-sm"
                      >
                        {label('削除', 'ลบ', 'Delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Permission Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {label('アプリ権限を追加', 'เพิ่มสิทธิ์แอป', 'Add App Permission')}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Target Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {label('対象種別', 'ประเภทเป้าหมาย', 'Target Type')}
                </label>
                <select
                  value={formData.target_type}
                  onChange={(e) => setFormData({ ...formData, target_type: e.target.value as typeof formData.target_type, target_id: '' })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                >
                  <option value="everyone">{label('全員', 'ทุกคน', 'Everyone')}</option>
                  <option value="role">{label('ロール', 'Role', 'Role')}</option>
                  <option value="organization">{label('組織', 'องค์กร', 'Organization')}</option>
                  <option value="user">{label('ユーザー', 'ผู้ใช้', 'User')}</option>
                </select>
              </div>

              {/* Target Selection */}
              {formData.target_type !== 'everyone' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label('対象', 'เป้าหมาย', 'Target')}
                  </label>
                  <select
                    value={formData.target_id}
                    onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                  >
                    <option value="">{label('選択してください', 'กรุณาเลือก', 'Select...')}</option>
                    {formData.target_type === 'role' && roles.map((r) => (
                      <option key={r.id} value={r.id}>{getRoleName(r)}</option>
                    ))}
                    {formData.target_type === 'organization' && organizations.map((o) => (
                      <option key={o.id} value={o.id}>{getOrgName(o)}</option>
                    ))}
                    {formData.target_type === 'user' && employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.name} ({e.employee_number})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {label('権限', 'สิทธิ์', 'Permissions')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'can_view', ja: '閲覧', th: 'ดู', en: 'View' },
                    { key: 'can_add', ja: '追加', th: 'เพิ่ม', en: 'Add' },
                    { key: 'can_edit', ja: '編集', th: 'แก้ไข', en: 'Edit' },
                    { key: 'can_delete', ja: '削除', th: 'ลบ', en: 'Delete' },
                    { key: 'can_manage', ja: '管理', th: 'จัดการ', en: 'Manage' },
                    { key: 'can_export', ja: '書き出し', th: 'ส่งออก', en: 'Export' },
                    { key: 'can_import', ja: '読み込み', th: 'นำเข้า', en: 'Import' },
                  ].map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData[perm.key as keyof typeof formData] as boolean}
                        onChange={(e) => setFormData({ ...formData, [perm.key]: e.target.checked })}
                        className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {label(perm.ja, perm.th, perm.en)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {label('優先度（高いほど優先）', 'ลำดับความสำคัญ', 'Priority (higher = more priority)')}
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                />
              </div>

              {/* Include Sub Organizations */}
              {formData.target_type === 'organization' && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.include_sub_organizations}
                    onChange={(e) => setFormData({ ...formData, include_sub_organizations: e.target.checked })}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {label('サブ組織にも適用', 'ใช้กับองค์กรย่อย', 'Apply to sub-organizations')}
                  </span>
                </label>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                {label('キャンセル', 'ยกเลิก', 'Cancel')}
              </button>
              <button
                onClick={handleAddPermission}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
              >
                {label('追加', 'เพิ่ม', 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
