'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Save, Loader2, Plus, X, Trash2, ChevronDown, ChevronUp, Bell,
} from 'lucide-react';

interface NotificationRule {
  id: string;
  name: string;
  trigger_type: string;
  condition: { logic: 'AND' | 'OR'; conditions: { field: string; operator: string; value: string }[] } | null;
  notify_type: string;
  notify_target_id: string;
  notify_target_field: string;
  title_template: string;
  message_template: string;
  isNew?: boolean;
  isExpanded?: boolean;
}

interface FieldOption {
  code: string;
  label: string;
}

const labels = {
  ja: {
    title: '通知設定',
    addRule: 'ルール追加',
    noRules: '通知ルールはありません',
    noRulesHelp: '操作やフィールド値の条件で自動通知を設定できます',
    ruleName: 'ルール名',
    trigger: 'トリガー',
    triggerAdded: 'レコード追加時',
    triggerEdited: 'レコード編集時',
    triggerDeleted: 'レコード削除時',
    triggerComment: 'コメント追加時',
    triggerStatus: 'ステータス変更時',
    condition: '条件（任意）',
    conditionHelp: '空の場合は全レコードが対象',
    addCondition: '条件追加',
    field: 'フィールド',
    operator: '演算子',
    value: '値',
    notifyType: '通知先',
    notifyCreator: '作成者',
    notifyUser: 'ユーザー',
    notifyRole: 'ロール',
    notifyOrg: '組織',
    notifyFieldValue: 'フィールド値',
    notifyTarget: '対象ID',
    notifyField: '対象フィールド',
    titleTemplate: '通知タイトル',
    messageTemplate: '通知メッセージ',
    templateHelp: '{{record_number}}、{{field_name}} 等のプレースホルダーが使えます',
    save: '保存',
    saving: '保存中...',
    saved: '保存しました',
    saveError: '保存に失敗しました',
    deleteConfirm: 'このルールを削除しますか？',
    selectField: 'フィールドを選択',
    operatorEq: '等しい',
    operatorNe: '等しくない',
    operatorContains: 'テキスト含む',
  },
  en: {
    title: 'Notification Settings',
    addRule: 'Add Rule',
    noRules: 'No notification rules',
    noRulesHelp: 'Set up automatic notifications based on operations or field conditions',
    ruleName: 'Rule Name',
    trigger: 'Trigger',
    triggerAdded: 'Record added',
    triggerEdited: 'Record edited',
    triggerDeleted: 'Record deleted',
    triggerComment: 'Comment added',
    triggerStatus: 'Status changed',
    condition: 'Condition (optional)',
    conditionHelp: 'Empty = all records',
    addCondition: 'Add Condition',
    field: 'Field',
    operator: 'Operator',
    value: 'Value',
    notifyType: 'Notify',
    notifyCreator: 'Creator',
    notifyUser: 'User',
    notifyRole: 'Role',
    notifyOrg: 'Organization',
    notifyFieldValue: 'Field Value',
    notifyTarget: 'Target ID',
    notifyField: 'Target Field',
    titleTemplate: 'Title Template',
    messageTemplate: 'Message Template',
    templateHelp: 'Use {{record_number}}, {{field_name}} etc. as placeholders',
    save: 'Save',
    saving: 'Saving...',
    saved: 'Saved',
    saveError: 'Failed to save',
    deleteConfirm: 'Delete this rule?',
    selectField: 'Select field',
    operatorEq: 'Equals',
    operatorNe: 'Not equals',
    operatorContains: 'Contains',
  },
  th: {
    title: 'การตั้งค่าการแจ้งเตือน',
    addRule: 'เพิ่มกฎ',
    noRules: 'ไม่มีกฎการแจ้งเตือน',
    noRulesHelp: 'ตั้งค่าการแจ้งเตือนอัตโนมัติตามการดำเนินการหรือเงื่อนไขฟิลด์',
    ruleName: 'ชื่อกฎ',
    trigger: 'ทริกเกอร์',
    triggerAdded: 'เมื่อเพิ่มระเบียน',
    triggerEdited: 'เมื่อแก้ไขระเบียน',
    triggerDeleted: 'เมื่อลบระเบียน',
    triggerComment: 'เมื่อเพิ่มความคิดเห็น',
    triggerStatus: 'เมื่อเปลี่ยนสถานะ',
    condition: 'เงื่อนไข (ไม่บังคับ)',
    conditionHelp: 'ว่าง = ทุกระเบียน',
    addCondition: 'เพิ่มเงื่อนไข',
    field: 'ฟิลด์',
    operator: 'ตัวดำเนินการ',
    value: 'ค่า',
    notifyType: 'แจ้งเตือน',
    notifyCreator: 'ผู้สร้าง',
    notifyUser: 'ผู้ใช้',
    notifyRole: 'บทบาท',
    notifyOrg: 'องค์กร',
    notifyFieldValue: 'ค่าฟิลด์',
    notifyTarget: 'ID เป้าหมาย',
    notifyField: 'ฟิลด์เป้าหมาย',
    titleTemplate: 'เทมเพลตชื่อเรื่อง',
    messageTemplate: 'เทมเพลตข้อความ',
    templateHelp: 'ใช้ {{record_number}}, {{field_name}} เป็นตัวแทน',
    save: 'บันทึก',
    saving: 'กำลังบันทึก...',
    saved: 'บันทึกแล้ว',
    saveError: 'ไม่สามารถบันทึกได้',
    deleteConfirm: 'ลบกฎนี้หรือไม่?',
    selectField: 'เลือกฟิลด์',
    operatorEq: 'เท่ากับ',
    operatorNe: 'ไม่เท่ากับ',
    operatorContains: 'ประกอบด้วย',
  },
};

