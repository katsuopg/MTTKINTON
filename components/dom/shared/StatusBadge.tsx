'use client';

import React from 'react';
import { DOM_ITEM_STATUS_LABELS, DOM_ITEM_STATUS_COLORS } from '@/types/dom';
import type { DomItemStatus } from '@/types/dom';

type Language = 'ja' | 'en' | 'th';

interface StatusBadgeProps {
  status: DomItemStatus;
  language?: Language;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, language = 'ja', size = 'sm' }: StatusBadgeProps) {
  const label = DOM_ITEM_STATUS_LABELS[status]?.[language] || status;
  const colorClass = DOM_ITEM_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

  const sizeClass = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${colorClass}`}>
      {label}
    </span>
  );
}
