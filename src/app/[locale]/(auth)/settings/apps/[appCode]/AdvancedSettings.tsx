'use client';

import { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Save, ToggleLeft, ToggleRight } from 'lucide-react';

interface AdvancedSettingsProps {
  locale: string;
  appCode: string;
}

interface AppSettings {
  enable_bulk_delete: boolean;
  enable_history: boolean;
  enable_comments: boolean;
}

const translations = {
  ja: {
    title: '高度な設定',
    description: 'アプリの動作に関する詳細設定を行います。',
    bulkDelete: 'レコード一括削除',
    bulkDeleteDesc: 'レコード一覧画面でチェックボックスによる一括削除を有効にします。',
    history: '変更履歴の記録',
    historyDesc: 'レコード編集時に変更履歴を自動的に記録します。',
    comments: 'コメント機能',
    commentsDesc: 'レコード詳細画面でコメントの投稿・閲覧を有効にします。',
    save: '保存',
    saving: '保存中...',
    saved: '保存しました',
    error: '設定の取得に失敗しました',
    saveError: '設定の保存に失敗しました',
    enabled: '有効',
    disabled: '無効',
  },
  en: {
    title: 'Advanced Settings',
    description: 'Configure detailed behavior settings for this app.',
    bulkDelete: 'Bulk Delete Records',
    bulkDeleteDesc: 'Enable checkbox-based bulk deletion on the record list page.',
    history: 'Record Change History',
    historyDesc: 'Automatically record change history when records are edited.',
    comments: 'Comment Feature',
    commentsDesc: 'Enable posting and viewing comments on the record detail page.',
    save: 'Save',
    saving: 'Saving...',
    saved: 'Saved successfully',
    error: 'Failed to fetch settings',
    saveError: 'Failed to save settings',
    enabled: 'Enabled',
    disabled: 'Disabled',
  },
  th: {
    title: 'ตั้งค่าขั้นสูง',
    description: 'กำหนดการตั้งค่าพฤติกรรมโดยละเอียดสำหรับแอปนี้',
    bulkDelete: 'ลบระเบียนจำนวนมาก',
    bulkDeleteDesc: 'เปิดใช้งานการลบจำนวนมากโดยใช้ช่องทำเครื่องหมายในหน้ารายการระเบียน',
    history: 'ประวัติการเปลี่ยนแปลง',
    historyDesc: 'บันทึกประวัติการเปลี่ยนแปลงโดยอัตโนมัติเมื่อแก้ไขระเบียน',
    comments: 'ฟีเจอร์ความคิดเห็น',
    commentsDesc: 'เปิดใช้งานการโพสต์และดูความคิดเห็นในหน้ารายละเอียดระเบียน',
    save: 'บันทึก',
    saving: 'กำลังบันทึก...',
    saved: 'บันทึกแล้ว',
    error: 'ไม่สามารถดึงการตั้งค่าได้',
    saveError: 'ไม่สามารถบันทึกการตั้งค่าได้',
    enabled: 'เปิดใช้งาน',
    disabled: 'ปิดใช้งาน',
  },
};

export default function AdvancedSettings({ locale, appCode }: AdvancedSettingsProps) {
  const t = translations[locale as keyof typeof translations] || translations.ja;
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/apps/${appCode}/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch {
      console.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, [appCode]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggle = (key: keyof AppSettings) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSaveMessage('');

    try {
      const res = await fetch(`/api/apps/${appCode}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaveMessage(t.saved);
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage(t.saveError);
      }
    } catch {
      setSaveMessage(t.saveError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!settings) return <p className="text-red-500">{t.error}</p>;

  const toggleItems: { key: keyof AppSettings; label: string; description: string }[] = [
    { key: 'enable_bulk_delete', label: t.bulkDelete, description: t.bulkDeleteDesc },
    { key: 'enable_history', label: t.history, description: t.historyDesc },
    { key: 'enable_comments', label: t.comments, description: t.commentsDesc },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t.title}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t.description}</p>
      </div>

      <div className="space-y-4">
        {toggleItems.map(({ key, label, description }) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex-1">
              <div className="font-medium text-gray-800 dark:text-white">{label}</div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</div>
            </div>
            <button
              onClick={() => handleToggle(key)}
              className="ml-4 flex-shrink-0"
              aria-label={`Toggle ${label}`}
            >
              {settings[key] ? (
                <ToggleRight className="h-8 w-8 text-brand-500" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? t.saving : t.save}
        </button>
        {saveMessage && (
          <span className={`text-sm ${saveMessage === t.saved ? 'text-green-600' : 'text-red-500'}`}>
            {saveMessage}
          </span>
        )}
      </div>
    </div>
  );
}
