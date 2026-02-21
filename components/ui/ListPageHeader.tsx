'use client';

import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';

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
}

export function ListPageHeader({
  searchValue,
  onSearchChange,
  searchPlaceholder = '検索...',
  totalCount,
  countLabel,
  filters,
  addButton,
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
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* 検索BOX */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
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

      {/* フィルター群 */}
      {filters}

      {/* 件数表示 */}
      {totalCount !== undefined && countLabel && (
        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {totalCount}{countLabel}
        </span>
      )}

      {/* 右寄せスペーサー */}
      <div className="flex-1" />

      {/* 追加ボタン */}
      {addButton && (
        <button
          type="button"
          onClick={addButton.onClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 whitespace-nowrap"
        >
          {addButton.icon}
          {addButton.label}
        </button>
      )}
    </div>
  );
}
