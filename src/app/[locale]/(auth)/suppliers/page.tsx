import { createClient } from '../../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import type { Language } from '@/lib/kintone/field-mappings';
import { tableStyles } from '@/components/ui/TableStyles';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import SuppliersTable from './SuppliersTable';

interface SuppliersPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function SuppliersPage({ params }: SuppliersPageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  const { data: suppliers, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('company_name_en', { ascending: true });

  if (error) {
    console.error('Error fetching suppliers:', error);
  }

  const pageTitle = language === 'ja' ? '仕入業者管理' : language === 'th' ? 'จัดการซัพพลายเออร์' : 'Supplier Management';
  const userInfo = await getCurrentUserInfo();

  return (
    <DashboardLayout
      locale={locale}
      userEmail={user.email}
      title={pageTitle}
      userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
    >
      <div className={tableStyles.contentWrapper}>
        <SuppliersTable suppliers={(suppliers || []) as any} locale={locale} language={language} />
      </div>
    </DashboardLayout>
  );
}
