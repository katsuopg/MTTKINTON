import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import AppsPortalContent from './AppsPortalContent';

interface AppsPortalPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AppsPortalPage({ params }: AppsPortalPageProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appsTable = supabase.from('apps') as any;
  const { data: apps } = await appsTable
    .select('id, code, name, name_en, name_th, description, app_type, icon, color, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  // 動的アプリのレコード数を取得
  const dynamicApps = (apps || []).filter((a: { app_type: string }) => a.app_type === 'dynamic');
  const recordCounts: Record<string, number> = {};

  if (dynamicApps.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recordsTable = supabase.from('app_records') as any;
    for (const app of dynamicApps) {
      const { count } = await recordsTable
        .select('id', { count: 'exact', head: true })
        .eq('app_id', app.id);
      recordCounts[app.code] = count || 0;
    }
  }

  const title = locale === 'ja' ? 'アプリ一覧' : locale === 'th' ? 'รายการแอป' : 'Apps';
  const userInfo = await getCurrentUserInfo();

  return (
    <DashboardLayout
      locale={locale}
      title={title}
      userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
    >
      <AppsPortalContent
        locale={locale}
        apps={apps || []}
        recordCounts={recordCounts}
      />
    </DashboardLayout>
  );
}
