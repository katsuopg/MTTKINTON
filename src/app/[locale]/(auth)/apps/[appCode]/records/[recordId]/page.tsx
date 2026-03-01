import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import DynamicDetailContent from './DynamicDetailContent';

interface DynamicRecordDetailPageProps {
  params: Promise<{ locale: string; appCode: string; recordId: string }>;
}

export default async function DynamicRecordDetailPage({ params }: DynamicRecordDetailPageProps) {
  const { locale, appCode, recordId } = await params;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appsTable = supabase.from('apps') as any;
  const { data: app } = await appsTable
    .select('id, code, name, name_en, name_th, app_type, enable_comments, enable_history')
    .eq('code', appCode)
    .eq('is_active', true)
    .single();

  if (!app || app.app_type !== 'dynamic') {
    redirect(`/${locale}/dashboard`);
  }

  // フィールド定義を取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fieldsTable = supabase.from('app_fields') as any;
  const { data: fields } = await fieldsTable
    .select('*')
    .eq('app_id', app.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  // レコードを取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recordsTable = supabase.from('app_records') as any;
  const { data: record } = await recordsTable
    .select('*')
    .eq('id', recordId)
    .eq('app_id', app.id)
    .single();

  if (!record) {
    redirect(`/${locale}/apps/${appCode}`);
  }

  const appName = locale === 'en' && app.name_en ? app.name_en : locale === 'th' && app.name_th ? app.name_th : app.name;
  const title = `${appName} - #${record.record_number}`;
  const userInfo = await getCurrentUserInfo();

  return (
    <DashboardLayout
      locale={locale}
      title={title}
      userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
    >
      <DynamicDetailContent
        locale={locale}
        appCode={appCode}
        appName={appName}
        fields={fields || []}
        record={record}
        enableComments={app.enable_comments ?? true}
        enableHistory={app.enable_history ?? true}
      />
    </DashboardLayout>
  );
}
