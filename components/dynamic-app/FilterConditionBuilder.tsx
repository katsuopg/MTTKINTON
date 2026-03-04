'use client';

import React from 'react';
import { Plus, X } from 'lucide-react';
import type { FieldDefinition, FilterCondition, FilterMatchType, FilterOperator } from '@/types/dynamic-app';
import { FIELD_OPERATORS, NO_VALUE_OPERATORS } from '@/types/dynamic-app';

interface FilterConditionBuilderProps {
  fields: FieldDefinition[];
  conditions: FilterCondition[];
  matchType: FilterMatchType;
  onConditionsChange: (conditions: FilterCondition[]) => void;
  onMatchTypeChange: (matchType: FilterMatchType) => void;
  locale: string;
  compact?: boolean;
}

type Lang = 'ja' | 'en' | 'th';

const OPERATOR_LABELS: Record<FilterOperator, Record<Lang, string>> = {
  eq: { ja: '等しい', en: 'equals', th: 'เท่ากับ' },
  ne: { ja: '等しくない', en: 'not equals', th: 'ไม่เท่ากับ' },
  gt: { ja: 'より大きい', en: 'greater than', th: 'มากกว่า' },
  gte: { ja: '以上', en: 'greater or equal', th: 'มากกว่าหรือเท่ากับ' },
  lt: { ja: 'より小さい', en: 'less than', th: 'น้อยกว่า' },
  lte: { ja: '以下', en: 'less or equal', th: 'น้อยกว่าหรือเท่ากับ' },
  contains: { ja: 'を含む', en: 'contains', th: 'มีคำว่า' },
  not_contains: { ja: 'を含まない', en: 'does not contain', th: 'ไม่มีคำว่า' },
  starts_with: { ja: 'で始まる', en: 'starts with', th: 'เริ่มต้นด้วย' },
  ends_with: { ja: 'で終わる', en: 'ends with', th: 'ลงท้ายด้วย' },
  is_empty: { ja: '空である', en: 'is empty', th: 'ว่างเปล่า' },
  is_not_empty: { ja: '空でない', en: 'is not empty', th: 'ไม่ว่างเปล่า' },
  in: { ja: 'いずれかに一致', en: 'is any of', th: 'เป็นหนึ่งใน' },
};

const t = (locale: string, ja: string, th: string, en: string) =>
  locale === 'ja' ? ja : locale === 'th' ? th : en;

