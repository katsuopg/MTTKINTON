'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Save, Loader2, Plus, X, ArrowRight, ToggleLeft, ToggleRight,
  CircleDot, Flag, GripVertical,
} from 'lucide-react';

interface StatusItem {
  id: string;
  name: string;
  is_initial: boolean;
  is_final: boolean;
  assignee_type: 'ONE' | 'ALL' | 'ANY' | null;
}

interface ActionItem {
  id: string;
  name: string;
  from_status_id: string;
  to_status_id: string;
  action_type: 'NORMAL' | 'NON_ASSIGNEE';
}

const labels = {
  ja: {
    title: 'プロセス管理',
    enabled: '有効',
    disabled: '無効',
    enableLabel: 'プロセス管理を有効にする',
    statuses: 'ステータス',
    actions: 'アクション',
    addStatus: 'ステータス追加',
    addAction: 'アクション追加',
    statusName: 'ステータス名',
    actionName: 'アクション名',
    from: '遷移元',
    to: '遷移先',
    initial: '初期',
    final: '最終',
    assigneeType: '作業者',
    assigneeOne: '選択(1人)',
    assigneeAll: '全員',
    assigneeAny: '誰か1人',
    assigneeNone: '設定なし',
    save: '保存',
    saving: '保存中...',
    saved: '保存しました',
    saveError: '保存に失敗しました',
    noStatuses: 'ステータスを追加してください',
    noActions: 'アクションを追加してください',
    selectStatus: '選択...',
    defaultStatuses: 'デフォルトステータスを設定',
    initialHelp: 'レコード作成時のステータス',
    finalHelp: 'プロセス終了（作業者指定不可）',
  },
  en: {
    title: 'Process Management',
    enabled: 'Enabled',
    disabled: 'Disabled',
    enableLabel: 'Enable process management',
    statuses: 'Statuses',
    actions: 'Actions',
    addStatus: 'Add Status',
    addAction: 'Add Action',
    statusName: 'Status Name',
    actionName: 'Action Name',
    from: 'From',
    to: 'To',
    initial: 'Initial',
    final: 'Final',
    assigneeType: 'Assignee',
    assigneeOne: 'Select (1)',
    assigneeAll: 'All',
    assigneeAny: 'Any one',
    assigneeNone: 'None',
    save: 'Save',
    saving: 'Saving...',
    saved: 'Saved',
    saveError: 'Failed to save',
    noStatuses: 'Add statuses to get started',
    noActions: 'Add actions to get started',
    selectStatus: 'Select...',
    defaultStatuses: 'Set default statuses',
    initialHelp: 'Status when record is created',
    finalHelp: 'Process ends (no assignee)',
  },
  th: {
    title: 'การจัดการกระบวนการ',
    enabled: 'เปิดใช้',
    disabled: 'ปิดใช้',
    enableLabel: 'เปิดใช้การจัดการกระบวนการ',
    statuses: 'สถานะ',
    actions: 'การดำเนินการ',
    addStatus: 'เพิ่มสถานะ',
    addAction: 'เพิ่มการดำเนินการ',
    statusName: 'ชื่อสถานะ',
    actionName: 'ชื่อการดำเนินการ',
    from: 'จาก',
    to: 'ไปยัง',
    initial: 'เริ่มต้น',
    final: 'สุดท้าย',
    assigneeType: 'ผู้ดำเนินการ',
    assigneeOne: 'เลือก (1)',
    assigneeAll: 'ทั้งหมด',
    assigneeAny: 'คนใดคนหนึ่ง',
    assigneeNone: 'ไม่ตั้ง',
    save: 'บันทึก',
    saving: 'กำลังบันทึก...',
    saved: 'บันทึกแล้ว',
    saveError: 'ไม่สามารถบันทึกได้',
    noStatuses: 'เพิ่มสถานะเพื่อเริ่มต้น',
    noActions: 'เพิ่มการดำเนินการเพื่อเริ่มต้น',
    selectStatus: 'เลือก...',
    defaultStatuses: 'ตั้งค่าสถานะเริ่มต้น',
    initialHelp: 'สถานะเมื่อสร้างระเบียน',
    finalHelp: 'กระบวนการสิ้นสุด (ไม่มีผู้ดำเนินการ)',
  },
};

interface ProcessManagementSettingsProps {
  locale: string;
  appCode: string;
}

