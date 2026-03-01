'use client';

import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Search, Settings, Download } from 'lucide-react';
import Link from 'next/link';

interface ListPageHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  totalCount?: number;
  countLabel?: string;
  filters?: ReactNode;
  addButton?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  settingsHref?: string;
  exportHref?: string;
  exportLabel?: string;
}

export function ListPageHeader({
  searchValue,
  onSearchChange,
  searchPlaceholder = '検索...',
  totalCount,
  countLabel,
  filters,
  addButton,
  settingsHref,
  exportHref,
  exportLabel,
}: ListPageHeaderProps) {
  const [inputValue, setInputValue] = useState(searchValue);

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

  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-white/[0.05] sm:px-5">
      {/* 1段目: 検索 + 追加ボタン */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0 sm:flex-none sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={inputValue}
            onChange={handleChange}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:placeholder-gray-500"
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* デスクトップ: フィルター・件数を1段目に表示 */}
        <div className="hidden sm:contents">
          {filters}
          {totalCount !== undefined && countLabel && (
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {totalCount}{countLabel}
            </span>
          )}
        </div>

        {/* CSVエクスポート */}
        {exportHref && (
          <a
            href={exportHref}
            download
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-white/[0.05] transition-colors flex-shrink-0"
            title={exportLabel || 'Export CSV'}
          >
            <Download size={18} />
          </a>
        )}

        {/* 設定アイコン */}
        {settingsHref && (
          <Link
            href={settingsHref}
            className="sm:ml-auto inline-flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-white/[0.05] transition-colors flex-shrink-0"
            title="Settings"
          >
            <Settings size={18} />
          </Link>
        )}

        {/* 追加ボタン */}
        {addButton && (
          <button
            type="button"
            onClick={addButton.onClick}
            className={`${settingsHref ? '' : 'sm:ml-auto '}inline-flex items-center min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 justify-center sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 whitespace-nowrap flex-shrink-0`}
          >
            {/* モバイル: アイコンのみ */}
            <span className="sm:hidden">{addButton.icon || <span className="text-lg">+</span>}</span>
            {/* デスクトップ: アイコン+テキスト */}
            <span className="hidden sm:inline-flex sm:items-center sm:gap-1">
              {addButton.icon}{addButton.label}
            </span>
          </button>
        )}
      </div>

      {/* 2段目: フィルター + 件数（モバイルのみ、要素がある場合） */}
      {(filters || (totalCount !== undefined && countLabel)) && (
        <div className="flex items-center gap-2 mt-2 overflow-x-auto sm:hidden">
          {filters}
          {totalCount !== undefined && countLabel && (
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {totalCount}{countLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
