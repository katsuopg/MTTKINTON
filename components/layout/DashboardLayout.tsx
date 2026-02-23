'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type Language } from '@/lib/kintone/field-mappings';
import LanguageSwitch from '@/components/LanguageSwitch';
import { logout } from '@/lib/auth/actions';
import TransitionLink from '@/components/ui/TransitionLink';
import CommandPalette from '@/components/ui/CommandPalette';
import { useSidebar } from '@/context/SidebarContext';
import { useTheme } from '@/context/ThemeContext';
import { useNavPermissions } from '@/hooks/useNavPermissions';
import { MENU_ITEMS, COMMON_MENU_KEYS, COMMON_TOP_KEYS, COMMON_BOTTOM_KEYS, applyMenuConfig, applyGroupedMenuConfig } from '@/lib/navigation/menu-items';

interface UserInfo {
  email?: string;
  name?: string;
  avatarUrl?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  locale?: string;
  userEmail?: string;
  userInfo?: UserInfo;
  title?: string;
  currentPath?: string;
}

export default function DashboardLayout({ children, locale = 'ja', userEmail, userInfo, title }: DashboardLayoutProps) {
  const pathname = usePathname();
  const actualLocale = locale || pathname.split('/')[1] || 'ja';
  const language = (actualLocale === 'ja' || actualLocale === 'en' || actualLocale === 'th' ? actualLocale : 'ja') as Language;

  const { isExpanded, isMobileOpen, toggleSidebar, toggleMobileSidebar, setIsHovered } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // 内部メールの場合は従業員番号を表示
  const displayUserIdentifier = userEmail?.endsWith('@mtt.internal')
    ? userEmail.replace('@mtt.internal', '')
    : userEmail;

  // ⌘K / Ctrl+K でコマンドパレット開閉
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsUserDropdownOpen(false);
    if (isUserDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isUserDropdownOpen]);

  const { canShowNavItem, menuConfig, groupedMenuConfig } = useNavPermissions();

  // MENU_ITEMSからナビゲーション構築
  const allNavItems = MENU_ITEMS.map(item => ({
    key: item.key,
    name: item.name[language],
    href: `/${actualLocale}/${item.path}`,
    icon: item.icon,
    appCode: item.appCode,
    requiredPermission: item.requiredPermission,
  }));

  // グループモード判定
  const isGroupedMode = groupedMenuConfig !== null && groupedMenuConfig.groups.length > 0;

  // グループモード: applyGroupedMenuConfig で上部共通 + グループ + 下部共通 構築
  const groupedNav = isGroupedMode
    ? (() => {
        const result = applyGroupedMenuConfig(allNavItems, groupedMenuConfig, COMMON_MENU_KEYS, COMMON_TOP_KEYS, COMMON_BOTTOM_KEYS);
        return {
          commonTop: result.commonTop.filter(item =>
            canShowNavItem(item.appCode ?? null, item.requiredPermission)
          ),
          commonBottom: result.commonBottom.filter(item =>
            canShowNavItem(item.appCode ?? null, item.requiredPermission)
          ),
          groups: result.groups.map(group => ({
            ...group,
            items: (group.items || []).filter(item =>
              canShowNavItem(item.appCode ?? null, item.requiredPermission)
            ),
          })).filter(group => group.items.length > 0),
        };
      })()
    : null;

  // フラットモード: 従来の applyMenuConfig パス
  const orderedNav = applyMenuConfig(allNavItems, menuConfig);
  const filteredNavigation = orderedNav.filter(item =>
    canShowNavItem(item.appCode ?? null, item.requiredPermission)
  );

  // 組織名をlocaleに応じて返す
  const getOrgDisplayName = (orgName: string, orgNameEn: string | null, orgNameTh: string | null) => {
    if (language === 'en' && orgNameEn) return orgNameEn;
    if (language === 'th' && orgNameTh) return orgNameTh;
    return orgName;
  };

  const renderIcon = (iconName: string, className: string) => {
    const icons: Record<string, React.ReactNode> = {
      home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
      document: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      clipboard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
      users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
      userGroup: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
      truck: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />,
      user: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
      list: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
      fileQuestion: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /><circle cx="12" cy="10" r="3" strokeWidth={1.5} /></>,
      cart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />,
      calculator: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
      clipboardDoc: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />,
      documentText: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
      dollar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      cog: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>,
      settings: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>,
      database: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />,
    };
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icons[iconName]}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-white dark:bg-gray-dark border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-[290px]' : 'w-20'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
          <Link href={`/${actualLocale}/dashboard`} className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500">
              <span className="text-xl font-bold text-white">M</span>
            </div>
            {isExpanded && (
              <span className="text-xl font-bold text-gray-800 dark:text-white">MTT KINTON</span>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar">
          {isGroupedMode && groupedNav ? (
            <>
              {/* 上部共通項目（TOP等） */}
              {groupedNav.commonTop.length > 0 && (
                <ul className="space-y-1">
                  {groupedNav.commonTop.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.key}>
                        <TransitionLink
                          href={item.href}
                          className={`menu-item group ${isActive ? 'menu-item-active' : 'menu-item-inactive'}`}
                        >
                          {renderIcon(item.icon, `w-5 h-5 ${isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'}`)}
                          {isExpanded && <span>{item.name}</span>}
                        </TransitionLink>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* 組織グループセクション */}
              {groupedNav.groups.map((group) => (
                <div key={group.orgId} className="mt-4">
                  {isExpanded ? (
                    <p className="px-3 mb-2 text-theme-xs font-medium text-gray-400 uppercase truncate">
                      {getOrgDisplayName(group.orgName, group.orgNameEn, group.orgNameTh)}
                    </p>
                  ) : (
                    <div className="hidden lg:block mx-3 mb-2 border-t border-gray-200 dark:border-gray-700" />
                  )}
                  <ul className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.key}>
                          <TransitionLink
                            href={item.href}
                            className={`menu-item group ${isActive ? 'menu-item-active' : 'menu-item-inactive'}`}
                          >
                            {renderIcon(item.icon, `w-5 h-5 ${isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'}`)}
                            {isExpanded && <span>{item.name}</span>}
                          </TransitionLink>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              {/* 下部共通項目（システム管理、データ同期） */}
              {groupedNav.commonBottom.length > 0 && (
                <div className="mt-4">
                  {isExpanded ? (
                    <p className="px-3 mb-2 text-theme-xs font-medium text-gray-400 uppercase truncate">
                      {language === 'ja' ? 'システム' : language === 'th' ? 'ระบบ' : 'System'}
                    </p>
                  ) : (
                    <div className="hidden lg:block mx-3 mb-2 border-t border-gray-200 dark:border-gray-700" />
                  )}
                  <ul className="space-y-1">
                    {groupedNav.commonBottom.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.key}>
                          <TransitionLink
                            href={item.href}
                            className={`menu-item group ${isActive ? 'menu-item-active' : 'menu-item-inactive'}`}
                          >
                            {renderIcon(item.icon, `w-5 h-5 ${isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'}`)}
                            {isExpanded && <span>{item.name}</span>}
                          </TransitionLink>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <>
              {/* フラットモード（従来動作） */}
              <ul className="space-y-1">
                {filteredNavigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.key}>
                      <TransitionLink
                        href={item.href}
                        className={`menu-item group ${isActive ? 'menu-item-active' : 'menu-item-inactive'}`}
                      >
                        {renderIcon(item.icon, `w-5 h-5 ${isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'}`)}
                        {isExpanded && <span>{item.name}</span>}
                      </TransitionLink>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${isExpanded ? 'lg:ml-[290px]' : 'lg:ml-20'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 dark:bg-gray-dark dark:border-gray-800 lg:px-6">
          {/* Left: Mobile menu button + Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMobileSidebar}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Search Bar (Command Palette trigger) */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden md:flex items-center w-64 py-2.5 pl-3 pr-3 text-theme-sm bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="flex-1 text-left text-gray-400 dark:text-gray-500">
                {language === 'ja' ? '検索...' : language === 'th' ? 'ค้นหา...' : 'Search...'}
              </span>
              <kbd className="px-2 py-0.5 text-theme-xs text-gray-400 bg-gray-100 rounded dark:bg-gray-700">⌘K</kbd>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>

            {/* Notification */}
            <button className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
            </button>

            {/* Language Switch */}
            <LanguageSwitch />

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsUserDropdownOpen(!isUserDropdownOpen);
                }}
                className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
              >
                <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {userInfo?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={userInfo.avatarUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <span className="hidden md:block text-theme-sm font-medium truncate max-w-[120px]">{userInfo?.name || displayUserIdentifier}</span>
                <svg className={`w-4 h-4 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu - TailAdmin Style */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-dark rounded-2xl border border-gray-200 dark:border-gray-800 shadow-theme-lg overflow-hidden">
                  {/* User Info Header */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                        {userInfo?.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={userInfo.avatarUrl} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-theme-sm font-semibold text-gray-800 dark:text-white/90 truncate">
                          {userInfo?.name || (language === 'ja' ? 'ユーザー' : 'User')}
                        </p>
                        <p className="text-theme-xs text-gray-500 dark:text-gray-400 truncate">{displayUserIdentifier}</p>
                      </div>
                    </div>
                  </div>
                  {/* Menu Items */}
                  <div className="p-2">
                    <Link
                      href={`/${actualLocale}/profile`}
                      className="flex items-center gap-3 px-3 py-2.5 text-theme-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {language === 'ja' ? 'プロフィール' : language === 'th' ? 'โปรไฟล์' : 'Edit profile'}
                    </Link>
                    <Link
                      href={`/${actualLocale}/settings`}
                      className="flex items-center gap-3 px-3 py-2.5 text-theme-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {language === 'ja' ? '設定' : language === 'th' ? 'ตั้งค่า' : 'Account settings'}
                    </Link>
                  </div>
                  {/* Sign Out */}
                  <div className="p-2 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => logout()}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-theme-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {language === 'ja' ? 'ログアウト' : language === 'th' ? 'ออกจากระบบ' : 'Sign out'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        locale={actualLocale}
      />
    </div>
  );
}
