import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import { ProjectManagementContent } from './ProjectManagementContent';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    status?: string;
    search?: string;
  }>;
}

const labels = {
  title: {
    ja: 'プロジェクト管理',
    en: 'Project Management',
    th: 'จัดการโครงการ',
  },
};

export default async function ProjectManagementPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const searchParamsResolved = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const userInfo = await getCurrentUserInfo();

  return (
    <DashboardLayout
      locale={locale}
      userEmail={user.email || ''}
      title={labels.title[language]}
      userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
    >
      <ProjectManagementContent
        locale={locale}
        language={language}
        initialFilters={{
          status_code: searchParamsResolved.status,
          search: searchParamsResolved.search,
        }}
      />
    </DashboardLayout>
  );
}
