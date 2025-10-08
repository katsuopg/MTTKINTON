import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

// 認証チェックはミドルウェアで実行されるため、ここでは単純なレイアウトのみ
export default function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}