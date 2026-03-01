'use client';

import { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Trash2, Edit2, Save, X, Webhook, ToggleLeft, ToggleRight } from 'lucide-react';

interface WebhookSettingsProps {
  locale: string;
  appCode: string;
}

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  trigger_type: string;
  headers: Record<string, string>;
  is_active: boolean;
  created_at: string;
}

const TRIGGER_TYPES = [
  'record_added',
  'record_edited',
  'record_deleted',
  'comment_added',
  'status_changed',
] as const;

const translations = {
  ja: {
    title: 'Webhook設定',
    description: 'レコード操作時に外部URLへHTTP POSTリクエストを送信します。',
    add: 'Webhook追加',
    name: 'Webhook名',
    url: 'URL',
    triggerType: 'トリガー',
    headers: 'カスタムヘッダー',
    headersHelp: 'JSON形式で指定（例: {"Authorization": "Bearer xxx"}）',
    active: '有効',
    inactive: '無効',
    save: '保存',
    cancel: 'キャンセル',
    delete: '削除',
    deleteConfirm: 'このWebhookを削除しますか？',
    noWebhooks: 'Webhookが設定されていません',
    triggers: {
      record_added: 'レコード追加',
      record_edited: 'レコード編集',
      record_deleted: 'レコード削除',
      comment_added: 'コメント追加',
      status_changed: 'ステータス変更',
    },
    error: 'Webhookの取得に失敗しました',
    saveError: '保存に失敗しました',
  },
  en: {
    title: 'Webhook Settings',
    description: 'Send HTTP POST requests to external URLs when record operations occur.',
    add: 'Add Webhook',
    name: 'Name',
    url: 'URL',
    triggerType: 'Trigger',
    headers: 'Custom Headers',
    headersHelp: 'JSON format (e.g., {"Authorization": "Bearer xxx"})',
    active: 'Active',
    inactive: 'Inactive',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    deleteConfirm: 'Delete this webhook?',
    noWebhooks: 'No webhooks configured',
    triggers: {
      record_added: 'Record Added',
      record_edited: 'Record Edited',
      record_deleted: 'Record Deleted',
      comment_added: 'Comment Added',
      status_changed: 'Status Changed',
    },
    error: 'Failed to fetch webhooks',
    saveError: 'Failed to save',
  },
  th: {
    title: 'ตั้งค่า Webhook',
    description: 'ส่งคำขอ HTTP POST ไปยัง URL ภายนอกเมื่อมีการดำเนินการกับระเบียน',
    add: 'เพิ่ม Webhook',
    name: 'ชื่อ',
    url: 'URL',
    triggerType: 'ทริกเกอร์',
    headers: 'ส่วนหัวที่กำหนดเอง',
    headersHelp: 'รูปแบบ JSON (เช่น {"Authorization": "Bearer xxx"})',
    active: 'เปิดใช้งาน',
    inactive: 'ปิดใช้งาน',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    deleteConfirm: 'ลบ webhook นี้หรือไม่?',
    noWebhooks: 'ยังไม่มี webhook ที่กำหนดค่า',
    triggers: {
      record_added: 'เพิ่มระเบียน',
      record_edited: 'แก้ไขระเบียน',
      record_deleted: 'ลบระเบียน',
      comment_added: 'เพิ่มความคิดเห็น',
      status_changed: 'เปลี่ยนสถานะ',
    },
    error: 'ไม่สามารถดึง webhook ได้',
    saveError: 'ไม่สามารถบันทึกได้',
  },
};

interface WebhookFormData {
  name: string;
  url: string;
  trigger_type: string;
  headers: string;
  is_active: boolean;
}

export default function WebhookSettings({ locale, appCode }: WebhookSettingsProps) {
  const t = translations[locale as keyof typeof translations] || translations.ja;
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState<WebhookFormData>({
    name: '',
    url: '',
    trigger_type: 'record_added',
    headers: '{}',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch(`/api/apps/${appCode}/webhooks`);
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks);
      }
    } catch {
      console.error('Failed to fetch webhooks');
    } finally {
      setLoading(false);
    }
  }, [appCode]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const resetForm = () => {
    setFormData({ name: '', url: '', trigger_type: 'record_added', headers: '{}', is_active: true });
    setEditingId(null);
    setShowNewForm(false);
  };

  const startEdit = (webhook: WebhookItem) => {
    setEditingId(webhook.id);
    setShowNewForm(false);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      trigger_type: webhook.trigger_type,
      headers: JSON.stringify(webhook.headers || {}, null, 2),
      is_active: webhook.is_active,
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.url) return;

    let parsedHeaders: Record<string, string> = {};
    try {
      parsedHeaders = JSON.parse(formData.headers);
    } catch {
      // ヘッダーが無効な場合は空オブジェクト
    }

    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/apps/${appCode}/webhooks/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, headers: parsedHeaders }),
        });
        if (res.ok) {
          await fetchWebhooks();
          resetForm();
        }
      } else {
        const res = await fetch(`/api/apps/${appCode}/webhooks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, headers: parsedHeaders }),
        });
        if (res.ok) {
          await fetchWebhooks();
          resetForm();
        }
      }
    } catch {
      console.error('Failed to save webhook');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      const res = await fetch(`/api/apps/${appCode}/webhooks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setWebhooks(webhooks.filter(w => w.id !== id));
        if (editingId === id) resetForm();
      }
    } catch {
      console.error('Failed to delete webhook');
    }
  };

  const handleToggleActive = async (webhook: WebhookItem) => {
    try {
      const res = await fetch(`/api/apps/${appCode}/webhooks/${webhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !webhook.is_active }),
      });
      if (res.ok) {
        setWebhooks(webhooks.map(w => w.id === webhook.id ? { ...w, is_active: !w.is_active } : w));
      }
    } catch {
      console.error('Failed to toggle webhook');
    }
  };

  if (loading) return <LoadingSpinner />;

  const triggerLabel = (type: string) =>
    (t.triggers as Record<string, string>)[type] || type;

  const renderForm = () => (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.name}
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="My Webhook"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.triggerType}
          </label>
          <select
            value={formData.trigger_type}
            onChange={e => setFormData({ ...formData, trigger_type: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {TRIGGER_TYPES.map(type => (
              <option key={type} value={type}>{triggerLabel(type)}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.url}
        </label>
        <input
          type="url"
          value={formData.url}
          onChange={e => setFormData({ ...formData, url: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="https://example.com/webhook"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.headers}
        </label>
        <textarea
          value={formData.headers}
          onChange={e => setFormData({ ...formData, headers: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          rows={3}
          placeholder='{"Authorization": "Bearer token"}'
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t.headersHelp}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !formData.name || !formData.url}
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
        {!showNewForm && !editingId && (
          <button
            onClick={() => { setShowNewForm(true); setEditingId(null); }}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            {t.add}
          </button>
        )}
      </div>

      {showNewForm && renderForm()}

      {webhooks.length === 0 && !showNewForm && (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
          <Webhook className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t.noWebhooks}</p>
        </div>
      )}

      <div className="space-y-3">
        {webhooks.map(webhook => (
          <div key={webhook.id}>
            {editingId === webhook.id ? (
              renderForm()
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 dark:text-white">{webhook.name}</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      webhook.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {webhook.is_active ? t.active : t.inactive}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="mr-3 inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {triggerLabel(webhook.trigger_type)}
                    </span>
                    <span className="font-mono text-xs">{webhook.url}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(webhook)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title={webhook.is_active ? t.inactive : t.active}
                  >
                    {webhook.is_active ? (
                      <ToggleRight className="h-5 w-5 text-brand-500" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => startEdit(webhook)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
