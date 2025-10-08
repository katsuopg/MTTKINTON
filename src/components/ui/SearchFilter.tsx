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
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            {searchPlaceholder}
          </label>
          <input
            type="text"
            id="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder={searchPlaceholder}
          />
        </div>
        
        {showPeriodFilter && onPeriodChange && (
          <div className="w-full sm:w-auto">
            <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'ja' ? '会計期間' : language === 'th' ? 'งวดบัญชี' : 'Fiscal Period'}
            </label>
            <select
              id="period"
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">{getPeriodLabel('')}</option>
              {availablePeriods.map((period) => (
                <option key={period} value={period}>
                  {getPeriodLabel(period)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="mt-2 text-sm text-gray-600">
        {totalCount} {countLabel}
      </div>
    </div>
  );
}