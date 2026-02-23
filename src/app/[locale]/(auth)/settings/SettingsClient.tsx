'use client';

import { useState } from 'react';
import OrganizationManagement from './OrganizationManagement';
import UserManagement from './UserManagement';
import PermissionManagement from './PermissionManagement';
import AppPermissionSettings from './AppPermissionSettings';
import FieldPermissionSettings from './FieldPermissionSettings';
import MenuManagement from './MenuManagement';
import { usePermissions } from '@/hooks/usePermissions';

interface SettingsClientProps {
  locale: string;
}

type TabId = 'organizations' | 'users' | 'permissions' | 'app_permissions' | 'field_permissions' | 'menu_management';

export default function SettingsClient({ locale }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('organizations');
  const { hasPermission, isAdmin, loading } = usePermissions();

  // アクセス権チェック: manage_settings権限またはsystem_admin
  const hasAccess = loading || isAdmin || hasPermission('manage_settings');

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'organizations',
      label: locale === 'ja' ? '組織管理' : locale === 'th' ? 'จัดการองค์กร' : 'Organization Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      id: 'users',
      label: locale === 'ja' ? 'ユーザー管理' : locale === 'th' ? 'จัดการผู้ใช้' : 'User Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      id: 'permissions',
      label: locale === 'ja' ? '権限管理' : locale === 'th' ? 'จัดการสิทธิ์' : 'Permission Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      id: 'app_permissions',
      label: locale === 'ja' ? 'アプリ権限' : locale === 'th' ? 'สิทธิ์แอป' : 'App Permissions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: 'field_permissions',
      label: locale === 'ja' ? 'フィールド権限' : locale === 'th' ? 'สิทธิ์ฟิลด์' : 'Field Permissions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'menu_management',
      label: locale === 'ja' ? 'メニュー管理' : locale === 'th' ? 'จัดการเมนู' : 'Menu Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
    },
  ];

  // ロード中はスケルトン表示
  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="mt-2 h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-12">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
          </div>
        </div>
      </div>
    );
  }

  // アクセス拒否
  if (!hasAccess) {
    return (
      <div className="p-4 md:p-6">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-12">
          <div className="text-center">
            <svg className="mx-auto w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-800 dark:text-white/90">
              {locale === 'ja' ? 'アクセス権限がありません' : locale === 'th' ? 'ไม่มีสิทธิ์เข้าถึง' : 'Access Denied'}
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {locale === 'ja'
                ? 'この設定ページを表示するには管理者権限が必要です。'
                : locale === 'th'
                ? 'ต้องมีสิทธิ์ผู้ดูแลระบบเพื่อดูหน้าการตั้งค่านี้'
                : 'Administrator privileges are required to view this settings page.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {locale === 'ja' ? 'システム管理' : locale === 'th' ? 'การจัดการระบบ' : 'System Management'}
        </h1>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          {locale === 'ja'
            ? '組織、ユーザー、権限などのシステム設定を管理します。'
            : locale === 'th'
            ? 'จัดการการตั้งค่าระบบ เช่น องค์กร ผู้ใช้ และสิทธิ์'
            : 'Manage system settings such as organizations, users, and permissions.'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 dark:border-gray-800">
          <nav className="flex overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 whitespace-nowrap px-5 py-4 text-theme-sm font-medium transition-colors border-b-2 -mb-px
                  ${
                    activeTab === tab.id
                      ? 'border-brand-500 text-brand-500 dark:text-brand-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <span className={activeTab === tab.id ? 'text-brand-500 dark:text-brand-400' : 'text-gray-400'}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-5 lg:p-6">
          {activeTab === 'organizations' && <OrganizationManagement locale={locale} />}
          {activeTab === 'users' && <UserManagement locale={locale} />}
          {activeTab === 'permissions' && <PermissionManagement locale={locale} />}
          {activeTab === 'app_permissions' && <AppPermissionSettings locale={locale} />}
          {activeTab === 'field_permissions' && <FieldPermissionSettings locale={locale} />}
          {activeTab === 'menu_management' && <MenuManagement locale={locale} />}
        </div>
      </div>
    </div>
  );
}
