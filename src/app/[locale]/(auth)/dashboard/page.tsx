import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KintoneClient } from '@/lib/kintone/client';
import { ProjectRecord, WorkNoRecord, EmployeeRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardContent from './DashboardContent';
import { getCurrentUserInfo } from '@/lib/auth/user-info';

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
  let employeeName = '';

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
    const employeeClient = new KintoneClient(
      '106',
      process.env.KINTONE_API_TOKEN_EMPLOYEE!
    );

    // 並列でAPI呼び出し
    const userEmail = user?.email || '';
    const [workNoRecords, projectRecords, employeeRecords] = await Promise.all([
      workNoClient.getRecords<WorkNoRecord>('order by 更新日時 desc limit 200'),
      projectClient.getRecords<ProjectRecord>('order by 更新日時 desc limit 200'),
      userEmail ? employeeClient.getRecords<EmployeeRecord>(`メールアドレス = "${userEmail}"`) : Promise.resolve([]),
    ]);

    // クライアント側でWIPフィルタリング
    const wipRecords = workNoRecords.filter(record =>
      record.Status?.value === 'Working' || record.Status?.value === 'WIP'
    );

    workNoCount = wipRecords.length;
    recentWorkNos = wipRecords;
    projectCount = projectRecords.length;

    // 従業員名を取得
    if (employeeRecords.length > 0) {
      employeeName = employeeRecords[0].氏名?.value || '';
    }
  } catch (error) {
    console.error('Error fetching kintone data:', error);
  }

  // 共通ユーティリティでユーザー情報を取得（ニックネーム、アバター含む）
  const currentUserInfo = await getCurrentUserInfo();

  const userInfo = currentUserInfo ? {
    email: currentUserInfo.email,
    name: currentUserInfo.name,
    avatarUrl: currentUserInfo.avatarUrl,
  } : {
    email: user?.email || '',
    name: employeeName || user?.user_metadata?.nickname || '',
    avatarUrl: user?.user_metadata?.avatar_url || '',
  };

  return (
    <DashboardLayout locale={locale} userEmail={user?.email || ''} userInfo={userInfo}>
      <DashboardContent 
        locale={locale}
        workNoCount={workNoCount}
        projectCount={projectCount}
        recentWorkNos={recentWorkNos}
      />
    </DashboardLayout>
  );
}