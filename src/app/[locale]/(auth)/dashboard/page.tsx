import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KintoneClient } from '@/lib/kintone/client';
import { ProjectRecord, WorkNoRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardContent from './DashboardContent';

interface DashboardPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const supabase = await createClient();
  const { locale } = await params;

  // 認証チェックはミドルウェアで実行されるため、ここではユーザー情報を取得のみ
  const { data: { user } } = await supabase.auth.getUser();

  // kintoneからデータを取得
  let workNoCount = 0;
  let projectCount = 0;
  let recentWorkNos: WorkNoRecord[] = [];
  
  try {
    // クライアントを初期化
    const workNoClient = new KintoneClient(
      '21',
      process.env.KINTONE_API_TOKEN_WORKNO!
    );
    const projectClient = new KintoneClient(
      '114',
      process.env.KINTONE_API_TOKEN_PROJECT!
    );
    
    // 並列でAPI呼び出し
    const [workNoRecords, projectRecords] = await Promise.all([
      workNoClient.getRecords<WorkNoRecord>('order by 更新日時 desc limit 200'),
      projectClient.getRecords<ProjectRecord>('order by 更新日時 desc limit 200')
    ]);
    
    // クライアント側でWIPフィルタリング
    const wipRecords = workNoRecords.filter(record => 
      record.Status?.value === 'Working' || record.Status?.value === 'WIP'
    );
    
    workNoCount = wipRecords.length;
    recentWorkNos = wipRecords;
    projectCount = projectRecords.length;
  } catch (error) {
    console.error('Error fetching kintone data:', error);
  }

  return (
    <DashboardLayout locale={locale} userEmail={user?.email || ''}>
      <DashboardContent 
        locale={locale}
        workNoCount={workNoCount}
        projectCount={projectCount}
        recentWorkNos={recentWorkNos}
      />
    </DashboardLayout>
  );
}