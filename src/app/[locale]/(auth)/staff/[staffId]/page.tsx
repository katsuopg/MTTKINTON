import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { fetchAllCustomerStaff } from '@/lib/kintone/api';
import { StaffDetailFromListContent } from './StaffDetailFromListContent';

interface StaffDetailPageProps {
  params: {
    staffId: string;
    locale: string;
  };
}

export default async function StaffDetailPage({ params }: StaffDetailPageProps) {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${params.locale}/login`);
  }

  // 全担当者から該当のスタッフを検索
  const allStaff = await fetchAllCustomerStaff();
  const staff = allStaff.find(s => s.$id.value === params.staffId);
  
  if (!staff) {
    return notFound();
  }

  return (
    <StaffDetailFromListContent
      staff={staff}
      locale={params.locale}
      userEmail={user.email || ''}
    />
  );
}