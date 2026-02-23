'use client';

import React from 'react';
import type { MasterMaterial, MasterHeatTreatment, MasterSurfaceTreatment } from '@/types/dom';

type MasterItem = MasterMaterial | MasterHeatTreatment | MasterSurfaceTreatment;
type Language = 'ja' | 'en' | 'th';

interface MasterSelectProps {
  items: MasterItem[];
  value: string | null;
  onChange: (value: string | null) => void;
  language?: Language;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  readOnly?: boolean;
}

function getDisplayName(item: MasterItem, language: Language): string {
  // en/th → 英語名を優先（タイ語でも英語表記）
  if (language !== 'ja') {
    if ('name_ja' in item) {
      // MasterMaterial
      return (item as MasterMaterial).name_en || (item as MasterMaterial).name_ja;
    }
    // MasterHeatTreatment / MasterSurfaceTreatment
    return (item as MasterHeatTreatment).name_en || (item as MasterHeatTreatment).name;
  }

  // ja → 日本語名
  if ('name_ja' in item) return (item as MasterMaterial).name_ja;
  return (item as MasterHeatTreatment).name;
}

export default function MasterSelect({
  items,
  value,
  onChange,
  language = 'ja',
  placeholder = '-',
  disabled = false,
  className = '',
  readOnly = false,
}: MasterSelectProps) {
  if (readOnly) {
    const selected = items.find((item) => item.id === value);
    const displayText = selected ? getDisplayName(selected, language) : '';
    return (
      <span className={`block py-1 text-sm text-gray-800 dark:text-gray-200 ${className}`}>
        {displayText || <span className="text-gray-300 dark:text-gray-600">-</span>}
      </span>
    );
  }

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
      className={`w-full px-1 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 dark:text-white disabled:opacity-50 ${className}`}
    >
      <option value="">{placeholder}</option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {getDisplayName(item, language)}
        </option>
      ))}
    </select>
  );
}
