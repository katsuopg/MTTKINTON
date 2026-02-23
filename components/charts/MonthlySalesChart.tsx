'use client';

import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { WorkNoRecord, InvoiceRecord } from '@/types/kintone';
import type { Language } from '@/lib/kintone/field-mappings';

interface MonthlySalesChartProps {
  workNos: WorkNoRecord[];
  invoices: InvoiceRecord[];
  language: Language;
  locale: string;
}

// 第14期: 2025/7 ~ 2026/6（会計年度の月順）
// month は Date.getMonth() の 0-based 値
const FISCAL_MONTHS = [
  { month: 6, year: 2025 },  // Jul
  { month: 7, year: 2025 },  // Aug
  { month: 8, year: 2025 },  // Sep
  { month: 9, year: 2025 },  // Oct
  { month: 10, year: 2025 }, // Nov
  { month: 11, year: 2025 }, // Dec
  { month: 0, year: 2026 },  // Jan
  { month: 1, year: 2026 },  // Feb
  { month: 2, year: 2026 },  // Mar
  { month: 3, year: 2026 },  // Apr
  { month: 4, year: 2026 },  // May
  { month: 5, year: 2026 },  // Jun
];

const LABELS_EN = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const LABELS_TH = ['ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'];

function getLabels(lang: Language) {
  return lang === 'th' ? LABELS_TH : LABELS_EN;
}

/** 当月の会計月インデックスを返す（0=Jul ... 11=Jun） */
function getCurrentFiscalIndex(): number {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return FISCAL_MONTHS.findIndex((fm) => fm.month === m && fm.year === y);
}

/** Date文字列 → FISCAL_MONTHS のインデックス (-1 = 範囲外) */
function toFiscalIndex(dateStr: string | undefined): number {
  if (!dateStr) return -1;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return -1;
  return FISCAL_MONTHS.findIndex((fm) => fm.month === d.getMonth() && fm.year === d.getFullYear());
}

interface MonthBucket {
  name: string;
  actual: number;      // 実績（請求書ベース）
  forecast: number;    // 予定（工事番号ベース）
  actualCount: number;
  forecastCount: number;
  isActual: boolean;   // この月が実績月かどうか
}

