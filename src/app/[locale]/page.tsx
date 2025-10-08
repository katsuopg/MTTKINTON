import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function LocalePage({ params }: PageProps) {
  const { locale } = await params;
  // ホームページアクセス時は認証ページへリダイレクト
  redirect(`/${locale}/auth/login`);
}