'use client';

import React from 'react';
import {
  Type, AlignLeft, Hash, Calendar, ChevronDown, CheckSquare,
  Circle, ListChecks, Clock, CalendarClock, Link,
  Paperclip, FileText,
  Search, GitBranch, Calculator, TableProperties,
  User, Building2, Shield,
  UserPlus, CalendarPlus, UserPen, CalendarCog,
  Tag, Square, Minus,
} from 'lucide-react';
import type { FieldType } from '@/types/dynamic-app';
import { FIELD_TYPE_INFO } from '@/types/dynamic-app';

const ICON_MAP: Record<string, React.ElementType> = {
  Type, AlignLeft, Hash, Calendar, ChevronDown, CheckSquare,
  Circle, ListChecks, Clock, CalendarClock, Link,
  Paperclip, FileText,
  Search, GitBranch, Calculator, TableProperties,
  User, Building2, Shield,
  UserPlus, CalendarPlus, UserPen, CalendarCog,
  Tag, Square, Minus,
};

interface FieldCategory {
  key: string;
  label: { ja: string; en: string; th: string };
  types: FieldType[];
}

const FIELD_CATEGORIES: FieldCategory[] = [
  {
    key: 'text',
    label: { ja: 'テキスト', en: 'Text', th: 'ข้อความ' },
    types: ['single_line_text', 'multi_line_text'],
  },
  {
    key: 'number',
    label: { ja: '数値', en: 'Number', th: 'ตัวเลข' },
    types: ['number'],
  },
  {
    key: 'selection',
    label: { ja: '選択', en: 'Selection', th: 'ตัวเลือก' },
    types: ['dropdown', 'checkbox', 'radio_button', 'multi_select'],
  },
  {
    key: 'datetime',
    label: { ja: '日時', en: 'Date & Time', th: 'วันที่และเวลา' },
    types: ['date', 'time', 'datetime'],
  },
  {
    key: 'link',
    label: { ja: 'リンク', en: 'Link', th: 'ลิงก์' },
    types: ['link'],
  },
  {
    key: 'media',
    label: { ja: 'メディア', en: 'Media', th: 'สื่อ' },
    types: ['file_upload', 'rich_editor'],
  },
  {
    key: 'reference',
    label: { ja: '参照', en: 'Reference', th: 'อ้างอิง' },
    types: ['lookup', 'related_records', 'calculated'],
  },
  {
    key: 'table',
    label: { ja: 'テーブル', en: 'Table', th: 'ตาราง' },
    types: ['subtable'],
  },
  {
    key: 'user',
    label: { ja: 'ユーザー/組織', en: 'User / Org', th: 'ผู้ใช้/องค์กร' },
    types: ['user_select', 'org_select', 'group_select'],
  },
  {
    key: 'auto',
    label: { ja: '自動入力', en: 'Auto', th: 'อัตโนมัติ' },
    types: ['record_number', 'creator', 'created_time', 'modifier', 'modified_time'],
  },
  {
    key: 'decoration',
    label: { ja: '装飾', en: 'Decoration', th: 'ตกแต่ง' },
    types: ['label', 'space', 'hr'],
  },
];

interface FieldPaletteProps {
  locale: string;
  onAddField: (fieldType: FieldType) => void;
}

export default function FieldPalette({ locale, onAddField }: FieldPaletteProps) {
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';

  const handleDragStart = (e: React.DragEvent, fieldType: FieldType) => {
    e.dataTransfer.setData('fieldType', fieldType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-56 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 overflow-y-auto">
      <div className="p-3">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          {lang === 'ja' ? 'フィールド' : lang === 'th' ? 'ฟิลด์' : 'Fields'}
        </h3>
        <div className="space-y-4">
          {FIELD_CATEGORIES.map((category) => (
            <div key={category.key}>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 px-1">
                {category.label[lang]}
              </p>
              <div className="space-y-1">
                {category.types.map((type) => {
                  const info = FIELD_TYPE_INFO[type];
                  const Icon = ICON_MAP[info.icon] || Type;
                  return (
                    <button
                      key={type}
                      type="button"
                      draggable
                      onDragStart={(e) => handleDragStart(e, type)}
                      onClick={() => onAddField(type)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all cursor-grab active:cursor-grabbing"
                    >
                      <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <span className="truncate">{info.label[lang]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
