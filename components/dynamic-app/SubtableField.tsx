'use client';

import React, { useState, useCallback } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { FieldDefinition, SubtableFieldDef, SubtableRow } from '@/types/dynamic-app';

interface SubtableFieldProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  locale: string;
}

export default function SubtableField({ field, value, onChange, locale }: SubtableFieldProps) {
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const subtableFields = field.validation?.subtable_fields || [];
  const config = field.validation?.subtable_config;
  const rows: SubtableRow[] = Array.isArray(value) ? value : [];

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const addLabel = lang === 'ja' ? '行を追加' : lang === 'th' ? 'เพิ่มแถว' : 'Add Row';

  const handleAddRow = useCallback(() => {
    if (config?.max_rows && rows.length >= config.max_rows) return;
    const newRow: SubtableRow = {
      subtable_row_id: `row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
    for (const sf of subtableFields) {
      if (sf.field_type === 'checkbox' || sf.field_type === 'multi_select') {
        newRow[sf.field_code] = [];
      } else {
        newRow[sf.field_code] = null;
      }
    }
    onChange([...rows, newRow]);
  }, [rows, subtableFields, config, onChange]);

  const handleDeleteRow = useCallback((rowId: string) => {
    onChange(rows.filter(r => r.subtable_row_id !== rowId));
  }, [rows, onChange]);

  const handleCellChange = useCallback((rowId: string, fieldCode: string, val: unknown) => {
    onChange(rows.map(r => r.subtable_row_id === rowId ? { ...r, [fieldCode]: val } : r));
  }, [rows, onChange]);

  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const newRows = [...rows];
    const [moved] = newRows.splice(draggedIdx, 1);
    newRows.splice(targetIdx, 0, moved);
    onChange(newRows);
    setDraggedIdx(null);
  };

  if (subtableFields.length === 0) {
    return (
      <p className="text-xs text-gray-400 dark:text-gray-500 py-2">
        {lang === 'ja' ? 'テーブルフィールドが未設定です' : lang === 'th' ? 'ยังไม่ได้ตั้งค่าฟิลด์ตาราง' : 'No table fields configured'}
      </p>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50">
              <th className="w-8 px-1 py-2" />
              <th className="w-8 px-1 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">#</th>
              {subtableFields.map(sf => (
                <th key={sf.field_code} className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {sf.label[lang] || sf.label.ja || sf.field_code}
                  {sf.required && <span className="text-red-500 ml-0.5">*</span>}
                </th>
              ))}
              {config?.allow_delete !== false && <th className="w-8 px-1 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row, idx) => (
              <tr
                key={row.subtable_row_id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 ${draggedIdx === idx ? 'opacity-40' : ''}`}
              >
                <td className="px-1 py-1.5 text-center">
                  <GripVertical className="w-3 h-3 text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing mx-auto" />
                </td>
                <td className="px-1 py-1.5 text-center text-xs text-gray-400">{idx + 1}</td>
                {subtableFields.map(sf => (
                  <td key={sf.field_code} className="px-2 py-1.5">
                    <SubtableCellInput
                      subField={sf}
                      value={row[sf.field_code]}
                      onChange={(val) => handleCellChange(row.subtable_row_id, sf.field_code, val)}
                      locale={locale}
                    />
                  </td>
                ))}
                {config?.allow_delete !== false && (
                  <td className="px-1 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row.subtable_row_id)}
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {config?.allow_add !== false && (
        <button
          type="button"
          onClick={handleAddRow}
          disabled={!!(config?.max_rows && rows.length >= config.max_rows)}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-brand-600 bg-brand-50 hover:bg-brand-100 dark:text-brand-400 dark:bg-brand-900/20 dark:hover:bg-brand-900/30 disabled:opacity-50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {addLabel}
        </button>
      )}
    </div>
  );
}

// 個々のセル入力コンポーネント
function SubtableCellInput({
  subField,
  value,
  onChange,
  locale,
}: {
  subField: SubtableFieldDef;
  value: unknown;
  onChange: (val: unknown) => void;
  locale: string;
}) {
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const inputClass = 'w-full px-2 py-1 text-xs border border-gray-200 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500';

  switch (subField.field_type) {
    case 'single_line_text':
    case 'link':
      return (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case 'multi_line_text':
      return (
        <textarea
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} min-h-[32px] resize-y`}
          rows={1}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={value !== null && value !== undefined ? String(value) : ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          className={inputClass}
        />
      );

    case 'date':
      return (
        <input
          type="date"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case 'time':
      return (
        <input
          type="time"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case 'datetime':
      return (
        <input
          type="datetime-local"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case 'dropdown':
    case 'radio_button':
      return (
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          <option value="">-</option>
          {(subField.options || []).map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label[lang] || opt.label.ja || opt.value}
            </option>
          ))}
        </select>
      );

    case 'checkbox':
    case 'multi_select': {
      const selected = Array.isArray(value) ? value as string[] : [];
      return (
        <div className="flex flex-wrap gap-1">
          {(subField.options || []).map(opt => (
            <label key={opt.value} className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={(e) => {
                  if (e.target.checked) onChange([...selected, opt.value]);
                  else onChange(selected.filter(v => v !== opt.value));
                }}
                className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 w-3 h-3"
              />
              {opt.label[lang] || opt.label.ja || opt.value}
            </label>
          ))}
        </div>
      );
    }

    default:
      return (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );
  }
}
