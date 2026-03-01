'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarRecord {
  id: string;
  record_number: number;
  data: Record<string, unknown>;
  [key: string]: unknown;
}

interface DynamicCalendarViewProps {
  records: CalendarRecord[];
  dateField: string;
  titleField?: string;
  locale: string;
  onRecordClick: (recordId: string) => void;
}

export default function DynamicCalendarView({
  records,
  dateField,
  titleField,
  locale,
  onRecordClick,
}: DynamicCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const monthLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : locale === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: 'long',
    });
    return formatter.format(currentDate);
  }, [currentDate, locale]);

  // 月のカレンダーグリッドを作成
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0=日, 1=月, ...

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // 前月の日
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
    }

    // 今月の日
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }

    // 次月の日（6行埋める）
    while (days.length < 42) {
      const nextD = days.length - startDayOfWeek - lastDay.getDate() + 1;
      days.push({ date: new Date(year, month + 1, nextD), isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  // レコードを日付でマップ
  const recordsByDate = useMemo(() => {
    const map: Record<string, CalendarRecord[]> = {};
    for (const record of records) {
      const dateValue = (record.data?.[dateField] as string) || (record[dateField] as string);
      if (!dateValue) continue;
      const dateStr = dateValue.slice(0, 10); // YYYY-MM-DD
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(record);
    }
    return map;
  }, [records, dateField]);

  const getRecordTitle = (record: CalendarRecord) => {
    if (titleField && record.data?.[titleField]) {
      return String(record.data[titleField]);
    }
    return `#${record.record_number}`;
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const weekDayLabels = locale === 'ja'
    ? ['日', '月', '火', '水', '木', '金', '土']
    : locale === 'th'
      ? ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h3 className="min-w-[160px] text-center text-lg font-semibold text-gray-900 dark:text-white">
            {monthLabel}
          </h3>
          <button onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <button
          onClick={goToday}
          className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {locale === 'ja' ? '今日' : locale === 'th' ? 'วันนี้' : 'Today'}
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {weekDayLabels.map((label, i) => (
          <div
            key={label}
            className={`py-2 text-center text-xs font-medium ${
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, i) => {
          const dateStr = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`;
          const dayRecords = recordsByDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          const dayOfWeek = day.date.getDay();

          return (
            <div
              key={i}
              className={`min-h-[80px] border-b border-r border-gray-100 p-1 dark:border-gray-800 ${
                !day.isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900/30' : ''
              } ${i % 7 === 0 ? 'border-l' : ''}`}
            >
              <div
                className={`mb-0.5 text-xs ${
                  isToday
                    ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white'
                    : !day.isCurrentMonth
                      ? 'text-gray-400 dark:text-gray-600'
                      : dayOfWeek === 0
                        ? 'text-red-500'
                        : dayOfWeek === 6
                          ? 'text-blue-500'
                          : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {day.date.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayRecords.slice(0, 3).map(record => (
                  <button
                    key={record.id}
                    onClick={() => onRecordClick(record.id)}
                    className="block w-full truncate rounded bg-brand-50 px-1 py-0.5 text-left text-[10px] text-brand-700 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:bg-brand-900/40"
                  >
                    {getRecordTitle(record)}
                  </button>
                ))}
                {dayRecords.length > 3 && (
                  <span className="block text-center text-[10px] text-gray-400">
                    +{dayRecords.length - 3}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
