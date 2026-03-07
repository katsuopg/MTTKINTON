'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { FieldDefinition } from '@/types/dynamic-app';

interface InlineEditCellProps {
  field: FieldDefinition;
  value: unknown;
  recordId: string;
  appCode: string;
  locale: string;
  onSaved: () => void;
  children: React.ReactNode;
}

// インライン編集不可のフィールドタイプ
const NON_EDITABLE_TYPES = new Set([
  'record_number', 'creator', 'created_time', 'modifier', 'modified_time',
  'calculated', 'related_records', 'subtable', 'file_upload', 'rich_editor',
  'user_select', 'org_select', 'group_select', 'lookup',
  'label', 'spacer', 'section_break', 'hr',
]);

export default function InlineEditCell({
  field, value, recordId, appCode, locale, onSaved, children,
}: InlineEditCellProps) {
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState<unknown>(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  const isEditable = !NON_EDITABLE_TYPES.has(field.field_type);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.select();
      }
    }
  }, [editing]);

  const save = useCallback(async () => {
    if (!editing) return;
    // 値が変更されていなければキャンセル
    if (JSON.stringify(editValue ?? null) === JSON.stringify(value ?? null)) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/apps/${appCode}/records/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { [field.field_code]: editValue } }),
      });
      if (res.ok) {
        onSaved();
      } else if (res.status === 409) {
        const errMsg = lang === 'ja'
          ? '他のユーザーが編集済みです。リロードしてください。'
          : lang === 'th'
          ? 'ข้อมูลถูกแก้ไขโดยผู้ใช้อื่น กรุณาโหลดใหม่'
          : 'Record modified by another user. Please reload.';
        alert(errMsg);
      } else {
        console.error('Inline edit failed:', res.status);
      }
    } catch (err) {
      console.error('Inline edit error:', err);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }, [editing, editValue, value, appCode, recordId, field.field_code, onSaved, lang]);

  const cancel = useCallback(() => {
    setEditValue(value);
    setEditing(false);
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      save();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  }, [save, cancel]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!isEditable) return;
    e.stopPropagation();
    setEditValue(value);
    setEditing(true);
  }, [isEditable, value]);

  if (!isEditable) {
    return <>{children}</>;
  }

  if (!editing) {
    return (
      <div
        onDoubleClick={handleDoubleClick}
        className="min-h-[1.5rem] cursor-cell"
        title={lang === 'ja' ? 'ダブルクリックで編集' : lang === 'th' ? 'ดับเบิลคลิกเพื่อแก้ไข' : 'Double-click to edit'}
      >
        {children}
      </div>
    );
  }

  // 編集中のUI
  const inputClasses = 'w-full rounded border border-brand-400 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-brand-600 dark:text-white';

  const renderEditor = () => {
    switch (field.field_type) {
      case 'single_line_text':
      case 'link':
      case 'number':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={field.field_type === 'number' ? 'number' : 'text'}
            value={editValue != null ? String(editValue) : ''}
            onChange={(e) => setEditValue(field.field_type === 'number' ? (e.target.value ? Number(e.target.value) : null) : e.target.value)}
            onBlur={save}
            onKeyDown={handleKeyDown}
            className={inputClasses}
            disabled={saving}
          />
        );

      case 'multi_line_text':
        return (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue != null ? String(editValue) : ''}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={save}
            onKeyDown={handleKeyDown}
            className={`${inputClasses} resize-none`}
            rows={3}
            disabled={saving}
          />
        );

      case 'date':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={editValue != null ? String(editValue) : ''}
            onChange={(e) => setEditValue(e.target.value || null)}
            onBlur={save}
            onKeyDown={handleKeyDown}
            className={inputClasses}
            disabled={saving}
          />
        );

      case 'time':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="time"
            value={editValue != null ? String(editValue) : ''}
            onChange={(e) => setEditValue(e.target.value || null)}
            onBlur={save}
            onKeyDown={handleKeyDown}
            className={inputClasses}
            disabled={saving}
          />
        );

      case 'datetime':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="datetime-local"
            value={editValue != null ? String(editValue).slice(0, 16) : ''}
            onChange={(e) => setEditValue(e.target.value ? new Date(e.target.value).toISOString() : null)}
            onBlur={save}
            onKeyDown={handleKeyDown}
            className={inputClasses}
            disabled={saving}
          />
        );

      case 'dropdown':
      case 'radio_button':
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue != null ? String(editValue) : ''}
            onChange={(e) => { setEditValue(e.target.value || null); }}
            onBlur={save}
            onKeyDown={handleKeyDown}
            className={inputClasses}
            disabled={saving}
          >
            <option value="">-</option>
            {(field.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label[lang] || opt.label.ja || opt.value}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
      case 'multi_select': {
        const selected = Array.isArray(editValue) ? (editValue as string[]) : [];
        return (
          <div className="flex flex-col gap-1" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) save(); }}>
            {(field.options || []).map((opt) => (
              <label key={opt.value} className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selected, opt.value]
                      : selected.filter(v => v !== opt.value);
                    setEditValue(next);
                  }}
                  className="rounded border-gray-300"
                  disabled={saving}
                />
                {opt.label[lang] || opt.label.ja || opt.value}
              </label>
            ))}
            <button type="button" onClick={save} className="mt-1 text-xs text-brand-600 hover:underline">OK</button>
          </div>
        );
      }

      default:
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue != null ? String(editValue) : ''}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={save}
            onKeyDown={handleKeyDown}
            className={inputClasses}
            disabled={saving}
          />
        );
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()} className="relative">
      {renderEditor()}
      {saving && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
