'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import type { DomSummary } from '@/types/dom';

type Language = 'ja' | 'en' | 'th';

interface SummaryTabProps {
  domId: string;
  language: Language;
}

const LABELS: Record<Language, Record<string, string>> = {
  ja: {
    title: 'コスト集計',
    category: 'カテゴリ',
    count: '件数',
    amount: '金額',
    mechMake: 'メカ製作品',
    mechBuy: 'メカ購入品',
    elecMake: '電気製作品',
    elecBuy: '電気購入品',
    mechLabor: 'メカ工数',
    elecLabor: '電気工数',
    grandTotal: '合計',
    refresh: '再計算',
    loading: '計算中...',
    partsSubtotal: '部品小計',
    laborSubtotal: '工数小計',
  },
  en: {
    title: 'Cost Summary',
    category: 'Category',
    count: 'Count',
    amount: 'Amount',
    mechMake: 'Mech Fabrication',
    mechBuy: 'Mech Purchased',
    elecMake: 'Elec Fabrication',
    elecBuy: 'Elec Purchased',
    mechLabor: 'Mech Labor',
    elecLabor: 'Elec Labor',
    grandTotal: 'Grand Total',
    refresh: 'Recalculate',
    loading: 'Calculating...',
    partsSubtotal: 'Parts Subtotal',
    laborSubtotal: 'Labor Subtotal',
  },
  th: {
    title: 'สรุปค่าใช้จ่าย',
    category: 'หมวดหมู่',
    count: 'จำนวน',
    amount: 'จำนวนเงิน',
    mechMake: 'ผลิตเครื่องกล',
    mechBuy: 'ซื้อเครื่องกล',
    elecMake: 'ผลิตไฟฟ้า',
    elecBuy: 'ซื้อไฟฟ้า',
    mechLabor: 'ชั่วโมงเครื่องกล',
    elecLabor: 'ชั่วโมงไฟฟ้า',
    grandTotal: 'ยอมรวม',
    refresh: 'คำนวณใหม่',
    loading: 'กำลังคำนวณ...',
    partsSubtotal: 'ยอดรวมชิ้นส่วน',
    laborSubtotal: 'ยอดรวมชั่วโมง',
  },
};

export default function SummaryTab({ domId, language }: SummaryTabProps) {
  const [summary, setSummary] = useState<DomSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dom/${domId}/summary`);
      if (!res.ok) throw new Error('Failed to fetch summary');
      const data = await res.json();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  }, [domId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
        <span className="ml-3 text-gray-500">{LABELS[language].loading}</span>
      </div>
    );
  }

  if (!summary) return null;

  const partsSubtotal = summary.mech_make_total + summary.mech_buy_total + summary.elec_make_total + summary.elec_buy_total;
  const laborSubtotal = summary.mech_labor_total + summary.elec_labor_total;

  const rows = [
    { label: LABELS[language].mechMake, count: summary.mech_make_count, amount: summary.mech_make_total, color: 'text-blue-600 dark:text-blue-400' },
    { label: LABELS[language].mechBuy, count: summary.mech_buy_count, amount: summary.mech_buy_total, color: 'text-blue-600 dark:text-blue-400' },
    { label: LABELS[language].elecMake, count: summary.elec_make_count, amount: summary.elec_make_total, color: 'text-purple-600 dark:text-purple-400' },
    { label: LABELS[language].elecBuy, count: summary.elec_buy_count, amount: summary.elec_buy_total, color: 'text-purple-600 dark:text-purple-400' },
  ];

  const laborRows = [
    { label: LABELS[language].mechLabor, count: summary.mech_labor_count, amount: summary.mech_labor_total, color: 'text-green-600 dark:text-green-400' },
    { label: LABELS[language].elecLabor, count: summary.elec_labor_count, amount: summary.elec_labor_total, color: 'text-green-600 dark:text-green-400' },
  ];

  return (
    <div>
      {/* 再計算ボタン */}
      <div className="flex justify-end mb-4">
        <button
          onClick={fetchSummary}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
        >
          <RefreshCw size={16} /> {LABELS[language].refresh}
        </button>
      </div>

      {/* 集計テーブル */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-4 py-2 text-left font-medium">{LABELS[language].category}</th>
              <th className="px-4 py-2 text-right font-medium w-24">{LABELS[language].count}</th>
              <th className="px-4 py-2 text-right font-medium w-40">{LABELS[language].amount}</th>
            </tr>
          </thead>
          <tbody>
            {/* 部品 */}
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                <td className={`px-4 py-2 ${row.color}`}>{row.label}</td>
                <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{row.count}</td>
                <td className="px-4 py-2 text-right font-medium text-gray-800 dark:text-white">
                  {formatCurrency(row.amount)}
                </td>
              </tr>
            ))}

            {/* 部品小計 */}
            <tr className="border-b-2 border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30">
              <td className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-300">
                {LABELS[language].partsSubtotal}
              </td>
              <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                {summary.mech_make_count + summary.mech_buy_count + summary.elec_make_count + summary.elec_buy_count}
              </td>
              <td className="px-4 py-2 text-right font-bold text-gray-800 dark:text-white">
                {formatCurrency(partsSubtotal)}
              </td>
            </tr>

            {/* 工数 */}
            {laborRows.map((row, idx) => (
              <tr key={`labor-${idx}`} className="border-b border-gray-100 dark:border-gray-800">
                <td className={`px-4 py-2 ${row.color}`}>{row.label}</td>
                <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{row.count}</td>
                <td className="px-4 py-2 text-right font-medium text-gray-800 dark:text-white">
                  {formatCurrency(row.amount)}
                </td>
              </tr>
            ))}

            {/* 工数小計 */}
            <tr className="border-b-2 border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30">
              <td className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-300">
                {LABELS[language].laborSubtotal}
              </td>
              <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                {summary.mech_labor_count + summary.elec_labor_count}
              </td>
              <td className="px-4 py-2 text-right font-bold text-gray-800 dark:text-white">
                {formatCurrency(laborSubtotal)}
              </td>
            </tr>

            {/* 合計 */}
            <tr className="bg-brand-50 dark:bg-brand-900/20">
              <td className="px-4 py-3 font-bold text-brand-700 dark:text-brand-300 text-base">
                {LABELS[language].grandTotal}
              </td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-right font-bold text-brand-700 dark:text-brand-300 text-lg">
                {formatCurrency(summary.grand_total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
