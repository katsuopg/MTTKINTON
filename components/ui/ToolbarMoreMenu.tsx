'use client';

import { ReactNode, useRef, useState, useEffect } from 'react';
import { MoreHorizontal, Check } from 'lucide-react';

interface ToolbarMoreMenuProps {
  pageSize?: {
    current: number;
    options: number[];
    onChange: (size: number) => void;
  };
  stickyHeader?: {
    enabled: boolean;
    onChange: (v: boolean) => void;
  };
  exportCsv?: {
    href?: string;
    onClick?: () => void;
    label?: string;
  };
  importCsv?: {
    onClick: () => void;
    label?: string;
  };
  custom?: Array<{
    key: string;
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  }>;
  labels?: {
    countPerPage?: string;
    stickyHeader?: string;
    exportCsv?: string;
    importCsv?: string;
  };
}

export function ToolbarMoreMenu({
  pageSize,
  stickyHeader,
  exportCsv,
  importCsv,
  custom,
  labels,
}: ToolbarMoreMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const hasContent = pageSize || stickyHeader || exportCsv || importCsv || (custom && custom.length > 0);
  if (!hasContent) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/[0.05] transition-colors"
        aria-label="More options"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 py-1 text-sm">
          {/* 表示件数 */}
          {pageSize && (
            <div className="px-3 py-2">
              <div className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5">
                {labels?.countPerPage || '表示件数'}
              </div>
              <div className="flex flex-wrap gap-1">
                {pageSize.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      pageSize.onChange(opt);
                      setOpen(false);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      opt === pageSize.current
                        ? 'bg-brand-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 先頭行固定 */}
          {stickyHeader && (
            <>
              {pageSize && <div className="border-t border-gray-100 dark:border-gray-700 my-1" />}
              <button
                type="button"
                onClick={() => stickyHeader.onChange(!stickyHeader.enabled)}
                className="w-full flex items-center justify-between px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
              >
                <span>{labels?.stickyHeader || '先頭行固定'}</span>
                {stickyHeader.enabled && <Check size={16} className="text-brand-500" />}
              </button>
            </>
          )}

          {/* 区切り線 */}
          {(pageSize || stickyHeader) && (exportCsv || importCsv || (custom && custom.length > 0)) && (
            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
          )}

          {/* CSVエクスポート */}
          {exportCsv && (
            exportCsv.href ? (
              <a
                href={exportCsv.href}
                download
                onClick={() => setOpen(false)}
                className="block w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
              >
                {exportCsv.label || labels?.exportCsv || 'CSVエクスポート'}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => {
                  exportCsv.onClick?.();
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
              >
                {exportCsv.label || labels?.exportCsv || 'CSVエクスポート'}
              </button>
            )
          )}

          {/* CSVインポート */}
          {importCsv && (
            <button
              type="button"
              onClick={() => {
                importCsv.onClick();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
            >
              {importCsv.label || labels?.importCsv || 'CSVインポート'}
            </button>
          )}

          {/* カスタムメニュー */}
          {custom && custom.length > 0 && (
            <>
              {(exportCsv || importCsv) && <div className="border-t border-gray-100 dark:border-gray-700 my-1" />}
              {custom.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    item.onClick();
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
