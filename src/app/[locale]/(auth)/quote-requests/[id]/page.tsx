import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import QuoteRequestDetail from './QuoteRequestDetail';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

const labels = {
  title: {
    ja: '見積依頼詳細',
    en: 'Quote Request Details',
    th: 'รายละเอียดใบขอใบเสนอราคา',
  },
};

export default async function QuoteRequestDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
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
      <QuoteRequestDetail
        locale={locale}
        language={language}
        requestId={id}
        currentUserId={user.id}
      />
    </DashboardLayout>
  );
}
