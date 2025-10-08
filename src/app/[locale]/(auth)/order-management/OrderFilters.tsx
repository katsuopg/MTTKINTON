'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Language } from '@/lib/kintone/field-mappings';

interface OrderFiltersProps {
  currentYear: number;
  locale: string;
  language: Language;
}

export default function OrderFilters({ currentYear, locale, language }: OrderFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set('fiscalYear', newYear);
    router.push(`/${locale}/order-management?${params.toString()}`);
  };

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKeyword(value);
    
    // デバウンスを使用して検索
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('keyword', value);
      } else {
        params.delete('keyword');
      }
      router.push(`/${locale}/order-management?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="flex items-center space-x-4">
      {/* 会計期間セレクター */}
      <div className="flex items-center space-x-3">
        <label className="text-sm font-medium text-gray-700">
          {language === 'ja' ? '会計期間:' : language === 'th' ? 'ปีงบประมาณ:' : 'Fiscal Year:'}
        </label>
        <select
          value={currentYear}
          onChange={handleYearChange}
          className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          {[14, 13, 12, 11, 10, 9, 8].map((year) => (
            <option key={year} value={year}>
              {language === 'ja' ? `第${year}期` : language === 'th' ? `ปีงบประมาณที่ ${year}` : `FY ${year}`}
            </option>
          ))}
        </select>
      </div>
      
      {/* キーワード検索 */}
      <div className="flex-1 max-w-md">
        <input
          type="text"
          value={keyword}
          onChange={handleKeywordChange}
          placeholder={language === 'ja' ? 'PO番号、顧客名、工事番号で検索...' : 'Search by PO No., Customer, Work No...'}
          className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>
  );
}