'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Save, X, Pencil } from 'lucide-react';
import ElecItemRow from './ElecItemRow';
import type { DomHeaderWithRelations, DomElecItem, DomItemCategory } from '@/types/dom';

type Language = 'ja' | 'en' | 'th';

interface ElecItemsTabProps {
  dom: DomHeaderWithRelations;
  language: Language;
  onRefresh: () => void | Promise<void>;
}

const COLUMN_HEADERS: Record<Language, string[]> = {
  ja: ['', 'No', '区分', 'MARK', '品名', '型式', 'メーカー', '数量', '単位', '単価', '金額', 'LT(日)', 'ステータス', '備考'],
  en: ['', 'No', 'Cat', 'MARK', 'Name', 'Model', 'Maker', 'Qty', 'Unit', 'Price', 'Amount', 'LT(d)', 'Status', 'Notes'],
  th: ['', 'No', 'ประเภท', 'MARK', 'ชื่อ', 'รุ่น', 'ผู้ผลิต', 'จำนวน', 'หน่วย', 'ราคา', 'รวม', 'LT(วัน)', 'สถานะ', 'หมายเหตุ'],
};

// ヘッダー配置: No=center, 区分=center, 数量=center, 単価=right, 金額=right
const COLUMN_ALIGNS: string[] = [
  '', 'text-center', 'text-center', '', '', '', '', 'text-center', '', 'text-right', 'text-right', '', '', '',
];

const UI_LABELS: Record<Language, Record<string, string>> = {
  ja: { edit: '編集', addRow: '行追加', deleteSelected: '選択削除', save: '保存', cancel: 'キャンセル', saving: '保存中...', noData: 'データがありません。', noDataEdit: 'データがありません。「行追加」で追加してください。', confirmDelete: '選択した項目を削除しますか？' },
  en: { edit: 'Edit', addRow: 'Add Row', deleteSelected: 'Delete', save: 'Save', cancel: 'Cancel', saving: 'Saving...', noData: 'No data.', noDataEdit: 'No data. Click "Add Row" to create.', confirmDelete: 'Delete selected items?' },
  th: { edit: 'แก้ไข', addRow: 'เพิ่มแถว', deleteSelected: 'ลบ', save: 'บันทึก', cancel: 'ยกเลิก', saving: 'กำลังบันทึก...', noData: 'ไม่มีข้อมูล', noDataEdit: 'ไม่มีข้อมูล คลิก "เพิ่มแถว" เพื่อสร้าง', confirmDelete: 'ลบรายการที่เลือก?' },
};

export default function ElecItemsTab({ dom, language, onRefresh }: ElecItemsTabProps) {
  const [editing, setEditing] = useState(false);
  const [editingItems, setEditingItems] = useState<Map<string, Record<string, unknown>>>(new Map());
  const [newItems, setNewItems] = useState<Partial<DomElecItem>[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const items = dom.elec_items || [];

  const handleAddRow = () => {
    const newItem: Partial<DomElecItem> = {
      dom_header_id: dom.id,
      category: 'buy' as DomItemCategory,
      item_number: items.length + newItems.length + 1,
      mark: '',
      part_name: '',
      model_number: '',
      manufacturer: '',
      quantity: 1,
      unit: '個',
      unit_price: 0,
      status: 'designing',
      notes: '',
      sort_order: items.length + newItems.length + 1,
    };
    setNewItems([...newItems, newItem]);
    setHasChanges(true);
  };

  const handleItemChange = (id: string, field: string, value: string | number | null) => {
    const existing = editingItems.get(id) || {};
    const updated = new Map(editingItems);
    updated.set(id, { ...existing, [field]: value });
    setEditingItems(updated);
    setHasChanges(true);
  };

  const handleNewItemChange = (index: number, field: string, value: string | number | null) => {
    const updated = [...newItems];
    updated[index] = { ...updated[index], [field]: value };
    setNewItems(updated);
    setHasChanges(true);
  };

  const handleToggleSelect = (id: string) => {
    const updated = new Set(selectedItems);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setSelectedItems(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (newItems.length > 0) {
        await fetch(`/api/dom/${dom.id}/elec-items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItems),
        });
      }

      if (editingItems.size > 0) {
        const updates = Array.from(editingItems.entries()).map(([id, data]) => ({
          id,
          ...data,
        }));
        await fetch(`/api/dom/${dom.id}/elec-items`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
      }

      // 集計APIを呼んでdom_headers.total_costを更新
      await fetch(`/api/dom/${dom.id}/summary`);
      // サーバーから最新データ取得
      await onRefresh();
      // データ更新後にローカル編集状態をリセット
      setEditingItems(new Map());
      setNewItems([]);
      setSelectedItems(new Set());
      setHasChanges(false);
      setEditing(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(UI_LABELS[language].confirmDelete)) return;

    try {
      const ids = Array.from(selectedItems).join(',');
      await fetch(`/api/dom/${dom.id}/elec-items?ids=${ids}`, { method: 'DELETE' });
      setSelectedItems(new Set());
      onRefresh();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleCancel = () => {
    setEditingItems(new Map());
    setNewItems([]);
    setSelectedItems(new Set());
    setHasChanges(false);
    setEditing(false);
    onRefresh();
  };

  const getMergedItems = () => {
    return items.map((item) => {
      const edits = editingItems.get(item.id);
      return edits ? { ...item, ...edits } : item;
    });
  };

  const mergedItems = getMergedItems();

  return (
    <div>
      {/* ツールバー */}
      <div className="flex flex-wrap gap-2 mb-4">
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-md"
          >
            <Pencil size={16} /> {UI_LABELS[language].edit}
          </button>
        ) : (
          <>
            <button
              onClick={handleAddRow}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
            >
              <Plus size={16} /> {UI_LABELS[language].addRow}
            </button>

            {selectedItems.size > 0 && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md"
              >
                <Trash2 size={16} /> {UI_LABELS[language].deleteSelected} ({selectedItems.size})
              </button>
            )}

            <div className="flex-1" />

            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <X size={16} /> {UI_LABELS[language].cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-md disabled:opacity-50"
            >
              <Save size={16} /> {saving ? UI_LABELS[language].saving : UI_LABELS[language].save}
            </button>
          </>
        )}
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
            <tr>
              {COLUMN_HEADERS[language].map((header, i) => (
                <th key={i} className={`px-1 py-1.5 font-medium text-xs whitespace-nowrap ${COLUMN_ALIGNS[i] || 'text-left'}`}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mergedItems.map((item, idx) => (
              <ElecItemRow
                key={item.id}
                item={item}
                index={idx}
                language={language}
                readOnly={!editing}
                selected={selectedItems.has(item.id)}
                onToggleSelect={() => handleToggleSelect(item.id)}
                onChange={(field, value) => handleItemChange(item.id, field, value)}
              />
            ))}
            {newItems.map((item, idx) => (
              <ElecItemRow
                key={`new-${idx}`}
                item={item}
                index={mergedItems.length + idx}
                isNew
                language={language}
                onChange={(field, value) => handleNewItemChange(idx, field, value)}
              />
            ))}
            {mergedItems.length === 0 && newItems.length === 0 && (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-center text-gray-400 text-sm">
                  {editing ? UI_LABELS[language].noDataEdit : UI_LABELS[language].noData}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
