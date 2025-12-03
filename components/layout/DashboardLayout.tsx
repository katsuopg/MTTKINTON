'use client';

import { usePathname, useRouter, useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { getFieldLabel, type Language } from '@/lib/kintone/field-mappings';
import { logout } from '@/lib/auth/actions';
import TransitionLink from '@/components/ui/TransitionLink';

interface DashboardLayoutProps {
  children: React.ReactNode;
  locale?: string;
  userEmail?: string;
  userName?: string | null;
  userNickname?: string | null;
  title?: string;
  currentPath?: string;
  userProfileImage?: string | null;
}

// アイコンコンポーネントを先に定義
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function ShoppingCartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function CalculatorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function DocumentTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function UserGroupIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ClipboardDocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  );
}

function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function CurrencyDollarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ArrowPathIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 4.5v5h5M19.5 19.5v-5h-5M5.636 18.364A9 9 0 1118.364 5.636 9 9 0 015.636 18.364z" />
    </svg>
  );
}

function SidebarToggleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

export default function DashboardLayout({ children, locale = 'ja', userEmail, userName, userNickname, title, userProfileImage }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  // localeが渡されていない場合はpathnameから取得
  const actualLocale = locale || pathname.split('/')[1] || 'ja';
  const language = (actualLocale === 'ja' || actualLocale === 'en' || actualLocale === 'th' ? actualLocale : 'ja') as Language;

  // カテゴリ分けされたナビゲーション
  const navigationCategories = useMemo(() => [
    {
      category: null, // カテゴリなし（トップレベル）
      items: [
        { name: 'TOP', href: `/${actualLocale}/dashboard`, icon: HomeIcon },
        { name: getFieldLabel('WorkNo', language), href: `/${actualLocale}/workno`, icon: DocumentIcon },
      ]
    },
    {
      category: language === 'ja' ? '総務部' : language === 'th' ? 'ฝ่ายบริหารทั่วไป' : 'General Affairs',
      items: [
        { name: language === 'ja' ? '従業員管理' : language === 'th' ? 'จัดการพนักงาน' : 'Employee Management', href: `/${actualLocale}/employees`, icon: UserIcon },
        { name: language === 'ja' ? '機械管理' : language === 'th' ? 'การจัดการเครื่องจักร' : 'Machine Management', href: `/${actualLocale}/machines`, icon: CogIcon },
      ]
    },
    {
      category: language === 'ja' ? '経理部' : language === 'th' ? 'ฝ่ายบัญชี' : 'Accounting',
      items: [
        { name: language === 'ja' ? '請求書管理' : language === 'th' ? 'จัดการใบแจ้งหนี้' : 'Invoice Management', href: `/${actualLocale}/invoice-management`, icon: CurrencyDollarIcon },
        { name: language === 'ja' ? 'コスト管理' : language === 'th' ? 'การจัดการต้นทุน' : 'Cost Management', href: `/${actualLocale}/cost-management`, icon: ChartBarIcon },
      ]
    },
    {
      category: language === 'ja' ? '調達部' : language === 'th' ? 'ฝ่ายจัดซื้อ' : 'Procurement',
      items: [
        { name: language === 'ja' ? '発注管理' : language === 'th' ? 'การจัดการใบสั่งซื้อ' : 'PO Management', href: `/${actualLocale}/po-management`, icon: DocumentTextIcon },
        { name: language === 'ja' ? '購買依頼' : language === 'th' ? 'คำขอจัดซื้อ' : 'Purchase Request', href: `/${actualLocale}/purchase-request`, icon: ShoppingCartIcon },
        { name: language === 'ja' ? '仕入業者管理' : language === 'th' ? 'จัดการซัพพลายเออร์' : 'Supplier Management', href: `/${actualLocale}/suppliers`, icon: TruckIcon },
      ]
    },
    {
      category: language === 'ja' ? '技術部' : language === 'th' ? 'ฝ่ายเทคนิค' : 'Engineering',
      items: [
        { name: language === 'ja' ? 'プロジェクト管理' : language === 'th' ? 'จัดการโครงการ' : 'Project Management', href: `/${actualLocale}/project-management`, icon: ClipboardIcon },
        { name: language === 'ja' ? 'パーツリスト' : language === 'th' ? 'รายการชิ้นส่วน' : 'Parts List', href: `/${actualLocale}/parts-list`, icon: ListIcon },
      ]
    },
    {
      category: language === 'ja' ? '営業部' : language === 'th' ? 'ฝ่ายขาย' : 'Sales',
      items: [
        { name: language === 'ja' ? '顧客管理' : language === 'th' ? 'จัดการลูกค้า' : 'Customer Management', href: `/${actualLocale}/customers`, icon: UsersIcon },
        { name: language === 'ja' ? '担当者管理' : language === 'th' ? 'จัดการผู้ติดต่อ' : 'Staff Management', href: `/${actualLocale}/staff`, icon: UserGroupIcon },
        { name: language === 'ja' ? '見積もり管理' : language === 'th' ? 'จัดการใบเสนอราคา' : 'Quotation Management', href: `/${actualLocale}/quotation`, icon: CalculatorIcon },
        { name: language === 'ja' ? '注文書管理' : language === 'th' ? 'จัดการใบสั่งซื้อ' : 'Order Management', href: `/${actualLocale}/order-management`, icon: ClipboardDocumentIcon },
      ]
    },
    {
      category: language === 'ja' ? '管理' : language === 'th' ? 'การจัดการ' : 'Administration',
      items: [
        { name: language === 'ja' ? 'APP設定' : language === 'th' ? 'การตั้งค่าแอป' : 'App Settings', href: `/${actualLocale}/settings`, icon: CogIcon },
        { name: language === 'ja' ? 'データ同期' : language === 'th' ? 'ซิงค์ข้อมูล' : 'Data Sync', href: `/${actualLocale}/import-data`, icon: ArrowPathIcon },
      ]
    },
  ], [actualLocale, language]);

  const sidebarWidthClass = isSidebarCollapsed ? 'w-16' : 'w-64';

  // 表示名: ニックネーム > 名前 > メールのユーザー名
  const displayName = userNickname || userName || userEmail?.split('@')[0] || 'User';

  const userInitial = displayName
    ? displayName[0].toUpperCase()
    : '?';

  const currentLocaleFromParams = (params as { locale?: string } | undefined)?.locale;
  const currentLocale = currentLocaleFromParams || actualLocale;

  const handleLocaleChange = (newLocale: string) => {
    if (!newLocale || newLocale === currentLocale) return;
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    setIsUserMenuOpen(false);
    router.push(newPath);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* ヘッダー（画面横いっぱい・ライトなコーポレートナビ） */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="flex justify-between items-center">
          {/* 左側: ロゴとタイトル */}
          <div className="flex items-center">
            {/* ロゴ部分（サイドバー幅と同じ） */}
            <div className={`${sidebarWidthClass} ${isSidebarCollapsed ? 'px-2' : 'px-6'} py-4 flex items-center space-x-2 transition-all duration-200`}>
              {/* メニュー展開時のみロゴとタイトルを表示。折りたたみ時はトグルのみ */}
              {!isSidebarCollapsed && (
                <>
                  <div className="w-8 h-8 bg-[#1A2359] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">K</span>
                  </div>
                  <h1 className="text-lg font-semibold text-slate-900">MTT KINTON</h1>
                </>
              )}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
                aria-label={isSidebarCollapsed ? 'メニューを展開' : 'メニューを折りたたむ'}
              >
                <SidebarToggleIcon className={`h-5 w-5 transition-transform duration-200 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {/* 区切り線とページタイトル */}
            <div className="flex items-center">
              <div className="h-12 w-px bg-slate-200"></div>
              <h2 className="text-lg font-medium text-slate-900 pl-6">
                {title || (language === 'ja' ? 'ダッシュボード' : language === 'th' ? 'แดชบอร์ด' : 'Dashboard')}
              </h2>
            </div>
          </div>
          {/* 右側: 通知アイコン＋ユーザープロフィールメニュー */}
          <div className="flex items-center space-x-3 pr-6 py-4">
            {/* 通知アイコン（将来のアラート用。バッジは今後実装） */}
            <button
              type="button"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <BellIcon className="h-5 w-5" />
              {/* hasNotifications が true のとき、下記のバッジを表示予定 */}
              {/* <span className="absolute top-1.5 right-1.5 inline-flex h-2 w-2 rounded-full bg-rose-500" /> */}
            </button>

            {/* ユーザープロフィールメニュー（アイコン＋ドロップダウン） */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 bg-slate-50 hover:bg-slate-100 transition-colors"
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
              >
                {userProfileImage ? (
                  <img
                    src={userProfileImage}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-[#1A2359] text-white flex items-center justify-center text-xs font-semibold">
                    {userInitial}
                  </div>
                )}
                <div className="hidden sm:flex flex-col items-start min-w-[120px]">
                  <span className="text-xs font-medium text-slate-900 truncate max-w-[160px]">
                    {displayName}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate max-w-[160px]">
                    {/* 部署は今後、従業員管理と連携して差し込む */}
                    {'-'}
                  </span>
                </div>
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg ring-1 ring-black/5 z-30 overflow-hidden">
                  {/* プロフィール情報 */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#1A2359] text-white flex items-center justify-center text-xs font-semibold">
                        {userInitial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate">
                          {userEmail}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* メニュー項目 */}
                  <div className="py-1 text-xs">
                    <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                      {language === 'ja'
                        ? '言語'
                        : language === 'th'
                        ? 'ภาษา'
                        : 'Language'}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleLocaleChange('ja')}
                      className={`w-full text-left px-4 py-1.5 hover:bg-slate-50 ${
                        currentLocale === 'ja' ? 'bg-slate-50 font-semibold' : ''
                      }`}
                    >
                      日本語
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLocaleChange('th')}
                      className={`w-full text-left px-4 py-1.5 hover:bg-slate-50 ${
                        currentLocale === 'th' ? 'bg-slate-50 font-semibold' : ''
                      }`}
                    >
                      ไทย
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLocaleChange('en')}
                      className={`w-full text-left px-4 py-1.5 hover:bg-slate-50 ${
                        currentLocale === 'en' ? 'bg-slate-50 font-semibold' : ''
                      }`}
                    >
                      English
                    </button>
                    <div className="mt-1 border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-[11px] text-rose-600 hover:bg-rose-50"
                    >
                      {language === 'ja'
                        ? 'ログアウト'
                        : language === 'th'
                        ? 'ออกจากระบบ'
                        : 'Logout'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* サイドバー（ヘッダー直下から開始・薄い色背景） */}
        <div className={`${sidebarWidthClass} bg-slate-50 border-r border-slate-200 transition-all duration-200`}>
          <div className="h-full flex flex-col">
          
          {/* ナビゲーション */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigationCategories.map((category, categoryIndex) => (
              <div key={category.category || 'top'}>
                {/* カテゴリ区切り線（最初のカテゴリ以外） */}
                {categoryIndex > 0 && (
                  <div className={`${isSidebarCollapsed ? 'mx-2' : 'mx-3'} my-3 border-t border-slate-200`} />
                )}

                {/* カテゴリ名（折りたたみ時は非表示） */}
                {category.category && !isSidebarCollapsed && (
                  <div className="px-3 py-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {category.category}
                    </span>
                  </div>
                )}

                {/* ナビゲーションアイテム */}
                {category.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <TransitionLink
                      key={item.name}
                      href={item.href}
                      className={`
                        group flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2 text-sm font-medium rounded-md transition-all duration-150
                        ${isActive
                          ? 'bg-white text-[#1A2359] shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}
                      `}
                    >
                      <item.icon
                        className={`${isSidebarCollapsed ? 'mr-0' : 'mr-3'} h-5 w-5 flex-shrink-0 ${isActive ? 'text-[#1A2359]' : 'text-slate-400 group-hover:text-slate-600'}`}
                      />
                      <span className={`${isSidebarCollapsed ? 'sr-only' : 'block'} truncate`}>{item.name}</span>
                    </TransitionLink>
                  );
                })}
              </div>
            ))}
          </nav>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 flex flex-col overflow-x-hidden">
          {/* コンテンツエリア - 全ページで統一された余白 */}
          <main className="flex-1 min-w-0 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
