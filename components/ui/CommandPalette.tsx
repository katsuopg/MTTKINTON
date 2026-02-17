'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

interface SearchResultCategory {
  category: string;
  label: string;
  icon: string;
  items: SearchResultItem[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  document: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  clipboard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
  calculator: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
  user: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  truck: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />,
  dollar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
};

export default function CommandPalette({ isOpen, onClose, locale }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 全アイテムのフラットリスト（キーボードナビ用）
  const flatItems = results.flatMap((cat) => cat.items);

  // モーダル開閉時にリセット
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // デバウンス検索
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&locale=${locale}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, locale]);

  // 選択中アイテムが見えるようにスクロール
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleNavigate = useCallback((href: string) => {
    onClose();
    router.push(href);
  }, [onClose, router]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          handleNavigate(flatItems[selectedIndex].href);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [flatItems, selectedIndex, handleNavigate, onClose]);

  if (!isOpen) return null;

  const labels = {
    placeholder: locale === 'ja' ? 'アプリ横断検索...' : locale === 'th' ? 'ค้นหาทั้งระบบ...' : 'Search across apps...',
    searching: locale === 'ja' ? '検索中...' : locale === 'th' ? 'กำลังค้นหา...' : 'Searching...',
    noResults: locale === 'ja' ? '検索結果がありません' : locale === 'th' ? 'ไม่พบผลลัพธ์' : 'No results found',
    hint: locale === 'ja' ? '2文字以上入力してください' : locale === 'th' ? 'พิมพ์อย่างน้อย 2 ตัวอักษร' : 'Type at least 2 characters',
  };

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={labels.placeholder}
              className="w-full py-4 px-3 text-base bg-transparent border-0 outline-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
            />
            {isLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-500 border-t-transparent shrink-0" />
            )}
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 rounded ml-2 shrink-0">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
            {/* Loading */}
            {isLoading && results.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-500 border-t-transparent mx-auto mb-2" />
                {labels.searching}
              </div>
            )}

            {/* No Results */}
            {!isLoading && query.length >= 2 && results.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {labels.noResults}
              </div>
            )}

            {/* Hint */}
            {!isLoading && query.length < 2 && query.length > 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                {labels.hint}
              </div>
            )}

            {/* Initial state */}
            {!isLoading && query.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                <div className="flex items-center justify-center gap-4 text-xs">
                  <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500">↑↓</kbd> {locale === 'ja' ? '移動' : 'Navigate'}</span>
                  <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500">Enter</kbd> {locale === 'ja' ? '選択' : 'Select'}</span>
                  <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500">Esc</kbd> {locale === 'ja' ? '閉じる' : 'Close'}</span>
                </div>
              </div>
            )}

            {/* Grouped Results */}
            {results.map((category) => (
              <div key={category.category}>
                {/* Category Header */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {categoryIcons[category.icon] || categoryIcons.document}
                    </svg>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {category.label}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      ({category.items.length})
                    </span>
                  </div>
                </div>

                {/* Items */}
                {category.items.map((item) => {
                  const currentIndex = flatIndex++;
                  const isSelected = currentIndex === selectedIndex;
                  return (
                    <button
                      key={`${category.category}-${item.id}`}
                      data-selected={isSelected}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors cursor-pointer border-b border-gray-50 dark:border-gray-700/50 last:border-0 ${
                        isSelected
                          ? 'bg-brand-50 dark:bg-brand-500/10'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                      onClick={() => handleNavigate(item.href)}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${
                          isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-gray-900 dark:text-white'
                        }`}>
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          {results.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                <div className="flex items-center gap-3">
                  <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd> {locale === 'ja' ? '移動' : 'Navigate'}</span>
                  <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd> {locale === 'ja' ? '選択' : 'Select'}</span>
                </div>
                <span>{flatItems.length} {locale === 'ja' ? '件' : 'results'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
