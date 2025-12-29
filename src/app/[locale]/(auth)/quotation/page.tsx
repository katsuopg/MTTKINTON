import { fetchAllQuotations } from '@/lib/kintone/api';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import QuotationListContent from './QuotationListContent';
import { getCurrentUserInfo } from '@/lib/auth/user-info';

interface QuotationListPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function QuotationListPage({ params }: QuotationListPageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  // 見積もり一覧を取得
  const quotations = await fetchAllQuotations();
  console.log('Fetched quotations:', quotations.length);

  const userInfo = await getCurrentUserInfo();

  return (
    <QuotationListContent
      quotations={quotations}
      locale={locale}
      userEmail={user.email || ''}
      userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
    />
  );
}