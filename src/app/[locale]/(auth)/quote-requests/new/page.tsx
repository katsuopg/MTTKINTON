import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import QuoteRequestForm from './QuoteRequestForm';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    work_no?: string;
    project_code?: string;
  }>;
}

const labels = {
  title: {
    ja: '新規見積依頼',
    en: 'New Quote Request',
    th: 'ใบขอใบเสนอราคาใหม่',
  },
};

export default async function NewQuoteRequestPage({
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
      <QuoteRequestForm
        locale={locale}
        language={language}
        defaultValues={{
          work_no: searchParamsResolved.work_no,
          project_code: searchParamsResolved.project_code,
        }}
      />
    </DashboardLayout>
  );
}
