'use client';

import { ReactNode } from 'react';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';

interface AuthLayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

// 認証チェックはミドルウェアで実行されるため、ここでは単純なレイアウトのみ
// TailAdminのプロバイダーでラップしてサイドバーとテーマ機能を有効化
export default function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
          {children}
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
