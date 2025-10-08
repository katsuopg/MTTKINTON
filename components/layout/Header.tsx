'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { logout } from '@/lib/auth/actions';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { Menu, X, LogOut, Globe } from 'lucide-react';

interface HeaderProps {
  locale: string;
  user: User;
}

export function Header({ locale, user }: HeaderProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      // サーバーアクションでリダイレクトが実行される
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const handleLanguageChange = (newLocale: string) => {
    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split('/');
    pathSegments[1] = newLocale;
    router.push(pathSegments.join('/'));
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* ロゴ */}
            <div className="flex-shrink-0 flex items-center">
              <Link href={`/${locale}/dashboard`} className="flex items-center">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white font-bold">K</span>
                </div>
                <span className="text-xl font-semibold text-gray-900">
                  Kintone Integration
                </span>
              </Link>
            </div>

            {/* ナビゲーション（デスクトップ） */}
            <nav className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                href={`/${locale}/dashboard`}
                className="inline-flex items-center px-1 pt-1 border-b-2 border-indigo-500 text-sm font-medium text-gray-900"
              >
                ダッシュボード
              </Link>
              <Link
                href={`/${locale}/projects`}
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                プロジェクト
              </Link>
            </nav>
          </div>

          {/* 右側のアクション */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {/* 言語切替 */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Globe className="h-5 w-5 text-gray-400" />
                <span className="ml-2 text-gray-700">{locale.toUpperCase()}</span>
              </button>
              {isProfileOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <button
                      onClick={() => handleLanguageChange('ja')}
                      className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${
                        locale === 'ja' ? 'bg-gray-100' : ''
                      }`}
                    >
                      日本語
                    </button>
                    <button
                      onClick={() => handleLanguageChange('th')}
                      className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${
                        locale === 'th' ? 'bg-gray-100' : ''
                      }`}
                    >
                      ภาษาไทย
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ユーザー情報 */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-500"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* モバイルメニューボタン */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* モバイルメニュー */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href={`/${locale}/dashboard`}
              className="block pl-3 pr-4 py-2 border-l-4 border-indigo-500 text-base font-medium text-indigo-700 bg-indigo-50"
            >
              {t('navigation.dashboard')}
            </Link>
            <Link
              href={`/${locale}/projects`}
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
            >
              {t('navigation.projects')}
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="text-sm font-medium text-gray-800">{user.email}</div>
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={handleLogout}
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 w-full text-left"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}