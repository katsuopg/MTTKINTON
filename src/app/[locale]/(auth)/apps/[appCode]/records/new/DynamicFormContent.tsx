'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { detailStyles } from '@/components/ui/DetailStyles';
import { DetailPageHeader } from '@/components/ui/DetailPageHeader';
import { Save, Loader2 } from 'lucide-react';
import type { FieldDefinition, AppRecord, ValidationError } from '@/types/dynamic-app';
import { NON_INPUT_FIELD_TYPES, AUTO_FIELD_TYPES, DECORATIVE_FIELD_TYPES } from '@/types/dynamic-app';
import DynamicField from '@/components/dynamic-app/DynamicField';

interface DynamicFormContentProps {
  locale: string;
  appCode: string;
  appName: string;
  fields: FieldDefinition[];
  record?: AppRecord;
  prefillData?: Record<string, unknown>;
}

export default function DynamicFormContent({
  locale,
  appCode,
  appName,
  fields,
  record,
  prefillData,
}: DynamicFormContentProps) {
  const router = useRouter();
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const isEdit = !!record;

  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    if (record?.data) return { ...record.data };
    // デフォルト値を設定（入力フィールドのみ）
    const defaults: Record<string, unknown> = {};
    for (const field of fields) {
      if (NON_INPUT_FIELD_TYPES.has(field.field_type)) continue;
      if (field.default_value !== null && field.default_value !== undefined) {
        defaults[field.field_code] = field.default_value;
      } else if (field.field_type === 'checkbox' || field.field_type === 'multi_select') {
        defaults[field.field_code] = [];
      } else if (field.field_type === 'subtable') {
        defaults[field.field_code] = [];
      } else if (
        (field.field_type === 'user_select' || field.field_type === 'org_select' || field.field_type === 'group_select')
        && field.validation?.allow_multiple
      ) {
        defaults[field.field_code] = [];
      }
    }
    // プリフィルデータがあればデフォルト値を上書き
    if (prefillData) {
      for (const [key, val] of Object.entries(prefillData)) {
        defaults[key] = val;
      }
    }
    return defaults;
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const saveLabel = isEdit
    ? (lang === 'ja' ? '更新' : lang === 'th' ? 'อัปเดต' : 'Update')
    : (lang === 'ja' ? '保存' : lang === 'th' ? 'บันทึก' : 'Save');
  const savingLabel = lang === 'ja' ? '保存中...' : lang === 'th' ? 'กำลังบันทึก...' : 'Saving...';
  const formTitle = isEdit
    ? (lang === 'ja' ? 'レコード編集' : lang === 'th' ? 'แก้ไขระเบียน' : 'Edit Record')
    : (lang === 'ja' ? '新規レコード' : lang === 'th' ? 'ระเบียนใหม่' : 'New Record');

  const headerTitle = isEdit
    ? `${appName} - #${record.record_number} ${lang === 'ja' ? '編集' : lang === 'th' ? 'แก้ไข' : 'Edit'}`
    : `${appName} - ${lang === 'ja' ? '新規作成' : lang === 'th' ? 'สร้างใหม่' : 'New'}`;

  const handleFieldChange = (fieldCode: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldCode]: value }));
    if (errors[fieldCode]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldCode];
        return next;
      });
    }
  };

  // ルックアップのコピーフィールド一括更新
  const handleBulkChange = (updates: Record<string, unknown>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors({});

    try {
      // NON_INPUT_FIELD_TYPES + file_uploadのデータを送信データから除外
      const submitData: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(formData)) {
        const field = fields.find((f) => f.field_code === key);
        if (field && NON_INPUT_FIELD_TYPES.has(field.field_type)) continue;
        if (field?.field_type === 'file_upload') continue; // ファイルは別テーブルで管理
        submitData[key] = val;
      }

      // calculatedフィールドの計算値を含める
      for (const field of fields) {
        if (field.field_type !== 'calculated' || !field.validation?.formula) continue;
        try {
          let expr = field.validation.formula;
          const numberFields = fields.filter(f => f.field_type === 'number');
          for (const nf of numberFields) {
            const v = Number(formData[nf.field_code] ?? 0) || 0;
            expr = expr.replace(new RegExp(`\\b${nf.field_code}\\b`, 'g'), String(v));
          }
          const sanitized = expr.replace(/[^0-9+\-*/().%\s]/g, '');
          if (sanitized.trim()) {
            // eslint-disable-next-line no-eval
            const result = eval(sanitized);
            if (typeof result === 'number' && !isNaN(result)) {
              const dec = field.validation.formula_decimals ?? 2;
              submitData[field.field_code] = Math.round(result * Math.pow(10, dec)) / Math.pow(10, dec);
            }
          }
        } catch { /* skip calc errors */ }
      }

      const url = isEdit
        ? `/api/apps/${appCode}/records/${record.id}`
        : `/api/apps/${appCode}/records`;
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: submitData }),
      });

      if (!res.ok) {
        const resData = await res.json();
        if (resData.details) {
          const fieldErrors: Record<string, string> = {};
          for (const err of resData.details as ValidationError[]) {
            fieldErrors[err.field_code] = err.message;
          }
          setErrors(fieldErrors);
          return;
        }
        throw new Error(resData.error || 'Save failed');
      }

      const data = await res.json();
      if (isEdit) {
        router.push(`/${locale}/apps/${appCode}/records/${record.id}`);
      } else {
        router.push(`/${locale}/apps/${appCode}/records/${data.record.id}`);
      }
      router.refresh();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // 表示対象フィールド（新規作成時は自動フィールドを除外、related_recordsは常に除外）
  const visibleFields = fields.filter((f) => {
    if (!isEdit && AUTO_FIELD_TYPES.has(f.field_type)) return false;
    if (f.field_type === 'related_records') return false; // 関連レコードはフォームに表示しない
    return true;
  });

  // フィールドのグリッド配置
  const fieldRows: FieldDefinition[][] = [];
  let currentRow: FieldDefinition[] = [];
  let currentRowWidth = 0;

  for (const field of visibleFields) {
    // 装飾フィールドは常に全幅扱い
    const isDecorative = DECORATIVE_FIELD_TYPES.has(field.field_type);
    const span = (isDecorative || field.field_type === 'subtable') ? 2 : (field.col_span || 2);

    if (currentRowWidth + span > 2 && currentRow.length > 0) {
      fieldRows.push(currentRow);
      currentRow = [];
      currentRowWidth = 0;
    }
    currentRow.push(field);
    currentRowWidth += span;
    if (currentRowWidth >= 2) {
      fieldRows.push(currentRow);
      currentRow = [];
      currentRowWidth = 0;
    }
  }
  if (currentRow.length > 0) fieldRows.push(currentRow);

  return (
    <div className={detailStyles.pageWrapper}>
      <DetailPageHeader
        title={headerTitle}
        backHref={isEdit ? `/${locale}/apps/${appCode}/records/${record.id}` : `/${locale}/apps/${appCode}`}
        actions={
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`${detailStyles.primaryButton} ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                {savingLabel}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" />
                {saveLabel}
              </>
            )}
          </button>
        }
      />

      <div className={detailStyles.card}>
        <div className={detailStyles.cardHeaderWithBg}>
          <h3 className={detailStyles.cardTitle}>{formTitle}</h3>
        </div>
        <div className={detailStyles.cardContent}>
          <div className="space-y-5 max-w-3xl">
            {fieldRows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className={row.length > 1 || row[0]?.col_span === 1 ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}
              >
                {row.map((field) => (
                  <DynamicField
                    key={field.id}
                    field={field}
                    value={formData[field.field_code]}
                    onChange={(value) => handleFieldChange(field.field_code, value)}
                    locale={locale}
                    error={errors[field.field_code]}
                    record={record}
                    isNew={!isEdit}
                    allFields={fields}
                    formData={formData}
                    onBulkChange={handleBulkChange}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
