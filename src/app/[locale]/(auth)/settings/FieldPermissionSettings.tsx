'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { tableStyles } from '@/components/ui/TableStyles';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';

interface FieldPermissionSettingsProps {
  locale: string;
  fixedAppCode?: string;
}

interface App {
  id: string;
  code: string;
  name: string;
  name_en: string | null;
  name_th: string | null;
  table_name: string;
}

interface FieldPermission {
  id: string;
  app_id: string;
  field_name: string;
  field_label: string | null;
  target_type: 'user' | 'organization' | 'role' | 'everyone';
  target_id: string | null;
  access_level: 'view' | 'edit' | 'hidden';
  priority: number;
  app?: { code: string; name: string };
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
}

// 各アプリのフィールド定義（簡略版）
const APP_FIELDS: Record<string, { name: string; label_ja: string; label_en: string; label_th: string }[]> = {
  employees: [
    { name: 'name', label_ja: '氏名', label_en: 'Name', label_th: 'ชื่อ' },
    { name: 'email', label_ja: 'メールアドレス', label_en: 'Email', label_th: 'อีเมล' },
    { name: 'tel', label_ja: '電話番号', label_en: 'Phone', label_th: 'โทรศัพท์' },
    { name: 'salary_amount', label_ja: '給与', label_en: 'Salary', label_th: 'เงินเดือน' },
    { name: 'bank_account', label_ja: '銀行口座', label_en: 'Bank Account', label_th: 'บัญชีธนาคาร' },
    { name: 'id_number', label_ja: 'ID番号', label_en: 'ID Number', label_th: 'หมายเลข ID' },
    { name: 'passport_number', label_ja: 'パスポート番号', label_en: 'Passport No.', label_th: 'หมายเลขหนังสือเดินทาง' },
    { name: 'address', label_ja: '住所', label_en: 'Address', label_th: 'ที่อยู่' },
  ],
  customers: [
    { name: 'name', label_ja: '顧客名', label_en: 'Customer Name', label_th: 'ชื่อลูกค้า' },
    { name: 'contact_name', label_ja: '担当者名', label_en: 'Contact Name', label_th: 'ชื่อผู้ติดต่อ' },
    { name: 'email', label_ja: 'メールアドレス', label_en: 'Email', label_th: 'อีเมล' },
    { name: 'phone', label_ja: '電話番号', label_en: 'Phone', label_th: 'โทรศัพท์' },
  ],
  quotations: [
    { name: 'amount', label_ja: '金額', label_en: 'Amount', label_th: 'จำนวนเงิน' },
    { name: 'profit_margin', label_ja: '利益率', label_en: 'Profit Margin', label_th: 'อัตรากำไร' },
    { name: 'cost', label_ja: '原価', label_en: 'Cost', label_th: 'ต้นทุน' },
  ],
};

