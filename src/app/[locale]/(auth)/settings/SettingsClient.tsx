'use client';

import { useState } from 'react';
import { tableStyles } from '@/components/ui/TableStyles';
import OrganizationManagement from './OrganizationManagement';
import UserManagement from './UserManagement';

interface SettingsClientProps {
  locale: string;
}

export default function SettingsClient({ locale }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'organizations' | 'users' | 'permissions'>('organizations');

  const tabs = [
    {
      id: 'organizations' as const,
      label: locale === 'ja' ? '組織管理' : locale === 'th' ? 'จัดการองค์กร' : 'Organization Management',
    },
    {
      id: 'users' as const,
      label: locale === 'ja' ? 'ユーザー管理' : locale === 'th' ? 'จัดการผู้ใช้' : 'User Management',
    },
    {
      id: 'permissions' as const,
      label: locale === 'ja' ? '権限管理' : locale === 'th' ? 'จัดการสิทธิ์' : 'Permission Management',
    },
  ];

  return (
    <div data-testid="settings-container" className={`${tableStyles.contentWrapper} space-y-6`}>
      <section>
        <h1 className="text-3xl font-bold text-slate-900">
          {locale === 'ja' ? 'APP設定' : locale === 'th' ? 'การตั้งค่าแอป' : 'App Settings'}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {locale === 'ja'
            ? '組織、ユーザー、権限などのアプリケーション設定を管理します。'
            : locale === 'th'
            ? 'จัดการการตั้งค่าแอปพลิเคชัน เช่น องค์กร ผู้ใช้ และสิทธิ์'
            : 'Manage application settings such as organizations, users, and permissions.'}
        </p>
      </section>

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* タブコンテンツ */}
      <div className="mt-6">
        {activeTab === 'organizations' && <OrganizationManagement locale={locale} />}
        {activeTab === 'users' && <UserManagement locale={locale} />}
        {activeTab === 'permissions' && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">
              {locale === 'ja'
                ? '権限管理機能は今後実装予定です。'
                : locale === 'th'
                ? 'ฟังก์ชันการจัดการสิทธิ์จะถูกนำไปใช้ในอนาคต'
                : 'Permission management feature will be implemented in the future.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


