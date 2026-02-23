import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KintoneClient } from '@/lib/kintone/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import OrderManagementContent, { type OrderRecord } from './OrderManagementContent';

interface OrderManagementPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    fiscalYear?: string;
    keyword?: string;
  }>;
}

export default async function OrderManagementPage({ params, searchParams }: OrderManagementPageProps) {
  const { locale } = await params;
  const { fiscalYear: fiscalYearParam, keyword: keywordParam } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = language === 'ja' ? '注文書管理' : language === 'th' ? 'จัดการใบสั่งซื้อ' : 'Order Management';

  const selectedFiscalYear = fiscalYearParam ? parseInt(fiscalYearParam) : 14;
  const keyword = keywordParam || '';

  // kintoneから注文書管理アプリのレコードを取得
  let orderRecords: OrderRecord[] = [];

  try {
    const orderClient = new KintoneClient(
      process.env.KINTONE_APP_ORDER_MANAGEMENT!,
      process.env.KINTONE_API_TOKEN_ORDER!
    );

    let queryParts = [`文字列__1行__2 like "${selectedFiscalYear}-"`];

    if (keyword) {
      queryParts.push(`(
        文字列__1行_ like "${keyword}" or
        文字列__1行__4 like "${keyword}" or
        文字列__1行__2 like "${keyword}" or
        ルックアップ like "${keyword}"
      )`);
    }

    const query = queryParts.join(' and ') + ' order by 日付 desc limit 200';
    orderRecords = await orderClient.getRecords<OrderRecord>(query);
  } catch (error) {
    console.error('Error fetching order data:', error);
  }

  const userInfo = await getCurrentUserInfo();

  return (
    <DashboardLayout
      locale={locale}
      title={pageTitle}
      userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
    >
      <OrderManagementContent
        orderRecords={orderRecords}
        locale={locale}
        language={language}
        currentFiscalYear={selectedFiscalYear}
        initialKeyword={keyword}
      />
    </DashboardLayout>
  );
}
