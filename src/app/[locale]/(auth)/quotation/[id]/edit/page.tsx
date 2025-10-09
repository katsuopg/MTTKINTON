import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KintoneClient } from '@/lib/kintone/client';
import { getCustomerRecords } from '@/lib/kintone/customer';
import type { QuotationRecord } from '@/types/kintone';
import QuotationEditForm from './QuotationEditForm';

interface QuotationEditPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

interface CustomerOption {
  id: string;
  name: string;
  address: string;
}

export default async function QuotationEditPage({ params }: QuotationEditPageProps) {
  const { locale, id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const client = new KintoneClient(
    process.env.KINTONE_APP_QUOTATION!,
    process.env.KINTONE_API_TOKEN_QUOTATION!
  );

  let quotation: QuotationRecord | null = null;
  let customerOptions: CustomerOption[] = [];

  try {
    quotation = await client.getRecord<QuotationRecord>(id);
    const customers = await getCustomerRecords();
    customerOptions = customers
      .map((record) => ({
        id: record.文字列__1行_?.value ?? '',
        name: record.会社名?.value ?? '',
        address: record.住所?.value ?? '',
      }))
      .filter((option) => option.id && option.name)
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  } catch (error) {
    console.error('Failed to fetch quotation record:', error);
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

  return (
    <QuotationEditForm
      locale={locale}
      quotation={quotation}
      userEmail={user.email || ''}
      customerOptions={customerOptions}
    />
  );
}
