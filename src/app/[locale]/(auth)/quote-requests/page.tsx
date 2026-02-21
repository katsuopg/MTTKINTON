import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import QuoteRequestList from './QuoteRequestList';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    status?: string;
    search?: string;
    from_date?: string;
    to_date?: string;
  }>;
}

const labels = {
  title: {
    ja: '見積依頼一覧',
    en: 'Quote Requests',
    th: 'รายการขอใบเสนอราคา',
  },
  description: {
    ja: '見積依頼の一覧と管理',
    en: 'Quote request list and management',
    th: 'รายการและการจัดการใบขอใบเสนอราคา',
  },
};

export default async function QuoteRequestsPage({
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
      <QuoteRequestList
        locale={locale}
        language={language}
        initialFilters={{
          status_code: searchParamsResolved.status,
          search: searchParamsResolved.search,
          from_date: searchParamsResolved.from_date,
          to_date: searchParamsResolved.to_date,
        }}
      />
    </DashboardLayout>
  );
}
