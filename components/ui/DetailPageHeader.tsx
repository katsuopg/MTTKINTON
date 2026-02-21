'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface DetailPageHeaderProps {
  backHref: string;
  backLabel?: string;
  title: string;
  subtitle?: string;
  statusBadge?: ReactNode;
  actions?: ReactNode;
}

export function DetailPageHeader({
  backHref,
  backLabel = '一覧に戻る',
  title,
  subtitle,
  statusBadge,
  actions,
}: DetailPageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      {/* 左側: 戻る + ステータス + タイトル */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 flex-shrink-0"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">{backLabel}</span>
        </Link>

        {statusBadge && (
          <div className="flex-shrink-0">{statusBadge}</div>
        )}

        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* 右側: 操作ボタン群 */}
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
