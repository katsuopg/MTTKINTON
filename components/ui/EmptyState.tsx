'use client';

import { detailStyles } from '@/components/ui/DetailStyles';

interface EmptyStateProps {
  locale?: string;
  message?: string;
}

const defaultMessages: Record<string, string> = {
  ja: 'データがありません',
  en: 'No data',
  th: 'ไม่มีข้อมูล',
};

export function EmptyState({ locale, message }: EmptyStateProps) {
  const text = message || defaultMessages[locale || 'en'] || defaultMessages.en;
  return <p className={detailStyles.emptyState}>{text}</p>;
}
