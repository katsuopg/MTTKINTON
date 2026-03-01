import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import OrderDetailContent from './OrderDetailContent';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface OrderDetailPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { locale, id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const pageTitle = locale === 'ja' ? '注文書詳細' : 'Order Detail';
  const userInfo = await getCurrentUserInfo();

  const { data: order } = await (supabase.from('customer_orders') as any)
    .select('*')
    .eq('kintone_record_id', id)
    .single();

  return (
    <DashboardLayout locale={locale} title={pageTitle} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
      <OrderDetailContent order={order} />
    </DashboardLayout>
  );
}
