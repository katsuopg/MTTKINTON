'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { InvoiceRecord, WorkNoRecord, QuotationRecord } from '@/types/kintone';
import type { Language } from '@/lib/kintone/field-mappings';

interface SalesChartProps {
  invoiceRecords: InvoiceRecord[];
  workNoRecords?: WorkNoRecord[];
  quotationRecords?: QuotationRecord[];
  language: Language;
}

// 会計期間の定義（7月始まり）
const fiscalPeriods = [
  { period: '9', label: '第9期', startDate: '2020-07-01', endDate: '2021-06-30' },
  { period: '10', label: '第10期', startDate: '2021-07-01', endDate: '2022-06-30' },
  { period: '11', label: '第11期', startDate: '2022-07-01', endDate: '2023-06-30' },
  { period: '12', label: '第12期', startDate: '2023-07-01', endDate: '2024-06-30' },
  { period: '13', label: '第13期', startDate: '2024-07-01', endDate: '2025-06-30' },
  { period: '14', label: '第14期', startDate: '2025-07-01', endDate: '2026-06-30' },
];

// バーの色定義
const BAR_COLORS = {
  sales: '#465fff',     // brand-500
  work: '#22c55e',      // success-500
  quotation: '#f59e0b', // amber-500
  invoice: '#ec4899',   // pink-500
};

export default function SalesChart({ invoiceRecords, workNoRecords = [], quotationRecords = [], language }: SalesChartProps) {
  // 配列でない場合は空配列として扱う
  const validInvoiceRecords = Array.isArray(invoiceRecords) ? invoiceRecords : [];
  const validWorkNoRecords = Array.isArray(workNoRecords) ? workNoRecords : [];
  const validQuotationRecords = Array.isArray(quotationRecords) ? quotationRecords : [];

  const chartData = useMemo(() => {
    // 工事番号から会計期間を抽出する関数
    const getFiscalPeriodFromWorkNo = (workNo: string): string | null => {
      const match = workNo?.match(/^(\d+)-/);
      if (match) {
        return parseInt(match[1], 10).toString();
      }
      return null;
    };

    // 会計期間ごとに売上・工事・見積を集計
    const dataByPeriod = fiscalPeriods.reduce((acc, period) => {
      acc[period.period] = {
        period: period.period,
        label: period.label,
        sales: 0,
        invoiceCount: 0,
        workNoCount: 0,
        quotationCount: 0
      };
      return acc;
    }, {} as Record<string, { period: string; label: string; sales: number; invoiceCount: number; workNoCount: number; quotationCount: number }>);

    // 請求書データを会計期間ごとに集計
    validInvoiceRecords.forEach((invoice) => {
      const workNo = invoice.文字列__1行_?.value || '';
      const fiscalPeriod = getFiscalPeriodFromWorkNo(workNo);
      const amount = parseFloat(invoice.計算?.value || '0');

      if (fiscalPeriod && dataByPeriod[fiscalPeriod]) {
        dataByPeriod[fiscalPeriod].sales += amount;
        dataByPeriod[fiscalPeriod].invoiceCount += 1;
      }
    });

    // 工事番号データを会計期間ごとに集計
    validWorkNoRecords.forEach((workNo) => {
      const workNoValue = workNo.WorkNo?.value || '';
      const fiscalPeriod = getFiscalPeriodFromWorkNo(workNoValue);

      if (fiscalPeriod && dataByPeriod[fiscalPeriod]) {
        dataByPeriod[fiscalPeriod].workNoCount += 1;
      }
    });

    // 見積データを会計期間ごとに集計（日付ベース）
    const getFiscalPeriodFromDate = (dateString: string): string | null => {
      if (!dateString) return null;
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      if (month >= 7) {
        const fiscalYear = year - 2011;
        return fiscalYear.toString();
      } else {
        const fiscalYear = year - 2012;
        return fiscalYear.toString();
      }
    };

    validQuotationRecords.forEach((quote) => {
      const dateValue = quote.日付?.value;
      const fiscalPeriod = getFiscalPeriodFromDate(dateValue);

      if (fiscalPeriod && dataByPeriod[fiscalPeriod]) {
        dataByPeriod[fiscalPeriod].quotationCount += 1;
      }
    });

    return fiscalPeriods.map(period => ({
      name: period.label,
      売上高: Math.round(dataByPeriod[period.period].sales),
      請求書: dataByPeriod[period.period].invoiceCount,
      工事: dataByPeriod[period.period].workNoCount,
      見積: dataByPeriod[period.period].quotationCount
    }));
  }, [validInvoiceRecords, validWorkNoRecords, validQuotationRecords]);

  // 金額フォーマット（Y軸用短縮表記）
  const fmtAxis = (value: number) => {
    if (value >= 1000000) return (value / 1000000).toFixed(0) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
    return value.toString();
  };

  // 金額フォーマット（ツールチップ用完全表記）
  const fmt = (value: number) =>
    new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(value);

  // 多言語ラベル
  const t = {
    title: language === 'ja' ? '会計期間別売上高' : language === 'th' ? 'ยอดขายตามรอบบัญชี' : 'Sales by Fiscal Period',
    subtitle: language === 'ja' ? '第9期〜第14期' : language === 'th' ? 'ปีที่ 9 – 14' : 'FY9 – FY14',
    sales: language === 'ja' ? '売上高' : language === 'th' ? 'ยอดขาย' : 'Sales',
    work: language === 'ja' ? '工事' : language === 'th' ? 'โครงการ' : 'Projects',
    quotation: language === 'ja' ? '見積' : language === 'th' ? 'ใบเสนอราคา' : 'Quotations',
    invoice: language === 'ja' ? '請求書' : language === 'th' ? 'ใบแจ้งหนี้' : 'Invoices',
    noData: language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available',
  };

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <p className="mb-1.5 text-sm font-medium text-gray-800 dark:text-white/90">{label}</p>
        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm bg-brand-500" />
            <span>{t.sales}: {fmt(data.売上高)} THB</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm bg-success-500" />
            <span>{t.work}: {data.工事}{language === 'ja' ? '件' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm bg-amber-500" />
            <span>{t.quotation}: {data.見積}{language === 'ja' ? '件' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm bg-pink-500" />
            <span>{t.invoice}: {data.請求書}{language === 'ja' ? '件' : ''}</span>
          </div>
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{t.title}</h3>
        <p className="mt-8 text-center text-gray-500 dark:text-gray-400 py-8">{t.noData}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      {/* ヘッダー */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{t.title}</h3>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">{t.subtitle}</p>
      </div>

      {/* チャート */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          <Bar yAxisId="left" dataKey="売上高" fill={BAR_COLORS.sales} radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="工事" fill={BAR_COLORS.work} radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="見積" fill={BAR_COLORS.quotation} radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="請求書" fill={BAR_COLORS.invoice} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* 凡例 */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-theme-sm">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand-500" />
          <span className="text-gray-500 dark:text-gray-400">{t.sales} (THB)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-success-500" />
          <span className="text-gray-500 dark:text-gray-400">{t.work}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" />
          <span className="text-gray-500 dark:text-gray-400">{t.quotation}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-pink-500" />
          <span className="text-gray-500 dark:text-gray-400">{t.invoice}</span>
        </div>
      </div>
    </div>
  );
}