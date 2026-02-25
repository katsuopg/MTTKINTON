'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FolderKanban, Users, Menu } from 'lucide-react';

interface BottomNavigationProps {
  locale: string;
  language: 'ja' | 'en' | 'th';
}

const navItems = [
  {
    key: 'home',
    icon: Home,
    label: { ja: 'ホーム', en: 'Home', th: 'หน้าหลัก' },
    path: 'dashboard',
  },
  {
    key: 'workno',
    icon: FolderKanban,
    label: { ja: '案件', en: 'Work', th: 'งาน' },
    path: 'workno',
  },
  {
    key: 'customers',
    icon: Users,
    label: { ja: '顧客', en: 'Customers', th: 'ลูกค้า' },
    path: 'customers',
  },
  {
    key: 'menu',
    icon: Menu,
    label: { ja: 'メニュー', en: 'Menu', th: 'เมนู' },
    path: '',
  },
];

export default function BottomNavigation({ locale, language }: BottomNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-gray-dark border-t border-gray-200 dark:border-gray-800 safe-bottom">
      <div className="flex items-stretch justify-around h-14">
        {navItems.map((item) => {
          const href = item.path ? `/${locale}/${item.path}` : `/${locale}/dashboard`;
          const isActive = item.path
            ? pathname.includes(`/${item.path}`)
            : false;
          const Icon = item.icon;

          if (item.key === 'menu') {
            return (
              <button
                key={item.key}
                onClick={() => {
                  // サイドバーを開くイベントをディスパッチ
                  window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'));
                }}
                className="flex flex-col items-center justify-center flex-1 min-w-[64px] gap-0.5 text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-white/[0.04] transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] leading-tight">{item.label[language]}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.key}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 min-w-[64px] gap-0.5 transition-colors active:bg-gray-100 dark:active:bg-white/[0.04] ${
                isActive
                  ? 'text-brand-500 dark:text-brand-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] leading-tight font-medium">{item.label[language]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
