'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface FiscalYearSelectProps {
  currentYear: number;
  locale: string;
  language: 'ja' | 'th' | 'en';
}

export default function FiscalYearSelect({ currentYear, locale, language }: FiscalYearSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set('fiscalYear', newYear);
    const currentPath = window.location.pathname;
    router.push(`${currentPath}?${params.toString()}`);
  };

  return (
    <div className="flex items-center space-x-3">
      <label className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
        {language === 'ja' ? '会計期間:' : language === 'th' ? 'ปีงบประมาณ:' : 'Fiscal Year:'}
      </label>
      <select
        value={currentYear}
        onChange={handleChange}
        className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 py-2.5 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10"
      >
        {[14, 13, 12, 11, 10, 9, 8].map((year) => (
          <option key={year} value={year}>
            {language === 'ja' ? `第${year}期` : language === 'th' ? `ปีงบประมาณที่ ${year}` : `FY ${year}`}
          </option>
        ))}
      </select>
    </div>
  );
}