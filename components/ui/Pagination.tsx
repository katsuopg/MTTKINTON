'use client';

import { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  locale?: string;
  /** 左側に追加表示するサマリー（合計金額など） */
  summaryLeft?: ReactNode;
}

const labels = {
  ja: { showing: '全', of: '件中', to: '-', items: '件を表示' },
  en: { showing: 'Showing', of: 'of', to: '-', items: '' },
  th: { showing: 'แสดง', of: 'จาก', to: '-', items: 'รายการ' },
} as const;

const btnBase = 'flex items-center justify-center w-10 h-10 rounded-lg text-theme-sm font-medium transition-colors';
const btnInactive = `${btnBase} border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]`;
const btnActive = `${btnBase} bg-brand-500 text-white`;
const btnDisabled = 'disabled:opacity-50 disabled:cursor-not-allowed';

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  if (currentPage > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);

  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  locale = 'en',
  summaryLeft,
}: PaginationProps) {
  if (totalPages <= 1 && !summaryLeft) return null;

  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as keyof typeof labels;
  const l = labels[lang];

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const infoText =
    lang === 'ja'
      ? `${l.showing} ${totalItems} ${l.of} ${startItem} ${l.to} ${endItem} ${l.items}`
      : lang === 'th'
        ? `${l.showing} ${startItem} ${l.to} ${endItem} ${l.of} ${totalItems} ${l.items}`
        : `${l.showing} ${startItem} ${l.to} ${endItem} ${l.of} ${totalItems}`;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 dark:border-white/[0.05]">
      <div className="text-theme-sm text-gray-500 dark:text-gray-400">
        {summaryLeft}
        {summaryLeft && <span className="ml-4" />}
        {infoText}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center gap-2" aria-label="Pagination">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`${btnInactive} ${btnDisabled}`}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {pageNumbers.map((page, idx) =>
            page === 'ellipsis' ? (
              <span
                key={`ellipsis-${idx}`}
                className="flex items-center justify-center w-10 h-10 text-theme-sm text-gray-400 dark:text-gray-500"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={page === currentPage ? btnActive : btnInactive}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`${btnInactive} ${btnDisabled}`}
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </nav>
      )}
    </div>
  );
}
