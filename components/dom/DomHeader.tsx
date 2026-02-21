'use client';

import React from 'react';
import { DOM_HEADER_STATUS_LABELS } from '@/types/dom';
import type { DomHeader as DomHeaderType, DomHeaderStatus } from '@/types/dom';

type Language = 'ja' | 'en' | 'th';

interface DomHeaderProps {
  dom: DomHeaderType;
  language: Language;
}

const STATUS_COLORS: Record<DomHeaderStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  in_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  released: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

const LABELS = {
  version: { ja: 'Ver.', en: 'Ver.', th: 'เวอร์ชัน' },
  totalCost: { ja: '合計', en: 'Total', th: 'รวม' },
};

export default function DomHeader({ dom, language }: DomHeaderProps) {
  const statusLabel = DOM_HEADER_STATUS_LABELS[dom.status]?.[language] || dom.status;
  const statusColor = STATUS_COLORS[dom.status] || STATUS_COLORS.draft;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'th' ? 'th-TH' : language === 'en' ? 'en-US' : 'ja-JP', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
      <div className="flex items-center gap-1.5">
        <span className="font-medium">{LABELS.version[language]}</span>
        <span className="text-gray-800 dark:text-white">{dom.version}</span>
      </div>
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
        {statusLabel}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="font-medium">{LABELS.totalCost[language]}:</span>
        <span className="text-gray-800 dark:text-white font-semibold">
          {formatCurrency(dom.total_cost || 0)}
        </span>
      </div>
    </div>
  );
}
