'use client';

import { useState, useMemo, useEffect } from 'react';

interface UsePaginationOptions {
  pageSize?: number;
}

interface UsePaginationResult<T> {
  paginatedItems: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  goToPage: (page: number) => void;
  goToNext: () => void;
  goToPrev: () => void;
}

export function usePagination<T>(
  items: T[],
  options?: UsePaginationOptions
): UsePaginationResult<T> {
  const pageSize = options?.pageSize ?? 15;
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // items が変わったら1ページ目にリセット（検索・フィルタ変更時）
  useEffect(() => {
    setCurrentPage(1);
  }, [totalItems]);

  // 現在ページがtotalPagesを超えないようにクランプ
  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return {
    paginatedItems,
    currentPage: safePage,
    totalPages,
    totalItems,
    pageSize,
    goToPage,
    goToNext,
    goToPrev,
  };
}
