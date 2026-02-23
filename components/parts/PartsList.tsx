'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Download, Upload, FolderPlus, Save, X } from 'lucide-react';
import Tabs, { TabPanel } from '@/components/ui/Tabs';
import type { PartCategory, PartSection, PartListItem, PartCategoryCode, PART_CATEGORY_LABELS } from '@/types/parts';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';

interface PartsListProps {
  projectCode: string;
  locale: string;
}

type Language = 'ja' | 'en' | 'th';

const CATEGORY_LABELS: Record<PartCategoryCode, Record<Language, string>> = {
  mech_make: { ja: 'メカ製作部品', en: 'Mech Fabrication', th: 'เครื่องกล-ผลิต' },
  mech_buy: { ja: 'メカ購入品', en: 'Mech Purchased', th: 'เครื่องกล-ซื้อ' },
  elec_make: { ja: '電気製作品', en: 'Elec Fabrication', th: 'ไฟฟ้า-ผลิต' },
  elec_buy: { ja: '電気購入品', en: 'Elec Purchased', th: 'ไฟฟ้า-ซื้อ' },
};

const COLUMN_HEADERS: Record<Language, string[]> = {
  ja: ['品番', '品名', '型式', 'メーカー', '数量', '単位', '単価', '図面番号', '備考'],
  en: ['Part No.', 'Part Name', 'Model', 'Manufacturer', 'Qty', 'Unit', 'Unit Price', 'Drawing No.', 'Remarks'],
  th: ['รหัส', 'ชื่อ', 'รุ่น', 'ผู้ผลิต', 'จำนวน', 'หน่วย', 'ราคา', 'เลขแบบ', 'หมายเหตุ'],
};

const UI_LABELS: Record<Language, Record<string, string>> = {
  ja: {
    addRow: '行追加',
    addSection: 'セクション追加',
    deleteSelected: '選択削除',
    export: 'CSV出力',
    import: 'CSV入力',
    save: '保存',
    cancel: 'キャンセル',
    noData: 'データがありません',
    sectionName: 'セクション名',
    confirmDelete: '選択した項目を削除しますか？',
  },
  en: {
    addRow: 'Add Row',
    addSection: 'Add Section',
    deleteSelected: 'Delete Selected',
    export: 'Export CSV',
    import: 'Import CSV',
    save: 'Save',
    cancel: 'Cancel',
    noData: 'No data',
    sectionName: 'Section Name',
    confirmDelete: 'Delete selected items?',
  },
  th: {
    addRow: 'เพิ่มแถว',
    addSection: 'เพิ่มส่วน',
    deleteSelected: 'ลบที่เลือก',
    export: 'ส่งออก CSV',
    import: 'นำเข้า CSV',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    noData: 'ไม่มีข้อมูล',
    sectionName: 'ชื่อส่วน',
    confirmDelete: 'ลบรายการที่เลือก?',
  },
};

