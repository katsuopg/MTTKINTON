'use client';

import { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Trash2, Edit2, Save, X, FolderOpen } from 'lucide-react';

interface AppGroupManagementProps {
  locale: string;
}

interface AppInfo {
  id: string;
  code: string;
  name: string;
  name_en?: string;
  name_th?: string;
  icon?: string;
  color?: string;
}

interface AppGroupItem {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  display_order: number;
  apps: { app_id: string; code: string; name: string; name_en?: string; name_th?: string }[];
}

const translations = {
  ja: {
    title: 'アプリグループ管理',
    description: 'アプリをグループに分けてポータルに表示します。',
    add: 'グループ追加',
    name: 'グループ名',
    descriptionField: '説明',
    icon: 'アイコン名',
    iconHelp: 'lucide-reactのアイコン名（例: Folder, Star, Box）',
    color: 'カラー',
    displayOrder: '表示順',
    apps: 'アプリ選択',
    appCount: 'アプリ数',
    save: '保存',
    cancel: 'キャンセル',
    delete: '削除',
    deleteConfirm: 'このグループを削除しますか？',
    noGroups: 'グループが設定されていません',
    edit: '編集',
    order: '表示順',
    operations: '操作',
    error: 'グループの取得に失敗しました',
  },
  en: {
    title: 'App Group Management',
    description: 'Organize apps into groups for portal display.',
    add: 'Add Group',
    name: 'Group Name',
    descriptionField: 'Description',
    icon: 'Icon Name',
    iconHelp: 'lucide-react icon name (e.g., Folder, Star, Box)',
    color: 'Color',
    displayOrder: 'Display Order',
    apps: 'Select Apps',
    appCount: 'Apps',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    deleteConfirm: 'Delete this group?',
    noGroups: 'No groups configured',
    edit: 'Edit',
    order: 'Order',
    operations: 'Actions',
    error: 'Failed to fetch groups',
  },
  th: {
    title: 'จัดการกลุ่มแอป',
    description: 'จัดระเบียบแอปเป็นกลุ่มสำหรับแสดงในพอร์ทัล',
    add: 'เพิ่มกลุ่ม',
    name: 'ชื่อกลุ่ม',
    descriptionField: 'คำอธิบาย',
    icon: 'ชื่อไอคอน',
    iconHelp: 'ชื่อไอคอน lucide-react (เช่น Folder, Star, Box)',
    color: 'สี',
    displayOrder: 'ลำดับ',
    apps: 'เลือกแอป',
    appCount: 'แอป',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    deleteConfirm: 'ลบกลุ่มนี้หรือไม่?',
    noGroups: 'ยังไม่มีกลุ่มที่กำหนดค่า',
    edit: 'แก้ไข',
    order: 'ลำดับ',
    operations: 'การดำเนินการ',
    error: 'ไม่สามารถดึงข้อมูลกลุ่มได้',
  },
};

interface FormData {
  id: string | null;
  name: string;
  description: string;
  icon: string;
  color: string;
  display_order: number;
  app_ids: string[];
}

const defaultForm: FormData = {
  id: null,
  name: '',
  description: '',
  icon: 'Folder',
  color: '#6366F1',
  display_order: 0,
  app_ids: [],
};

