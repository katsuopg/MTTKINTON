'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import type { FieldDefinition, FieldType } from '@/types/dynamic-app';
import { AUTO_FIELD_TYPES, DECORATIVE_FIELD_TYPES, FIELD_TYPE_INFO } from '@/types/dynamic-app';
import FieldPalette from './FieldPalette';
import FormCanvas from './FormCanvas';
import FieldSettings from './FieldSettings';

const labels = {
  ja: {
    save: '保存',
    saving: '保存中...',
    saved: '保存しました',
    back: '戻る',
    unsaved: '未保存の変更があります',
    saveError: '保存に失敗しました',
  },
  en: {
    save: 'Save',
    saving: 'Saving...',
    saved: 'Saved',
    back: 'Back',
    unsaved: 'Unsaved changes',
    saveError: 'Failed to save',
  },
  th: {
    save: 'บันทึก',
    saving: 'กำลังบันทึก...',
    saved: 'บันทึกแล้ว',
    back: 'กลับ',
    unsaved: 'มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก',
    saveError: 'ไม่สามารถบันทึกได้',
  },
};

interface FormBuilderContentProps {
  locale: string;
  appCode: string;
  appName: string;
}

export default function FormBuilderContent({ locale, appCode, appName }: FormBuilderContentProps) {
  const router = useRouter();
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const t = labels[lang];

  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // フィールド一覧を取得
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const res = await fetch(`/api/apps/${appCode}/fields`);
        if (res.ok) {
          const data = await res.json();
          setFields(data.fields || []);
        }
      } catch (err) {
        console.error('Failed to fetch fields:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFields();
  }, [appCode]);

  // 新規フィールド追加
  const handleAddField = useCallback((fieldType: FieldType, insertIndex?: number) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const nextOrder = fields.length;

    // 自動フィールドはfield_codeを固定
    const isAuto = AUTO_FIELD_TYPES.has(fieldType);
    const isDecorative = DECORATIVE_FIELD_TYPES.has(fieldType);
    const fieldCode = isAuto ? fieldType : `field_${nextOrder + 1}`;

    // 選択肢系フィールドは初期optionsを付与
    const hasOptions = ['dropdown', 'checkbox', 'radio_button', 'multi_select'].includes(fieldType);
    const options = hasOptions
      ? [{ label: { ja: '選択肢1', en: 'Option 1', th: 'ตัวเลือก 1' }, value: 'option_1' }]
      : null;

    // 自動・装飾フィールドはデフォルトラベルを設定
    const typeInfo = FIELD_TYPE_INFO[fieldType];
    const defaultLabel = (isAuto || isDecorative)
      ? { ja: typeInfo.label.ja, en: typeInfo.label.en, th: typeInfo.label.th }
      : { ja: '', en: '', th: '' };

    // フィールドタイプ別デフォルトバリデーション
    let validation = null;
    if (fieldType === 'link') {
      validation = { link_type: 'url' as const };
    } else if (fieldType === 'file_upload') {
      validation = { max_file_size: 10, max_files: 5 };
    } else if (fieldType === 'lookup') {
      validation = { lookup_app_code: '', lookup_key_field: '', lookup_copy_fields: [] };
    } else if (fieldType === 'related_records') {
      validation = { related_app_code: '', related_key_field: '', related_this_field: '', related_display_fields: [] };
    } else if (fieldType === 'calculated') {
      validation = { formula: '', formula_format: 'number' as const, formula_decimals: 2 };
    } else if (fieldType === 'subtable') {
      validation = { subtable_fields: [], subtable_config: { allow_add: true, allow_delete: true } };
    } else if (fieldType === 'user_select' || fieldType === 'org_select' || fieldType === 'group_select') {
      validation = { allow_multiple: false };
    }

    const newField: FieldDefinition = {
      id: tempId,
      app_id: '',
      field_code: fieldCode,
      field_type: fieldType,
      label: defaultLabel,
      description: { ja: '', en: '', th: '' },
      required: false,
      unique_field: false,
      default_value: null,
      options,
      validation,
      display_order: insertIndex ?? nextOrder,
      row_index: insertIndex ?? nextOrder,
      col_index: 0,
      col_span: 2,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    // 自動フィールドの重複チェック（各自動フィールドは1アプリに1つのみ）
    if (isAuto) {
      const exists = fields.some((f) => f.field_type === fieldType);
      if (exists) return;
    }

    setFields((prev) => {
      const newFields = [...prev];
      const idx = insertIndex ?? newFields.length;
      newFields.splice(idx, 0, newField);
      return newFields.map((f, i) => ({ ...f, display_order: i, row_index: i }));
    });
    setSelectedFieldId(tempId);
    setIsDirty(true);
  }, [fields]);

  // フィールド更新
  const handleUpdateField = useCallback((fieldId: string, updates: Partial<FieldDefinition>) => {
    setFields((prev) => prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)));
    setIsDirty(true);
  }, []);

  // フィールド削除
  const handleRemoveField = useCallback((fieldId: string) => {
    setFields((prev) => {
      const filtered = prev.filter((f) => f.id !== fieldId);
      return filtered.map((f, i) => ({ ...f, display_order: i, row_index: i }));
    });
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
    setIsDirty(true);
  }, [selectedFieldId]);

  // フィールド並び替え
  const handleReorderFields = useCallback((reordered: FieldDefinition[]) => {
    setFields(reordered);
    setIsDirty(true);
  }, []);

  // 保存
  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');

    try {
      const fieldsPayload = fields.map((f) => ({
        id: f.id.startsWith('temp_') ? undefined : f.id,
        field_code: f.field_code,
        field_type: f.field_type,
        label: f.label,
        description: f.description,
        required: f.required,
        unique_field: f.unique_field,
        default_value: f.default_value,
        options: f.options,
        validation: f.validation,
        display_order: f.display_order,
        row_index: f.row_index,
        col_index: f.col_index,
        col_span: f.col_span,
      }));

      const res = await fetch(`/api/apps/${appCode}/fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: fieldsPayload }),
      });

      if (!res.ok) {
        throw new Error(t.saveError);
      }

      const data = await res.json();
      setFields(data.fields || []);
      setIsDirty(false);
      setSaveMessage(t.saved);
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : t.saveError);
    } finally {
      setSaving(false);
    }
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* ツールバー */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/apps/${appCode}`)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-medium text-gray-800 dark:text-white">{appName}</h2>
          {isDirty && (
            <span className="text-xs text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
              {t.unsaved}
            </span>
          )}
          {saveMessage && !isDirty && (
            <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
              {saveMessage}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t.saving}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {t.save}
            </>
          )}
        </button>
      </div>

      {/* 3カラムレイアウト */}
      <div className="flex flex-1 overflow-hidden">
        <FieldPalette
          locale={locale}
          onAddField={(type) => handleAddField(type)}
        />
        <FormCanvas
          locale={locale}
          fields={fields}
          selectedFieldId={selectedFieldId}
          onSelectField={setSelectedFieldId}
          onReorderFields={handleReorderFields}
          onRemoveField={handleRemoveField}
          onDropNewField={(type, index) => handleAddField(type, index)}
        />
        <FieldSettings
          locale={locale}
          field={selectedField}
          allFields={fields}
          currentAppCode={appCode}
          onUpdateField={handleUpdateField}
          onClose={() => setSelectedFieldId(null)}
        />
      </div>
    </div>
  );
}
