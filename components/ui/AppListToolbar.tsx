'use client';

import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Search, Filter, Plus, Settings, X } from 'lucide-react';
import Link from 'next/link';
import { ToolbarMoreMenu } from './ToolbarMoreMenu';

interface AppListToolbarProps {
  // 検索
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  // 件数
  totalCount?: number;
  countLabel?: string;

  // フィルター（既存ReactNode互換）
  inlineFilters?: ReactNode;

  // カスタムアクション（右寄せ）
  customActions?: ReactNode;

  // 追加ボタン
  addButton?: { label: string; onClick: () => void; icon?: ReactNode };

  // 設定
  settingsHref?: string;

  // ⋯メニュー
  moreMenu?: {
    pageSize?: { current: number; options: number[]; onChange: (size: number) => void };
    stickyHeader?: { enabled: boolean; onChange: (v: boolean) => void };
    exportCsv?: { href?: string; onClick?: () => void; label?: string };
    importCsv?: { onClick: () => void; label?: string };
    custom?: Array<{ key: string; label: string; icon?: ReactNode; onClick: () => void }>;
  };

  // ビュー（動的アプリ用、Phase 1はoptional）
  views?: Array<{ id: string; name: string; type: string; isActive: boolean }>;
  onViewChange?: (viewId: string) => void;

  locale?: string;
}

// 多言語テキスト取得用
function useToolbarLabels(locale?: string) {
  // messages JSONから直接取得（軽量化のためハードコード対応、messages更新時に同期）
  const labels: Record<string, Record<string, string>> = {
    ja: {
      search: '検索...',
      filter: 'フィルター',
      totalCount: '{count}件',
      countPerPage: '表示件数',
      stickyHeader: '先頭行固定',
      exportCsv: 'CSVエクスポート',
      importCsv: 'CSVインポート',
      settings: '設定',
      addNew: '追加',
    },
    en: {
      search: 'Search...',
      filter: 'Filter',
      totalCount: '{count} items',
      countPerPage: 'Items per page',
      stickyHeader: 'Sticky header',
      exportCsv: 'Export CSV',
      importCsv: 'Import CSV',
      settings: 'Settings',
      addNew: 'Add',
    },
    th: {
      search: 'ค้นหา...',
      filter: 'ตัวกรอง',
      totalCount: '{count} รายการ',
      countPerPage: 'จำนวนต่อหน้า',
      stickyHeader: 'ตรึงแถวส่วนหัว',
      exportCsv: 'ส่งออก CSV',
      importCsv: 'นำเข้า CSV',
      settings: 'ตั้งค่า',
      addNew: 'เพิ่ม',
    },
  };
  return labels[locale || 'ja'] || labels.ja;
}

export function AppListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  totalCount,
  countLabel,
  inlineFilters,
  customActions,
  addButton,
  settingsHref,
  moreMenu,
  locale,
}: AppListToolbarProps) {
  const [inputValue, setInputValue] = useState(searchValue);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const t = useToolbarLabels(locale);

  // 外部からの値変更を反映
  useEffect(() => {
    setInputValue(searchValue);
  }, [searchValue]);

  // 300ms デバウンス
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== searchValue) {
        onSearchChange(inputValue);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, searchValue, onSearchChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setInputValue('');
    onSearchChange('');
  }, [onSearchChange]);

  const hasFilters = !!inlineFilters;

  return (
    <div className="px-4 py-2.5 border-b border-gray-200 dark:border-white/[0.05]">
      {/* デスクトップ: 1行レイアウト */}
      <div className="hidden sm:flex items-center gap-2">
        {/* 検索 */}
        <div className="relative flex-none w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={inputValue}
            onChange={handleChange}
            placeholder={searchPlaceholder || t.search}
            className="w-full pl-10 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:placeholder-gray-500"
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* フィルタートグル */}
        {hasFilters && (
          <button
            type="button"
            onClick={() => setFiltersVisible((v) => !v)}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
              filtersVisible
                ? 'text-brand-500 bg-brand-50 dark:text-brand-400 dark:bg-brand-500/10'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/[0.05]'
            }`}
            title={t.filter}
          >
            <Filter size={16} />
          </button>
        )}

        {/* インラインフィルタ */}
        {hasFilters && filtersVisible && inlineFilters}

        {/* 件数 */}
        {totalCount !== undefined && (
          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {countLabel ? `${totalCount}${countLabel}` : t.totalCount.replace('{count}', String(totalCount))}
          </span>
        )}

        {/* スペーサー */}
        <div className="flex-1" />

        {/* カスタムアクション */}
        {customActions}

        {/* 追加ボタン */}
        {addButton && (
          <button
            type="button"
            onClick={addButton.onClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 whitespace-nowrap"
          >
            {addButton.icon || <Plus size={16} />}
            {addButton.label}
          </button>
        )}

        {/* 設定アイコン */}
        {settingsHref && (
          <Link
            href={settingsHref}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/[0.05] transition-colors"
            title={t.settings}
          >
            <Settings size={18} />
          </Link>
        )}

        {/* ⋯メニュー */}
        {moreMenu && (
          <ToolbarMoreMenu
            {...moreMenu}
            labels={{
              countPerPage: t.countPerPage,
              stickyHeader: t.stickyHeader,
              exportCsv: t.exportCsv,
              importCsv: t.importCsv,
            }}
          />
        )}
      </div>

      {/* モバイル: 2段構成 */}
      <div className="sm:hidden">
        {/* 段1: 検索 + 追加 + メニュー */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              inputMode="search"
              enterKeyHint="search"
              value={inputValue}
              onChange={handleChange}
              placeholder={searchPlaceholder || t.search}
              className="w-full pl-10 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:placeholder-gray-500"
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* フィルタートグル（モバイル） */}
          {hasFilters && (
            <button
              type="button"
              onClick={() => setFiltersVisible((v) => !v)}
              className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-colors ${
                filtersVisible
                  ? 'text-brand-500 bg-brand-50 dark:text-brand-400 dark:bg-brand-500/10'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/[0.05]'
              }`}
            >
              <Filter size={18} />
            </button>
          )}

          {/* 追加ボタン（モバイル：アイコンのみ） */}
          {addButton && (
            <button
              type="button"
              onClick={addButton.onClick}
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg shadow-sm text-white bg-brand-500 hover:bg-brand-600"
            >
              {addButton.icon || <Plus size={20} />}
            </button>
          )}

          {/* ⋯メニュー（モバイル） */}
          {moreMenu && (
            <ToolbarMoreMenu
              {...moreMenu}
              labels={{
                countPerPage: t.countPerPage,
                stickyHeader: t.stickyHeader,
                exportCsv: t.exportCsv,
                importCsv: t.importCsv,
              }}
            />
          )}
        </div>

        {/* 段2: フィルター + 件数 */}
        {(hasFilters || totalCount !== undefined) && (
          <div className="flex items-center gap-2 mt-2 overflow-x-auto">
            {hasFilters && filtersVisible && inlineFilters}
            {totalCount !== undefined && (
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {countLabel ? `${totalCount}${countLabel}` : t.totalCount.replace('{count}', String(totalCount))}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
