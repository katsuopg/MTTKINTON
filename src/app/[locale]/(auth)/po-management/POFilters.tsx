'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface POFiltersProps {
  locale: string;
  language: 'ja' | 'th' | 'en';
}

export default function POFilters({ locale, language }: POFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const notArrived = searchParams.get('notArrived') === 'true';
  const alertOnly = searchParams.get('alertOnly') === 'true';
  const fiscalYear = searchParams.get('fiscalYear') || '14';

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKeyword(value);
    // リアルタイム検索のため、入力の度に更新
    updateFilters({ keyword: value });
  };

  const updateFilters = (updates: Partial<{
    keyword: string;
    notArrived: boolean;
    alertOnly: boolean;
  }>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update keyword
    if ('keyword' in updates) {
      if (updates.keyword) {
        params.set('keyword', updates.keyword);
      } else {
        params.delete('keyword');
      }
    }
    
    // Update notArrived
    if ('notArrived' in updates) {
      if (updates.notArrived) {
        params.set('notArrived', 'true');
      } else {
        params.delete('notArrived');
      }
    }
    
    // Update alertOnly
    if ('alertOnly' in updates) {
      if (updates.alertOnly) {
        params.set('alertOnly', 'true');
      } else {
        params.delete('alertOnly');
      }
    }

    router.push(`/${locale}/po-management?${params.toString()}`);
  };

  return (
    <>
      {/* キーワード検索 */}
      <div className="flex items-center">
        <input
          type="text"
          value={keyword}
          onChange={handleKeywordChange}
          placeholder={
            language === 'ja' ? 'キーワード検索...' :
            language === 'th' ? 'ค้นหา...' :
            'Search...'
          }
          className="h-10 w-48 rounded-lg border border-gray-300 bg-transparent px-3 py-2.5 text-theme-sm text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10"
        />
      </div>

      {/* Not Arrived フィルター */}
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={notArrived}
          onChange={(e) => updateFilters({ notArrived: e.target.checked })}
          className="h-4 w-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
        />
        <span className="ml-2 text-theme-sm text-gray-700 dark:text-gray-300">
          {language === 'ja' ? '未着' : language === 'th' ? 'ยังไม่มาถึง' : 'Not arrived'}
        </span>
      </label>

      {/* アラートフィルター */}
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={alertOnly}
          onChange={(e) => updateFilters({ alertOnly: e.target.checked })}
          className="h-4 w-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
        />
        <span className="ml-2 text-theme-sm text-gray-700 dark:text-gray-300">
          {language === 'ja' ? 'アラート' : language === 'th' ? 'แจ้งเตือน' : 'Alert'}
        </span>
      </label>
    </>
  );
}