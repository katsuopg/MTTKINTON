'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Save, Loader2, Plus, X, Pencil, Trash2, ArrowRight, MoveRight, ChevronDown,
} from 'lucide-react';

interface FieldMapping {
  source_field: string;
  target_field: string;
  copy_type: 'value' | 'fixed';
  fixed_value?: string;
}

interface AppActionItem {
  id?: string;
  name: string;
  description?: string;
  target_app_id: string;
  target_app_code?: string;
  target_app_name?: string;
  field_mappings: FieldMapping[];
  display_order?: number;
}

interface AppInfo {
  id: string;
  code: string;
  name: string;
}

interface FieldInfo {
  id: string;
  field_code: string;
  field_type: string;
  label: { ja?: string; en?: string; th?: string };
}

const labels = {
  ja: {
    title: 'アクション（転記）',
    noActions: 'アクションが設定されていません',
    addAction: 'アクションを追加',
    actionName: 'アクション名',
    description: '説明',
    targetApp: '転記先アプリ',
    selectApp: 'アプリを選択...',
    fieldMappings: 'フィールドマッピング',
    sourceField: '元フィールド',
    targetField: '先フィールド',
    selectField: 'フィールドを選択...',
    addMapping: 'マッピングを追加',
    save: '保存',
    saving: '保存中...',
    cancel: 'キャンセル',
    edit: '編集',
    delete: '削除',
    deleteConfirm: 'このアクションを削除しますか？',
    saved: '保存しました',
    saveError: '保存に失敗しました',
    noMappings: 'フィールドマッピングを追加してください',
    createNew: '新規作成',
  },
  en: {
    title: 'Actions (Copy)',
    noActions: 'No actions configured',
    addAction: 'Add Action',
    actionName: 'Action Name',
    description: 'Description',
    targetApp: 'Target App',
    selectApp: 'Select app...',
    fieldMappings: 'Field Mappings',
    sourceField: 'Source Field',
    targetField: 'Target Field',
    selectField: 'Select field...',
    addMapping: 'Add Mapping',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    deleteConfirm: 'Delete this action?',
    saved: 'Saved',
    saveError: 'Failed to save',
    noMappings: 'Add field mappings',
    createNew: 'Create New',
  },
  th: {
    title: 'การดำเนินการ (คัดลอก)',
    noActions: 'ไม่มีการดำเนินการ',
    addAction: 'เพิ่มการดำเนินการ',
    actionName: 'ชื่อการดำเนินการ',
    description: 'คำอธิบาย',
    targetApp: 'แอปปลายทาง',
    selectApp: 'เลือกแอป...',
    fieldMappings: 'การแมปฟิลด์',
    sourceField: 'ฟิลด์ต้นทาง',
    targetField: 'ฟิลด์ปลายทาง',
    selectField: 'เลือกฟิลด์...',
    addMapping: 'เพิ่มการแมป',
    save: 'บันทึก',
    saving: 'กำลังบันทึก...',
    cancel: 'ยกเลิก',
    edit: 'แก้ไข',
    delete: 'ลบ',
    deleteConfirm: 'ลบการดำเนินการนี้หรือไม่?',
    saved: 'บันทึกแล้ว',
    saveError: 'ไม่สามารถบันทึกได้',
    noMappings: 'เพิ่มการแมปฟิลด์',
    createNew: 'สร้างใหม่',
  },
};

interface AppActionSettingsProps {
  locale: string;
  appCode: string;
}

