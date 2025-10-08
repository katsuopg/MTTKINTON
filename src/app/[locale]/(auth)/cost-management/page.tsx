import { getCostRecords } from '@/lib/kintone/cost';
import { CostManagementContent } from './CostManagementContent';

interface CostManagementPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CostManagementPage({ params }: CostManagementPageProps) {
  const { locale } = await params;
  
  // Mock user email - 実際の実装では認証から取得
  const userEmail = 'user@example.com';

  try {
    console.log('Attempting to fetch cost records...');
    const { records: costRecords } = await getCostRecords();
    
    return (
      <CostManagementContent
        costRecords={costRecords}
        locale={locale}
        userEmail={userEmail}
      />
    );
  } catch (error) {
    console.error('Error fetching cost records:', error);
    
    return (
      <CostManagementContent
        costRecords={[]}
        locale={locale}
        userEmail={userEmail}
      />
    );
  }
}