export default function ProcessManagementSettings({ locale, appCode }: ProcessManagementSettingsProps) {
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const t = labels[lang];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/apps/${appCode}/process`);
        if (res.ok) {
          const data = await res.json();
          setEnabled(data.definition?.enabled ?? false);
          setStatuses(
            (data.statuses || []).map((s: any) => ({
              id: s.id,
              name: s.name,
              is_initial: s.is_initial,
              is_final: s.is_final,
              assignee_type: s.assignee_type,
            }))
          );
          setActions(
            (data.actions || []).map((a: any) => ({
              id: a.id,
              name: a.name,
              from_status_id: a.from_status_id,
              to_status_id: a.to_status_id,
              action_type: a.action_type || 'NORMAL',
            }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch process definition:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [appCode]);

  // デフォルトステータスセット
  const setDefaults = useCallback(() => {
    const defaultNames = lang === 'ja'
      ? ['未処理', '処理中', '完了']
      : lang === 'th'
      ? ['ยังไม่ดำเนินการ', 'กำลังดำเนินการ', 'เสร็จสิ้น']
      : ['Not Started', 'In Progress', 'Completed'];

    const newStatuses: StatusItem[] = defaultNames.map((name, i) => ({
      id: `temp_${Date.now()}_${i}`,
      name,
      is_initial: i === 0,
      is_final: i === defaultNames.length - 1,
      assignee_type: i === defaultNames.length - 1 ? null : 'ANY',
    }));
    setStatuses(newStatuses);

    // デフォルトアクション
    const defaultActionNames = lang === 'ja'
      ? ['処理開始', '完了する']
      : lang === 'th'
      ? ['เริ่มดำเนินการ', 'เสร็จสิ้น']
      : ['Start Processing', 'Complete'];

    setActions([
      {
        id: `temp_a_${Date.now()}_0`,
        name: defaultActionNames[0],
        from_status_id: newStatuses[0].id,
        to_status_id: newStatuses[1].id,
        action_type: 'NORMAL',
      },
      {
        id: `temp_a_${Date.now()}_1`,
        name: defaultActionNames[1],
        from_status_id: newStatuses[1].id,
        to_status_id: newStatuses[2].id,
        action_type: 'NORMAL',
      },
    ]);
    setIsDirty(true);
  }, [lang]);

  // ステータス追加
  const addStatus = () => {
    setStatuses((prev) => [
      ...prev,
      {
        id: `temp_${Date.now()}`,
        name: '',
        is_initial: prev.length === 0,
        is_final: false,
        assignee_type: 'ANY',
      },
    ]);
    setIsDirty(true);
  };

  // ステータス削除
  const removeStatus = (id: string) => {
    setStatuses((prev) => prev.filter((s) => s.id !== id));
    setActions((prev) => prev.filter((a) => a.from_status_id !== id && a.to_status_id !== id));
    setIsDirty(true);
  };

  // ステータス更新
  const updateStatus = (id: string, updates: Partial<StatusItem>) => {
    setStatuses((prev) =>
      prev.map((s) => {
        if (s.id !== id) {
          // is_initial は1つだけ
          if (updates.is_initial) return { ...s, is_initial: false };
          return s;
        }
        const updated = { ...s, ...updates };
        // 最終ステータスは作業者指定不可
        if (updated.is_final) updated.assignee_type = null;
        return updated;
      })
    );
    setIsDirty(true);
  };

  // アクション追加
  const addAction = () => {
    setActions((prev) => [
      ...prev,
      {
        id: `temp_a_${Date.now()}`,
        name: '',
        from_status_id: statuses[0]?.id || '',
        to_status_id: statuses.length > 1 ? statuses[1].id : statuses[0]?.id || '',
        action_type: 'NORMAL',
      },
    ]);
    setIsDirty(true);
  };

  // アクション削除
  const removeAction = (id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
    setIsDirty(true);
  };

  // アクション更新
  const updateAction = (id: string, updates: Partial<ActionItem>) => {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    setIsDirty(true);
  };

  // 保存
  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');

    try {
      const res = await fetch(`/api/apps/${appCode}/process`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, statuses, actions }),
      });

      if (!res.ok) {
        throw new Error(t.saveError);
      }

      const data = await res.json();
      setStatuses(
        (data.statuses || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          is_initial: s.is_initial,
          is_final: s.is_final,
          assignee_type: s.assignee_type,
        }))
      );
      setActions(
        (data.actions || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          from_status_id: a.from_status_id,
          to_status_id: a.to_status_id,
          action_type: a.action_type || 'NORMAL',
        }))
      );
      setIsDirty(false);
      setSaveMessage(t.saved);
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : t.saveError);
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
      {/* ヘッダー + 有効/無効トグル + 保存 */}
      <div className={`${cardClass} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => { setEnabled(!enabled); setIsDirty(true); }}
              className="flex items-center gap-2 text-sm"
            >
              {enabled ? (
                <ToggleRight className="w-8 h-8 text-brand-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-400" />
              )}
              <span className={enabled ? 'text-brand-600 dark:text-brand-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                {enabled ? t.enabled : t.disabled}
              </span>
            </button>
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
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
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

      {/* ステータス定義 */}
      <div className={cardClass}>
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{t.statuses}</h3>
          <div className="flex items-center gap-2">
            {statuses.length === 0 && (
              <button
                type="button"
                onClick={setDefaults}
                className="text-xs text-brand-500 hover:text-brand-600 px-2 py-1 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20"
              >
                {t.defaultStatuses}
              </button>
            )}
            <button
              type="button"
              onClick={addStatus}
              className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 px-2 py-1 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20"
            >
              <Plus className="w-3.5 h-3.5" />{t.addStatus}
            </button>
          </div>
        </div>
        <div className="p-4">
          {statuses.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">{t.noStatuses}</p>
          ) : (
            <div className="space-y-2">
              {/* ヘッダー行 */}
              <div className="grid grid-cols-12 gap-2 px-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                <div className="col-span-1"></div>
                <div className="col-span-4">{t.statusName}</div>
                <div className="col-span-1 text-center" title={t.initialHelp}>{t.initial}</div>
                <div className="col-span-1 text-center" title={t.finalHelp}>{t.final}</div>
                <div className="col-span-4">{t.assigneeType}</div>
                <div className="col-span-1"></div>
              </div>
              {statuses.map((status) => (
                <div key={status.id} className="grid grid-cols-12 gap-2 items-center group">
                  <div className="col-span-1 flex justify-center">
                    <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={status.name}
                      onChange={(e) => updateStatus(status.id, { name: e.target.value })}
                      placeholder={t.statusName}
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => updateStatus(status.id, { is_initial: true })}
                      className={`p-1 rounded ${status.is_initial ? 'text-green-500' : 'text-gray-300 dark:text-gray-600 hover:text-gray-400'}`}
                      title={t.initialHelp}
                    >
                      <CircleDot className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => updateStatus(status.id, { is_final: !status.is_final })}
                      className={`p-1 rounded ${status.is_final ? 'text-red-500' : 'text-gray-300 dark:text-gray-600 hover:text-gray-400'}`}
                      title={t.finalHelp}
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="col-span-4">
                    <select
                      value={status.assignee_type || ''}
                      onChange={(e) => updateStatus(status.id, { assignee_type: (e.target.value || null) as any })}
                      className={selectClass}
                      disabled={status.is_final}
                    >
                      <option value="">{t.assigneeNone}</option>
                      <option value="ONE">{t.assigneeOne}</option>
                      <option value="ALL">{t.assigneeAll}</option>
                      <option value="ANY">{t.assigneeAny}</option>
                    </select>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeStatus(status.id)}
                      className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 rounded transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* アクション定義 */}
      <div className={cardClass}>
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{t.actions}</h3>
          <button
            type="button"
            onClick={addAction}
            disabled={statuses.length < 2}
            className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 px-2 py-1 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />{t.addAction}
          </button>
        </div>
        <div className="p-4">
          {actions.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">{t.noActions}</p>
          ) : (
            <div className="space-y-2">
              {/* ヘッダー行 */}
              <div className="grid grid-cols-12 gap-2 px-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                <div className="col-span-4">{t.actionName}</div>
                <div className="col-span-3">{t.from}</div>
                <div className="col-span-1 text-center"></div>
                <div className="col-span-3">{t.to}</div>
                <div className="col-span-1"></div>
              </div>
              {actions.map((action) => (
                <div key={action.id} className="grid grid-cols-12 gap-2 items-center group">
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={action.name}
                      onChange={(e) => updateAction(action.id, { name: e.target.value })}
                      placeholder={t.actionName}
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-3">
                    <select
                      value={action.from_status_id}
                      onChange={(e) => updateAction(action.id, { from_status_id: e.target.value })}
                      className={`${selectClass} w-full`}
                    >
                      <option value="">{t.selectStatus}</option>
                      {statuses.map((s) => (
                        <option key={s.id} value={s.id}>{s.name || `(${t.statusName})`}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="col-span-3">
                    <select
                      value={action.to_status_id}
                      onChange={(e) => updateAction(action.id, { to_status_id: e.target.value })}
                      className={`${selectClass} w-full`}
                    >
                      <option value="">{t.selectStatus}</option>
                      {statuses.map((s) => (
                        <option key={s.id} value={s.id}>{s.name || `(${t.statusName})`}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeAction(action.id)}
                      className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 rounded transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* プレビュー */}
      {statuses.length > 0 && actions.length > 0 && (
        <div className={cardClass}>
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
              {lang === 'ja' ? 'フロープレビュー' : lang === 'th' ? 'ตัวอย่างโฟลว์' : 'Flow Preview'}
            </h3>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              {statuses.map((status, i) => {
                const outActions = actions.filter((a) => a.from_status_id === status.id);
                return (
                  <React.Fragment key={status.id}>
                    <div
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                        status.is_initial
                          ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : status.is_final
                          ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400'
                          : 'border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {status.name || '...'}
                    </div>
                    {outActions.length > 0 && i < statuses.length - 1 && (
                      <div className="flex flex-col items-center gap-0.5">
                        {outActions.map((a) => (
                          <div key={a.id} className="flex items-center gap-1">
                            <span className="text-[10px] text-gray-400">{a.name || '...'}</span>
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
