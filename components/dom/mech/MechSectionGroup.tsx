'use client';

import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import MechItemRow from './MechItemRow';
import type { DomSection, DomMechItem, DomMasters, DomItemCategory } from '@/types/dom';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';

type Language = 'ja' | 'en' | 'th';

interface MechSectionGroupProps {
  section: DomSection;
  items: Partial<DomMechItem>[];
  newItems: Partial<DomMechItem>[];
  masters: DomMasters;
  language: Language;
  editing: boolean;
  domHeaderId: string;
  selectedItems: Set<string>;
  onToggleSelect: (id: string) => void;
  onItemChange: (id: string, field: string, value: string | number | null) => void;
  onNewItemChange: (index: number, field: string, value: string | number | null) => void;
  onAddRow: (sectionId: string, category?: DomItemCategory) => void;
  onSectionNameChange: (sectionId: string, name: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  onReorder?: (sectionId: string, category: DomItemCategory, fromIndex: number, toIndex: number) => void;
  onFileNotify?: (type: 'success' | 'error', message: string) => void;
}

// 製作品カラム定義                  ☐+⠿  No  品名   図番   Rev  図面  材質   熱処理  表面処理 数量  単位  単価   金額   LT   ステータス 備考
const MAKE_COLUMNS: Record<Language, string[]> = {
  ja: ['', 'No', '品名', '図番', 'Rev', '図面', '材質', '熱処理', '表面処理', '数量', '単位', '単価', '金額', 'LT', 'ステータス', '備考'],
  en: ['', 'No', 'Name', 'Dwg No.', 'Rev', 'File', 'Material', 'Heat Treat.', 'Surface', 'Qty', 'Unit', 'Price', 'Amount', 'LT', 'Status', 'Notes'],
  th: ['', 'No', 'ชื่อ', 'แบบ', 'Rev', 'ไฟล์', 'วัสดุ', 'ความร้อน', 'ผิว', 'จำนวน', 'หน่วย', 'ราคา', 'รวม', 'LT', 'สถานะ', 'หมายเหตุ'],
};
const MAKE_ALIGNS = ['', 'text-center', '', '', 'text-center', 'text-center', '', '', '', 'text-center', '', 'text-right', 'text-right', 'text-center', '', ''];
//                    ☐⠿  No  品名   図番  Rev 図面 材質  熱処理       表面処理    数量 単位  単価  金額  LT  ステータス 備考
const MAKE_WIDTHS = [30, 36, 120, 80, 36, 36, 88, 148, 116, 44, 36, 72, 76, 52, 96, 72];

// 購入品カラム定義                  ☐+⠿  No  品名   型式   メーカー  数量  単位  単価   金額   LT   ステータス 備考
const BUY_COLUMNS: Record<Language, string[]> = {
  ja: ['', 'No', '品名', '型式', 'メーカー', '数量', '単位', '単価', '金額', 'LT', 'ステータス', '備考'],
  en: ['', 'No', 'Name', 'Model', 'Maker', 'Qty', 'Unit', 'Price', 'Amount', 'LT', 'Status', 'Notes'],
  th: ['', 'No', 'ชื่อ', 'รุ่น', 'ผู้ผลิต', 'จำนวน', 'หน่วย', 'ราคา', 'รวม', 'LT', 'สถานะ', 'หมายเหตุ'],
};
const BUY_ALIGNS = ['', 'text-center', '', '', '', 'text-center', '', 'text-right', 'text-right', 'text-center', '', ''];
//                    ☐⠿  No  品名   型式   メーカー 数量 単位  単価  金額  LT  ステータス 備考
const BUY_WIDTHS = [30, 36, 160, 200, 148, 44, 36, 76, 76, 60, 96, 88];

const GROUP_LABELS: Record<Language, { make: string; buy: string; add: string; noData: string }> = {
  ja: { make: '製作品', buy: '購入品', add: '追加', noData: 'データなし' },
  en: { make: 'Fabricated', buy: 'Purchased', add: 'Add', noData: 'No data' },
  th: { make: 'ผลิต', buy: 'ซื้อ', add: 'เพิ่ม', noData: 'ไม่มีข้อมูล' },
};

export default function MechSectionGroup({
  section,
  items,
  newItems,
  masters,
  language,
  editing,
  domHeaderId,
  selectedItems,
  onToggleSelect,
  onItemChange,
  onNewItemChange,
  onAddRow,
  onSectionNameChange,
  onDeleteSection,
  onReorder,
  onFileNotify,
}: MechSectionGroupProps) {
  const { confirmDialog } = useConfirmDialog();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<DomItemCategory>('make');

  // DnD state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounterRef = useRef(0);

  // カテゴリ別に分離
  const makeItems = items.filter((i) => i.category !== 'buy');
  const buyItems = items.filter((i) => i.category === 'buy');
  const newMakeItems = newItems.filter((i) => i.category !== 'buy');
  const newBuyItems = newItems.filter((i) => i.category === 'buy');

  const calcSubtotal = (list: Partial<DomMechItem>[]) =>
    list.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);

  const sectionSubtotal = calcSubtotal(items);
  const makeSubtotal = calcSubtotal(makeItems);
  const buySubtotal = calcSubtotal(buyItems);
  const makeCount = makeItems.length + newMakeItems.length;
  const buyCount = buyItems.length + newBuyItems.length;

