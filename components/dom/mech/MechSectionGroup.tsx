'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import MechItemRow from './MechItemRow';
import type { DomSection, DomMechItem, DomMasters } from '@/types/dom';

type Language = 'ja' | 'en' | 'th';

interface MechSectionGroupProps {
  section: DomSection;
  items: Partial<DomMechItem>[];
  newItems: Partial<DomMechItem>[];
  masters: DomMasters;
  language: Language;
  editing: boolean;
  selectedItems: Set<string>;
  onToggleSelect: (id: string) => void;
  onItemChange: (id: string, field: string, value: string | number | null) => void;
  onNewItemChange: (index: number, field: string, value: string | number | null) => void;
  onAddRow: (sectionId: string) => void;
  onSectionNameChange: (sectionId: string, name: string) => void;
  onDeleteSection?: (sectionId: string) => void;
}

const COLUMN_HEADERS: Record<Language, string[]> = {
  ja: ['', 'No', '区分', '品名', '図番/型式', '履歴', 'メーカー', '材質', '熱処理', '表面処理', '数量', '単位', '単価', '金額', 'LT', 'ステータス', '備考'],
  en: ['', 'No', 'Cat', 'Name', 'Dwg/Model', 'Rev', 'Maker', 'Material', 'Heat Treat.', 'Surface', 'Qty', 'Unit', 'Price', 'Amount', 'LT', 'Status', 'Notes'],
  th: ['', 'No', 'ประเภท', 'ชื่อ', 'แบบ/รุ่น', 'Rev', 'ผู้ผลิต', 'วัสดุ', 'ความร้อน', 'ผิว', 'จำนวน', 'หน่วย', 'ราคา', 'รวม', 'LT', 'สถานะ', 'หมายเหตุ'],
};

// ヘッダー配置: No=center, 区分=center, 履歴=center, 数量=center, 単価=right, 金額=right, LT=center
const COLUMN_ALIGNS: string[] = [
  '', 'text-center', 'text-center', '', '', 'text-center', '', '', '', '', 'text-center', '', 'text-right', 'text-right', 'text-center', '', '',
];

// table-fixed用カラム幅(px): checkbox,No,区分,品名,図番/型式,履歴,メーカー,材質,熱処理,表面処理,数量,単位,単価,金額,LT,ステータス,備考
const COLUMN_WIDTHS = [28, 40, 38, 92, 146, 34, 66, 56, 56, 100, 38, 34, 60, 60, 44, 104, 56];

export default function MechSectionGroup({
  section,
  items,
  newItems,
  masters,
  language,
  editing,
  selectedItems,
  onToggleSelect,
  onItemChange,
  onNewItemChange,
  onAddRow,
  onSectionNameChange,
  onDeleteSection,
}: MechSectionGroupProps) {
  const [collapsed, setCollapsed] = useState(false);

  const sectionSubtotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0
  );

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg mb-4 overflow-hidden">
      {/* セクションヘッダー */}
      <div
        className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
          {section.section_code}
        </span>
        {editing ? (
          <input
            type="text"
            value={section.section_name || ''}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onSectionNameChange(section.id, e.target.value)}
            placeholder={language === 'ja' ? 'セクション名' : 'Section Name'}
            className="flex-1 px-2 py-0.5 text-sm border-0 bg-transparent focus:ring-1 focus:ring-brand-500 dark:text-white"
          />
        ) : (
          <span className="flex-1 text-sm text-gray-600 dark:text-gray-400">
            {section.section_name || ''}
          </span>
        )}
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({items.length}{language === 'ja' ? '件' : ''})
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {sectionSubtotal.toLocaleString()}
        </span>
        {editing && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddRow(section.id);
              }}
              className="ml-2 p-1 text-brand-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded"
              title={language === 'ja' ? '行追加' : 'Add Row'}
            >
              <Plus size={16} />
            </button>
            {onDeleteSection && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const msg = language === 'ja'
                    ? `セクション「${section.section_code}」を削除しますか？\nセクション内の部品もすべて削除されます。`
                    : `Delete section "${section.section_code}"?\nAll items in this section will also be deleted.`;
                  if (confirm(msg)) {
                    onDeleteSection(section.id);
                  }
                }}
                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                title={language === 'ja' ? 'セクション削除' : 'Delete Section'}
              >
                <Trash2 size={16} />
              </button>
            )}
          </>
        )}
      </div>

      {/* テーブル */}
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="text-sm table-fixed" style={{ width: COLUMN_WIDTHS.reduce((a, b) => a + b, 0) }}>
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300">
              <tr>
                {COLUMN_HEADERS[language].map((header, i) => (
                  <th key={i} style={{ width: COLUMN_WIDTHS[i] }} className={`px-1 py-1.5 font-medium text-xs whitespace-nowrap ${COLUMN_ALIGNS[i] || 'text-left'}`}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <MechItemRow
                  key={item.id || `item-${idx}`}
                  item={item}
                  masters={masters}
                  language={language}
                  readOnly={!editing}
                  selected={selectedItems.has(item.id!)}
                  onToggleSelect={() => onToggleSelect(item.id!)}
                  onChange={(field, value) => onItemChange(item.id!, field, value)}
                />
              ))}
              {newItems.map((item, idx) => (
                <MechItemRow
                  key={`new-${idx}`}
                  item={item}
                  isNew
                  masters={masters}
                  language={language}
                  onChange={(field, value) => onNewItemChange(idx, field, value)}
                />
              ))}
              {items.length === 0 && newItems.length === 0 && (
                <tr>
                  <td colSpan={17} className="px-4 py-4 text-center text-gray-400 text-sm">
                    {language === 'ja' ? 'データがありません。' : 'No data.'}
                    {editing && (language === 'ja' ? '「+」で行を追加してください。' : ' Click "+" to add a row.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
