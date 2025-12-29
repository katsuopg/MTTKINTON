import { getCostRecords } from '@/lib/kintone/cost';
import { CostManagementContent } from './CostManagementContent';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCurrentUserInfo } from '@/lib/auth/user-info';

interface CostManagementPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CostManagementPage({ params }: CostManagementPageProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  const userInfo = await getCurrentUserInfo();

  try {
    console.log('Attempting to fetch cost records...');
    const { records: costRecords } = await getCostRecords();

    return (
      <CostManagementContent
        costRecords={costRecords}
        locale={locale}
        userEmail={user.email || ''}
        userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
      />
    );
  } catch (error) {
    console.error('Error fetching cost records:', error);

    return (
      <CostManagementContent
        costRecords={[]}
        locale={locale}
        userEmail={user.email || ''}
        userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
      />
    );
  }
}