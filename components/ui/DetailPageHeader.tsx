'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface DetailPageHeaderProps {
  backHref?: string;
  title: string;
  subtitle?: string;
  statusBadge?: ReactNode;
  actions?: ReactNode;
}

export function DetailPageHeader({
  backHref,
  title,
  subtitle,
  statusBadge,
  actions,
}: DetailPageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="flex-shrink-0 p-1.5 -ml-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-white/[0.05] transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
          )}

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

        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
