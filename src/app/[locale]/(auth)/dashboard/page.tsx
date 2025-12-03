import { KintoneClient } from '@/lib/kintone/client';
import { ProjectRecord, WorkNoRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardContent from './DashboardContent';
import { getUserProfile } from '@/lib/auth/get-user-profile';

interface DashboardPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;

  // ユーザープロファイルを取得（認証チェックはミドルウェアで実行）
  const userProfile = await getUserProfile();

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
    <DashboardLayout
      locale={locale}
      userEmail={userProfile?.email || ''}
      userName={userProfile?.name}
      userNickname={userProfile?.nickname}
      userProfileImage={userProfile?.profileImage}
    >
      <DashboardContent
        locale={locale}
        workNoCount={workNoCount}
        projectCount={projectCount}
        recentWorkNos={recentWorkNos}
      />
    </DashboardLayout>
  );
}