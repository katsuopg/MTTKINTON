'use client';

import { Language } from '@/lib/kintone/field-mappings';

interface SearchFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  totalCount: number;
  countLabel: string;
  showPeriodFilter?: boolean;
  selectedPeriod?: string;
  onPeriodChange?: (value: string) => void;
  availablePeriods?: string[];
  periodOptions?: { value: string; label: string }[];
  periodLabel?: string;
  language: Language;
}

export default function SearchFilter({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  totalCount,
  countLabel,
  showPeriodFilter = false,
  selectedPeriod = '',
  onPeriodChange,
  availablePeriods = [],
  periodOptions,
  periodLabel,
  language,
}: SearchFilterProps) {
  const getPeriodLabel = (period: string) => {
    if (!period) {
      return language === 'ja' ? '全期間' : language === 'th' ? 'ทุกงวด' : 'All Periods';
    }
    return language === 'ja' ? `第${period}期` : language === 'th' ? `งวด ${period}` : `Period ${period}`;
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        {/* 検索フィールド - TailAdminスタイル */}
        <div className="flex-1">
          <label htmlFor="search" className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {searchPlaceholder}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              id="search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 text-theme-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
              placeholder={searchPlaceholder}
            />
          </div>
        </div>

        {/* 期間フィルター - TailAdminスタイル */}
        {(showPeriodFilter || periodOptions) && onPeriodChange && (
          <div className="w-full sm:w-auto">
            <label htmlFor="period" className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {periodLabel || (language === 'ja' ? '会計期間' : language === 'th' ? 'งวดบัญชี' : 'Fiscal Period')}
            </label>
            <select
              id="period"
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-theme-sm bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
            >
              {periodOptions ? (
                periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))
              ) : (
                <>
                  <option value="">{getPeriodLabel('')}</option>
                  {availablePeriods.map((period) => (
                    <option key={period} value={period}>
                      {getPeriodLabel(period)}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        )}
      </div>

      {/* 件数表示 - TailAdminスタイル */}
      <div className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
        {totalCount} {countLabel}
      </div>
    </div>
  );
}