'use client';

import React from 'react';
import type { FieldDefinition, SubtableFieldDef, SubtableRow } from '@/types/dynamic-app';

interface SubtableDisplayProps {
  field: FieldDefinition;
  value: unknown;
  locale: string;
}

export default function SubtableDisplay({ field, value, locale }: SubtableDisplayProps) {
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const localeStr = lang === 'ja' ? 'ja-JP' : lang === 'th' ? 'th-TH' : 'en-US';
  const subtableFields = field.validation?.subtable_fields || [];
  const rows: SubtableRow[] = Array.isArray(value) ? value : [];

  if (subtableFields.length === 0 || rows.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500">
        {rows.length === 0
          ? (lang === 'ja' ? 'データなし' : lang === 'th' ? 'ไม่มีข้อมูล' : 'No data')
          : '-'
        }
      </p>
    );
  }

  const formatCellValue = (sf: SubtableFieldDef, val: unknown): string => {
    if (val === null || val === undefined || val === '') return '-';

    switch (sf.field_type) {
      case 'number': {
        const num = typeof val === 'number' ? val : Number(val);
        return isNaN(num) ? String(val) : num.toLocaleString(localeStr);
      }
      case 'date': {
        try {
          const d = new Date(String(val));
          return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString(localeStr);
        } catch { return String(val); }
      }
      case 'datetime': {
        try {
          const d = new Date(String(val));
          return isNaN(d.getTime()) ? String(val) : d.toLocaleString(localeStr);
        } catch { return String(val); }
      }
      case 'dropdown':
      case 'radio_button': {
        const opt = sf.options?.find(o => o.value === String(val));
        return opt ? (opt.label[lang] || opt.label.ja || opt.value) : String(val);
      }
      case 'checkbox':
      case 'multi_select': {
        if (!Array.isArray(val)) return String(val);
        return (val as string[]).map(v => {
          const opt = sf.options?.find(o => o.value === v);
          return opt ? (opt.label[lang] || opt.label.ja || opt.value) : v;
        }).join(', ');
      }
      default:
        return String(val);
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50">
            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-8">#</th>
            {subtableFields.map(sf => (
              <th key={sf.field_code} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {sf.label[lang] || sf.label.ja || sf.field_code}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row, idx) => (
            <tr key={row.subtable_row_id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
              <td className="px-2 py-2 text-xs text-gray-400">{idx + 1}</td>
              {subtableFields.map(sf => (
                <td key={sf.field_code} className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                  {formatCellValue(sf, row[sf.field_code])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800/30 text-xs text-gray-400 border-t border-gray-200 dark:border-gray-700">
        {rows.length} {lang === 'ja' ? '行' : lang === 'th' ? 'แถว' : 'rows'}
      </div>
    </div>
  );
}
