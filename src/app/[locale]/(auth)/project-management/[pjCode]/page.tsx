import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import ProjectDetailContent from './ProjectDetailContent';

interface ProjectDetailPageProps {
  params: Promise<{
    locale: string;
    pjCode: string;
  }>;
}

const labels = {
  title: {
    ja: 'プロジェクト詳細',
    en: 'Project Details',
    th: 'รายละเอียดโครงการ',
  },
  notFound: {
    ja: 'プロジェクトが見つかりません',
    en: 'Project not found',
    th: 'ไม่พบโครงการ',
  },
  error: {
    ja: 'エラーが発生しました',
    en: 'An error occurred',
    th: 'เกิดข้อผิดพลาด',
  },
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { locale, pjCode } = await params;
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
      <ProjectDetailContent
        projectCode={decodeURIComponent(pjCode)}
        locale={locale}
        language={language}
      />
    </DashboardLayout>
  );
}
