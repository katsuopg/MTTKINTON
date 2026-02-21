'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TransitionLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
}

export default function TransitionLink({ 
  href, 
  children, 
  className = '', 
  prefetch = true 
}: TransitionLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // コンポーネントがマウントされたことを確認
  useEffect(() => {
    setMounted(true);
  }, []);

  // ナビゲーション完了時にローディング状態をリセット
  useEffect(() => {
    if (!isPending && isNavigating) {
      // 少し遅延を入れてからリセット（スムーズな遷移のため）
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPending, isNavigating]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    console.log('TransitionLink clicked:', href); // デバッグ用ログ
    setIsNavigating(true);
    
    startTransition(() => {
      router.push(href);
    });
  };

  // デバッグ用：ローディング状態を確認
  useEffect(() => {
    console.log('Loading state:', { isPending, isNavigating });
  }, [isPending, isNavigating]);

  // ローディングオーバーレイ（画面中央にスピナー、背景なし）
  const loadingOverlay = (isPending || isNavigating) && mounted && (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 99999 }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 flex items-center space-x-4 border border-gray-200 dark:border-gray-700">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
        <p className="text-base font-medium text-gray-700 dark:text-gray-200">読み込み中...</p>
      </div>
    </div>
  );

  return (
    <>
      <Link 
        href={href} 
        onClick={handleClick}
        className={`${className} ${(isPending || isNavigating) ? 'pointer-events-none opacity-50' : ''}`}
        prefetch={prefetch}
      >
        {children}
      </Link>
      {mounted && loadingOverlay && createPortal(loadingOverlay, document.body)}
    </>
  );
}