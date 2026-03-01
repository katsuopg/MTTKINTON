import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import DynamicFormContent from './DynamicFormContent';

interface NewRecordPageProps {
  params: Promise<{ locale: string; appCode: string }>;
  searchParams: Promise<{ prefill?: string }>;
}

export default async function NewRecordPage({ params, searchParams }: NewRecordPageProps) {
  const { locale, appCode } = await params;
  const { prefill } = await searchParams;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appsTable = supabase.from('apps') as any;
  const { data: app } = await appsTable
    .select('id, code, name, name_en, name_th, app_type')
    .eq('code', appCode)
    .eq('is_active', true)
    .single();

  if (!app || app.app_type !== 'dynamic') {
    redirect(`/${locale}/dashboard`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fieldsTable = supabase.from('app_fields') as any;
  const { data: fields } = await fieldsTable
    .select('*')
    .eq('app_id', app.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const appName = locale === 'en' && app.name_en ? app.name_en : locale === 'th' && app.name_th ? app.name_th : app.name;
  const title = locale === 'ja' ? `${appName} - 新規作成` : locale === 'th' ? `${appName} - สร้างใหม่` : `${appName} - New Record`;
  const userInfo = await getCurrentUserInfo();

  // プリフィルデータの安全なパース
  let prefillData: Record<string, unknown> | undefined;
  if (prefill) {
    try {
      prefillData = JSON.parse(decodeURIComponent(prefill));
    } catch {
      // 不正なデータは無視
    }
  }

  return (
    <DashboardLayout
      locale={locale}
      title={title}
      userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
    >
      <DynamicFormContent
        locale={locale}
        appCode={appCode}
        appName={appName}
        fields={fields || []}
        prefillData={prefillData}
      />
    </DashboardLayout>
  );
}
