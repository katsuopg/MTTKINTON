import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { fetchWorkNo } from '@/lib/kintone/api';
import WorkNoEditContent from './WorkNoEditContent';

interface WorkNoEditPageProps {
  params: Promise<{
    locale: string;
    workNo: string;
  }>;
}

export default async function WorkNoEditPage({ params }: WorkNoEditPageProps) {
  const { locale, workNo } = await params;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  // 工事番号の詳細を取得
  const record = await fetchWorkNo(workNo);

  if (!record) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">工事番号が見つかりません</h1>
          <p className="text-gray-600">工事番号: {workNo}</p>
          <a
            href={`/${locale}/dashboard`}
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
          >
            ダッシュボードに戻る
          </a>
        </div>
      </div>
    );
  }

  return <WorkNoEditContent record={record} locale={locale} userEmail={user.email || ''} />;
}