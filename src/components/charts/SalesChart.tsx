'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
        // 前ゼロを除去（09 → 9）
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

    // 請求書データを会計期間ごとに集計（重複を考慮）
    const periodCount: Record<string, number> = {};
    const uniqueWorkNos = new Set<string>();
    const duplicateCounts: Record<string, number> = {};
    
    validInvoiceRecords.forEach((invoice, index) => {
      const workNo = invoice.文字列__1行_?.value || '';
      const fiscalPeriod = getFiscalPeriodFromWorkNo(workNo);
      const amount = parseFloat(invoice.計算?.value || '0');
      
      // 最初の数件をデバッグ
      if (index < 10) {
        console.log(`請求書[${index}] 工事番号: ${workNo}, 会計期間: ${fiscalPeriod}`);
      }
      
      if (fiscalPeriod) {
        periodCount[fiscalPeriod] = (periodCount[fiscalPeriod] || 0) + 1;
        
        // 重複チェック
        if (!uniqueWorkNos.has(workNo)) {
          uniqueWorkNos.add(workNo);
        } else {
          duplicateCounts[fiscalPeriod] = (duplicateCounts[fiscalPeriod] || 0) + 1;
        }
        
        if (dataByPeriod[fiscalPeriod]) {
          dataByPeriod[fiscalPeriod].sales += amount;
          dataByPeriod[fiscalPeriod].invoiceCount += 1;
        }
      }
    });
    
    console.log('=== 会計期間別の請求書件数 ===');
    console.log('レコード数（重複含む）:', periodCount);
    console.log('重複数:', duplicateCounts);
    console.log('全請求書件数:', validInvoiceRecords.length);
    console.log('ユニーク工事番号数:', uniqueWorkNos.size);

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
      const month = date.getMonth() + 1; // 0-based

      // 会計期間は7月開始
      if (month >= 7) {
        // 7月〜12月は同年度
        const fiscalYear = year - 2011;
        return fiscalYear.toString();
      } else {
        // 1月〜6月は前年度
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

    // グラフ用のデータ配列に変換（第9期から第14期まですべて表示）
    return fiscalPeriods.map(period => ({
      name: period.label,
      売上高: Math.round(dataByPeriod[period.period].sales),
      請求書: dataByPeriod[period.period].invoiceCount,
      工事: dataByPeriod[period.period].workNoCount,
      見積: dataByPeriod[period.period].quotationCount
    }));
  }, [validInvoiceRecords, validWorkNoRecords, validQuotationRecords]);

  // 金額をフォーマット（Y軸用の短縮表記）
  const formatAxisCurrency = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(0) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'K';
    }
    return value.toString();
  };

  // 金額をフォーマット（ツールチップ用の完全表記）
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value) + ' B';
  };

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2.5 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-sm mb-1.5">{label}</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
              <span>売上高: {formatCurrency(data.売上高)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
              <span>工事: {data.工事}件</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
              <span>見積: {data.見積}件</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-pink-500 rounded-sm"></div>
              <span>請求書: {data.請求書}件</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getTitle = () => {
    switch (language) {
      case 'ja':
        return '会計期間別売上高';
      case 'th':
        return 'ยอดขายตามรอบบัญชี';
      case 'en':
        return 'Sales by Fiscal Period';
      default:
        return 'Sales by Fiscal Period';
    }
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{getTitle()}</h3>
        <p className="text-gray-500 text-center py-8">
          {language === 'ja' ? 'データがありません' : 
           language === 'th' ? 'ไม่มีข้อมูล' : 
           'No data available'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{getTitle()}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 60, left: 40, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis 
            yAxisId="left" 
            tickFormatter={formatAxisCurrency}
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#E5E7EB' }}
            label={{ value: '売上高 (THB)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12 } }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#E5E7EB' }}
            label={{ value: '件数', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: 12 } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar yAxisId="left" dataKey="売上高" fill="#6366F1" name="売上高" />
          <Bar yAxisId="right" dataKey="工事" fill="#10B981" name="工事件数" />
          <Bar yAxisId="right" dataKey="見積" fill="#F59E0B" name="見積件数" />
          <Bar yAxisId="right" dataKey="請求書" fill="#EC4899" name="請求書件数" />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="rect"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}