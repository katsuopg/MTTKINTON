import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardContent from '@/src/app/[locale]/(auth)/dashboard/DashboardContent';
import { KintoneClient } from '@/lib/kintone/client';
import { ProjectRecord, WorkNoRecord } from '@/types/kintone';

export default async function DashboardTestPage() {
  // kintoneからデータを取得
  let workNoCount = 0;
  let projectCount = 0;
  let recentWorkNos: WorkNoRecord[] = [];
  
  try {
    // Work No.アプリから受注後のプロジェクトを取得
    const workNoClient = new KintoneClient(
      '21',
      process.env.KINTONE_API_TOKEN_WORKNO!
    );
    const workNoRecords = await workNoClient.getRecords<WorkNoRecord>();
    // WIP（Working）ステータスのレコードのみをフィルタリング
    const wipRecords = workNoRecords.filter(record => 
      record.Status?.value === 'Working' || record.Status?.value === 'WIP'
    );
    workNoCount = wipRecords.length;
    // 最新の5件を取得
    recentWorkNos = wipRecords.slice(0, 5);
    
    // Project managementアプリから受注前のプロジェクトを取得
    const projectClient = new KintoneClient(
      '114',
      process.env.KINTONE_API_TOKEN_PROJECT!
    );
    const projectRecords = await projectClient.getRecords<ProjectRecord>();
    projectCount = projectRecords.length;
  } catch (error) {
    console.error('Error fetching kintone data:', error);
  }

  return (
    <DashboardLayout locale="ja" userEmail="test@example.com">
      <DashboardContent 
        locale="ja"
        workNoCount={workNoCount}
        projectCount={projectCount}
        recentWorkNos={recentWorkNos}
      />
    </DashboardLayout>
  );
}