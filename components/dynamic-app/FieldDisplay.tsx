'use client';

import React from 'react';
import type { FieldDefinition, AppRecord } from '@/types/dynamic-app';
import { DECORATIVE_FIELD_TYPES } from '@/types/dynamic-app';
import SubtableDisplay from './SubtableDisplay';
import EntityDisplay from './EntityDisplay';

interface FieldDisplayProps {
  field: FieldDefinition;
  value: unknown;
  locale: string;
  record?: AppRecord;
}

export default function FieldDisplay({ field, value, locale, record }: FieldDisplayProps) {
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const localeStr = lang === 'ja' ? 'ja-JP' : lang === 'th' ? 'th-TH' : 'en-US';

  // 装飾フィールドは何も表示しない
  if (DECORATIVE_FIELD_TYPES.has(field.field_type)) {
    return null;
  }

  // 自動フィールドはrecordメタデータから値を取得
  if (record) {
    switch (field.field_type) {
      case 'record_number':
        return <p className="text-sm text-gray-800 dark:text-white/90">{record.record_number}</p>;
      case 'creator':
        return <p className="text-sm text-gray-800 dark:text-white/90">{record.created_by || '-'}</p>;
      case 'created_time':
        return (
          <p className="text-sm text-gray-800 dark:text-white/90">
            {record.created_at ? new Date(record.created_at).toLocaleString(localeStr) : '-'}
          </p>
        );
      case 'modifier':
        return <p className="text-sm text-gray-800 dark:text-white/90">{record.updated_by || '-'}</p>;
      case 'modified_time':
        return (
          <p className="text-sm text-gray-800 dark:text-white/90">
            {record.updated_at ? new Date(record.updated_at).toLocaleString(localeStr) : '-'}
          </p>
        );
    }
  }

  const formatValue = (): string | React.ReactNode => {
    if (value === undefined || value === null || value === '') return '-';

    switch (field.field_type) {
      case 'number': {
        const num = typeof value === 'string' ? Number(value) : (value as number);
        if (isNaN(num)) return String(value);
        return num.toLocaleString(localeStr);
      }

      case 'date': {
        const dateStr = String(value);
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return dateStr;
          return date.toLocaleDateString(localeStr);
        } catch {
          return dateStr;
        }
      }

      case 'time':
        return String(value);

      case 'datetime': {
        const dtStr = String(value);
        try {
          const dt = new Date(dtStr);
          if (isNaN(dt.getTime())) return dtStr;
          return dt.toLocaleString(localeStr);
        } catch {
          return dtStr;
        }
      }

      case 'link': {
        const linkVal = String(value);
        const linkType = field.validation?.link_type || 'url';
        if (linkType === 'tel') {
          return (
            <a href={`tel:${linkVal}`} className="text-brand-500 hover:underline" onClick={(e) => e.stopPropagation()}>
              {linkVal}
            </a>
          );
        }
        if (linkType === 'email') {
          return (
            <a href={`mailto:${linkVal}`} className="text-brand-500 hover:underline" onClick={(e) => e.stopPropagation()}>
              {linkVal}
            </a>
          );
        }
        return (
          <a href={linkVal} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline" onClick={(e) => e.stopPropagation()}>
            {linkVal}
          </a>
        );
      }

      case 'dropdown':
      case 'radio_button': {
        const option = field.options?.find((o) => o.value === String(value));
        return option ? (option.label[lang] || option.label.ja || option.value) : String(value);
      }

      case 'checkbox':
      case 'multi_select': {
        if (!Array.isArray(value)) return String(value);
        return (value as string[])
          .map((v) => {
            const option = field.options?.find((o) => o.value === v);
            return option ? (option.label[lang] || option.label.ja || option.value) : v;
          })
          .join(', ');
      }

      case 'record_number':
        return String(value);

      case 'creator':
      case 'modifier':
        return String(value);

      case 'created_time':
      case 'modified_time': {
        const ts = String(value);
        try {
          const d = new Date(ts);
          if (isNaN(d.getTime())) return ts;
          return d.toLocaleString(localeStr);
        } catch {
          return ts;
        }
      }

      case 'multi_line_text':
        return String(value);

      case 'rich_editor':
        // HTMLをそのまま返す（dangerouslySetInnerHTMLで描画）
        return String(value);

      case 'file_upload':
        // ファイルは別管理なので表示しない
        return '-';

      case 'lookup':
        return String(value);

      case 'calculated': {
        // 計算値はdata内に保存されている場合はそのまま表示
        const num = typeof value === 'number' ? value : Number(value);
        if (isNaN(num)) return String(value);
        const fmt = field.validation?.formula_format || 'number';
        const dec = field.validation?.formula_decimals ?? 2;
        if (fmt === 'percent') return `${(num * 100).toFixed(Math.max(0, dec - 2))}%`;
        return num.toLocaleString(localeStr, { minimumFractionDigits: dec, maximumFractionDigits: dec });
      }

      case 'related_records':
        // 関連レコードはフィールドデータとしては表示しない（詳細ページで別途表示）
        return '-';

      case 'subtable':
        // サブテーブルは専用コンポーネントで表示
        return null;

      case 'user_select':
      case 'org_select':
      case 'group_select':
        // エンティティ選択は専用コンポーネントで表示
        return null;

      default:
        return String(value);
    }
  };

  // エンティティ選択は専用コンポーネントで描画
  if (field.field_type === 'user_select' || field.field_type === 'org_select' || field.field_type === 'group_select') {
    return <EntityDisplay field={field} value={value} locale={locale} />;
  }

  // サブテーブルは専用コンポーネントで描画
  if (field.field_type === 'subtable') {
    return <SubtableDisplay field={field} value={value} locale={locale} />;
  }

  const displayValue = formatValue();

  // React要素の場合はそのまま返す（linkフィールドの<a>タグ等）
  if (React.isValidElement(displayValue)) {
    return <div className="text-sm text-gray-800 dark:text-white/90">{displayValue}</div>;
  }

  // リッチエディターはHTMLとして描画
  if (field.field_type === 'rich_editor' && displayValue !== '-') {
    return (
      <div
        className="text-sm text-gray-800 dark:text-white/90 prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: String(displayValue) }}
      />
    );
  }

  // 複数行テキストは改行を保持して表示
  if (field.field_type === 'multi_line_text' && displayValue !== '-') {
    return <p className="text-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">{displayValue}</p>;
  }

  return <p className="text-sm text-gray-800 dark:text-white/90">{displayValue}</p>;
}
