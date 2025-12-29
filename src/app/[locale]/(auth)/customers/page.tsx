import { CustomerListContent } from './CustomerListContent';
import { createClient } from '../../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import { fetchAllCustomers } from '@/lib/kintone/api';
import { getSalesSummaryByCustomers } from '@/lib/kintone/invoice';
import { getCurrentUserInfo } from '@/lib/auth/user-info';

interface CustomerListPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function CustomerListPage({ params }: CustomerListPageProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  // 顧客一覧を取得
  const customers = await fetchAllCustomers();

  // 顧客名のリストを作成
  const customerNames = customers.map(c => c.会社名.value);

  // 売上サマリーを取得
  const salesSummary = await getSalesSummaryByCustomers(customerNames);

  const userInfo = await getCurrentUserInfo();

  return (
    <CustomerListContent
      customers={customers}
      locale={locale}
      userEmail={user.email || ''}
      salesSummary={salesSummary}
      userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
    />
  );
}