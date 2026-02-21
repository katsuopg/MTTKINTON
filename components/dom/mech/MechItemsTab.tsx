'use client';

import React, { useState, useCallback } from 'react';
import { Plus, Trash2, Save, X, FolderPlus, Pencil } from 'lucide-react';
import MechSectionGroup from './MechSectionGroup';
import type {
  DomHeaderWithRelations,
  DomSectionWithItems,
  DomMechItem,
  DomSection,
  DomMasters,
  DomItemCategory,
} from '@/types/dom';

type Language = 'ja' | 'en' | 'th';

interface MechItemsTabProps {
  dom: DomHeaderWithRelations;
  masters: DomMasters;
  language: Language;
  onRefresh: () => void | Promise<void>;
}

const UI_LABELS: Record<Language, Record<string, string>> = {
  ja: {
    edit: '編集',
    addSection: 'セクション追加',
    deleteSelected: '選択削除',
    save: '保存',
    cancel: 'キャンセル',
    saving: '保存中...',
    confirmDelete: '選択した項目を削除しますか？',
  },
  en: {
    edit: 'Edit',
    addSection: 'Add Section',
    deleteSelected: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    saving: 'Saving...',
    confirmDelete: 'Delete selected items?',
  },
  th: {
    edit: 'แก้ไข',
    addSection: 'เพิ่มส่วน',
    deleteSelected: 'ลบ',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    saving: 'กำลังบันทึก...',
    confirmDelete: 'ลบรายการที่เลือก?',
  },
};

