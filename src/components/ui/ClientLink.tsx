'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface ClientLinkProps extends React.ComponentProps<typeof Link> {
  children: React.ReactNode;
  showLoading?: boolean;
}

export default function ClientLink({ children, showLoading = true, ...props }: ClientLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsNavigating(true);
    
    startTransition(() => {
      router.push(props.href.toString());
    });
  };

  return (
    <>
      <Link {...props} onClick={handleClick}>
        {children}
      </Link>
      {showLoading && (isNavigating || isPending) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
            <p className="text-sm font-medium text-gray-700">読み込み中...</p>
          </div>
        </div>
      )}
    </>
  );
}