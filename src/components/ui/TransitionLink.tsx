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

  // ローディングオーバーレイ
  const loadingOverlay = (isPending || isNavigating) && mounted && (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      style={{ 
        zIndex: 99999, // 最大値に設定
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl p-8 flex flex-col items-center space-y-4 transform scale-110">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 border-solid"></div>
        <p className="text-lg font-semibold text-gray-800">読み込み中...</p>
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