const TRIGGER_TYPES = [
  { value: 'record_added', key: 'triggerAdded' as const },
  { value: 'record_edited', key: 'triggerEdited' as const },
  { value: 'record_deleted', key: 'triggerDeleted' as const },
  { value: 'comment_added', key: 'triggerComment' as const },
  { value: 'status_changed', key: 'triggerStatus' as const },
];

interface NotificationSettingsProps {
  locale: string;
  appCode: string;
}

export default function NotificationSettings({ locale, appCode }: NotificationSettingsProps) {
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const t = labels[lang];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [fields, setFields] = useState<FieldOption[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const res = await fetch(`/api/apps/${appCode}/fields`);
        if (res.ok) {
          const data = await res.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setFields((data.fields || []).map((f: any) => ({ code: f.field_code, label: f.label || f.field_code })));
        }
      } catch { /* static apps may not have fields */ }
    };
    fetchFields();
  }, [appCode]);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch(`/api/apps/${appCode}/notifications`);
      if (res.ok) {
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setRules((data.rules || []).map((r: any) => ({
          id: r.id,
          name: r.name || '',
          trigger_type: r.trigger_type || 'record_added',
          condition: r.condition || null,
          notify_type: r.notify_type || 'creator',
          notify_target_id: r.notify_target_id || '',
          notify_target_field: r.notify_target_field || '',
          title_template: r.title_template || '',
          message_template: r.message_template || '',
          isExpanded: false,
        })));
      }
    } catch (err) {
      console.error('Failed to fetch notification rules:', err);
    } finally {
      setLoading(false);
    }
  }, [appCode]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const addRule = () => {
    setRules((prev) => [...prev, {
      id: `new_${Date.now()}`,
      name: '',
      trigger_type: 'record_added',
      condition: null,
      notify_type: 'creator',
      notify_target_id: '',
      notify_target_field: '',
      title_template: '',
      message_template: '',
      isNew: true,
      isExpanded: true,
    }]);
  };

  const removeRule = (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    const rule = rules.find((r) => r.id === id);
    if (rule && !rule.isNew) setDeletedIds((prev) => [...prev, id]);
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRule = (id: string, updates: Partial<NotificationRule>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const toggleExpand = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isExpanded: !r.isExpanded } : r)));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      for (const id of deletedIds) {
        await fetch(`/api/apps/${appCode}/notifications`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
      }

      for (const rule of rules) {
        const payload = {
          name: rule.name,
          trigger_type: rule.trigger_type,
          condition: rule.condition,
          notify_type: rule.notify_type,
          notify_target_id: rule.notify_target_id || null,
          notify_target_field: rule.notify_target_field || null,
          title_template: rule.title_template || null,
          message_template: rule.message_template || null,
        };

        if (rule.isNew) {
          await fetch(`/api/apps/${appCode}/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } else {
          await fetch(`/api/apps/${appCode}/notifications`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: rule.id, ...payload }),
          });
        }
      }

      setDeletedIds([]);
      await fetchRules();
      setSaveMessage(t.saved);
      setTimeout(() => setSaveMessage(''), 2000);
    } catch {
      setSaveMessage(t.saveError);
    } finally {
      setSaving(false);
    }
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
      <div className={`${cardClass} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-brand-500" />
            <span className="text-sm font-medium text-gray-800 dark:text-white">{t.title}</span>
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addRule}
              className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 px-3 py-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 border border-brand-200 dark:border-brand-800"
            >
              <Plus className="w-3.5 h-3.5" />{t.addRule}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t.saving}</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />{t.save}</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ルール一覧 */}
      {rules.length === 0 ? (
        <div className={`${cardClass} p-8 text-center`}>
          <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.noRules}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t.noRulesHelp}</p>
        </div>
      ) : (
        rules.map((rule) => {
          const triggerLabel = TRIGGER_TYPES.find((tt) => tt.value === rule.trigger_type);
          return (
            <div key={rule.id} className={cardClass}>
              <div
                className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80"
                onClick={() => toggleExpand(rule.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {rule.isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                  <span className="text-sm font-medium text-gray-800 dark:text-white truncate">
                    {rule.name || `(${t.ruleName})`}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {triggerLabel ? t[triggerLabel.key] : rule.trigger_type}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeRule(rule.id); }}
                  className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {rule.isExpanded && (
                <div className="p-4 space-y-4">
                  {/* ルール名 + トリガー */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.ruleName}</label>
                      <input
                        type="text"
                        value={rule.name}
                        onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                        className={inputClass}
                        placeholder={t.ruleName}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.trigger}</label>
                      <select
                        value={rule.trigger_type}
                        onChange={(e) => updateRule(rule.id, { trigger_type: e.target.value })}
                        className={`${selectClass} w-full`}
                      >
                        {TRIGGER_TYPES.map((tt) => (
                          <option key={tt.value} value={tt.value}>{t[tt.key]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 通知先 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.notifyType}</label>
                      <select
                        value={rule.notify_type}
                        onChange={(e) => updateRule(rule.id, { notify_type: e.target.value })}
                        className={`${selectClass} w-full`}
                      >
                        <option value="creator">{t.notifyCreator}</option>
                        <option value="user">{t.notifyUser}</option>
                        <option value="role">{t.notifyRole}</option>
                        <option value="organization">{t.notifyOrg}</option>
                        <option value="field_value">{t.notifyFieldValue}</option>
                      </select>
                    </div>
                    {(rule.notify_type === 'user' || rule.notify_type === 'role' || rule.notify_type === 'organization') && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.notifyTarget}</label>
                        <input
                          type="text"
                          value={rule.notify_target_id}
                          onChange={(e) => updateRule(rule.id, { notify_target_id: e.target.value })}
                          className={inputClass}
                          placeholder="UUID"
                        />
                      </div>
                    )}
                    {rule.notify_type === 'field_value' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.notifyField}</label>
                        <select
                          value={rule.notify_target_field}
                          onChange={(e) => updateRule(rule.id, { notify_target_field: e.target.value })}
                          className={`${selectClass} w-full`}
                        >
                          <option value="">{t.selectField}</option>
                          {fields.map((f) => (
                            <option key={f.code} value={f.code}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* テンプレート */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.titleTemplate}</label>
                      <input
                        type="text"
                        value={rule.title_template}
                        onChange={(e) => updateRule(rule.id, { title_template: e.target.value })}
                        className={inputClass}
                        placeholder={t.titleTemplate}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.messageTemplate}</label>
                      <input
                        type="text"
                        value={rule.message_template}
                        onChange={(e) => updateRule(rule.id, { message_template: e.target.value })}
                        className={inputClass}
                        placeholder={t.templateHelp}
                      />
                    </div>
                  </div>

                  {/* 条件 */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t.condition} <span className="text-[10px] text-gray-400">({t.conditionHelp})</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const cond = rule.condition || { logic: 'AND' as const, conditions: [] };
                          updateRule(rule.id, {
                            condition: {
                              ...cond,
                              conditions: [...cond.conditions, { field: '', operator: 'eq', value: '' }],
                            },
                          });
                        }}
                        className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600"
                      >
                        <Plus className="w-3 h-3" />{t.addCondition}
                      </button>
                    </div>
                    {rule.condition && rule.condition.conditions.length > 0 && (
                      <div className="space-y-2">
                        {rule.condition.conditions.map((cond, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <select
                              value={cond.field}
                              onChange={(e) => {
                                const newConds = [...rule.condition!.conditions];
                                newConds[idx] = { ...newConds[idx], field: e.target.value };
                                updateRule(rule.id, { condition: { ...rule.condition!, conditions: newConds } });
                              }}
                              className={`${selectClass} flex-1`}
                            >
                              <option value="">{t.selectField}</option>
                              <option value="status">status</option>
                              {fields.map((f) => (
                                <option key={f.code} value={f.code}>{f.label}</option>
                              ))}
                            </select>
                            <select
                              value={cond.operator}
                              onChange={(e) => {
                                const newConds = [...rule.condition!.conditions];
                                newConds[idx] = { ...newConds[idx], operator: e.target.value };
                                updateRule(rule.id, { condition: { ...rule.condition!, conditions: newConds } });
                              }}
                              className={`${selectClass} w-32`}
                            >
                              <option value="eq">{t.operatorEq}</option>
                              <option value="ne">{t.operatorNe}</option>
                              <option value="contains">{t.operatorContains}</option>
                            </select>
                            <input
                              type="text"
                              value={cond.value}
                              onChange={(e) => {
                                const newConds = [...rule.condition!.conditions];
                                newConds[idx] = { ...newConds[idx], value: e.target.value };
                                updateRule(rule.id, { condition: { ...rule.condition!, conditions: newConds } });
                              }}
                              className={`${inputClass} flex-1`}
                              placeholder={t.value}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newConds = rule.condition!.conditions.filter((_, i) => i !== idx);
                                updateRule(rule.id, {
                                  condition: newConds.length > 0 ? { ...rule.condition!, conditions: newConds } : null,
                                });
                              }}
                              className="p-1 text-gray-400 hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
