'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Save, X, Pencil } from 'lucide-react';
import EditableCell from '../shared/EditableCell';
import StatusBadge from '../shared/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import type {
  DomHeaderWithRelations,
  DomLabor,
  DomDiscipline,
  DomWorkType,
  DOM_DISCIPLINE_LABELS,
  DOM_WORK_TYPE_LABELS,
} from '@/types/dom';

type Language = 'ja' | 'en' | 'th';

interface LaborTabProps {
  dom: DomHeaderWithRelations;
  language: Language;
  onRefresh: () => void | Promise<void>;
}

const DISCIPLINE_OPTIONS: { value: DomDiscipline; labels: Record<Language, string> }[] = [
  { value: 'mech', labels: { ja: 'メカ', en: 'Mechanical', th: 'เครื่องกล' } },
  { value: 'elec', labels: { ja: '電気', en: 'Electrical', th: 'ไฟฟ้า' } },
];

const WORK_TYPE_OPTIONS: { value: DomWorkType; labels: Record<Language, string> }[] = [
  { value: 'design', labels: { ja: '設計', en: 'Design', th: 'ออกแบบ' } },
  { value: 'construction', labels: { ja: '施工', en: 'Construction', th: 'ก่อสร้าง' } },
  { value: 'other', labels: { ja: 'その他', en: 'Other', th: 'อื่นๆ' } },
];

const COLUMN_HEADERS: Record<Language, string[]> = {
  ja: ['', 'No', '区分', '作業種別', '作業内容', '工数(h)', '単価', '金額', '担当者', '備考'],
  en: ['', 'No', 'Discipline', 'Work Type', 'Description', 'Hours', 'Rate', 'Amount', 'Assigned', 'Notes'],
  th: ['', 'No', 'แผนก', 'ประเภทงาน', 'รายละเอียด', 'ชั่วโมง', 'อัตรา', 'รวม', 'ผู้รับผิดชอบ', 'หมายเหตุ'],
};

const UI_LABELS: Record<Language, Record<string, string>> = {
  ja: { edit: '編集', addRow: '行追加', deleteSelected: '選択削除', save: '保存', cancel: 'キャンセル', saving: '保存中...', noData: 'データがありません。', noDataEdit: 'データがありません。「行追加」で追加してください。', confirmDelete: '選択した項目を削除しますか？', mechSection: 'メカ工数', elecSection: '電気工数' },
  en: { edit: 'Edit', addRow: 'Add Row', deleteSelected: 'Delete', save: 'Save', cancel: 'Cancel', saving: 'Saving...', noData: 'No data.', noDataEdit: 'No data. Click "Add Row" to create.', confirmDelete: 'Delete selected items?', mechSection: 'Mechanical Labor', elecSection: 'Electrical Labor' },
  th: { edit: 'แก้ไข', addRow: 'เพิ่มแถว', deleteSelected: 'ลบ', save: 'บันทึก', cancel: 'ยกเลิก', saving: 'กำลังบันทึก...', noData: 'ไม่มีข้อมูล', noDataEdit: 'ไม่มีข้อมูล', confirmDelete: 'ลบรายการที่เลือก?', mechSection: 'ชั่วโมงเครื่องกล', elecSection: 'ชั่วโมงไฟฟ้า' },
};

