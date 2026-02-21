import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KintoneClient } from '@/lib/kintone/client';
import { QuotationRecord } from '@/types/kintone';
import QuotationDetailContent from './QuotationDetailContent';
import { getCurrentUserInfo } from '@/lib/auth/user-info';

interface QuotationDetailPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function QuotationDetailPage({ params }: QuotationDetailPageProps) {
  const { locale, id } = await params;
  const supabase = await createClient();

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // 見積もり詳細を取得
  let quotation: QuotationRecord | null = null;

  try {
    const quotationClient = new KintoneClient(
      process.env.KINTONE_APP_QUOTATION!,
      process.env.KINTONE_API_TOKEN_QUOTATION!
    );

    quotation = await quotationClient.getRecord<QuotationRecord>(id);
  } catch (error) {
    console.error('Error fetching quotation detail:', error);
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">見積もりが見つかりません</h1>
          <p className="text-gray-600">ID: {id}</p>
          <a
            href={`/${locale}/quotation`}
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
          >
            一覧に戻る
          </a>
        </div>
      </div>
    );
  }

  const userInfo = await getCurrentUserInfo();

  return (
    <QuotationDetailContent
      quotation={quotation}
      locale={locale}
      userEmail={user.email || ''}
      userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
    />
  );
}