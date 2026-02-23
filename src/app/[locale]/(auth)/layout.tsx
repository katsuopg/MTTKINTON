'use client';

import { ReactNode } from 'react';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { PermissionsProvider } from '@/hooks/usePermissions';
import { FeedbackProvider } from '@/components/ui/FeedbackProvider';

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
      <PermissionsProvider>
        <FeedbackProvider>
          <SidebarProvider>
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
              {children}
            </div>
          </SidebarProvider>
        </FeedbackProvider>
      </PermissionsProvider>
    </ThemeProvider>
  );
}