export default function LaborTab({ dom, language, onRefresh }: LaborTabProps) {
  const { toast } = useToast();
  const { confirmDialog } = useConfirmDialog();
  const [editing, setEditing] = useState(false);
  const [editingItems, setEditingItems] = useState<Map<string, Record<string, unknown>>>(new Map());
  const [newItems, setNewItems] = useState<Partial<DomLabor>[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const laborItems = dom.labor || [];
  const mechItems = laborItems.filter((l) => l.discipline === 'mech');
  const elecItems = laborItems.filter((l) => l.discipline === 'elec');

  const handleAddRow = (discipline: DomDiscipline) => {
    const newItem: Partial<DomLabor> = {
      dom_header_id: dom.id,
      discipline,
      work_type: 'design' as DomWorkType,
      description: '',
      hours: 0,
      hourly_rate: 0,
      notes: '',
      sort_order: laborItems.length + newItems.length + 1,
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
        await fetch(`/api/dom/${dom.id}/labor`, {
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
        await fetch(`/api/dom/${dom.id}/labor`, {
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
      toast({ type: 'success', title: UI_LABELS[language].save + ' OK' });
    } catch (error) {
      console.error('Error saving:', error);
      toast({ type: 'error', title: language === 'ja' ? '保存に失敗しました' : language === 'th' ? 'บันทึกไม่สำเร็จ' : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedItems.size === 0) return;
    const confirmed = await confirmDialog({
      title: language === 'ja' ? '削除確認' : language === 'th' ? 'ยืนยันการลบ' : 'Confirm Delete',
      message: UI_LABELS[language].confirmDelete,
      variant: 'danger',
      confirmLabel: language === 'ja' ? '削除' : language === 'th' ? 'ลบ' : 'Delete',
      cancelLabel: language === 'ja' ? 'キャンセル' : language === 'th' ? 'ยกเลิก' : 'Cancel',
    });
    if (!confirmed) return;

    try {
      const ids = Array.from(selectedItems).join(',');
      await fetch(`/api/dom/${dom.id}/labor?ids=${ids}`, { method: 'DELETE' });
      setSelectedItems(new Set());
      onRefresh();
      toast({ type: 'success', title: language === 'ja' ? '削除しました' : language === 'th' ? 'ลบสำเร็จ' : 'Deleted' });
    } catch (error) {
      console.error('Error deleting:', error);
      toast({ type: 'error', title: language === 'ja' ? '削除に失敗しました' : language === 'th' ? 'ลบไม่สำเร็จ' : 'Failed to delete' });
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

  const renderLaborRow = (item: DomLabor | Partial<DomLabor>, index: number, isNew = false, newIndex = 0) => {
    const edits = !isNew && 'id' in item ? editingItems.get(item.id as string) : null;
    const merged = edits ? { ...item, ...edits } : item;
    const amount = (Number(merged.hours) || 0) * (Number(merged.hourly_rate) || 0);
    const itemId = !isNew ? (item as DomLabor).id : undefined;

    const disciplineLabel = DISCIPLINE_OPTIONS.find((o) => o.value === (merged as DomLabor).discipline)?.labels[language] || '';
    const workTypeLabel = WORK_TYPE_OPTIONS.find((o) => o.value === (merged as DomLabor).work_type)?.labels[language] || '';

    return (
      <tr
        key={isNew ? `new-${newIndex}` : itemId}
        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
      >
        <td className="px-2 py-1 w-10">
          {editing && !isNew && itemId && (
            <input
              type="checkbox"
              checked={selectedItems.has(itemId)}
              onChange={() => handleToggleSelect(itemId)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
          )}
        </td>
        <td className="px-1 py-1 w-12 text-center text-sm text-gray-500">{index + 1}</td>
        <td className="px-1 py-1 w-24">
          {!editing ? (
            <span className="block px-1 py-1 text-sm text-gray-800 dark:text-gray-200">{disciplineLabel}</span>
          ) : (
            <select
              value={(merged as DomLabor).discipline || 'mech'}
              onChange={(e) =>
                isNew
                  ? handleNewItemChange(newIndex, 'discipline', e.target.value)
                  : handleItemChange(itemId!, 'discipline', e.target.value)
              }
              className="w-full px-1 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 dark:text-white"
            >
              {DISCIPLINE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.labels[language]}</option>
              ))}
            </select>
          )}
        </td>
        <td className="px-1 py-1 w-24">
          {!editing ? (
            <span className="block px-1 py-1 text-sm text-gray-800 dark:text-gray-200">{workTypeLabel}</span>
          ) : (
            <select
              value={(merged as DomLabor).work_type || 'design'}
              onChange={(e) =>
                isNew
                  ? handleNewItemChange(newIndex, 'work_type', e.target.value)
                  : handleItemChange(itemId!, 'work_type', e.target.value)
              }
              className="w-full px-1 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 dark:text-white"
            >
              {WORK_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.labels[language]}</option>
              ))}
            </select>
          )}
        </td>
        <td className="px-1 py-1">
          <EditableCell
            value={merged.description ?? null}
            onChange={(v) =>
              isNew
                ? handleNewItemChange(newIndex, 'description', v)
                : handleItemChange(itemId!, 'description', v)
            }
            placeholder={language === 'ja' ? '作業内容' : 'Description'}
            readOnly={!editing}
          />
        </td>
        <td className="px-1 py-1 w-20">
          <EditableCell
            value={merged.hours ?? 0}
            onChange={(v) =>
              isNew
                ? handleNewItemChange(newIndex, 'hours', v)
                : handleItemChange(itemId!, 'hours', v)
            }
            type="number"
            readOnly={!editing}
          />
        </td>
        <td className="px-1 py-1 w-24">
          <EditableCell
            value={merged.hourly_rate ?? 0}
            onChange={(v) =>
              isNew
                ? handleNewItemChange(newIndex, 'hourly_rate', v)
                : handleItemChange(itemId!, 'hourly_rate', v)
            }
            type="number"
            readOnly={!editing}
          />
        </td>
        <td className="px-1 py-1 w-24 text-right text-sm text-gray-700 dark:text-gray-300">
          {amount.toLocaleString()}
        </td>
        <td className="px-1 py-1 w-24">
          <EditableCell
            value={null}
            onChange={() => {}}
            placeholder={language === 'ja' ? '担当者' : 'Assigned'}
            disabled
            readOnly={!editing}
          />
        </td>
        <td className="px-1 py-1">
          <EditableCell
            value={merged.notes ?? null}
            onChange={(v) =>
              isNew
                ? handleNewItemChange(newIndex, 'notes', v)
                : handleItemChange(itemId!, 'notes', v)
            }
            placeholder={language === 'ja' ? '備考' : 'Notes'}
            readOnly={!editing}
          />
        </td>
      </tr>
    );
  };

  const renderSection = (title: string, discipline: DomDiscipline, sectionItems: DomLabor[]) => {
    const newSectionItems = newItems.filter((i) => i.discipline === discipline);
    const sectionSubtotal = sectionItems.reduce(
      (sum, item) => {
        const edits = editingItems.get(item.id);
        const h = Number(edits?.hours ?? item.hours) || 0;
        const r = Number(edits?.hourly_rate ?? item.hourly_rate) || 0;
        return sum + h * r;
      },
      0
    );

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {title}
            <span className="ml-2 text-gray-400 font-normal">
              ({sectionItems.length}{language === 'ja' ? '件' : ''}) — {sectionSubtotal.toLocaleString()}
            </span>
          </h3>
          {editing && (
            <button
              onClick={() => handleAddRow(discipline)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-brand-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded"
            >
              <Plus size={14} /> {UI_LABELS[language].addRow}
            </button>
          )}
        </div>

        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <tr>
                {COLUMN_HEADERS[language].map((header, i) => (
                  <th key={i} className="px-1 py-1.5 text-left font-medium text-xs whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sectionItems.map((item, idx) => renderLaborRow(item, idx))}
              {newSectionItems.map((item, idx) => {
                const globalIdx = newItems.indexOf(item);
                return renderLaborRow(item, sectionItems.length + idx, true, globalIdx);
              })}
              {sectionItems.length === 0 && newSectionItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-4 text-center text-gray-400 text-sm">
                    {editing ? UI_LABELS[language].noDataEdit : UI_LABELS[language].noData}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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

      {/* メカ工数 */}
      {renderSection(UI_LABELS[language].mechSection, 'mech', mechItems)}

      {/* 電気工数 */}
      {renderSection(UI_LABELS[language].elecSection, 'elec', elecItems)}
    </div>
  );
}