export default function FilterConditionBuilder({
  fields,
  conditions,
  matchType,
  onConditionsChange,
  onMatchTypeChange,
  locale,
  compact = false,
}: FilterConditionBuilderProps) {
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Lang;

  // フィルター対象に使えるフィールド（装飾系除外）
  const filterableFields = fields.filter(
    (f) => FIELD_OPERATORS[f.field_type] && FIELD_OPERATORS[f.field_type].length > 0
  );

  const addCondition = () => {
    onConditionsChange([
      ...conditions,
      { field_code: '', operator: 'eq', value: '' },
    ]);
  };

  const removeCondition = (index: number) => {
    onConditionsChange(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
    onConditionsChange(
      conditions.map((c, i) => (i === index ? { ...c, ...updates } : c))
    );
  };

  const getFieldLabel = (fieldCode: string): string => {
    const f = fields.find((fd) => fd.field_code === fieldCode);
    if (!f) return fieldCode;
    return f.label[lang] || f.label.ja || f.field_code;
  };

  const getOperatorsForField = (fieldCode: string): FilterOperator[] => {
    const f = fields.find((fd) => fd.field_code === fieldCode);
    if (!f) return ['eq', 'ne', 'contains', 'is_empty', 'is_not_empty'];
    return FIELD_OPERATORS[f.field_type] || ['eq', 'ne'];
  };

  const getFieldByCode = (fieldCode: string): FieldDefinition | undefined => {
    return fields.find((f) => f.field_code === fieldCode);
  };

  const renderValueInput = (condition: FilterCondition, index: number) => {
    if (NO_VALUE_OPERATORS.has(condition.operator)) {
      return null;
    }

    const field = getFieldByCode(condition.field_code);
    const inputClass = `rounded-md border border-gray-300 px-2 ${compact ? 'py-1 text-xs' : 'py-1.5 text-sm'} dark:border-gray-600 dark:bg-gray-800 dark:text-white`;

    // in演算子で選択肢がある場合はチェックボックスリスト
    if (condition.operator === 'in' && field?.options && field.options.length > 0) {
      const selected = Array.isArray(condition.value) ? condition.value : [];
      return (
        <div className="flex flex-wrap gap-1">
          {field.options.map((opt) => {
            const optLabel = opt.label[lang] || opt.label.ja || opt.value;
            const isChecked = selected.includes(opt.value);
            return (
              <label key={opt.value} className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs ${isChecked ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-300 dark:border-gray-600'}`}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    const newVal = isChecked
                      ? selected.filter((v) => v !== opt.value)
                      : [...selected, opt.value];
                    updateCondition(index, { value: newVal });
                  }}
                  className="h-3 w-3 rounded border-gray-300"
                />
                {optLabel}
              </label>
            );
          })}
        </div>
      );
    }

    // dropdown/radio/checkboxの等値比較はドロップダウン
    if (field?.options && field.options.length > 0 && ['eq', 'ne'].includes(condition.operator)) {
      return (
        <select
          value={String(condition.value || '')}
          onChange={(e) => updateCondition(index, { value: e.target.value })}
          className={`${inputClass} min-w-[120px]`}
        >
          <option value="">{t(locale, '選択...', 'เลือก...', 'Select...')}</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label[lang] || opt.label.ja || opt.value}
            </option>
          ))}
        </select>
      );
    }

    // 数値フィールド
    if (field && field.field_type === 'number') {
      return (
        <input
          type="number"
          value={condition.value !== undefined ? String(condition.value) : ''}
          onChange={(e) => updateCondition(index, { value: e.target.value ? Number(e.target.value) : '' })}
          placeholder={t(locale, '値を入力', 'ป้อนค่า', 'Enter value')}
          className={`${inputClass} w-28`}
        />
      );
    }

    // 日付フィールド
    if (field && ['date', 'created_time', 'modified_time', 'datetime'].includes(field.field_type)) {
      return (
        <input
          type={field.field_type === 'datetime' ? 'datetime-local' : 'date'}
          value={String(condition.value || '')}
          onChange={(e) => updateCondition(index, { value: e.target.value })}
          className={`${inputClass} w-40`}
        />
      );
    }

    // 時刻フィールド
    if (field && field.field_type === 'time') {
      return (
        <input
          type="time"
          value={String(condition.value || '')}
          onChange={(e) => updateCondition(index, { value: e.target.value })}
          className={`${inputClass} w-28`}
        />
      );
    }

    // デフォルト: テキスト入力
    return (
      <input
        type="text"
        value={String(condition.value || '')}
        onChange={(e) => updateCondition(index, { value: e.target.value })}
        placeholder={t(locale, '値を入力', 'ป้อนค่า', 'Enter value')}
        className={`${inputClass} min-w-[120px]`}
      />
    );
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {/* AND/OR トグル */}
      {conditions.length > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onMatchTypeChange('and')}
            className={`rounded-md px-2 py-1 text-xs font-medium ${
              matchType === 'and'
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            AND
          </button>
          <button
            type="button"
            onClick={() => onMatchTypeChange('or')}
            className={`rounded-md px-2 py-1 text-xs font-medium ${
              matchType === 'or'
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            OR
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {matchType === 'and'
              ? t(locale, 'すべての条件に一致', 'ตรงทุกเงื่อนไข', 'Match all conditions')
              : t(locale, 'いずれかの条件に一致', 'ตรงเงื่อนไขใดก็ได้', 'Match any condition')}
          </span>
        </div>
      )}

      {/* 条件行リスト */}
      {conditions.map((condition, index) => {
        const operators = getOperatorsForField(condition.field_code);
        return (
          <div key={index} className={`flex items-start gap-2 ${compact ? 'flex-wrap' : ''}`}>
            {/* フィールド選択 */}
            <select
              value={condition.field_code}
              onChange={(e) => {
                const newFieldCode = e.target.value;
                const newOps = getOperatorsForField(newFieldCode);
                const newOp = newOps.includes(condition.operator) ? condition.operator : newOps[0] || 'eq';
                updateCondition(index, { field_code: newFieldCode, operator: newOp, value: '' });
              }}
              className={`rounded-md border border-gray-300 px-2 ${compact ? 'py-1 text-xs' : 'py-1.5 text-sm'} dark:border-gray-600 dark:bg-gray-800 dark:text-white ${compact ? 'min-w-[100px]' : 'min-w-[140px]'}`}
            >
              <option value="">{t(locale, 'フィールド', 'ฟิลด์', 'Field')}</option>
              {filterableFields.map((f) => (
                <option key={f.field_code} value={f.field_code}>
                  {getFieldLabel(f.field_code)}
                </option>
              ))}
            </select>

            {/* 演算子選択 */}
            <select
              value={condition.operator}
              onChange={(e) => {
                const newOp = e.target.value as FilterOperator;
                const updates: Partial<FilterCondition> = { operator: newOp };
                if (NO_VALUE_OPERATORS.has(newOp)) {
                  updates.value = undefined;
                } else if (newOp === 'in') {
                  updates.value = [];
                }
                updateCondition(index, updates);
              }}
              className={`rounded-md border border-gray-300 px-2 ${compact ? 'py-1 text-xs' : 'py-1.5 text-sm'} dark:border-gray-600 dark:bg-gray-800 dark:text-white ${compact ? 'min-w-[90px]' : 'min-w-[120px]'}`}
            >
              {operators.map((op) => (
                <option key={op} value={op}>
                  {OPERATOR_LABELS[op]?.[lang] || op}
                </option>
              ))}
            </select>

            {/* 値入力 */}
            {renderValueInput(condition, index)}

            {/* 削除ボタン */}
            <button
              type="button"
              onClick={() => removeCondition(index)}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
              title={t(locale, '条件を削除', 'ลบเงื่อนไข', 'Remove condition')}
            >
              <X className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            </button>
          </div>
        );
      })}

      {/* 条件追加ボタン */}
      <button
        type="button"
        onClick={addCondition}
        className={`flex items-center gap-1 text-brand-600 hover:text-brand-700 dark:text-brand-400 ${compact ? 'text-xs' : 'text-sm'}`}
      >
        <Plus className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        {t(locale, '条件を追加', 'เพิ่มเงื่อนไข', 'Add Condition')}
      </button>
    </div>
  );
}