  // 現在のタブのデータ
  const currentItems = activeTab === 'make' ? makeItems : buyItems;
  const currentNewItems = activeTab === 'make' ? newMakeItems : newBuyItems;
  const columns = activeTab === 'make' ? MAKE_COLUMNS : BUY_COLUMNS;
  const aligns = activeTab === 'make' ? MAKE_ALIGNS : BUY_ALIGNS;
  const widths = activeTab === 'make' ? MAKE_WIDTHS : BUY_WIDTHS;
  const colCount = columns[language].length;

  // DnD handlers（既存アイテムのみ。新規行はDnD対象外）
  const handleDragStart = (index: number) => { setDragIndex(index); };
  const handleDragEnter = (index: number) => {
    dragCounterRef.current++;
    if (dragIndex !== null && index !== dragIndex) setDragOverIndex(index);
  };
  const handleDragLeave = () => {
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setDragOverIndex(null);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (dropIndex: number) => {
    if (dragIndex !== null && dragIndex !== dropIndex && onReorder) {
      onReorder(section.id, activeTab, dragIndex, dropIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragCounterRef.current = 0;
  };
  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
    dragCounterRef.current = 0;
  };

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
        {editing && onDeleteSection && (
          <button
            onClick={async (e) => {
              e.stopPropagation();
              const msg = language === 'ja'
                ? `セクション「${section.section_code}」を削除しますか？\nセクション内の部品もすべて削除されます。`
                : `Delete section "${section.section_code}"?\nAll items in this section will also be deleted.`;
              const confirmed = await confirmDialog({
                title: language === 'ja' ? 'セクション削除' : 'Delete Section',
                message: msg,
                variant: 'danger',
                confirmLabel: language === 'ja' ? '削除' : 'Delete',
                cancelLabel: language === 'ja' ? 'キャンセル' : 'Cancel',
              });
              if (confirmed) {
                onDeleteSection(section.id);
              }
            }}
            className="ml-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title={language === 'ja' ? 'セクション削除' : 'Delete Section'}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* コンテンツ */}
      {!collapsed && (
        <div className="p-3">
          {/* 製作品/購入品 タブ */}
          <div className="flex items-center gap-1 mb-2 border-b border-gray-200 dark:border-gray-700">
            {(['make', 'buy'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const isMake = tab === 'make';
              const label = GROUP_LABELS[language][tab];
              const count = isMake ? makeCount : buyCount;
              const subtotal = isMake ? makeSubtotal : buySubtotal;
              const activeColor = isMake
                ? 'text-blue-600 dark:text-blue-400 border-blue-500'
                : 'text-amber-600 dark:text-amber-400 border-amber-500';

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors -mb-px ${
                    isActive
                      ? activeColor
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {label}
                  <span className={`text-[10px] px-1 py-0.5 rounded-full ${
                    isActive
                      ? (isMake ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-amber-100 dark:bg-amber-900/30')
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    {count}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {subtotal.toLocaleString()}
                  </span>
                </button>
              );
            })}

            {/* 追加ボタン（編集モード時） */}
            {editing && (
              <button
                onClick={() => onAddRow(section.id, activeTab)}
                className="inline-flex items-center gap-0.5 ml-auto px-2 py-1 text-xs font-medium text-brand-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded"
              >
                <Plus size={12} />
                {GROUP_LABELS[language].add}
              </button>
            )}
          </div>

          {/* テーブル */}
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded">
            <table className="text-sm table-fixed" style={{ width: widths.reduce((a, b) => a + b, 0) }}>
              <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300">
                <tr>
                  {columns[language].map((header, i) => (
                    <th
                      key={i}
                      style={{ width: widths[i] }}
                      className={`px-1 py-1.5 font-medium text-xs whitespace-nowrap ${aligns[i] || 'text-left'}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, idx) => (
                  <MechItemRow
                    key={item.id || `${activeTab}-${idx}`}
                    item={item}
                    mode={activeTab}
                    displayNo={idx + 1}
                    domHeaderId={domHeaderId}
                    masters={masters}
                    language={language}
                    readOnly={!editing}
                    selected={selectedItems.has(item.id!)}
                    onToggleSelect={() => onToggleSelect(item.id!)}
                    onChange={(field, value) => onItemChange(item.id!, field, value)}
                    onFileNotify={onFileNotify}
                    draggable={editing}
                    onDragStart={() => handleDragStart(idx)}
                    onDragEnter={() => handleDragEnter(idx)}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(idx)}
                    onDragEnd={handleDragEnd}
                    isDragging={dragIndex === idx}
                    isDragOver={dragOverIndex === idx}
                  />
                ))}
                {currentNewItems.map((item, newIdx) => {
                  const globalIdx = newItems.indexOf(item);
                  return (
                    <MechItemRow
                      key={`new-${activeTab}-${globalIdx}`}
                      item={item}
                      mode={activeTab}
                      displayNo={currentItems.length + newIdx + 1}
                      domHeaderId={domHeaderId}
                      isNew
                      masters={masters}
                      language={language}
                      onChange={(field, value) => onNewItemChange(globalIdx, field, value)}
                    />
                  );
                })}
                {currentItems.length === 0 && currentNewItems.length === 0 && (
                  <tr>
                    <td colSpan={colCount} className="px-4 py-6 text-center text-gray-400 text-xs">
                      {GROUP_LABELS[language].noData}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
