import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import FormBuilderContent from './FormBuilderContent';

interface FormBuilderPageProps {
  params: Promise<{ locale: string; appCode: string }>;
}

export default async function FormBuilderPage({ params }: FormBuilderPageProps) {
  const { locale, appCode } = await params;
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

  if (!app) {
    redirect(`/${locale}/dashboard`);
  }

  const appName = locale === 'en' && app.name_en ? app.name_en : locale === 'th' && app.name_th ? app.name_th : app.name;
  const title = locale === 'ja' ? `${appName} - フォーム設計` : locale === 'th' ? `${appName} - ออกแบบฟอร์ม` : `${appName} - Form Design`;
  const userInfo = await getCurrentUserInfo();

  return (
    <DashboardLayout
      locale={locale}
      title={title}
      userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
    >
      <FormBuilderContent locale={locale} appCode={appCode} appName={appName} />
    </DashboardLayout>
  );
}
