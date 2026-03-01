import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import DynamicListContent from './DynamicListContent';

interface DynamicAppPageProps {
  params: Promise<{ locale: string; appCode: string }>;
}

export default async function DynamicAppPage({ params }: DynamicAppPageProps) {
  const { locale, appCode } = await params;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appsTable = supabase.from('apps') as any;
  const { data: app } = await appsTable
    .select('id, code, name, name_en, name_th, app_type, icon, color, enable_bulk_delete, enable_history, enable_comments')
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

  const appName = locale === 'en' && app.name_en ? app.name_en : locale === 'th' && app.name_th ? app.name_th : app.name;
  const userInfo = await getCurrentUserInfo();

  return (
    <DashboardLayout
      locale={locale}
      title={appName}
      userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
    >
      <DynamicListContent
        locale={locale}
        appCode={appCode}
        appName={appName}
        fields={fields || []}
        enableBulkDelete={app.enable_bulk_delete ?? true}
      />
    </DashboardLayout>
  );
}