export default function PartsList({ projectCode, locale }: PartsListProps) {
  const { toast } = useToast();
  const { confirmDialog } = useConfirmDialog();
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  const [categories, setCategories] = useState<PartCategory[]>([]);
  const [sections, setSections] = useState<PartSection[]>([]);
  const [items, setItems] = useState<PartListItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingItems, setEditingItems] = useState<Map<string, Partial<PartListItem>>>(new Map());
  const [newItems, setNewItems] = useState<Partial<PartListItem>[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // データ取得
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/parts?project_code=${encodeURIComponent(projectCode)}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      setCategories(data.categories || []);
      setSections(data.sections || []);
      setItems(data.items || []);

      if (data.categories?.length > 0 && !activeCategory) {
        setActiveCategory(data.categories[0].id);
      }
    } catch (error) {
      console.error('Error fetching parts:', error);
    } finally {
      setLoading(false);
    }
  }, [projectCode, activeCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 現在のカテゴリのアイテムとセクション
  const currentCategory = categories.find(c => c.id === activeCategory);
  const currentSections = sections.filter(s => s.category_id === activeCategory);
  const currentItems = items.filter(i => i.category_id === activeCategory);

  // カテゴリタブ
  const categoryTabs = categories.map(cat => ({
    key: cat.id,
    label: CATEGORY_LABELS[cat.code as PartCategoryCode]?.[language] || cat.name,
    badge: items.filter(i => i.category_id === cat.id).length || undefined,
  }));

  // 行追加
  const handleAddRow = (sectionId?: string | null) => {
    const newItem: Partial<PartListItem> = {
      project_code: projectCode,
      category_id: activeCategory,
      section_id: sectionId || null,
      part_number: '',
      part_name: '',
      model_number: '',
      manufacturer: '',
      quantity: 1,
      unit: '個',
      unit_price: null,
      drawing_no: '',
      remarks: '',
      sort_order: currentItems.length + newItems.length + 1,
    };
    setNewItems([...newItems, newItem]);
    setHasChanges(true);
  };

  // セクション追加
  const handleAddSection = async () => {
    if (!currentCategory?.has_sections) return;

    const sectionCount = currentSections.length;
    const newSectionCode = `S${sectionCount + 1}`;

    try {
      const res = await fetch('/api/parts/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_code: projectCode,
          category_id: activeCategory,
          section_code: newSectionCode,
          section_name: '',
        }),
      });

      if (!res.ok) throw new Error('Failed to create section');

      await fetchData();
    } catch (error) {
      console.error('Error creating section:', error);
    }
  };

  // 選択切り替え
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // 全選択
  const toggleSelectAll = () => {
    if (selectedItems.size === currentItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(currentItems.map(i => i.id)));
    }
  };

  // セル編集
  const handleCellChange = (id: string, field: keyof PartListItem, value: string | number | null) => {
    const existing = editingItems.get(id) || {};
    setEditingItems(new Map(editingItems.set(id, { ...existing, [field]: value })));
    setHasChanges(true);
  };

  // 新規アイテムの編集
  const handleNewItemChange = (index: number, field: keyof PartListItem, value: string | number | null) => {
    const updated = [...newItems];
    updated[index] = { ...updated[index], [field]: value };
    setNewItems(updated);
    setHasChanges(true);
  };

  // 保存
  const handleSave = async () => {
    setSaving(true);
    try {
      // 新規アイテムの保存
      if (newItems.length > 0) {
        const res = await fetch('/api/parts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItems),
        });
        if (!res.ok) throw new Error('Failed to create items');
      }

      // 編集アイテムの保存
      if (editingItems.size > 0) {
        const updates = Array.from(editingItems.entries()).map(([id, data]) => ({
          id,
          ...data,
        }));
        const res = await fetch('/api/parts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error('Failed to update items');
      }

      // リセットして再取得
      setNewItems([]);
      setEditingItems(new Map());
      setHasChanges(false);
      await fetchData();
      toast({ type: 'success', title: UI_LABELS[language].save + ' OK' });
    } catch (error) {
      console.error('Error saving:', error);
      toast({ type: 'error', title: language === 'ja' ? '保存に失敗しました' : language === 'th' ? 'บันทึกไม่สำเร็จ' : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  // 削除
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
      const res = await fetch(`/api/parts?ids=${ids}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      setSelectedItems(new Set());
      await fetchData();
      toast({ type: 'success', title: language === 'ja' ? '削除しました' : language === 'th' ? 'ลบสำเร็จ' : 'Deleted' });
    } catch (error) {
      console.error('Error deleting:', error);
      toast({ type: 'error', title: language === 'ja' ? '削除に失敗しました' : language === 'th' ? 'ลบไม่สำเร็จ' : 'Failed to delete' });
    }
  };

  // CSVエクスポート
  const handleExport = () => {
    const headers = COLUMN_HEADERS[language].join(',');
    const rows = currentItems.map(item => [
      item.part_number || '',
      item.part_name || '',
      item.model_number || '',
      item.manufacturer || '',
      item.quantity,
      item.unit || '',
      item.unit_price || '',
      item.drawing_no || '',
      item.remarks || '',
    ].map(v => `"${v}"`).join(','));

    const csv = [headers, ...rows].join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parts_${projectCode}_${currentCategory?.code || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSVインポート
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());

      // ヘッダー行をスキップ
      const dataLines = lines.slice(1);

      const importedItems: Partial<PartListItem>[] = dataLines.map((line, index) => {
        // CSVパース（ダブルクォート対応）
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        return {
          project_code: projectCode,
          category_id: activeCategory,
          section_id: null,
          part_number: values[0] || '',
          part_name: values[1] || '',
          model_number: values[2] || '',
          manufacturer: values[3] || '',
          quantity: parseFloat(values[4]) || 1,
          unit: values[5] || '個',
          unit_price: values[6] ? parseFloat(values[6]) : null,
          drawing_no: values[7] || '',
          remarks: values[8] || '',
          sort_order: currentItems.length + newItems.length + index + 1,
        };
      });

      setNewItems([...newItems, ...importedItems]);
      setHasChanges(true);
    };

    reader.readAsText(file, 'UTF-8');
    // ファイル選択をリセット
    e.target.value = '';
  };

  // 編集可能セル
  const EditableCell = ({
    value,
    onChange,
    type = 'text',
    className = '',
  }: {
    value: string | number | null;
    onChange: (v: string | number | null) => void;
    type?: 'text' | 'number';
    className?: string;
  }) => (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => {
        const v = type === 'number'
          ? (e.target.value === '' ? null : Number(e.target.value))
          : e.target.value;
        onChange(v);
      }}
      className={`w-full px-2 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-brand-500 dark:text-white ${className}`}
    />
  );

  // アイテム行のレンダリング
  const renderItemRow = (item: PartListItem, isNew = false, newIndex = 0) => {
    const editData = isNew ? newItems[newIndex] : editingItems.get(item.id);
    const getValue = (field: keyof PartListItem) => {
      if (isNew) return newItems[newIndex]?.[field] ?? '';
      return editData?.[field] ?? item[field];
    };
    const handleChange = (field: keyof PartListItem, value: string | number | null) => {
      if (isNew) {
        handleNewItemChange(newIndex, field, value);
      } else {
        handleCellChange(item.id, field, value);
      }
    };

    return (
      <tr
        key={isNew ? `new-${newIndex}` : item.id}
        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
      >
        <td className="px-2 py-1 w-10">
          {!isNew && (
            <input
              type="checkbox"
              checked={selectedItems.has(item.id)}
              onChange={() => toggleSelect(item.id)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
          )}
        </td>
        <td className="px-1 py-1">
          <EditableCell value={getValue('part_number') as string} onChange={(v) => handleChange('part_number', v)} />
        </td>
        <td className="px-1 py-1">
          <EditableCell value={getValue('part_name') as string} onChange={(v) => handleChange('part_name', v)} />
        </td>
        <td className="px-1 py-1">
          <EditableCell value={getValue('model_number') as string} onChange={(v) => handleChange('model_number', v)} />
        </td>
        <td className="px-1 py-1">
          <EditableCell value={getValue('manufacturer') as string} onChange={(v) => handleChange('manufacturer', v)} />
        </td>
        <td className="px-1 py-1 w-20">
          <EditableCell value={getValue('quantity') as number} onChange={(v) => handleChange('quantity', v)} type="number" />
        </td>
        <td className="px-1 py-1 w-16">
          <EditableCell value={getValue('unit') as string} onChange={(v) => handleChange('unit', v)} />
        </td>
        <td className="px-1 py-1 w-24">
          <EditableCell value={getValue('unit_price') as number} onChange={(v) => handleChange('unit_price', v)} type="number" />
        </td>
        <td className="px-1 py-1">
          <EditableCell value={getValue('drawing_no') as string} onChange={(v) => handleChange('drawing_no', v)} />
        </td>
        <td className="px-1 py-1">
          <EditableCell value={getValue('remarks') as string} onChange={(v) => handleChange('remarks', v)} />
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
      {/* カテゴリタブ */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Tabs
          tabs={categoryTabs}
          activeTab={activeCategory}
          onTabChange={setActiveCategory}
          variant="pill"
        />
      </div>

      {/* ツールバー */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
        <button
          onClick={() => handleAddRow()}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-md"
        >
          <Plus size={16} /> {UI_LABELS[language].addRow}
        </button>

        {currentCategory?.has_sections && (
          <button
            onClick={handleAddSection}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
          >
            <FolderPlus size={16} /> {UI_LABELS[language].addSection}
          </button>
        )}

        {selectedItems.size > 0 && (
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md"
          >
            <Trash2 size={16} /> {UI_LABELS[language].deleteSelected} ({selectedItems.size})
          </button>
        )}

        <div className="flex-1" />

        <label className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md cursor-pointer">
          <Upload size={16} /> {UI_LABELS[language].import}
          <input
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
        </label>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
        >
          <Download size={16} /> {UI_LABELS[language].export}
        </button>

        {hasChanges && (
          <>
            <button
              onClick={() => {
                setNewItems([]);
                setEditingItems(new Map());
                setHasChanges(false);
                fetchData();
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <X size={16} /> {UI_LABELS[language].cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-md disabled:opacity-50"
            >
              <Save size={16} /> {saving ? '...' : UI_LABELS[language].save}
            </button>
          </>
        )}
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-2 py-2 w-10">
                <input
                  type="checkbox"
                  checked={currentItems.length > 0 && selectedItems.size === currentItems.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
              </th>
              {COLUMN_HEADERS[language].map((header, i) => (
                <th key={i} className="px-2 py-2 text-left font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentCategory?.has_sections ? (
              // セクション別表示
              <>
                {currentSections.map(section => (
                  <React.Fragment key={section.id}>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <td colSpan={10} className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">
                        {section.section_code}: {section.section_name || ''}
                        <button
                          onClick={() => handleAddRow(section.id)}
                          className="ml-2 text-brand-500 hover:text-brand-600 text-sm"
                        >
                          + {UI_LABELS[language].addRow}
                        </button>
                      </td>
                    </tr>
                    {currentItems
                      .filter(item => item.section_id === section.id)
                      .map(item => renderItemRow(item))}
                  </React.Fragment>
                ))}
                {/* セクションなしのアイテム */}
                {currentItems.filter(item => !item.section_id).length > 0 && (
                  <>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <td colSpan={10} className="px-4 py-2 font-medium text-gray-500 dark:text-gray-400">
                        (未分類)
                      </td>
                    </tr>
                    {currentItems
                      .filter(item => !item.section_id)
                      .map(item => renderItemRow(item))}
                  </>
                )}
              </>
            ) : (
              // フラット表示
              currentItems.map(item => renderItemRow(item))
            )}

            {/* 新規アイテム */}
            {newItems
              .filter(item => item.category_id === activeCategory)
              .map((item, index) => renderItemRow(item as PartListItem, true, index))}

            {/* データなしメッセージ */}
            {currentItems.length === 0 && newItems.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  {UI_LABELS[language].noData}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
