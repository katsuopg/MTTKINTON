import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KintoneClient } from '@/lib/kintone/client';
import { ProjectRecord, CustomerRecord } from '@/types/kintone';
import { fetchCustomer } from '@/lib/kintone/api';
import ProjectDetailContent from './ProjectDetailContent';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';

interface ProjectDetailPageProps {
  params: Promise<{
    locale: string;
    pjCode: string;
  }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { locale, pjCode } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  
  // kintoneからプロジェクト情報を取得
  let record: ProjectRecord | null = null;
  let error = false;
  
  try {
    const client = new KintoneClient(
      '114', // Project managementアプリID
      process.env.KINTONE_API_TOKEN_PROJECT!
    );
    
    const records = await client.getRecords<ProjectRecord>(`PJ_code = "${pjCode}"`);
    if (records && records.length > 0) {
      record = records[0];
    }
  } catch (err) {
    console.error('Error fetching kintone data:', err);
    error = true;
  }

  if (!record) {
    return (
      <DashboardLayout locale={locale} userEmail={user.email} title={language === 'ja' ? 'プロジェクト詳細' : language === 'th' ? 'รายละเอียดโครงการ' : 'Project Details'}>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <p className="text-red-600">
              {error 
                ? (language === 'ja' ? 'エラーが発生しました' : language === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred')
                : (language === 'ja' ? 'プロジェクトが見つかりません' : language === 'th' ? 'ไม่พบโครงการ' : 'Project not found')
              }
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // CS IDから顧客情報を取得（URLデコードして検索）
  let customer = null;
  const csId = record.Cs_ID?.value;
  if (csId) {
    const decodedCsId = decodeURIComponent(csId);
    customer = await fetchCustomer(decodedCsId);
  }

  const pageTitle = language === 'ja' ? 'プロジェクト詳細' : language === 'th' ? 'รายละเอียดโครงการ' : 'Project Details';

  return (
    <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle}>
      <ProjectDetailContent 
        record={record} 
        customer={customer} 
        locale={locale}
      />
    </DashboardLayout>
  );
}