export default function AppGroupManagement({ locale }: AppGroupManagementProps) {
  const t = translations[locale as keyof typeof translations] || translations.ja;
  const [groups, setGroups] = useState<AppGroupItem[]>([]);
  const [allApps, setAllApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({ ...defaultForm });
  const [saving, setSaving] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/app-groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch {
      console.error('Failed to fetch groups');
    }
  }, []);

  const fetchApps = useCallback(async () => {
    try {
      const res = await fetch('/api/apps');
      if (res.ok) {
        const data = await res.json();
        setAllApps(data.apps || []);
      }
    } catch {
      console.error('Failed to fetch apps');
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchGroups(), fetchApps()]).finally(() => setLoading(false));
  }, [fetchGroups, fetchApps]);

  const resetForm = () => {
    setFormData({ ...defaultForm });
    setShowForm(false);
  };

  const startEdit = (group: AppGroupItem) => {
    setFormData({
      id: group.id,
      name: group.name,
      description: group.description || '',
      icon: group.icon || 'Folder',
      color: group.color || '#6366F1',
      display_order: group.display_order,
      app_ids: group.apps.map(a => a.app_id),
    });
    setShowForm(true);
  };

  const startNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: formData.name,
        description: formData.description || null,
        icon: formData.icon || 'Folder',
        color: formData.color || '#6366F1',
        display_order: formData.display_order,
        app_ids: formData.app_ids,
      };
      if (formData.id) body.id = formData.id;

      const res = await fetch('/api/app-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await fetchGroups();
        resetForm();
      }
    } catch {
      console.error('Failed to save group');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      const res = await fetch(`/api/app-groups?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGroups(groups.filter(g => g.id !== id));
      }
    } catch {
      console.error('Failed to delete group');
    }
  };

  const toggleApp = (appId: string) => {
    setFormData(prev => ({
      ...prev,
      app_ids: prev.app_ids.includes(appId)
        ? prev.app_ids.filter(id => id !== appId)
        : [...prev.app_ids, appId],
    }));
  };

  const getAppName = (app: AppInfo) => {
    if (locale === 'en' && app.name_en) return app.name_en;
    if (locale === 'th' && app.name_th) return app.name_th;
    return app.name;
  };

  if (loading) return <LoadingSpinner />;

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent';
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300';

  const renderForm = () => (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.name} *</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className={inputClass}
            placeholder={t.name}
          />
        </div>
        <div>
          <label className={labelClass}>{t.descriptionField}</label>
          <input
            type="text"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className={inputClass}
            placeholder={t.descriptionField}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>{t.icon}</label>
          <input
            type="text"
            value={formData.icon}
            onChange={e => setFormData({ ...formData, icon: e.target.value })}
            className={inputClass}
            placeholder="Folder"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t.iconHelp}</p>
        </div>
        <div>
          <label className={labelClass}>{t.color}</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.color}
              onChange={e => setFormData({ ...formData, color: e.target.value })}
              className="h-9 w-12 cursor-pointer rounded border border-gray-300 dark:border-gray-600"
            />
            <input
              type="text"
              value={formData.color}
              onChange={e => setFormData({ ...formData, color: e.target.value })}
              className={inputClass}
              placeholder="#6366F1"
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>{t.displayOrder}</label>
          <input
            type="number"
            value={formData.display_order}
            onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>{t.apps}</label>
        <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-600 dark:bg-gray-700/50">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {allApps.map(app => (
              <label key={app.id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600/50 rounded px-2 py-1">
                <input
                  type="checkbox"
                  checked={formData.app_ids.includes(app.id)}
                  onChange={() => toggleApp(app.id)}
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-500"
                />
                <span className="truncate">{getAppName(app)}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !formData.name}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {t.save}
        </button>
        <button
          onClick={resetForm}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <X className="h-4 w-4" />
          {t.cancel}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t.title}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t.description}</p>
        </div>
        {!showForm && (
          <button
            onClick={startNew}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            {t.add}
          </button>
        )}
      </div>

      {showForm && renderForm()}

      {groups.length === 0 && !showForm && (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
          <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t.noGroups}</p>
        </div>
      )}

      {groups.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">{t.color}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">{t.name}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">{t.appCount}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">{t.order}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">{t.operations}</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(group => (
                <tr key={group.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <div
                      className="h-6 w-6 rounded-md"
                      style={{ backgroundColor: group.color || '#6366F1' }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800 dark:text-white">{group.name}</div>
                    {group.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{group.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {group.apps.length}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {group.display_order}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(group)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title={t.edit}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(group.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title={t.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
