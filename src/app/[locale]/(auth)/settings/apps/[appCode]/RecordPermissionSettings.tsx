'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Save, Loader2, Plus, X, Trash2, ChevronDown, ChevronUp, Shield,
} from 'lucide-react';

interface ConditionItem {
  field: string;
  operator: string;
  value: string;
  values: string[];
}

interface RuleItem {
  id: string;
  name: string;
  description: string;
  condition: { logic: 'AND' | 'OR'; conditions: ConditionItem[] };
  target_type: 'user' | 'organization' | 'role' | 'creator' | 'field_value';
  target_id: string;
  target_field: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  priority: number;
  isNew?: boolean;
  isExpanded?: boolean;
}

interface FieldOption {
  code: string;
  label: string;
  type: string;
}

const labels = {
  ja: {
    title: 'レコードのアクセス権',
    addRule: 'ルール追加',
    noRules: 'レコード権限ルールはありません',
    noRulesHelp: '条件を設定して、レコードごとにアクセス制御を行えます',
    ruleName: 'ルール名',
    description: '説明',
    condition: '条件',
    conditionLogic: '条件の組み合わせ',
    conditionAnd: 'すべて一致 (AND)',
    conditionOr: 'いずれか一致 (OR)',
    addCondition: '条件追加',
    field: 'フィールド',
    operator: '演算子',
    value: '値',
    targetType: '権限対象',
    targetUser: 'ユーザー',
    targetOrg: '組織',
    targetRole: 'ロール',
    targetCreator: '作成者',
    targetFieldValue: 'フィールド値',
    targetId: '対象ID',
    targetField: '対象フィールド',
    permissions: '許可する操作',
    canView: '閲覧',
    canEdit: '編集',
    canDelete: '削除',
    priority: '優先順位',
    priorityHelp: '数値が大きいほど優先',
    save: '保存',
    saving: '保存中...',
    saved: '保存しました',
    saveError: '保存に失敗しました',
    deleteConfirm: 'このルールを削除しますか？',
    selectField: 'フィールドを選択',
    selectOperator: '演算子を選択',
    operatorEq: '等しい',
    operatorNe: '等しくない',
    operatorIn: '含む',
    operatorNotIn: '含まない',
    operatorGt: 'より大きい',
    operatorLt: 'より小さい',
    operatorGte: '以上',
    operatorLte: '以下',
    operatorContains: 'テキスト含む',
    valuesHelp: 'カンマ区切りで複数値を指定',
    noConditions: '条件なし（全レコードに適用）',
  },
  en: {
    title: 'Record Access Rights',
    addRule: 'Add Rule',
    noRules: 'No record permission rules',
    noRulesHelp: 'Set conditions to control access per record',
    ruleName: 'Rule Name',
    description: 'Description',
    condition: 'Conditions',
    conditionLogic: 'Condition Logic',
    conditionAnd: 'All match (AND)',
    conditionOr: 'Any match (OR)',
    addCondition: 'Add Condition',
    field: 'Field',
    operator: 'Operator',
    value: 'Value',
    targetType: 'Target',
    targetUser: 'User',
    targetOrg: 'Organization',
    targetRole: 'Role',
    targetCreator: 'Creator',
    targetFieldValue: 'Field Value',
    targetId: 'Target ID',
    targetField: 'Target Field',
    permissions: 'Allowed Operations',
    canView: 'View',
    canEdit: 'Edit',
    canDelete: 'Delete',
    priority: 'Priority',
    priorityHelp: 'Higher number = higher priority',
    save: 'Save',
    saving: 'Saving...',
    saved: 'Saved',
    saveError: 'Failed to save',
    deleteConfirm: 'Delete this rule?',
    selectField: 'Select field',
    selectOperator: 'Select operator',
    operatorEq: 'Equals',
    operatorNe: 'Not equals',
    operatorIn: 'In',
    operatorNotIn: 'Not in',
    operatorGt: 'Greater than',
    operatorLt: 'Less than',
    operatorGte: 'Greater or equal',
    operatorLte: 'Less or equal',
    operatorContains: 'Contains',
    valuesHelp: 'Comma-separated values',
    noConditions: 'No conditions (applies to all records)',
  },
  th: {
    title: 'สิทธิ์การเข้าถึงระเบียน',
    addRule: 'เพิ่มกฎ',
    noRules: 'ไม่มีกฎสิทธิ์ระเบียน',
    noRulesHelp: 'ตั้งเงื่อนไขเพื่อควบคุมการเข้าถึงแต่ละระเบียน',
    ruleName: 'ชื่อกฎ',
    description: 'คำอธิบาย',
    condition: 'เงื่อนไข',
    conditionLogic: 'ตรรกะเงื่อนไข',
    conditionAnd: 'ทั้งหมดตรงกัน (AND)',
    conditionOr: 'ตรงกันอย่างใดอย่างหนึ่ง (OR)',
    addCondition: 'เพิ่มเงื่อนไข',
    field: 'ฟิลด์',
    operator: 'ตัวดำเนินการ',
    value: 'ค่า',
    targetType: 'เป้าหมาย',
    targetUser: 'ผู้ใช้',
    targetOrg: 'องค์กร',
    targetRole: 'บทบาท',
    targetCreator: 'ผู้สร้าง',
    targetFieldValue: 'ค่าฟิลด์',
    targetId: 'ID เป้าหมาย',
    targetField: 'ฟิลด์เป้าหมาย',
    permissions: 'การดำเนินการที่อนุญาต',
    canView: 'ดู',
    canEdit: 'แก้ไข',
    canDelete: 'ลบ',
    priority: 'ลำดับความสำคัญ',
    priorityHelp: 'ตัวเลขสูงกว่า = ความสำคัญสูงกว่า',
    save: 'บันทึก',
    saving: 'กำลังบันทึก...',
    saved: 'บันทึกแล้ว',
    saveError: 'ไม่สามารถบันทึกได้',
    deleteConfirm: 'ลบกฎนี้หรือไม่?',
    selectField: 'เลือกฟิลด์',
    selectOperator: 'เลือกตัวดำเนินการ',
    operatorEq: 'เท่ากับ',
    operatorNe: 'ไม่เท่ากับ',
    operatorIn: 'อยู่ใน',
    operatorNotIn: 'ไม่อยู่ใน',
    operatorGt: 'มากกว่า',
    operatorLt: 'น้อยกว่า',
    operatorGte: 'มากกว่าหรือเท่ากับ',
    operatorLte: 'น้อยกว่าหรือเท่ากับ',
    operatorContains: 'ประกอบด้วย',
    valuesHelp: 'คั่นด้วยจุลภาคสำหรับหลายค่า',
    noConditions: 'ไม่มีเงื่อนไข (ใช้กับทุกระเบียน)',
  },
};

