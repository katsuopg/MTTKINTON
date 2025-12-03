"use server";

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SettingsClient from './SettingsClient';

interface SettingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
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
      ? 'APP設定'
      : locale === 'th'
      ? 'การตั้งค่าแอป'
      : 'App Settings';

  return (
    <DashboardLayout locale={locale} userEmail={user.email || ''} title={title}>
      <SettingsClient locale={locale} />
    </DashboardLayout>
  );
}


