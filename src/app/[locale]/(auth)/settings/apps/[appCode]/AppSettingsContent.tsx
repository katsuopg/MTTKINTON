'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DetailPageHeader } from '@/components/ui/DetailPageHeader';
import Tabs, { TabPanel } from '@/components/ui/Tabs';
import { useNavPermissions } from '@/hooks/useNavPermissions';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import AppPermissionSettings from '../../AppPermissionSettings';
import FieldPermissionSettings from '../../FieldPermissionSettings';
import ProcessManagementSettings from './ProcessManagementSettings';
import RecordPermissionSettings from './RecordPermissionSettings';
import NotificationSettings from './NotificationSettings';
import ViewSettings from './ViewSettings';
import AdvancedSettings from './AdvancedSettings';
import WebhookSettings from './WebhookSettings';

interface AppSettingsContentProps {
  locale: string;
  appCode: string;
  appName: string;
}

export default function AppSettingsContent({ locale, appCode, appName }: AppSettingsContentProps) {
  const router = useRouter();
  const { canManageApp, loading } = useNavPermissions();
  const [activeTab, setActiveTab] = useState('access');

  const label = (ja: string, th: string, en: string) =>
    locale === 'ja' ? ja : locale === 'th' ? th : en;

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!canManageApp(appCode)) {
    router.push(`/${locale}/dashboard`);
    return <LoadingSpinner />;
  }

  const tabs = [
    { key: 'access', label: label('アクセス権', 'สิทธิ์การเข้าถึง', 'Access Rights') },
    { key: 'records', label: label('レコード権限', 'สิทธิ์ระเบียน', 'Record Permissions') },
    { key: 'fields', label: label('フィールド権限', 'สิทธิ์ฟิลด์', 'Field Permissions') },
    { key: 'process', label: label('プロセス管理', 'การจัดการกระบวนการ', 'Process Management') },
    { key: 'views', label: label('一覧・グラフ', 'มุมมอง/กราฟ', 'Views & Charts') },
    { key: 'notification', label: label('通知設定', 'การตั้งค่าการแจ้งเตือน', 'Notifications') },
    { key: 'webhooks', label: label('Webhook', 'Webhook', 'Webhooks') },
    { key: 'advanced', label: label('高度な設定', 'ตั้งค่าขั้นสูง', 'Advanced') },
  ];

  return (
    <div>
      <DetailPageHeader
        backHref={`/${locale}/settings`}
        title={`${appName} - ${label('設定', 'การตั้งค่า', 'Settings')}`}
      />

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
        className="mb-6"
      />

      <TabPanel value="access" activeValue={activeTab}>
        <AppPermissionSettings locale={locale} fixedAppCode={appCode} />
      </TabPanel>

      <TabPanel value="records" activeValue={activeTab}>
        <RecordPermissionSettings locale={locale} appCode={appCode} />
      </TabPanel>

      <TabPanel value="fields" activeValue={activeTab}>
        <FieldPermissionSettings locale={locale} fixedAppCode={appCode} />
      </TabPanel>

      <TabPanel value="process" activeValue={activeTab}>
        <ProcessManagementSettings locale={locale} appCode={appCode} />
      </TabPanel>

      <TabPanel value="views" activeValue={activeTab}>
        <ViewSettings locale={locale} appCode={appCode} />
      </TabPanel>

      <TabPanel value="notification" activeValue={activeTab}>
        <NotificationSettings locale={locale} appCode={appCode} />
      </TabPanel>

      <TabPanel value="webhooks" activeValue={activeTab}>
        <WebhookSettings locale={locale} appCode={appCode} />
      </TabPanel>

      <TabPanel value="advanced" activeValue={activeTab}>
        <AdvancedSettings locale={locale} appCode={appCode} />
      </TabPanel>
    </div>
  );
}