export default function FieldPermissionSettings({ locale, fixedAppCode }: FieldPermissionSettingsProps) {
  const { toast } = useToast();
  const { confirmDialog } = useConfirmDialog();
  const [apps, setApps] = useState<App[]>([]);
  const [permissions, setPermissions] = useState<FieldPermission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // ドラッグ&ドロップ state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounterRef = useRef(0);

  const [formData, setFormData] = useState({
    field_name: '',
    field_label: '',
    target_type: 'role' as 'user' | 'organization' | 'role' | 'everyone',
    target_id: '',
    access_level: 'view' as 'view' | 'edit' | 'hidden',
  });

  const label = (ja: string, th: string, en: string) =>
    locale === 'ja' ? ja : locale === 'th' ? th : en;

  const getAppName = (app: App) => {
    if (locale === 'en' && app.name_en) return app.name_en;
    if (locale === 'th' && app.name_th) return app.name_th;
    return app.name;
  };

  const getFieldLabel = (field: { label_ja: string; label_en: string; label_th: string }) => {
    if (locale === 'en') return field.label_en;
    if (locale === 'th') return field.label_th;
    return field.label_ja;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [appsRes, rolesRes, orgsRes] = await Promise.all([
        fetch('/api/apps'),
        fetch('/api/roles'),
        fetch('/api/organizations'),
      ]);

      const [appsData, rolesData, orgsData] = await Promise.all([
        appsRes.json(),
        rolesRes.json(),
        orgsRes.json(),
      ]);

      const appsList = appsData.apps || [];
      setApps(appsList);
      setRoles(rolesData.roles || []);
      setOrganizations(orgsData.organizations || []);

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
      const res = await fetch(`/api/field-permissions?app_id=${selectedApp.id}`, {
        cache: 'no-store',
      });
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

  // priority再計算 & API一括保存
  const savePriorities = async (reorderedPerms: FieldPermission[]) => {
    const items = reorderedPerms.map((p, i) => ({
      id: p.id,
      priority: reorderedPerms.length - 1 - i,
    }));

    try {
      const res = await fetch('/api/field-permissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) throw new Error('Failed to save priorities');
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
    if (!selectedApp || !formData.field_name) return;

    const newPriority = permissions.length;

    try {
      const res = await fetch('/api/field-permissions', {
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
          field_name: '',
          field_label: '',
          target_type: 'role',
          target_id: '',
          access_level: 'view',
        });
        fetchPermissions();
        toast({ type: 'success', title: label('フィールド権限を追加しました', 'เพิ่มสิทธิ์ฟิลด์สำเร็จ', 'Field permission added') });
      } else {
        toast({ type: 'error', title: label('フィールド権限の追加に失敗しました', 'เพิ่มสิทธิ์ฟิลด์ไม่สำเร็จ', 'Failed to add field permission') });
      }
    } catch (err) {
      console.error('Error adding permission:', err);
      toast({ type: 'error', title: label('フィールド権限の追加に失敗しました', 'เพิ่มสิทธิ์ฟิลด์ไม่สำเร็จ', 'Failed to add field permission') });
    }
  };

  const handleDeletePermission = async (id: string) => {
    const confirmed = await confirmDialog({
      title: label('フィールド権限削除', 'ลบสิทธิ์ฟิลด์', 'Delete Field Permission'),
      message: label('このフィールド権限を削除しますか？', 'ลบสิทธิ์ฟิลด์นี้?', 'Delete this field permission?'),
      variant: 'danger',
      confirmLabel: label('削除', 'ลบ', 'Delete'),
      cancelLabel: label('キャンセル', 'ยกเลิก', 'Cancel'),
    });
    if (!confirmed) return;

    // 楽観的更新: 先にUIから削除
    const previousPermissions = permissions;
    setPermissions((prev) => prev.filter((p) => p.id !== id));

    try {
      const res = await fetch(`/api/field-permissions?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete permission');
      }

      toast({ type: 'success', title: label('フィールド権限を削除しました', 'ลบสิทธิ์ฟิลด์สำเร็จ', 'Field permission deleted') });
    } catch (err) {
      console.error('Error deleting permission:', err);
      // 失敗時はUIを元に戻す
      setPermissions(previousPermissions);
      toast({ type: 'error', title: label('フィールド権限の削除に失敗しました', 'ลบสิทธิ์ฟิลด์ไม่สำเร็จ', 'Failed to delete field permission') });
    }
  };

  const getAccessLevelBadge = (level: 'view' | 'edit' | 'hidden') => {
    const styles = {
      view: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
      edit: 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400',
      hidden: 'bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-400',
    };
    const labels = {
      view: label('閲覧のみ', 'ดูเท่านั้น', 'View Only'),
      edit: label('編集可能', 'แก้ไขได้', 'Editable'),
      hidden: label('非表示', 'ซ่อน', 'Hidden'),
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded ${styles[level]}`}>
        {labels[level]}
      </span>
    );
  };

  const availableFields = selectedApp ? (APP_FIELDS[selectedApp.code] || []) : [];

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
          {label('フィールド権限を追加', 'เพิ่มสิทธิ์ฟิลด์', 'Add Field Permission')}
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          {label(
            'フィールド権限を設定すると、特定のユーザー/ロール/組織に対してフィールドの表示・編集を制限できます。',
            'ตั้งค่าสิทธิ์ฟิลด์เพื่อจำกัดการดู/แก้ไขฟิลด์สำหรับผู้ใช้/Role/องค์กรเฉพาะ',
            'Set field permissions to restrict viewing/editing of fields for specific users/roles/organizations.'
          )}
        </p>
      </div>

      {/* Permissions Table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-800 dark:text-white/90">
            {selectedApp && getAppName(selectedApp)} - {label('フィールド権限', 'สิทธิ์ฟิลด์', 'Field Permissions')}
          </h3>
        </div>

        {permissions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {label('フィールド権限設定がありません（全フィールドにフルアクセス）', 'ยังไม่มีการตั้งค่าสิทธิ์ฟิลด์ (เข้าถึงทุกฟิลด์ได้)', 'No field permissions configured (full access to all fields)')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th} style={{ width: '44px' }}></th>
                  <th className={tableStyles.th}>{label('フィールド', 'ฟิลด์', 'Field')}</th>
                  <th className={tableStyles.th}>{label('対象種別', 'ประเภท', 'Target Type')}</th>
                  <th className={tableStyles.th}>{label('対象', 'เป้าหมาย', 'Target')}</th>
                  <th className={tableStyles.th}>{label('アクセスレベル', 'ระดับสิทธิ์', 'Access Level')}</th>
                  <th className={tableStyles.th} style={{ width: '80px' }}></th>
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
                {permissions.map((perm, index) => (
                  <tr
                    key={perm.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    className={`${tableStyles.tr} ${
                      dragIndex === index ? 'opacity-50' : ''
                    } ${
                      dragOverIndex === index ? 'border-t-2 border-brand-500' : ''
                    }`}
                  >
                    <td className={`${tableStyles.td} cursor-grab active:cursor-grabbing`}>
                      <span className="text-gray-400 text-lg select-none">⠿</span>
                    </td>
                    <td className={`${tableStyles.td} ${tableStyles.tdPrimary}`}>
                      <div>
                        <span className="font-medium">{perm.field_label || perm.field_name}</span>
                        <span className="text-xs text-gray-400 ml-2 font-mono">{perm.field_name}</span>
                      </div>
                    </td>
                    <td className={tableStyles.td}>
                      <span className={tableStyles.tag}>
                        {perm.target_type === 'everyone' && label('全員', 'ทุกคน', 'Everyone')}
                        {perm.target_type === 'role' && label('ロール', 'Role', 'Role')}
                        {perm.target_type === 'organization' && label('組織', 'องค์กร', 'Organization')}
                        {perm.target_type === 'user' && label('ユーザー', 'ผู้ใช้', 'User')}
                      </span>
                    </td>
                    <td className={tableStyles.td}>
                      {perm.target_type === 'everyone' ? label('全員', 'ทุกคน', 'Everyone') : perm.target_id || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {getAccessLevelBadge(perm.access_level)}
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
                {label('フィールド権限を追加', 'เพิ่มสิทธิ์ฟิลด์', 'Add Field Permission')}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Field Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {label('フィールド', 'ฟิลด์', 'Field')}
                </label>
                <select
                  value={formData.field_name}
                  onChange={(e) => {
                    const field = availableFields.find((f) => f.name === e.target.value);
                    setFormData({
                      ...formData,
                      field_name: e.target.value,
                      field_label: field ? getFieldLabel(field) : '',
                    });
                  }}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                >
                  <option value="">{label('選択してください', 'กรุณาเลือก', 'Select...')}</option>
                  {availableFields.map((field) => (
                    <option key={field.name} value={field.name}>
                      {getFieldLabel(field)} ({field.name})
                    </option>
                  ))}
                </select>
              </div>

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
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                    {formData.target_type === 'organization' && organizations.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Access Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {label('アクセスレベル', 'ระดับสิทธิ์', 'Access Level')}
                </label>
                <select
                  value={formData.access_level}
                  onChange={(e) => setFormData({ ...formData, access_level: e.target.value as typeof formData.access_level })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                >
                  <option value="edit">{label('編集可能', 'แก้ไขได้', 'Editable')}</option>
                  <option value="view">{label('閲覧のみ', 'ดูเท่านั้น', 'View Only')}</option>
                  <option value="hidden">{label('非表示', 'ซ่อน', 'Hidden')}</option>
                </select>
              </div>

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
                disabled={!formData.field_name}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
