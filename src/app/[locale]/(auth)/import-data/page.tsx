"use server";

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ImportDataClient from './ImportDataClient';

interface ImportDataPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ImportDataPage({ params }: ImportDataPageProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  const title =
    locale === 'ja'
      ? 'データ同期'
      : locale === 'th'
      ? 'ซิงก์ข้อมูล'
      : 'Data Sync';

  return (
    <DashboardLayout locale={locale} userEmail={user.email || ''} title={title}>
      <ImportDataClient locale={locale} />
    </DashboardLayout>
  );
}
