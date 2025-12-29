'use client';

import { useState } from 'react';
import OrganizationManagement from './OrganizationManagement';
import UserManagement from './UserManagement';
import PermissionManagement from './PermissionManagement';

interface SettingsClientProps {
  locale: string;
}

export default function SettingsClient({ locale }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'organizations' | 'users' | 'permissions'>('organizations');

  const tabs = [
    {
      id: 'organizations' as const,
      label: locale === 'ja' ? '組織管理' : locale === 'th' ? 'จัดการองค์กร' : 'Organization Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      id: 'users' as const,
      label: locale === 'ja' ? 'ユーザー管理' : locale === 'th' ? 'จัดการผู้ใช้' : 'User Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      id: 'permissions' as const,
      label: locale === 'ja' ? '権限管理' : locale === 'th' ? 'จัดการสิทธิ์' : 'Permission Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6">
      {/* Page Header - TailAdmin Style */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {locale === 'ja' ? 'APP設定' : locale === 'th' ? 'การตั้งค่าแอป' : 'App Settings'}
        </h1>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          {locale === 'ja'
            ? '組織、ユーザー、権限などのアプリケーション設定を管理します。'
            : locale === 'th'
            ? 'จัดการการตั้งค่าแอปพลิเคชัน เช่น องค์กร ผู้ใช้ และสิทธิ์'
            : 'Manage application settings such as organizations, users, and permissions.'}
        </p>
      </div>

      {/* Tab Navigation - TailAdmin Style */}
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
        </div>
      </div>
    </div>
  );
}
