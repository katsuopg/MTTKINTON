'use client';

import { useState } from 'react';
import { Building2, Users, ShieldCheck, LayoutGrid, Table2, Menu, FolderOpen, ClipboardList, KeyRound, LayoutDashboard, Lock } from 'lucide-react';
import { detailStyles } from '@/components/ui/DetailStyles';
import OrganizationManagement from './OrganizationManagement';
import UserManagement from './UserManagement';
import PermissionManagement from './PermissionManagement';
import AppPermissionSettings from './AppPermissionSettings';
import FieldPermissionSettings from './FieldPermissionSettings';
import MenuManagement from './MenuManagement';
import AppGroupManagement from './AppGroupManagement';
import AuditLogViewer from './AuditLogViewer';
import ApiTokenManagement from './ApiTokenManagement';
import PortalWidgetManagement from './PortalWidgetManagement';
import { usePermissions } from '@/hooks/usePermissions';

interface SettingsClientProps {
  locale: string;
}

type TabId = 'organizations' | 'users' | 'permissions' | 'app_permissions' | 'field_permissions' | 'menu_management' | 'app_groups' | 'audit_logs' | 'api_tokens' | 'portal_widgets';

export default function SettingsClient({ locale }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('organizations');
  const { hasPermission, isAdmin, loading } = usePermissions();

  // アクセス権チェック: manage_settings権限またはsystem_admin
  const hasAccess = loading || isAdmin || hasPermission('manage_settings');

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'organizations',
      label: locale === 'ja' ? '組織管理' : locale === 'th' ? 'จัดการองค์กร' : 'Organization Management',
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      id: 'users',
      label: locale === 'ja' ? 'ユーザー管理' : locale === 'th' ? 'จัดการผู้ใช้' : 'User Management',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'permissions',
      label: locale === 'ja' ? '権限管理' : locale === 'th' ? 'จัดการสิทธิ์' : 'Permission Management',
      icon: <ShieldCheck className="w-5 h-5" />,
    },
    {
      id: 'app_permissions',
      label: locale === 'ja' ? 'アプリ権限' : locale === 'th' ? 'สิทธิ์แอป' : 'App Permissions',
      icon: <LayoutGrid className="w-5 h-5" />,
    },
    {
      id: 'field_permissions',
      label: locale === 'ja' ? 'フィールド権限' : locale === 'th' ? 'สิทธิ์ฟิลด์' : 'Field Permissions',
      icon: <Table2 className="w-5 h-5" />,
    },
    {
      id: 'menu_management',
      label: locale === 'ja' ? 'メニュー管理' : locale === 'th' ? 'จัดการเมนู' : 'Menu Management',
      icon: <Menu className="w-5 h-5" />,
    },
    {
      id: 'app_groups',
      label: locale === 'ja' ? 'アプリグループ' : locale === 'th' ? 'กลุ่มแอป' : 'App Groups',
      icon: <FolderOpen className="w-5 h-5" />,
    },
    {
      id: 'audit_logs',
      label: locale === 'ja' ? '監査ログ' : locale === 'th' ? 'บันทึกการตรวจสอบ' : 'Audit Logs',
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      id: 'api_tokens',
      label: locale === 'ja' ? 'APIトークン' : locale === 'th' ? 'โทเค็น API' : 'API Tokens',
      icon: <KeyRound className="w-5 h-5" />,
    },
    {
      id: 'portal_widgets',
      label: locale === 'ja' ? 'ポータル' : locale === 'th' ? 'พอร์ทัล' : 'Portal',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
  ];

  // ロード中はスケルトン表示
  if (loading) {
    return (
      <div className={detailStyles.pageWrapper}>
        <div className={detailStyles.pageHeader}>
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="mt-2 h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className={`${detailStyles.card} p-12`}>
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
      <div className={detailStyles.pageWrapper}>
        <div className={`${detailStyles.card} p-12`}>
          <div className="text-center">
            <Lock className="mx-auto w-16 h-16 text-gray-300 dark:text-gray-600" />
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
    <div className={detailStyles.pageWrapper}>
      {/* Page Header */}
      <div className={detailStyles.pageHeader}>
        <h1 className={detailStyles.pageTitle}>
          {locale === 'ja' ? 'システム管理' : locale === 'th' ? 'การจัดการระบบ' : 'System Management'}
        </h1>
        <p className={detailStyles.pageSubtitle}>
          {locale === 'ja'
            ? '組織、ユーザー、権限などのシステム設定を管理します。'
            : locale === 'th'
            ? 'จัดการการตั้งค่าระบบ เช่น องค์กร ผู้ใช้ และสิทธิ์'
            : 'Manage system settings such as organizations, users, and permissions.'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={detailStyles.card}>
        <div className={detailStyles.tabList}>
          <nav className="flex overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${detailStyles.tabButton} -mb-px ${
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-500 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-brand-500 dark:text-brand-400' : 'text-gray-400'}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className={detailStyles.cardContent}>
          {activeTab === 'organizations' && <OrganizationManagement locale={locale} />}
          {activeTab === 'users' && <UserManagement locale={locale} />}
          {activeTab === 'permissions' && <PermissionManagement locale={locale} />}
          {activeTab === 'app_permissions' && <AppPermissionSettings locale={locale} />}
          {activeTab === 'field_permissions' && <FieldPermissionSettings locale={locale} />}
          {activeTab === 'menu_management' && <MenuManagement locale={locale} />}
          {activeTab === 'app_groups' && <AppGroupManagement locale={locale} />}
          {activeTab === 'audit_logs' && <AuditLogViewer locale={locale} />}
          {activeTab === 'api_tokens' && <ApiTokenManagement locale={locale} />}
          {activeTab === 'portal_widgets' && <PortalWidgetManagement locale={locale} />}
        </div>
      </div>
    </div>
  );
}