export default function AppActionSettings({ locale, appCode }: AppActionSettingsProps) {
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const t = labels[lang];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [actionsList, setActionsList] = useState<AppActionItem[]>([]);

  // 編集中のアクション
  const [editingAction, setEditingAction] = useState<AppActionItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // マスターデータ
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [sourceFields, setSourceFields] = useState<FieldInfo[]>([]);
  const [targetFields, setTargetFields] = useState<FieldInfo[]>([]);
  const [targetFieldsLoading, setTargetFieldsLoading] = useState(false);

  // 元アプリフィールド取得
  useEffect(() => {
    const fetchSourceFields = async () => {
      try {
        const res = await fetch(`/api/apps/${appCode}/fields`);
        if (res.ok) {
          const data = await res.json();
          setSourceFields(data.fields || []);
        }
      } catch (err) {
        console.error('Failed to fetch source fields:', err);
      }
    };
    fetchSourceFields();
  }, [appCode]);

  // アクション一覧取得
  const fetchActions = useCallback(async () => {
    try {
      const res = await fetch(`/api/apps/${appCode}/actions`);
      if (res.ok) {
        const data = await res.json();
        setActionsList(
          (data.actions || []).map((a: any) => ({
            id: a.id,
            name: a.name,
            description: a.description,
            target_app_id: a.target_app_id,
            target_app_code: a.target_app?.code,
            target_app_name: a.target_app?.name,
            field_mappings: a.field_mappings || [],
            display_order: a.display_order,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch actions:', err);
    } finally {
      setLoading(false);
    }
  }, [appCode]);

  useEffect(() => { fetchActions(); }, [fetchActions]);

  // アプリ一覧取得
  const fetchApps = useCallback(async () => {
    if (apps.length > 0) return;
    try {
      const res = await fetch('/api/apps?type=dynamic');
      if (res.ok) {
        const data = await res.json();
        setApps((data.apps || []).map((a: any) => ({ id: a.id, code: a.code, name: a.name })));
      }
    } catch (err) {
      console.error('Failed to fetch apps:', err);
    }
  }, [apps.length]);

  // 転記先フィールド取得
  const fetchTargetFields = useCallback(async (targetAppCode: string) => {
    setTargetFieldsLoading(true);
    try {
      const res = await fetch(`/api/apps/${targetAppCode}/fields`);
      if (res.ok) {
        const data = await res.json();
        setTargetFields(data.fields || []);
      }
    } catch (err) {
      console.error('Failed to fetch target fields:', err);
    } finally {
      setTargetFieldsLoading(false);
    }
  }, []);

  // 新規作成開始
  const startCreate = () => {
    fetchApps();
    setEditingAction({
      name: '',
      target_app_id: '',
      field_mappings: [],
    });
    setIsCreating(true);
    setTargetFields([]);
  };

  // 編集開始
  const startEdit = (action: AppActionItem) => {
    fetchApps();
    setEditingAction({ ...action, field_mappings: [...action.field_mappings] });
    setIsCreating(false);
    if (action.target_app_code) {
      fetchTargetFields(action.target_app_code);
    }
  };

  // 転記先アプリ変更
  const handleTargetAppChange = (appId: string) => {
    if (!editingAction) return;
    const app = apps.find((a) => a.id === appId);
    setEditingAction({
      ...editingAction,
      target_app_id: appId,
      target_app_code: app?.code,
      target_app_name: app?.name,
      field_mappings: [],
    });
    if (app) {
      fetchTargetFields(app.code);
    } else {
      setTargetFields([]);
    }
  };

  // マッピング追加
  const addMapping = () => {
    if (!editingAction) return;
    setEditingAction({
      ...editingAction,
      field_mappings: [
        ...editingAction.field_mappings,
        { source_field: '', target_field: '', copy_type: 'value' },
      ],
    });
  };

  // マッピング更新
  const updateMapping = (idx: number, updates: Partial<FieldMapping>) => {
    if (!editingAction) return;
    const newMappings = [...editingAction.field_mappings];
    newMappings[idx] = { ...newMappings[idx], ...updates };
    setEditingAction({ ...editingAction, field_mappings: newMappings });
  };

  // マッピング削除
  const removeMapping = (idx: number) => {
    if (!editingAction) return;
    const newMappings = editingAction.field_mappings.filter((_, i) => i !== idx);
    setEditingAction({ ...editingAction, field_mappings: newMappings });
  };

  // 保存
  const handleSave = async () => {
    if (!editingAction || !editingAction.name || !editingAction.target_app_id) return;
    setSaving(true);
    setSaveMessage('');

    try {
      // 既存アクションリストを更新
      let updatedList: AppActionItem[];
      if (isCreating) {
        updatedList = [...actionsList, editingAction];
      } else {
        updatedList = actionsList.map((a) =>
          a.id === editingAction.id ? editingAction : a
        );
      }

      const res = await fetch(`/api/apps/${appCode}/actions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actions: updatedList.map((a) => ({
            id: a.id,
            name: a.name,
            description: a.description,
            target_app_id: a.target_app_id,
            field_mappings: a.field_mappings,
          })),
        }),
      });

      if (!res.ok) throw new Error(t.saveError);

      setSaveMessage(t.saved);
      setEditingAction(null);
      setIsCreating(false);
      fetchActions();
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : t.saveError);
    } finally {
      setSaving(false);
    }
  };

  // 削除
  const handleDelete = async (actionId: string) => {
    if (!confirm(t.deleteConfirm)) return;

    try {
      const res = await fetch(`/api/apps/${appCode}/actions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_id: actionId }),
      });
      if (res.ok) {
        fetchActions();
      } else {
        // DELETE not supported, use PUT to remove
        const updatedList = actionsList.filter((a) => a.id !== actionId);
        const putRes = await fetch(`/api/apps/${appCode}/actions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actions: updatedList.map((a) => ({
              id: a.id,
              name: a.name,
              description: a.description,
              target_app_id: a.target_app_id,
              field_mappings: a.field_mappings,
            })),
          }),
        });
        if (putRes.ok) fetchActions();
      }
    } catch (err) {
      console.error('Failed to delete action:', err);
    }
  };

  const getFieldLabel = (field: FieldInfo): string => {
    return field.label[lang] || field.label.ja || field.field_code;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const cardClass = 'rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50';
  const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500';
  const selectClass = 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              saveMessage === t.saved
                ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                : 'text-red-600 bg-red-50 dark:bg-red-900/20'
            }`}>
              {saveMessage}
            </span>
          )}
        </div>
        {!editingAction && (
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand-500 hover:bg-brand-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t.addAction}
          </button>
        )}
      </div>

      {/* 編集フォーム */}
      {editingAction && (
        <div className={`${cardClass} p-5`}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">
            {isCreating ? t.createNew : t.edit}
          </h3>
          <div className="space-y-4">
            {/* アクション名 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t.actionName}
              </label>
              <input
                type="text"
                value={editingAction.name}
                onChange={(e) => setEditingAction({ ...editingAction, name: e.target.value })}
                placeholder={t.actionName}
                className={inputClass}
              />
            </div>

            {/* 説明 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t.description}
              </label>
              <input
                type="text"
                value={editingAction.description || ''}
                onChange={(e) => setEditingAction({ ...editingAction, description: e.target.value })}
                placeholder={t.description}
                className={inputClass}
              />
            </div>

            {/* 転記先アプリ */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t.targetApp}
              </label>
              <select
                value={editingAction.target_app_id}
                onChange={(e) => handleTargetAppChange(e.target.value)}
                className={`${selectClass} w-full`}
              >
                <option value="">{t.selectApp}</option>
                {apps.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name} ({app.code})
                  </option>
                ))}
              </select>
            </div>

            {/* フィールドマッピング */}
            {editingAction.target_app_id && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {t.fieldMappings}
                  </label>
                  <button
                    type="button"
                    onClick={addMapping}
                    disabled={targetFieldsLoading}
                    className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 px-2 py-1 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20"
                  >
                    <Plus className="w-3.5 h-3.5" />{t.addMapping}
                  </button>
                </div>

                {targetFieldsLoading ? (
                  <div className="py-4 text-center">
                    <Loader2 className="w-4 h-4 mx-auto animate-spin text-gray-400" />
                  </div>
                ) : editingAction.field_mappings.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">{t.noMappings}</p>
                ) : (
                  <div className="space-y-2">
                    {/* ヘッダー */}
                    <div className="grid grid-cols-11 gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium px-1">
                      <div className="col-span-5">{t.sourceField}</div>
                      <div className="col-span-1 text-center"></div>
                      <div className="col-span-4">{t.targetField}</div>
                      <div className="col-span-1"></div>
                    </div>
                    {editingAction.field_mappings.map((mapping, idx) => (
                      <div key={idx} className="grid grid-cols-11 gap-2 items-center group">
                        <div className="col-span-5">
                          <select
                            value={mapping.source_field}
                            onChange={(e) => updateMapping(idx, { source_field: e.target.value })}
                            className={`${selectClass} w-full text-xs`}
                          >
                            <option value="">{t.selectField}</option>
                            {sourceFields.map((f) => (
                              <option key={f.id} value={f.field_code}>
                                {getFieldLabel(f)} ({f.field_code})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <MoveRight className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="col-span-4">
                          <select
                            value={mapping.target_field}
                            onChange={(e) => updateMapping(idx, { target_field: e.target.value })}
                            className={`${selectClass} w-full text-xs`}
                          >
                            <option value="">{t.selectField}</option>
                            {targetFields.map((f) => (
                              <option key={f.id} value={f.field_code}>
                                {getFieldLabel(f)} ({f.field_code})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => removeMapping(idx)}
                            className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 rounded transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ボタン */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => { setEditingAction(null); setIsCreating(false); }}
                className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !editingAction.name || !editingAction.target_app_id}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{t.saving}</>
                ) : (
                  <><Save className="w-4 h-4" />{t.save}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* アクション一覧 */}
      {actionsList.length === 0 && !editingAction ? (
        <div className={`${cardClass} p-8 text-center`}>
          <MoveRight className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">{t.noActions}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {actionsList.map((action) => (
            <div key={action.id} className={`${cardClass} p-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-white">
                    <MoveRight className="w-4 h-4 text-brand-500" />
                    {action.name}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    <ArrowRight className="w-3 h-3 inline mr-1" />
                    {action.target_app_name || action.target_app_code || ''}
                  </span>
                  {action.field_mappings.length > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      {action.field_mappings.length} {lang === 'ja' ? 'マッピング' : lang === 'th' ? 'การแมป' : 'mappings'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(action)}
                    className="p-1.5 rounded text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                    title={t.edit}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => action.id && handleDelete(action.id)}
                    className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title={t.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {action.description && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-7">{action.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
