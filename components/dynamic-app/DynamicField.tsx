'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, FileIcon, Loader2, Bold, Italic, List, Link2, Search } from 'lucide-react';
import type { FieldDefinition, AppRecord } from '@/types/dynamic-app';
import { AUTO_FIELD_TYPES, DECORATIVE_FIELD_TYPES } from '@/types/dynamic-app';
import SubtableField from './SubtableField';
import EntitySelectField from './EntitySelectField';

interface UploadedFile {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  url: string | null;
}

interface DynamicFieldProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  locale: string;
  error?: string;
  record?: AppRecord;
  isNew?: boolean;
  allFields?: FieldDefinition[];
  formData?: Record<string, unknown>;
  onBulkChange?: (updates: Record<string, unknown>) => void;
}

export default function DynamicField({ field, value, onChange, locale, error, record, isNew, allFields, formData, onBulkChange }: DynamicFieldProps) {
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const label = field.label[lang] || field.label.ja || field.field_code;
  const helpText = field.description?.[lang] || field.description?.ja || '';
  const isAuto = AUTO_FIELD_TYPES.has(field.field_type);
  const isDecorative = DECORATIVE_FIELD_TYPES.has(field.field_type);

  const inputClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white ${
    error
      ? 'border-red-300 dark:border-red-600'
      : 'border-gray-300 dark:border-gray-600'
  }`;

  const readonlyClass = 'w-full px-3 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg';

  // 装飾フィールド
  if (field.field_type === 'label') {
    return (
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
      </div>
    );
  }

  if (field.field_type === 'space') {
    return <div className="min-h-8" />;
  }

  if (field.field_type === 'hr') {
    return <hr className="border-gray-200 dark:border-gray-700" />;
  }

  // 自動フィールド
  if (isAuto) {
    if (isNew) return null;

    let displayValue = '';
    const autoPlaceholder = lang === 'ja' ? '自動入力' : lang === 'th' ? 'อัตโนมัติ' : 'Auto';

    if (record) {
      switch (field.field_type) {
        case 'record_number':
          displayValue = String(record.record_number ?? '');
          break;
        case 'creator':
          displayValue = record.created_by || '';
          break;
        case 'created_time':
          displayValue = record.created_at
            ? new Date(record.created_at).toLocaleString(lang === 'ja' ? 'ja-JP' : lang === 'th' ? 'th-TH' : 'en-US')
            : '';
          break;
        case 'modifier':
          displayValue = record.updated_by || '';
          break;
        case 'modified_time':
          displayValue = record.updated_at
            ? new Date(record.updated_at).toLocaleString(lang === 'ja' ? 'ja-JP' : lang === 'th' ? 'th-TH' : 'en-US')
            : '';
          break;
      }
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
        <p className={readonlyClass}>{displayValue || autoPlaceholder}</p>
      </div>
    );
  }

  const renderInput = () => {
    switch (field.field_type) {
      case 'single_line_text':
        return (
          <input
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
            maxLength={field.validation?.max}
          />
        );

      case 'multi_line_text':
        return (
          <textarea
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
            rows={4}
            maxLength={field.validation?.max}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value !== undefined && value !== null ? String(value) : ''}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            className={inputClass}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
        );

      case 'link': {
        const linkType = field.validation?.link_type || 'url';
        const inputType = linkType === 'tel' ? 'tel' : linkType === 'email' ? 'email' : 'url';
        const placeholder = linkType === 'tel'
          ? '090-1234-5678'
          : linkType === 'email'
          ? 'example@mail.com'
          : 'https://example.com';
        return (
          <input
            type={inputType}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
            placeholder={placeholder}
          />
        );
      }

      case 'dropdown':
        return (
          <select
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          >
            <option value="">{lang === 'ja' ? '選択してください' : lang === 'th' ? 'กรุณาเลือก' : 'Select...'}</option>
            {(field.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label[lang] || opt.label.ja || opt.value}
              </option>
            ))}
          </select>
        );

      case 'radio_button':
        return (
          <div className="space-y-2">
            {(field.options || []).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name={field.field_code}
                  value={opt.value}
                  checked={(value as string) === opt.value}
                  onChange={(e) => onChange(e.target.value)}
                  className="border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                {opt.label[lang] || opt.label.ja || opt.value}
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {(field.options || []).map((opt) => {
              const checked = Array.isArray(value) ? (value as string[]).includes(opt.value) : false;
              return (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const current = Array.isArray(value) ? [...(value as string[])] : [];
                      if (e.target.checked) {
                        current.push(opt.value);
                      } else {
                        const idx = current.indexOf(opt.value);
                        if (idx >= 0) current.splice(idx, 1);
                      }
                      onChange(current);
                    }}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  {opt.label[lang] || opt.label.ja || opt.value}
                </label>
              );
            })}
          </div>
        );

      case 'multi_select':
        return (
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 space-y-1.5 max-h-48 overflow-y-auto bg-white dark:bg-gray-800">
            {(field.options || []).map((opt) => {
              const checked = Array.isArray(value) ? (value as string[]).includes(opt.value) : false;
              return (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 px-1 py-0.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const current = Array.isArray(value) ? [...(value as string[])] : [];
                      if (e.target.checked) {
                        current.push(opt.value);
                      } else {
                        const idx = current.indexOf(opt.value);
                        if (idx >= 0) current.splice(idx, 1);
                      }
                      onChange(current);
                    }}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  {opt.label[lang] || opt.label.ja || opt.value}
                </label>
              );
            })}
          </div>
        );

      case 'file_upload':
        return <FileUploadField field={field} record={record} locale={locale} />;

      case 'rich_editor':
        return <RichEditorField value={value} onChange={onChange} />;

      case 'lookup':
        return (
          <LookupField
            field={field}
            value={value}
            onChange={onChange}
            locale={locale}
            onBulkChange={onBulkChange}
          />
        );

      case 'calculated':
        return (
          <CalculatedField
            field={field}
            formData={formData || {}}
            locale={locale}
            allFields={allFields || []}
          />
        );

      case 'related_records':
        return null; // 関連レコードはフォームでは表示しない（詳細ページで表示）

      case 'subtable':
        return (
          <SubtableField
            field={field}
            value={value}
            onChange={onChange}
            locale={locale}
          />
        );

      case 'user_select':
        return <EntitySelectField field={field} value={value} onChange={onChange} locale={locale} entityType="user" />;
      case 'org_select':
        return <EntitySelectField field={field} value={value} onChange={onChange} locale={locale} entityType="org" />;
      case 'group_select':
        return <EntitySelectField field={field} value={value} onChange={onChange} locale={locale} entityType="role" />;

      default:
        return (
          <input
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
        );
    }
  };

  // 通常入力フィールドのラッパー
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {helpText && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helpText}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ========== ファイルアップロードコンポーネント ==========
function FileUploadField({ field, record, locale }: { field: FieldDefinition; record?: AppRecord; locale: string }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const appCode = typeof window !== 'undefined' ? window.location.pathname.split('/apps/')[1]?.split('/')[0] : '';
  const recordId = record?.id;
  const maxFiles = field.validation?.max_files || 5;

  // 既存ファイル取得
  useEffect(() => {
    if (!recordId || !appCode) return;
    fetch(`/api/apps/${appCode}/records/${recordId}/files?fieldCode=${field.field_code}`)
      .then((res) => res.ok ? res.json() : { files: [] })
      .then((data) => setFiles(data.files || []))
      .catch(() => {});
  }, [appCode, recordId, field.field_code]);

  const handleUpload = useCallback(async (fileList: FileList) => {
    if (!recordId || !appCode) return;
    if (files.length + fileList.length > maxFiles) return;

    setUploading(true);
    try {
      for (const f of Array.from(fileList)) {
        const formData = new FormData();
        formData.append('file', f);
        formData.append('fieldCode', field.field_code);

        const res = await fetch(`/api/apps/${appCode}/records/${recordId}/files`, {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          setFiles((prev) => [...prev, data.file]);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  }, [appCode, recordId, field.field_code, files.length, maxFiles]);

  const handleDelete = async (fileId: string) => {
    if (!recordId || !appCode) return;
    try {
      const res = await fetch(`/api/apps/${appCode}/records/${recordId}/files?fileId=${fileId}`, { method: 'DELETE' });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!recordId) {
    return (
      <p className="text-xs text-gray-400 dark:text-gray-500 italic">
        {locale === 'ja' ? 'レコード保存後にファイルをアップロードできます' : locale === 'th' ? 'อัปโหลดไฟล์ได้หลังจากบันทึกระเบียน' : 'Save the record first to upload files'}
      </p>
    );
  }

  return (
    <div>
      {/* D&Dエリア */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          dragOver
            ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-400" />
        ) : (
          <>
            <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {locale === 'ja' ? 'ファイルをドラッグ&ドロップ、またはクリック' : locale === 'th' ? 'ลากและวางไฟล์ หรือคลิก' : 'Drag & drop files or click'}
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />
      </div>

      {/* ファイル一覧 */}
      {files.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
              {f.mime_type?.startsWith('image/') && f.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.url} alt={f.file_name} className="w-8 h-8 object-cover rounded" />
              ) : (
                <FileIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
              <a
                href={f.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate text-brand-600 dark:text-brand-400 hover:underline"
              >
                {f.file_name}
              </a>
              <span className="text-xs text-gray-400 flex-shrink-0">{formatSize(f.file_size)}</span>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); handleDelete(f.id); }}
                className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== ルックアップフィールドコンポーネント ==========
function LookupField({
  field,
  value,
  onChange,
  locale,
  onBulkChange,
}: {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  locale: string;
  onBulkChange?: (updates: Record<string, unknown>) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; record_number: number; key_value: string; data: Record<string, unknown> }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const appCode = typeof window !== 'undefined' ? window.location.pathname.split('/apps/')[1]?.split('/')[0] : '';
  const targetAppCode = field.validation?.lookup_app_code;
  const keyField = field.validation?.lookup_key_field;

  // 外部クリックで閉じる
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const doSearch = useCallback((q: string) => {
    if (!targetAppCode || !keyField || !appCode) return;
    setSearching(true);
    fetch(`/api/apps/${appCode}/lookup?targetApp=${targetAppCode}&keyField=${keyField}&query=${encodeURIComponent(q)}`)
      .then(r => r.ok ? r.json() : { records: [] })
      .then(data => {
        setResults(data.records || []);
        setShowDropdown(true);
      })
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, [appCode, targetAppCode, keyField]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleSelect = (result: { id: string; data: Record<string, unknown>; key_value: string }) => {
    // キーフィールドの値をセット
    onChange(result.key_value);
    setQuery(result.key_value);
    setShowDropdown(false);

    // コピーフィールドの値を反映
    if (onBulkChange && field.validation?.lookup_copy_fields) {
      const updates: Record<string, unknown> = {};
      for (const cf of field.validation.lookup_copy_fields) {
        if (cf.source_field && cf.target_field) {
          updates[cf.target_field] = result.data[cf.source_field] ?? null;
        }
      }
      if (Object.keys(updates).length > 0) {
        onBulkChange(updates);
      }
    }
  };

  // 初期表示時にvalueをqueryにセット
  useEffect(() => {
    if (value && !query) setQuery(String(value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const placeholder = lang === 'ja' ? '検索...' : lang === 'th' ? 'ค้นหา...' : 'Search...';

  if (!targetAppCode || !keyField) {
    return (
      <p className="text-xs text-gray-400 italic">
        {lang === 'ja' ? 'ルックアップ設定を完了してください' : lang === 'th' ? 'กรุณาตั้งค่าการค้นหาอ้างอิง' : 'Please complete lookup configuration'}
      </p>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {searching ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <Search className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          {results.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 border-b last:border-0 border-gray-100 dark:border-gray-700"
            >
              <span className="font-medium text-gray-800 dark:text-white">{r.key_value}</span>
              <span className="ml-2 text-xs text-gray-400">#{r.record_number}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== 計算フィールドコンポーネント ==========
function CalculatedField({
  field,
  formData,
  locale,
  allFields,
}: {
  field: FieldDefinition;
  formData: Record<string, unknown>;
  locale: string;
  allFields: FieldDefinition[];
}) {
  const formula = field.validation?.formula || '';
  const format = field.validation?.formula_format || 'number';
  const decimals = field.validation?.formula_decimals ?? 2;
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const localeStr = lang === 'ja' ? 'ja-JP' : lang === 'th' ? 'th-TH' : 'en-US';

  let result: number | null = null;
  if (formula) {
    try {
      // フィールドコードを数値に置換して計算
      let expr = formula;
      const numberFields = allFields.filter(f => f.field_type === 'number');
      for (const nf of numberFields) {
        const val = Number(formData[nf.field_code] ?? 0) || 0;
        expr = expr.replace(new RegExp(`\\b${nf.field_code}\\b`, 'g'), String(val));
      }
      // 安全な計算（数値と演算子のみ許可）
      const sanitized = expr.replace(/[^0-9+\-*/().%\s]/g, '');
      if (sanitized.trim()) {
        // eslint-disable-next-line no-eval
        result = eval(sanitized);
        if (typeof result === 'number' && !isNaN(result)) {
          result = Math.round(result * Math.pow(10, decimals)) / Math.pow(10, decimals);
        } else {
          result = null;
        }
      }
    } catch {
      result = null;
    }
  }

  let displayValue = '-';
  if (result !== null) {
    if (format === 'currency') {
      displayValue = result.toLocaleString(localeStr, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    } else if (format === 'percent') {
      displayValue = `${(result * 100).toFixed(Math.max(0, decimals - 2))}%`;
    } else {
      displayValue = result.toLocaleString(localeStr, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }
  }

  return (
    <p className="w-full px-3 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      {displayValue}
    </p>
  );
}

// ========== リッチエディターコンポーネント ==========
function RichEditorField({ value, onChange }: { value: unknown; onChange: (value: unknown) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (editorRef.current && !initialized) {
      editorRef.current.innerHTML = (value as string) || '';
      setInitialized(true);
    }
  }, [value, initialized]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    handleInput();
  };

  const handleLink = () => {
    const url = prompt('URL:');
    if (url) execCommand('createLink', url);
  };

  const btnClass = 'p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors';

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      {/* ツールバー */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button type="button" onClick={() => execCommand('bold')} className={btnClass} title="Bold">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => execCommand('italic')} className={btnClass} title="Italic">
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className={btnClass} title="List">
          <List className="w-4 h-4" />
        </button>
        <button type="button" onClick={handleLink} className={btnClass} title="Link">
          <Link2 className="w-4 h-4" />
        </button>
      </div>
      {/* エディタ */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[120px] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none prose prose-sm dark:prose-invert max-w-none"
        suppressContentEditableWarning
      />
    </div>
  );
}