const OPERATORS = [
  { value: 'eq', key: 'operatorEq' as const },
  { value: 'ne', key: 'operatorNe' as const },
  { value: 'in', key: 'operatorIn' as const },
  { value: 'not_in', key: 'operatorNotIn' as const },
  { value: 'gt', key: 'operatorGt' as const },
  { value: 'lt', key: 'operatorLt' as const },
  { value: 'gte', key: 'operatorGte' as const },
  { value: 'lte', key: 'operatorLte' as const },
  { value: 'contains', key: 'operatorContains' as const },
];

interface RecordPermissionSettingsProps {
  locale: string;
  appCode: string;
}

export default function RecordPermissionSettings({ locale, appCode }: RecordPermissionSettingsProps) {
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const t = labels[lang];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [fields, setFields] = useState<FieldOption[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  // フィールド定義取得
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const res = await fetch(`/api/apps/${appCode}/fields`);
        if (res.ok) {
          const data = await res.json();
          setFields(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data.fields || []).map((f: any) => ({
              code: f.field_code,
              label: f.label || f.field_code,
              type: f.field_type,
            }))
          );
        }
      } catch {
        // 静的アプリの場合はフィールド定義がないかもしれない
      }
    };
    fetchFields();
  }, [appCode]);

  // ルール取得
  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch(`/api/record-permissions?app_code=${appCode}`);
      if (res.ok) {
        const data = await res.json();
        setRules(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data.rules || []).map((r: any) => ({
            id: r.id,
            name: r.name || '',
            description: r.description || '',
            condition: r.condition || { logic: 'AND', conditions: [] },
            target_type: r.target_type || 'creator',
            target_id: r.target_id || '',
            target_field: r.target_field || '',
            can_view: r.can_view ?? true,
            can_edit: r.can_edit ?? false,
            can_delete: r.can_delete ?? false,
            priority: r.priority ?? 0,
            isExpanded: false,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch record permission rules:', err);
    } finally {
      setLoading(false);
    }
  }, [appCode]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      {
        id: `new_${Date.now()}`,
        name: '',
        description: '',
        condition: { logic: 'AND', conditions: [] },
        target_type: 'creator',
        target_id: '',
        target_field: '',
        can_view: true,
        can_edit: false,
        can_delete: false,
        priority: 0,
        isNew: true,
        isExpanded: true,
      },
    ]);
  };

  const removeRule = (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    const rule = rules.find((r) => r.id === id);
    if (rule && !rule.isNew) {
      setDeletedIds((prev) => [...prev, id]);
    }
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRule = (id: string, updates: Partial<RuleItem>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const toggleExpand = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isExpanded: !r.isExpanded } : r)));
  };

  const addCondition = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        return {
          ...r,
          condition: {
            ...r.condition,
            conditions: [
              ...r.condition.conditions,
              { field: '', operator: 'eq', value: '', values: [] },
            ],
          },
        };
      })
    );
  };

  const updateCondition = (ruleId: string, condIdx: number, updates: Partial<ConditionItem>) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        const newConditions = [...r.condition.conditions];
        newConditions[condIdx] = { ...newConditions[condIdx], ...updates };
        return { ...r, condition: { ...r.condition, conditions: newConditions } };
      })
    );
  };

  const removeCondition = (ruleId: string, condIdx: number) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        const newConditions = r.condition.conditions.filter((_, i) => i !== condIdx);
        return { ...r, condition: { ...r.condition, conditions: newConditions } };
      })
    );
  };

  // 保存
  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');

    try {
      // 削除処理
      for (const id of deletedIds) {
        await fetch('/api/record-permissions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
      }

      // 作成/更新処理
      for (const rule of rules) {
        const payload = {
          app_code: appCode,
          name: rule.name,
          description: rule.description,
          condition: rule.condition,
          target_type: rule.target_type,
          target_id: rule.target_id || null,
          target_field: rule.target_field || null,
          can_view: rule.can_view,
          can_edit: rule.can_edit,
          can_delete: rule.can_delete,
          priority: rule.priority,
        };

        if (rule.isNew) {
          await fetch('/api/record-permissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } else {
          await fetch('/api/record-permissions', {
            method: 'PATCH',
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
  const checkboxLabel = 'inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer';

  return (
    <div className="space-y-6">
      {/* ヘッダー + 保存 */}
      <div className={`${cardClass} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-brand-500" />
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
          <Shield className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.noRules}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t.noRulesHelp}</p>
        </div>
      ) : (
        rules.map((rule) => (
          <div key={rule.id} className={cardClass}>
            {/* ルールヘッダー */}
            <div
              className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80"
              onClick={() => toggleExpand(rule.id)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {rule.isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                <span className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {rule.name || `(${t.ruleName})`}
                </span>
                <div className="flex items-center gap-1.5">
                  {rule.can_view && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">{t.canView}</span>}
                  {rule.can_edit && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">{t.canEdit}</span>}
                  {rule.can_delete && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">{t.canDelete}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeRule(rule.id); }}
                className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* ルール詳細 */}
            {rule.isExpanded && (
              <div className="p-4 space-y-4">
                {/* ルール名 + 説明 */}
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
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.description}</label>
                    <input
                      type="text"
                      value={rule.description}
                      onChange={(e) => updateRule(rule.id, { description: e.target.value })}
                      className={inputClass}
                      placeholder={t.description}
                    />
                  </div>
                </div>

                {/* 対象設定 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.targetType}</label>
                    <select
                      value={rule.target_type}
                      onChange={(e) => updateRule(rule.id, { target_type: e.target.value as RuleItem['target_type'] })}
                      className={`${selectClass} w-full`}
                    >
                      <option value="creator">{t.targetCreator}</option>
                      <option value="user">{t.targetUser}</option>
                      <option value="organization">{t.targetOrg}</option>
                      <option value="role">{t.targetRole}</option>
                      <option value="field_value">{t.targetFieldValue}</option>
                    </select>
                  </div>
                  {(rule.target_type === 'user' || rule.target_type === 'organization' || rule.target_type === 'role') && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.targetId}</label>
                      <input
                        type="text"
                        value={rule.target_id}
                        onChange={(e) => updateRule(rule.id, { target_id: e.target.value })}
                        className={inputClass}
                        placeholder="UUID"
                      />
                    </div>
                  )}
                  {rule.target_type === 'field_value' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.targetField}</label>
                      <select
                        value={rule.target_field}
                        onChange={(e) => updateRule(rule.id, { target_field: e.target.value })}
                        className={`${selectClass} w-full`}
                      >
                        <option value="">{t.selectField}</option>
                        {fields.map((f) => (
                          <option key={f.code} value={f.code}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t.priority} <span className="text-[10px] text-gray-400">({t.priorityHelp})</span>
                    </label>
                    <input
                      type="number"
                      value={rule.priority}
                      onChange={(e) => updateRule(rule.id, { priority: parseInt(e.target.value) || 0 })}
                      className={inputClass}
                      min={0}
                    />
                  </div>
                </div>

                {/* 権限チェックボックス */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t.permissions}</label>
                  <div className="flex items-center gap-6">
                    <label className={checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={rule.can_view}
                        onChange={(e) => updateRule(rule.id, { can_view: e.target.checked })}
                        className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      {t.canView}
                    </label>
                    <label className={checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={rule.can_edit}
                        onChange={(e) => updateRule(rule.id, { can_edit: e.target.checked })}
                        className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      {t.canEdit}
                    </label>
                    <label className={checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={rule.can_delete}
                        onChange={(e) => updateRule(rule.id, { can_delete: e.target.checked })}
                        className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      {t.canDelete}
                    </label>
                  </div>
                </div>

                {/* 条件ビルダー */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{t.condition}</label>
                    <div className="flex items-center gap-2">
                      {rule.condition.conditions.length > 1 && (
                        <select
                          value={rule.condition.logic}
                          onChange={(e) => updateRule(rule.id, {
                            condition: { ...rule.condition, logic: e.target.value as 'AND' | 'OR' },
                          })}
                          className={`${selectClass} text-xs`}
                        >
                          <option value="AND">{t.conditionAnd}</option>
                          <option value="OR">{t.conditionOr}</option>
                        </select>
                      )}
                      <button
                        type="button"
                        onClick={() => addCondition(rule.id)}
                        className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600"
                      >
                        <Plus className="w-3 h-3" />{t.addCondition}
                      </button>
                    </div>
                  </div>

                  {rule.condition.conditions.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">{t.noConditions}</p>
                  ) : (
                    <div className="space-y-2">
                      {rule.condition.conditions.map((cond, condIdx) => (
                        <div key={condIdx} className="flex items-center gap-2">
                          {/* フィールド */}
                          <select
                            value={cond.field}
                            onChange={(e) => updateCondition(rule.id, condIdx, { field: e.target.value })}
                            className={`${selectClass} flex-1`}
                          >
                            <option value="">{t.selectField}</option>
                            {/* 共通フィールド */}
                            <option value="status">status</option>
                            <option value="created_by">created_by</option>
                            <option value="updated_by">updated_by</option>
                            {fields.map((f) => (
                              <option key={f.code} value={f.code}>{f.label}</option>
                            ))}
                          </select>

                          {/* 演算子 */}
                          <select
                            value={cond.operator}
                            onChange={(e) => updateCondition(rule.id, condIdx, { operator: e.target.value })}
                            className={`${selectClass} w-36`}
                          >
                            {OPERATORS.map((op) => (
                              <option key={op.value} value={op.value}>{t[op.key]}</option>
                            ))}
                          </select>

                          {/* 値 */}
                          {cond.operator === 'in' || cond.operator === 'not_in' ? (
                            <input
                              type="text"
                              value={cond.values?.join(',') || ''}
                              onChange={(e) => updateCondition(rule.id, condIdx, {
                                values: e.target.value.split(',').map((v) => v.trim()),
                              })}
                              className={`${inputClass} flex-1`}
                              placeholder={t.valuesHelp}
                            />
                          ) : (
                            <input
                              type="text"
                              value={cond.value}
                              onChange={(e) => updateCondition(rule.id, condIdx, { value: e.target.value })}
                              className={`${inputClass} flex-1`}
                              placeholder={t.value}
                            />
                          )}

                          <button
                            type="button"
                            onClick={() => removeCondition(rule.id, condIdx)}
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
        ))
      )}
    </div>
  );
}
