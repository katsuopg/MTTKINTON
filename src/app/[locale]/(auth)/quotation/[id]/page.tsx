import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import QuotationDetailContent from './QuotationDetailContent';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';

interface QuotationDetailPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function QuotationDetailPage({ params }: QuotationDetailPageProps) {
  const { locale, id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = language === 'ja' ? '見積もり詳細' : language === 'th' ? 'รายละเอียดใบเสนอราคา' : 'Quotation Details';
  const userInfo = await getCurrentUserInfo();

  const { data: quotation } = await (supabase.from('quotations') as any)
    .select('*')
    .eq('kintone_record_id', id)
    .single();

  if (!quotation) {
    return (
      <DashboardLayout locale={locale} title={pageTitle} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">見積もりが見つかりません</h1>
            <p className="text-gray-600 dark:text-gray-400">ID: {id}</p>
            <a
              href={`/${locale}/quotation`}
              className="mt-4 inline-block text-brand-500 hover:text-brand-600"
            >
              一覧に戻る
            </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout locale={locale} title={pageTitle} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
      <QuotationDetailContent
        quotation={quotation}
        locale={locale}
      />
    </DashboardLayout>
  );
}
