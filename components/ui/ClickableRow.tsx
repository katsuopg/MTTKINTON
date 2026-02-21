'use client';

import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

interface ClickableRowProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export function ClickableRow({ href, className, children }: ClickableRowProps) {
  const router = useRouter();
  return (
    <tr
      className={className}
      onClick={() => router.push(href)}
      style={{ cursor: 'pointer' }}
    >
      {children}
    </tr>
  );
}
