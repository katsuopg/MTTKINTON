'use client';

import { useState, useCallback, useEffect } from 'react';

interface SearchFilterProps {
  // 検索関連
  searchValue?: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  // 期間フィルター関連
  showPeriodFilter?: boolean;
  periodOptions?: { value: string; label: string }[];
  availablePeriods?: string[]; // 新規追加: 利用可能な期間リスト
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
  periodLabel?: string;
  language?: 'ja' | 'en' | 'th'; // 新規追加: 言語設定
  
  // 件数表示
  totalCount?: number;
  countLabel?: string;
  
  // スタイリング
  className?: string;
}

export default function SearchFilter({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = '検索...',
  showPeriodFilter = true,
  periodOptions,
  availablePeriods,
  selectedPeriod = '',
  onPeriodChange,
  periodLabel = '会計期間:',
  totalCount,
  countLabel = '件の工事番号',
  className = '',
  language = 'ja',
}: SearchFilterProps) {
  const [searchInput, setSearchInput] = useState(searchValue);

  // リアルタイム検索のためのデバウンス処理
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearchChange(searchInput);
    }, 300); // 300ms後に検索実行

    return () => clearTimeout(timeoutId);
  }, [searchInput, onSearchChange]);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  const handlePeriodChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onPeriodChange) {
      onPeriodChange(e.target.value);
    }
  }, [onPeriodChange]);

  // 期間オプションの動的生成
  const getPeriodOptions = () => {
    try {
      if (availablePeriods && Array.isArray(availablePeriods) && availablePeriods.length > 0) {
        // availablePeriodsが提供された場合（請求書管理など）
        const allOption = { value: '', label: language === 'ja' ? '全期間' : 'All Periods' };
        const periodOptionsFromAvailable = availablePeriods.map(period => ({
          value: period,
          label: period
        }));
        return [allOption, ...periodOptionsFromAvailable];
      } else if (periodOptions && Array.isArray(periodOptions) && periodOptions.length > 0) {
        // periodOptionsが提供された場合（従来の工事番号管理など）
        return periodOptions;
      } else {
        // デフォルトの期間オプション
        return [
          { value: '14', label: '25-26' },
          { value: '13', label: '24-25' },
          { value: '12', label: '23-24' },
        ];
      }
    } catch (error) {
      console.error('Error in getPeriodOptions:', error);
      // エラーが発生した場合はデフォルトを返す
      return [
        { value: '14', label: '25-26' },
        { value: '13', label: '24-25' },
        { value: '12', label: '23-24' },
      ];
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-4 mb-6 ${className}`}>
      {/* 期間フィルター - TailAdminスタイル */}
      {showPeriodFilter && (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <label className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
            {periodLabel}
          </label>
          <select
            value={selectedPeriod}
            onChange={handlePeriodChange}
            className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-theme-sm bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
          >
            {(getPeriodOptions() || []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 件数表示 - TailAdminスタイル */}
      {totalCount !== undefined && (
        <div className="text-theme-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {totalCount}{countLabel}
        </div>
      )}

      {/* 検索フィールド - TailAdminスタイル */}
      <div className="flex-1 max-w-xs">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchInputChange}
            placeholder={searchPlaceholder}
            className="w-full py-2.5 pl-10 pr-4 text-theme-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
          />
        </div>
      </div>
    </div>
  );
}