export default function MechItemsTab({ dom, masters, language, onRefresh }: MechItemsTabProps) {
  const [editing, setEditing] = useState(false);
  const [editingItems, setEditingItems] = useState<Map<string, Record<string, unknown>>>(new Map());
  const [newItemsBySection, setNewItemsBySection] = useState<Map<string, Partial<DomMechItem>[]>>(new Map());
  const [sectionEdits, setSectionEdits] = useState<Map<string, Partial<DomSection>>>(new Map());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const sections = dom.sections || [];

  // 編集モード開始
  const handleStartEdit = () => {
    setEditing(true);
  };

  // セクション削除
  const handleDeleteSection = async (sectionId: string) => {
    try {
      const res = await fetch(`/api/dom/${dom.id}/sections?section_id=${sectionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete section');
      onRefresh();
    } catch (error) {
      console.error('Error deleting section:', error);
    }
  };

  // セクション追加
  const handleAddSection = async () => {
    try {
      const res = await fetch(`/api/dom/${dom.id}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Failed to create section');
      onRefresh();
    } catch (error) {
      console.error('Error creating section:', error);
    }
  };

  // 行追加
  const handleAddRow = (sectionId: string) => {
    const current = newItemsBySection.get(sectionId) || [];
    const sectionItems = sections.find((s) => s.id === sectionId)?.mech_items || [];
    // 製作品(make)の既存最大番号を取得
    const existingMakeNos = sectionItems
      .filter((i) => i.category !== 'buy')
      .map((i) => i.item_number || 0);
    const newMakeNos = current
      .filter((i) => i.category !== 'buy')
      .map((i) => i.item_number || 0);
    const nextMakeNo = Math.max(0, ...existingMakeNos, ...newMakeNos) + 1;

    const existingCount = sectionItems.length;

    const newItem: Partial<DomMechItem> = {
      dom_section_id: sectionId,
      category: 'make' as DomItemCategory,
      item_number: nextMakeNo,
      part_code: '',
      part_name: '',
      model_number: '',
      manufacturer: '',
      quantity: 1,
      unit: '個',
      unit_price: 0,
      status: 'designing',
      notes: '',
      sort_order: existingCount + current.length + 1,
    };

    const updated = new Map(newItemsBySection);
    updated.set(sectionId, [...current, newItem]);
    setNewItemsBySection(updated);
    setHasChanges(true);
  };

  // アイテム編集
  const handleItemChange = (id: string, field: string, value: string | number | null) => {
    const existing = editingItems.get(id) || {};
    const updated = new Map(editingItems);
    updated.set(id, { ...existing, [field]: value });
    setEditingItems(updated);
    setHasChanges(true);
  };

  // 新規アイテム編集
  const handleNewItemChange = (sectionId: string, index: number, field: string, value: string | number | null) => {
    const items = [...(newItemsBySection.get(sectionId) || [])];
    items[index] = { ...items[index], [field]: value };
    const updated = new Map(newItemsBySection);
    updated.set(sectionId, items);
    setNewItemsBySection(updated);
    setHasChanges(true);
  };

  // セクション名変更
  const handleSectionNameChange = (sectionId: string, name: string) => {
    const updated = new Map(sectionEdits);
    updated.set(sectionId, { section_name: name });
    setSectionEdits(updated);
    setHasChanges(true);
  };

  // 選択切り替え
  const handleToggleSelect = (id: string) => {
    const updated = new Set(selectedItems);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setSelectedItems(updated);
  };

  // 保存
  const handleSave = async () => {
    setSaving(true);
    try {
      // セクション名の更新
      for (const [sectionId, edits] of sectionEdits) {
        await fetch(`/api/dom/${dom.id}/sections`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: sectionId, ...edits }),
        });
      }

      // 新規アイテムの保存
      for (const [sectionId, items] of newItemsBySection) {
        if (items.length > 0) {
          await fetch(`/api/dom/${dom.id}/mech-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items),
          });
        }
      }

      // 編集済みアイテムの保存
      if (editingItems.size > 0) {
        const updates = Array.from(editingItems.entries()).map(([id, data]) => ({
          id,
          ...data,
        }));
        const patchRes = await fetch(`/api/dom/${dom.id}/mech-items`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (!patchRes.ok) {
          const errBody = await patchRes.text();
          console.error('PATCH failed:', patchRes.status, errBody);
          return;
        }
      }

      // 並び替え: 製作品(make)→購入品(buy)の順にsort_orderを振り直す
      for (const section of sections) {
        const merged = getMergedItems(section as DomSectionWithItems);
        const makeItems = merged.filter((i) => i.category !== 'buy').sort((a, b) => (a.item_number || 0) - (b.item_number || 0));
        const buyItems = merged.filter((i) => i.category === 'buy').sort((a, b) => (a.item_number || 0) - (b.item_number || 0));
        const sorted = [...makeItems, ...buyItems];
        const reorderUpdates = sorted
          .map((item, idx) => ({ id: item.id!, sort_order: idx + 1 }))
          .filter((u) => u.id);
        if (reorderUpdates.length > 0) {
          await fetch(`/api/dom/${dom.id}/mech-items`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reorderUpdates),
          });
        }
      }

      // 集計APIを呼んでdom_headers.total_costを更新
      await fetch(`/api/dom/${dom.id}/summary`);
      // サーバーから最新データ取得（DOMのstateが更新される）
      await onRefresh();
      // データ更新後にローカル編集状態をリセット
      setEditingItems(new Map());
      setNewItemsBySection(new Map());
      setSectionEdits(new Map());
      setSelectedItems(new Set());
      setHasChanges(false);
      setEditing(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  // 削除
  const handleDelete = async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(UI_LABELS[language].confirmDelete)) return;

    try {
      const ids = Array.from(selectedItems).join(',');
      await fetch(`/api/dom/${dom.id}/mech-items?ids=${ids}`, { method: 'DELETE' });
      setSelectedItems(new Set());
      onRefresh();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  // キャンセル
  const handleCancel = () => {
    setEditingItems(new Map());
    setNewItemsBySection(new Map());
    setSectionEdits(new Map());
    setSelectedItems(new Set());
    setHasChanges(false);
    setEditing(false);
    onRefresh();
  };

  // セクションごとのアイテムを取得（編集中の値をマージ）
  const getMergedItems = (section: DomSectionWithItems) => {
    const items = section.mech_items || [];
    return items.map((item: DomMechItem) => {
      const edits = editingItems.get(item.id);
      return edits ? { ...item, ...edits } : item;
    });
  };

  // セクション名を取得（編集中の値をマージ）
  const getMergedSection = (section: DomSection): DomSection => {
    const edits = sectionEdits.get(section.id);
    return edits ? { ...section, ...edits } as DomSection : section;
  };

  return (
    <div>
      {/* ツールバー */}
      <div className="flex flex-wrap gap-2 mb-4">
        {!editing ? (
          /* 閲覧モード：編集ボタンのみ */
          <button
            onClick={handleStartEdit}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-md"
          >
            <Pencil size={16} /> {UI_LABELS[language].edit}
          </button>
        ) : (
          /* 編集モード：操作ボタン */
          <>
            <button
              onClick={handleAddSection}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
            >
              <FolderPlus size={16} /> {UI_LABELS[language].addSection}
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

      {/* セクション一覧 */}
      {sections.map((section) => (
        <MechSectionGroup
          key={section.id}
          section={getMergedSection(section)}
          items={getMergedItems(section)}
          newItems={newItemsBySection.get(section.id) || []}
          masters={masters}
          language={language}
          editing={editing}
          selectedItems={selectedItems}
          onToggleSelect={handleToggleSelect}
          onItemChange={handleItemChange}
          onNewItemChange={(index, field, value) =>
            handleNewItemChange(section.id, index, field, value)
          }
          onAddRow={handleAddRow}
          onSectionNameChange={handleSectionNameChange}
          onDeleteSection={handleDeleteSection}
        />
      ))}

      {sections.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          {language === 'ja'
            ? 'セクションがありません。'
            : 'No sections.'}
          {editing && (language === 'ja'
            ? '「セクション追加」をクリックしてください。'
            : ' Click "Add Section" to create one.')}
        </div>
      )}
    </div>
  );
}
