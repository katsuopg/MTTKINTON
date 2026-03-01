import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import QuotationListContent from './QuotationListContent';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import type { Language } from '@/lib/kintone/field-mappings';

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

  const { data: quotations } = await (supabase.from('quotations') as any)
    .select('*')
    .order('quotation_date', { ascending: false });

  const userInfo = await getCurrentUserInfo();

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = language === 'ja' ? '見積もり管理' : language === 'th' ? 'จัดการใบเสนอราคา' : 'Quotation Management';

  return (
    <DashboardLayout
      locale={locale}
      userEmail={user.email}
      title={pageTitle}
      userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
    >
      <QuotationListContent quotations={quotations || []} locale={locale} />
    </DashboardLayout>
  );
}
