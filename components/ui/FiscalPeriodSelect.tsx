'use client';

interface FiscalPeriodSelectProps {
  value: string;
  onChange: (v: string) => void;
  locale?: string;
  periods?: string[];
}

const DEFAULT_PERIODS = ['8', '9', '10', '11', '12', '13', '14'];

export function FiscalPeriodSelect({
  value,
  onChange,
  locale = 'en',
  periods = DEFAULT_PERIODS,
}: FiscalPeriodSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-theme-sm text-gray-500 dark:text-gray-400">
        {locale === 'ja' ? '会計期間:' : 'Period:'}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 text-theme-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        {periods.map((period) => (
          <option key={period} value={period}>
            {locale === 'ja' ? `第${period}期` : `Period ${period}`}
          </option>
        ))}
      </select>
    </div>
  );
}
