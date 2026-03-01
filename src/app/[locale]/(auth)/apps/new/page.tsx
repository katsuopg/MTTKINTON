import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import NewAppContent from './NewAppContent';

interface NewAppPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ templateId?: string }>;
}

export default async function NewAppPage({ params, searchParams }: NewAppPageProps) {
  const { locale } = await params;
  const { templateId } = await searchParams;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  // テンプレート情報を取得
  let templateInfo: { id: string; name: string; name_en?: string; name_th?: string; description?: string; icon?: string; color?: string } | null = null;
  if (templateId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: template } = await (supabase.from('app_templates') as any)
      .select('id, name, name_en, name_th, description, icon, color')
      .eq('id', templateId)
      .single();
    if (template) {
      templateInfo = template;
    }
  }

  const title = locale === 'ja' ? '新規アプリ作成' : locale === 'th' ? 'สร้างแอปใหม่' : 'Create New App';
  const userInfo = await getCurrentUserInfo();

  return (
    <DashboardLayout
      locale={locale}
      title={title}
      userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
    >
      <NewAppContent locale={locale} templateInfo={templateInfo} />
    </DashboardLayout>
  );
}
