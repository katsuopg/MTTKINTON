'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Upload, X, FileText, File } from 'lucide-react';
import EditableCell from '../shared/EditableCell';
import StatusBadge from '../shared/StatusBadge';
import MasterSelect from '../shared/MasterSelect';
import type { DomMechItem, DomItemStatus, DomMasters, DomItemFile } from '@/types/dom';

type Language = 'ja' | 'en' | 'th';

interface MechItemRowProps {
  item: Partial<DomMechItem>;
  mode: 'make' | 'buy';
  displayNo: number;
  domHeaderId?: string;
  isNew?: boolean;
  masters: DomMasters;
  language: Language;
  selected?: boolean;
  readOnly?: boolean;
  onToggleSelect?: () => void;
  onChange: (field: string, value: string | number | null) => void;
  onFileNotify?: (type: 'success' | 'error', message: string) => void;
  // DnD
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  // 見積依頼選択モード
  quoteSelecting?: boolean;
  quoteSelected?: boolean;
  onToggleQuoteSelect?: () => void;
}

const UNIT_EN_MAP: Record<string, string> = {
  '個': 'pcs', '本': 'pcs', '台': 'unit', 'セット': 'set',
  '式': 'set', '枚': 'pcs', '組': 'set', '巻': 'roll',
};

function translateUnit(unit: string, language: Language): string {
  if (language === 'ja') return unit;
  return UNIT_EN_MAP[unit] || unit;
}

const STATUS_OPTIONS: DomItemStatus[] = [
  'designing', 'on_hold', 'quote_requesting', 'quote_done',
  'order_requesting', 'ordering', 'delivered',
];

const STATUS_LABELS: Record<DomItemStatus, Record<Language, string>> = {
  designing: { ja: '設計中', en: 'Designing', th: 'ออกแบบ' },
  on_hold: { ja: '保留', en: 'Hold', th: 'ระงับ' },
  quote_requesting: { ja: '見積依頼中', en: 'Quoting', th: 'ขอราคา' },
  quote_done: { ja: '見積完了', en: 'Quoted', th: 'เสนอราคาแล้ว' },
  order_requesting: { ja: '手配依頼', en: 'Order Req', th: 'ขอสั่ง' },
  ordering: { ja: '手配中', en: 'Ordering', th: 'สั่งซื้อ' },
  delivered: { ja: '入荷済', en: 'Delivered', th: 'ได้รับ' },
};