export default function MonthlySalesChart({ workNos, invoices, language }: MonthlySalesChartProps) {
  const labels = getLabels(language);
  const currentIdx = getCurrentFiscalIndex();

  const { chartData, actualTotal, forecastTotal } = useMemo(() => {
    // 当月より前 = 実績月、当月以降 = 予定月
    const buckets: MonthBucket[] = FISCAL_MONTHS.map((_, i) => ({
      name: labels[i],
      actual: 0,
      forecast: 0,
      actualCount: 0,
      forecastCount: 0,
      isActual: currentIdx >= 0 ? i < currentIdx : false,
    }));

    // --- 実績: 請求書の日付(日付)ベースで月別集計 ---
    invoices.forEach((inv) => {
      const idx = toFiscalIndex(inv.日付?.value);
      if (idx === -1 || !buckets[idx].isActual) return;
      buckets[idx].actual += parseFloat(inv.total?.value || '0');
      buckets[idx].actualCount += 1;
    });

    // --- 予定: 工事番号のSalesdateベースで当月以降を集計 ---
    workNos.forEach((record) => {
      const idx = toFiscalIndex(record.Salesdate?.value);
      if (idx === -1 || buckets[idx].isActual) return;
      buckets[idx].forecast += parseFloat(record.grand_total?.value || '0');
      buckets[idx].forecastCount += 1;
    });

    const aTotal = buckets.reduce((s, b) => s + b.actual, 0);
    const fTotal = buckets.reduce((s, b) => s + b.forecast, 0);
    return { chartData: buckets, actualTotal: aTotal, forecastTotal: fTotal };
  }, [workNos, invoices, labels, currentIdx]);

  // --- ヘルパー ---
  const fmt = (v: number) =>
    new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(v);

  const fmtAxis = (v: number) => {
    if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
    if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
    return v.toString();
  };

  // --- 多言語ラベル ---
  const t = {
    title:    language === 'ja' ? '第14期 月別売上' : language === 'th' ? 'ยอดขายรายเดือน (ปีที่ 14)' : 'Monthly Sales (FY14)',
    actual:   language === 'ja' ? '実績' : language === 'th' ? 'จริง' : 'Actual',
    forecast: language === 'ja' ? '予定' : language === 'th' ? 'คาดการณ์' : 'Forecast',
    amount:   language === 'ja' ? '金額' : language === 'th' ? 'ยอดเงิน' : 'Amount',
    count:    language === 'ja' ? '件数' : language === 'th' ? 'จำนวน' : 'Count',
    total:    language === 'ja' ? '合計' : language === 'th' ? 'รวม' : 'Total',
  };

  // --- ツールチップ ---
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d: MonthBucket = payload[0].payload;
    const amount = d.isActual ? d.actual : d.forecast;
    const count  = d.isActual ? d.actualCount : d.forecastCount;
    const tag    = d.isActual ? t.actual : t.forecast;

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <p className="mb-1.5 text-sm font-medium text-gray-800 dark:text-white/90">
          {label}
          <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            d.isActual
              ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
              : 'bg-brand-50 text-brand-400 dark:bg-brand-500/10 dark:text-brand-300'
          }`}>
            {tag}
          </span>
        </p>
        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <span className={`inline-block h-3 w-3 rounded-sm ${d.isActual ? 'bg-brand-500' : 'bg-brand-300'}`} />
            <span>{t.amount}: {fmt(amount)} THB</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm bg-success-500" />
            <span>{t.count}: {count}</span>
          </div>
        </div>
      </div>
    );
  };

  // チャート用に統合値を生成（実績月はactual、予定月はforecast）
  const mergedData = chartData.map((d) => ({
    ...d,
    amount: d.isActual ? d.actual : d.forecast,
    count: d.isActual ? d.actualCount : d.forecastCount,
  }));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      {/* ヘッダー */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{t.title}</h3>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">2025/07 — 2026/06</p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">{t.actual}</p>
            <p className="text-base font-bold text-gray-800 dark:text-white/90">
              {fmt(actualTotal)} <span className="text-xs font-normal">THB</span>
            </p>
          </div>
          <div>
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">{t.forecast}</p>
            <p className="text-base font-bold text-brand-400 dark:text-brand-300">
              {fmt(forecastTotal)} <span className="text-xs font-normal">THB</span>
            </p>
          </div>
          <div>
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">{t.total}</p>
            <p className="text-base font-bold text-gray-800 dark:text-white/90">
              {fmt(actualTotal + forecastTotal)} <span className="text-xs font-normal">THB</span>
            </p>
          </div>
        </div>
      </div>

      {/* チャート */}
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={mergedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-gray-500 dark:text-gray-400"
          />
          <YAxis
            yAxisId="left"
            tickFormatter={fmtAxis}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={50}
            className="text-gray-500 dark:text-gray-400"
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={30}
            allowDecimals={false}
            className="text-gray-500 dark:text-gray-400"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />

          {/* 金額バー: 実績=brand-500, 予定=amber-400 */}
          <Bar yAxisId="left" dataKey="amount" radius={[4, 4, 0, 0]}>
            {mergedData.map((entry, idx) => (
              <Cell key={idx} fill={entry.isActual ? '#465fff' : '#93b4ff'} />
            ))}
          </Bar>

          {/* 件数: 折れ線グラフ */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="count"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* 凡例 */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-theme-sm">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand-500" />
          <span className="text-gray-500 dark:text-gray-400">{t.actual} (THB)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand-300" />
          <span className="text-gray-500 dark:text-gray-400">{t.forecast} (THB)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-success-500" />
          <span className="text-gray-500 dark:text-gray-400">{t.count}</span>
        </div>
      </div>
      {/* TODO: 今後、見積データ（QuotationRecord）を予測として追加予定 */}
    </div>
  );
}
