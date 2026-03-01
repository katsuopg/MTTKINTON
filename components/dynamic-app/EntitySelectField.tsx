'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import type { FieldDefinition } from '@/types/dynamic-app';

interface EntityItem {
  id: string;
  label: string;
  label_en?: string | null;
  label_th?: string | null;
  sub?: string;
  department?: string | null;
  is_system_role?: boolean;
}

interface EntitySelectFieldProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  locale: string;
  entityType: 'user' | 'org' | 'role';
}

export default function EntitySelectField({
  field,
  value,
  onChange,
  locale,
  entityType,
}: EntitySelectFieldProps) {
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const allowMultiple = field.validation?.allow_multiple === true;

  const [search, setSearch] = useState('');
  const [items, setItems] = useState<EntityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [resolvedItems, setResolvedItems] = useState<Map<string, EntityItem>>(new Map());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 選択値をID配列として取得
  const selectedIds: string[] = allowMultiple
    ? (Array.isArray(value) ? value as string[] : [])
    : (value && typeof value === 'string' ? [value] : []);

  // ID→表示名解決
  useEffect(() => {
    const unresolvedIds = selectedIds.filter(id => !resolvedItems.has(id));
    if (unresolvedIds.length === 0) return;

    const resolveIds = async () => {
      try {
        const res = await fetch(`/api/apps/entity-search?type=${entityType}&ids=${unresolvedIds.join(',')}`);
        if (res.ok) {
          const data = await res.json();
          setResolvedItems(prev => {
            const next = new Map(prev);
            for (const item of data.items as EntityItem[]) {
              next.set(item.id, item);
            }
            return next;
          });
        }
      } catch { /* skip */ }
    };
    resolveIds();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds.join(','), entityType]);

  // 検索API
  const fetchItems = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/apps/entity-search?type=${entityType}&search=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch { /* skip */ }
    setLoading(false);
  }, [entityType]);

  // 検索デバウンス
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchItems(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, open, fetchItems]);

  // 外部クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: EntityItem) => {
    // 解決済みマップに追加
    setResolvedItems(prev => {
      const next = new Map(prev);
      next.set(item.id, item);
      return next;
    });

    if (allowMultiple) {
      if (selectedIds.includes(item.id)) return;
      onChange([...selectedIds, item.id]);
    } else {
      onChange(item.id);
      setOpen(false);
      setSearch('');
    }
  };

  const handleRemove = (id: string) => {
    if (allowMultiple) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange('');
    }
  };

  const getDisplayName = (item: EntityItem): string => {
    if (lang === 'th' && item.label_th) return item.label_th;
    if (lang === 'en' && item.label_en) return item.label_en;
    return item.label;
  };

  const placeholders: Record<string, Record<string, string>> = {
    user: { ja: 'ユーザーを検索...', en: 'Search users...', th: 'ค้นหาผู้ใช้...' },
    org: { ja: '組織を検索...', en: 'Search organizations...', th: 'ค้นหาองค์กร...' },
    role: { ja: 'グループを検索...', en: 'Search groups...', th: 'ค้นหากลุ่ม...' },
  };
  const noResultsText: Record<string, string> = {
    ja: '該当なし', en: 'No results', th: 'ไม่พบผลลัพธ์',
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* 選択済みタグ（複数選択時） */}
      {allowMultiple && selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {selectedIds.map(id => {
            const resolved = resolvedItems.get(id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
              >
                {resolved ? getDisplayName(resolved) : id.slice(0, 8)}
                <button
                  type="button"
                  onClick={() => handleRemove(id)}
                  className="hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* 検索入力 */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={!allowMultiple && !open && selectedIds.length > 0
            ? (resolvedItems.get(selectedIds[0])
              ? getDisplayName(resolvedItems.get(selectedIds[0])!)
              : selectedIds[0].slice(0, 8))
            : search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            if (!allowMultiple && selectedIds.length > 0) {
              setSearch('');
            }
          }}
          placeholder={placeholders[entityType]?.[lang] || 'Search...'}
          className="w-full pl-8 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
        {!allowMultiple && selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => { handleRemove(selectedIds[0]); setSearch(''); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />
        )}
      </div>

      {/* ドロップダウン */}
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          {items.length === 0 && !loading && (
            <p className="px-3 py-2 text-xs text-gray-400">{noResultsText[lang]}</p>
          )}
          {items.map(item => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                disabled={isSelected}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between ${
                  isSelected ? 'opacity-40 cursor-default' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="text-gray-800 dark:text-gray-200 truncate">
                    {getDisplayName(item)}
                  </p>
                  {item.sub && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.sub}</p>
                  )}
                </div>
                {item.is_system_role && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded flex-shrink-0 ml-2">
                    System
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
