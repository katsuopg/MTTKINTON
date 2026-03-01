'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { X } from 'lucide-react';

interface AppPermissionSettingsProps {
  locale: string;
  fixedAppCode?: string;
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

const PERMISSION_KEYS = [
  'can_view',
  'can_add',
  'can_edit',
  'can_delete',
  'can_manage',
  'can_import',
  'can_export',
] as const;

type PermissionKey = (typeof PERMISSION_KEYS)[number];

export default function AppPermissionSettings({ locale, fixedAppCode }: AppPermissionSettingsProps) {
  const { toast } = useToast();
  const { confirmDialog } = useConfirmDialog();
  const [apps, setApps] = useState<App[]>([]);
  const [permissions, setPermissions] = useState<AppPermission[]>([]);
  const [savedPermissions, setSavedPermissions] = useState<AppPermission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // ドラッグ&ドロップ state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounterRef = useRef(0);

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
    include_sub_organizations: true,
  });

  const label = (ja: string, th: string, en: string) =>
    locale === 'ja' ? ja : locale === 'th' ? th : en;

  const permLabel: Record<PermissionKey, string> = {
    can_view: label('レコード閲覧', 'ดูเรคอร์ด', 'Record View'),
    can_add: label('レコード追加', 'เพิ่มเรคอร์ด', 'Record Add'),
    can_edit: label('レコード編集', 'แก้ไขเรคอร์ด', 'Record Edit'),
    can_delete: label('レコード削除', 'ลบเรคอร์ด', 'Record Delete'),
    can_manage: label('アプリ管理', 'จัดการแอป', 'App Manage'),
    can_import: label('ファイル読み込み', 'นำเข้าไฟล์', 'File Import'),
    can_export: label('ファイル書き出し', 'ส่งออกไฟล์', 'File Export'),
  };

  const inheritLabel = label('アクセス権の継承', 'สืบทอดสิทธิ์', 'Access Inherit');

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

  // 未保存変更の検知
  const hasUnsavedChanges = useCallback(() => {
    if (permissions.length !== savedPermissions.length) return true;
    return permissions.some((perm, i) => {
      const saved = savedPermissions[i];
      if (!saved || perm.id !== saved.id) return true;
      return PERMISSION_KEYS.some((key) => perm[key] !== saved[key]) ||
        perm.include_sub_organizations !== saved.include_sub_organizations;
    });
  }, [permissions, savedPermissions]);

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

      const appsList = appsData.apps || [];
      setApps(appsList);
      setRoles(rolesData.roles || []);
      setOrganizations(orgsData.organizations || []);
      setEmployees(empsData.employees || []);

      if (fixedAppCode) {
        const fixedApp = appsList.find((a: App) => a.code === fixedAppCode);
        if (fixedApp) setSelectedApp(fixedApp);
      } else if (appsList.length > 0) {
        setSelectedApp(appsList[0]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [fixedAppCode]);

  const fetchPermissions = useCallback(async () => {
    if (!selectedApp) return;
    try {
      const res = await fetch(`/api/app-permissions?app_id=${selectedApp.id}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      const perms = data.permissions || [];
      setPermissions(perms);
      setSavedPermissions(JSON.parse(JSON.stringify(perms)));
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

  // インラインチェックボックス変更
  const handleInlineToggle = (permId: string, key: PermissionKey | 'include_sub_organizations') => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.id === permId ? { ...p, [key]: !p[key] } : p
      )
    );
  };

  // 一括保存
  const handleSaveAll = async () => {
    const changed = permissions.filter((perm, i) => {
      const saved = savedPermissions[i];
      if (!saved || perm.id !== saved.id) return true;
      return PERMISSION_KEYS.some((key) => perm[key] !== saved[key]) ||
        perm.include_sub_organizations !== saved.include_sub_organizations;
    });

    if (changed.length === 0) return;

    setSaving(true);
    try {
      const results = await Promise.all(
        changed.map((perm) =>
          fetch('/api/app-permissions', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: perm.id,
              can_view: perm.can_view,
              can_add: perm.can_add,
              can_edit: perm.can_edit,
              can_delete: perm.can_delete,
              can_manage: perm.can_manage,
              can_export: perm.can_export,
              can_import: perm.can_import,
              include_sub_organizations: perm.include_sub_organizations,
            }),
          })
        )
      );

      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        toast({ type: 'error', title: label('一部の保存に失敗しました', 'บันทึกบางรายการไม่สำเร็จ', 'Some updates failed') });
      } else {
        setSavedPermissions(JSON.parse(JSON.stringify(permissions)));
        toast({ type: 'success', title: label('保存しました', 'บันทึกสำเร็จ', 'Saved') });
      }
    } catch (err) {
      console.error('Error saving permissions:', err);
      toast({ type: 'error', title: label('保存に失敗しました', 'บันทึกไม่สำเร็จ', 'Failed to save') });
    } finally {
      setSaving(false);
    }
  };

  // priority再計算 & API一括保存
  const savePriorities = async (reorderedPerms: AppPermission[]) => {
    const items = reorderedPerms.map((p, i) => ({
      id: p.id,
      priority: reorderedPerms.length - 1 - i,
    }));

    try {
      const res = await fetch('/api/app-permissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) throw new Error('Failed to save priorities');
      // savedPermissionsも並び替え後の状態に更新
      setSavedPermissions(JSON.parse(JSON.stringify(reorderedPerms)));
      toast({ type: 'success', title: label('並び順を保存しました', 'บันทึกลำดับสำเร็จ', 'Order saved') });
    } catch (err) {
      console.error('Error saving priorities:', err);
      toast({ type: 'error', title: label('並び順の保存に失敗しました', 'บันทึกลำดับไม่สำเร็จ', 'Failed to save order') });
      fetchPermissions();
    }
  };

  // DnDイベントハンドラー
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragEnter = (index: number) => {
    dragCounterRef.current++;
    if (dragIndex !== null && index !== dragIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setDragOverIndex(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      dragCounterRef.current = 0;
      return;
    }

    const reordered = [...permissions];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    setPermissions(reordered);
    setDragIndex(null);
    setDragOverIndex(null);
    dragCounterRef.current = 0;
    savePriorities(reordered);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
    dragCounterRef.current = 0;
  };

  const handleAddPermission = async () => {
    if (!selectedApp) return;

    const newPriority = permissions.length;

    try {
      const res = await fetch('/api/app-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: selectedApp.id,
          ...formData,
          priority: newPriority,
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
          include_sub_organizations: true,
        });
        fetchPermissions();
        toast({ type: 'success', title: label('権限を追加しました', 'เพิ่มสิทธิ์สำเร็จ', 'Permission added') });
      } else {
        toast({ type: 'error', title: label('権限の追加に失敗しました', 'เพิ่มสิทธิ์ไม่สำเร็จ', 'Failed to add permission') });
      }
    } catch (err) {
      console.error('Error adding permission:', err);
      toast({ type: 'error', title: label('権限の追加に失敗しました', 'เพิ่มสิทธิ์ไม่สำเร็จ', 'Failed to add permission') });
    }
  };

  const handleDeletePermission = async (id: string) => {
    const confirmed = await confirmDialog({
      title: label('権限削除', 'ลบสิทธิ์', 'Delete Permission'),
      message: label('この権限設定を削除しますか？', 'ลบการตั้งค่าสิทธิ์นี้?', 'Delete this permission setting?'),
      variant: 'danger',
      confirmLabel: label('削除', 'ลบ', 'Delete'),
      cancelLabel: label('キャンセル', 'ยกเลิก', 'Cancel'),
    });
    if (!confirmed) return;

    const previousPermissions = permissions;
    const previousSaved = savedPermissions;
    setPermissions((prev) => prev.filter((p) => p.id !== id));
    setSavedPermissions((prev) => prev.filter((p) => p.id !== id));

    try {
      const res = await fetch(`/api/app-permissions?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete permission');
      }

      toast({ type: 'success', title: label('権限を削除しました', 'ลบสิทธิ์สำเร็จ', 'Permission deleted') });
    } catch (err) {
      console.error('Error deleting permission:', err);
      setPermissions(previousPermissions);
      setSavedPermissions(previousSaved);
      toast({ type: 'error', title: label('権限の削除に失敗しました', 'ลบสิทธิ์ไม่สำเร็จ', 'Failed to delete permission') });
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  const unsaved = hasUnsavedChanges();

  return (
    <div className="space-y-6">
      {/* App Selection */}
      <div className="flex items-center gap-4">
        {!fixedAppCode && (
          <>
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
          </>
        )}
        <button
          onClick={() => setShowAddModal(true)}
          className={`px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 text-sm font-medium${fixedAppCode ? ' ml-auto' : ''}`}
        >
          {label('権限を追加', 'เพิ่มสิทธิ์', 'Add Permission')}
        </button>
      </div>

      {/* Permissions — Kintone-style inline checkboxes */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50">
        {/* Header row */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-40 flex-shrink-0">
            {label('ユーザー／組織／グループ', 'ผู้ใช้/องค์กร/กลุ่ม', 'User / Org / Group')}
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {label('許可する操作', 'การดำเนินการที่อนุญาต', 'Allowed Operations')}
          </span>
        </div>

        {permissions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {label('権限設定がありません', 'ยังไม่มีการตั้งค่าสิทธิ์', 'No permissions configured')}
            </p>
          </div>
        ) : (
          <div>
            {permissions.map((perm, index) => (
              <div
                key={perm.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 ${
                  dragIndex === index ? 'opacity-50' : ''
                } ${
                  dragOverIndex === index ? 'border-t-2 !border-t-brand-500' : ''
                }`}
              >
                {/* Drag handle */}
                <span className="text-gray-400 text-lg select-none cursor-grab active:cursor-grabbing flex-shrink-0">⠿</span>

                {/* Target name */}
                <div className="w-36 flex-shrink-0 flex items-center gap-1.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                    {perm.target_type === 'everyone' && label('全員', 'ทุกคน', 'All')}
                    {perm.target_type === 'user' && label('ユーザー', 'ผู้ใช้', 'User')}
                    {perm.target_type === 'organization' && label('組織', 'องค์กร', 'Org')}
                    {perm.target_type === 'role' && label('ロール', 'Role', 'Role')}
                  </span>
                  <span className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                    {getTargetName(perm)}
                  </span>
                </div>

                {/* Inline checkboxes with labels */}
                <div className="flex items-center gap-3 flex-wrap min-w-0">
                  {PERMISSION_KEYS.map((key) => (
                    <label key={key} className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={perm[key]}
                        onChange={() => handleInlineToggle(perm.id, key)}
                        className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 h-3.5 w-3.5"
                      />
                      <span className={`text-xs ${perm[key] ? 'text-gray-800 dark:text-white/80' : 'text-gray-400 dark:text-gray-500'}`}>
                        {permLabel[key]}
                      </span>
                    </label>
                  ))}
                  {/* アクセス権の継承 — 組織の場合のみ */}
                  {perm.target_type === 'organization' && (
                    <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={perm.include_sub_organizations}
                        onChange={() => handleInlineToggle(perm.id, 'include_sub_organizations')}
                        className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 h-3.5 w-3.5"
                      />
                      <span className={`text-xs ${perm.include_sub_organizations ? 'text-gray-800 dark:text-white/80' : 'text-gray-400 dark:text-gray-500'}`}>
                        {inheritLabel}
                      </span>
                    </label>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDeletePermission(perm.id)}
                  className="ml-auto flex-shrink-0 text-gray-400 hover:text-error-500 transition-colors"
                  title={label('削除', 'ลบ', 'Delete')}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Save / Cancel bar */}
        {permissions.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
            {unsaved && (
              <span className="text-sm text-amber-600 dark:text-amber-400 mr-auto">
                {label('未保存の変更があります', 'มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก', 'Unsaved changes')}
              </span>
            )}
            <button
              onClick={() => {
                setPermissions(JSON.parse(JSON.stringify(savedPermissions)));
              }}
              disabled={!unsaved}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {label('キャンセル', 'ยกเลิก', 'Cancel')}
            </button>
            <button
              onClick={handleSaveAll}
              disabled={!unsaved || saving}
              className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
            >
              {saving ? label('保存中...', 'กำลังบันทึก...', 'Saving...') : label('保存', 'บันทึก', 'Save')}
            </button>
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
                  {PERMISSION_KEYS.map((key) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData[key]}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                        className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {permLabel[key]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* アクセス権の継承 */}
              {formData.target_type === 'organization' && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.include_sub_organizations}
                    onChange={(e) => setFormData({ ...formData, include_sub_organizations: e.target.checked })}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {inheritLabel}
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