export default function MechItemRow({
  item,
  mode,
  displayNo,
  domHeaderId,
  isNew = false,
  masters,
  language,
  selected = false,
  readOnly = false,
  onToggleSelect,
  onChange,
  onFileNotify,
  draggable = false,
  onDragStart,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging = false,
  isDragOver = false,
  quoteSelecting = false,
  quoteSelected = false,
  onToggleQuoteSelect,
}: MechItemRowProps) {
  const amount = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<DomItemFile[]>([]);
  const [showFiles, setShowFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // 製作品の既存アイテムのみファイル取得
  useEffect(() => {
    if (mode === 'make' && item.id && domHeaderId) {
      fetch(`/api/dom/${domHeaderId}/files?item_type=mech&item_id=${item.id}`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setFiles(data); })
        .catch(() => {});
    }
  }, [mode, item.id, domHeaderId]);

  // ポップオーバー外クリックで閉じる
  useEffect(() => {
    if (!showFiles) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowFiles(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFiles]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !item.id || !domHeaderId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('item_type', 'mech');
      formData.append('item_id', item.id);
      formData.append('revision', String(item.revision ?? 0));
      const res = await fetch(`/api/dom/${domHeaderId}/files`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const newFile = await res.json();
        setFiles((prev) => [newFile, ...prev]);
        onFileNotify?.('success', language === 'ja' ? `「${file.name}」をアップロードしました` : `Uploaded "${file.name}"`);
      } else {
        onFileNotify?.('error', language === 'ja' ? 'アップロードに失敗しました' : 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      onFileNotify?.('error', language === 'ja' ? 'アップロードに失敗しました' : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!domHeaderId) return;
    try {
      const res = await fetch(`/api/dom/${domHeaderId}/files?file_id=${fileId}`, { method: 'DELETE' });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        onFileNotify?.('success', language === 'ja' ? 'ファイルを削除しました' : 'File deleted');
      } else {
        onFileNotify?.('error', language === 'ja' ? 'ファイル削除に失敗しました' : 'Failed to delete file');
      }
    } catch (err) {
      console.error('Delete error:', err);
      onFileNotify?.('error', language === 'ja' ? 'ファイル削除に失敗しました' : 'Failed to delete file');
    }
  };

  const handleFileDownload = async (file: DomItemFile) => {
    if (!domHeaderId) return;
    try {
      const res = await fetch(`/api/dom/${domHeaderId}/files?action=download&file_path=${encodeURIComponent(file.file_path)}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.file_name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <tr
      className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
        isDragging ? 'opacity-40' : ''
      } ${isDragOver ? 'border-t-2 border-t-brand-500' : ''}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* ドラッグハンドル + チェックボックス */}
      <td className="px-0.5 py-1">
        <div className="flex items-center justify-center gap-0">
          {quoteSelecting && !isNew && item.id ? (
            /* 見積依頼選択モード: designingステータスのみ選択可 */
            <input
              type="checkbox"
              checked={quoteSelected}
              onChange={onToggleQuoteSelect}
              disabled={item.status !== 'designing'}
              className={`h-3.5 w-3.5 rounded ${
                item.status === 'designing'
                  ? 'border-orange-400 text-orange-500 focus:ring-orange-500 cursor-pointer'
                  : 'border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-30'
              }`}
              title={item.status !== 'designing'
                ? (language === 'ja' ? '設計中のアイテムのみ選択可' : language === 'th' ? 'เลือกได้เฉพาะรายการที่กำลังออกแบบ' : 'Only designing items can be selected')
                : undefined
              }
            />
          ) : (
            <>
              {draggable && (
                <span className="cursor-grab text-gray-300 dark:text-gray-600 hover:text-gray-500 select-none text-[10px] leading-none" title="Drag">⠿</span>
              )}
              {!readOnly && !isNew && onToggleSelect && (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={onToggleSelect}
                  className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600"
                />
              )}
            </>
          )}
        </div>
      </td>

      {/* No（自動採番・編集不可） */}
      <td className="px-1 py-1 text-center text-sm text-gray-500 whitespace-nowrap">
        {mode === 'buy' ? `P${displayNo}` : displayNo}
      </td>

      {/* 品名 */}
      <td className="px-1 py-1">
        <EditableCell
          value={item.part_name ?? null}
          onChange={(v) => onChange('part_name', v)}
          placeholder={language === 'ja' ? '品名' : 'Name'}
          readOnly={readOnly}
        />
      </td>

      {mode === 'make' ? (
        <>
          {/* 図番（製作品） */}
          <td className="px-1 py-1">
            <EditableCell
              value={item.part_code ?? null}
              onChange={(v) => onChange('part_code', v)}
              placeholder={language === 'ja' ? '図番' : 'Dwg No.'}
              readOnly={readOnly}
            />
          </td>

          {/* Rev */}
          <td className="px-1 py-1 text-center">
            <EditableCell
              value={item.revision ?? '0'}
              onChange={(v) => onChange('revision', v)}
              align="center"
              readOnly={readOnly}
            />
          </td>

          {/* 図面ファイル */}
          <td className="px-1 py-1 text-center relative">
            {isNew ? (
              <span className="text-gray-300 text-xs">-</span>
            ) : readOnly ? (
              /* 閲覧モード: PDF/DWGアイコン表示 */
              files.length > 0 ? (
                <div className="flex items-center justify-center gap-0.5">
                  {files.map((f) => {
                    const ext = f.file_name.split('.').pop()?.toLowerCase() || '';
                    const isPdf = ext === 'pdf';
                    const isDwg = ext === 'dwg';
                    return (
                      <button
                        key={f.id}
                        onClick={() => handleFileDownload(f)}
                        className={`p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          isPdf ? 'text-red-500' : isDwg ? 'text-orange-500' : 'text-blue-500'
                        }`}
                        title={f.file_name}
                      >
                        {isPdf ? (
                          <FileText size={14} />
                        ) : (
                          <File size={14} />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="text-gray-300 text-xs">-</span>
              )
            ) : (
              /* 編集モード: クリップアイコン + ポップオーバー */
              <>
                <button
                  onClick={() => setShowFiles(!showFiles)}
                  className={`inline-flex items-center gap-0.5 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    files.length > 0 ? 'text-blue-500' : 'text-gray-400'
                  }`}
                  title={files.length > 0
                    ? `${files.length} ${language === 'ja' ? 'ファイル' : 'file(s)'}`
                    : (language === 'ja' ? '図面追加' : 'Add drawing')
                  }
                >
                  <Paperclip size={14} />
                  {files.length > 0 && (
                    <span className="text-[10px] font-medium">{files.length}</span>
                  )}
                </button>

                {showFiles && (
                  <div
                    ref={popoverRef}
                    className="absolute z-50 top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
                  >
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        {language === 'ja' ? '図面ファイル' : 'Drawing Files'}
                      </span>
                      <label className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload size={10} />
                        {uploading
                          ? '...'
                          : (language === 'ja' ? '追加' : 'Add')
                        }
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.dwg,.jpeg,.jpg,.png"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                    <div className="max-h-32 overflow-y-auto">
                      {files.length === 0 ? (
                        <p className="px-2 py-3 text-center text-xs text-gray-400">
                          {language === 'ja' ? 'ファイルなし' : 'No files'}
                        </p>
                      ) : (
                        files.map((f) => {
                          const ext = f.file_name.split('.').pop()?.toLowerCase() || '';
                          const isPdf = ext === 'pdf';
                          const isDwg = ext === 'dwg';
                          return (
                            <div key={f.id} className="flex items-center gap-1 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 group">
                              {isPdf ? (
                                <FileText size={12} className="text-red-500 shrink-0" />
                              ) : isDwg ? (
                                <File size={12} className="text-orange-500 shrink-0" />
                              ) : (
                                <File size={12} className="text-gray-400 shrink-0" />
                              )}
                              <button
                                onClick={() => handleFileDownload(f)}
                                className="flex-1 text-left text-[11px] text-gray-700 dark:text-gray-300 truncate hover:text-brand-500"
                                title={f.file_name}
                              >
                                {f.file_name}
                              </button>
                              <button
                                onClick={() => handleFileDelete(f.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:text-red-600 rounded"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </td>

          {/* 材質 */}
          <td className="px-1 py-1">
            <MasterSelect
              items={masters.materials}
              value={item.material_id ?? null}
              onChange={(v) => onChange('material_id', v)}
              language={language}
              readOnly={readOnly}
            />
          </td>

          {/* 熱処理 */}
          <td className="px-1 py-1">
            <MasterSelect
              items={masters.heat_treatments}
              value={item.heat_treatment_id ?? null}
              onChange={(v) => onChange('heat_treatment_id', v)}
              language={language}
              readOnly={readOnly}
            />
          </td>

          {/* 表面処理 */}
          <td className="px-1 py-1">
            <MasterSelect
              items={masters.surface_treatments}
              value={item.surface_treatment_id ?? null}
              onChange={(v) => onChange('surface_treatment_id', v)}
              language={language}
              readOnly={readOnly}
            />
          </td>
        </>
      ) : (
        <>
          {/* 型式（購入品） */}
          <td className="px-1 py-1">
            <EditableCell
              value={item.model_number ?? null}
              onChange={(v) => onChange('model_number', v)}
              placeholder={language === 'ja' ? '型式' : 'Model'}
              readOnly={readOnly}
            />
          </td>

          {/* メーカー（購入品） */}
          <td className="px-1 py-1">
            <EditableCell
              value={item.manufacturer ?? null}
              onChange={(v) => onChange('manufacturer', v)}
              placeholder={language === 'ja' ? 'メーカー' : 'Maker'}
              readOnly={readOnly}
            />
          </td>
        </>
      )}

      {/* 数量 */}
      <td className="px-1 py-1">
        <EditableCell
          value={item.quantity ?? 1}
          onChange={(v) => onChange('quantity', v)}
          type="number"
          align="center"
          readOnly={readOnly}
        />
      </td>

      {/* 単位 */}
      <td className="px-1 py-1">
        <EditableCell
          value={readOnly ? translateUnit(item.unit ?? '個', language) : (item.unit ?? '個')}
          onChange={(v) => onChange('unit', v)}
          readOnly={readOnly}
        />
      </td>

      {/* 単価 */}
      <td className="px-1 py-1">
        <EditableCell
          value={item.unit_price ?? null}
          onChange={(v) => onChange('unit_price', v)}
          type="number"
          align="right"
          readOnly={readOnly}
        />
      </td>

      {/* 金額 */}
      <td className="px-1 py-1 text-right text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
        {amount.toLocaleString()}
      </td>

      {/* LT(日) */}
      <td className="px-1 py-1">
        <EditableCell
          value={item.lead_time_days ?? null}
          onChange={(v) => onChange('lead_time_days', v)}
          type="number"
          placeholder={language === 'ja' ? '日' : 'd'}
          align="center"
          readOnly={readOnly}
        />
      </td>

      {/* ステータス */}
      <td className="px-1 py-1">
        {readOnly ? (
          <StatusBadge status={(item.status as DomItemStatus) || 'designing'} language={language} />
        ) : (
          <select
            value={item.status || 'designing'}
            onChange={(e) => onChange('status', e.target.value)}
            className="w-full py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 dark:text-white"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s][language]}</option>
            ))}
          </select>
        )}
      </td>

      {/* 備考 */}
      <td className="px-1 py-1">
        <EditableCell
          value={item.notes ?? null}
          onChange={(v) => onChange('notes', v)}
          placeholder={language === 'ja' ? '備考' : 'Notes'}
          readOnly={readOnly}
        />
      </td>
    </tr>
  );
}
