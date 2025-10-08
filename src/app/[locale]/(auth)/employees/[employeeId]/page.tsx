import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KintoneClient } from '@/lib/kintone/client';
import { EmployeeRecord } from '@/types/kintone';
import EmployeeDetailContent from './EmployeeDetailContent';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';

interface EmployeeDetailPageProps {
  params: Promise<{
    locale: string;
    employeeId: string;
  }>;
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const { locale, employeeId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  
  // kintoneから従業員情報を取得
  let record: EmployeeRecord | null = null;
  let error = false;
  
  try {
    const client = new KintoneClient(
      '106', // Employee managementアプリID
      process.env.KINTONE_API_TOKEN_EMPLOYEE!
    );
    
    console.log('Searching for employee with ID:', employeeId);
    
    // すべてのレコードを取得してからフィルタリング
    const allRecords = await client.getRecords<EmployeeRecord>();
    console.log('Total records:', allRecords?.length || 0);
    
    // $idでフィルタリング
    record = allRecords?.find(r => r.$id.value === employeeId) || null;
    
    if (record) {
      console.log('Employee detail record:', JSON.stringify(record, null, 2));
    } else {
      console.log('No record found with $id:', employeeId);
    }
  } catch (err) {
    console.error('Error fetching kintone data:', err);
    error = true;
  }

  if (!record) {
    return (
      <DashboardLayout locale={locale} userEmail={user.email} title={language === 'ja' ? '従業員詳細' : language === 'th' ? 'รายละเอียดพนักงาน' : 'Employee Details'}>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <p className="text-red-600">
              {error 
                ? (language === 'ja' ? 'エラーが発生しました' : language === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred')
                : (language === 'ja' ? '従業員が見つかりません' : language === 'th' ? 'ไม่พบพนักงาน' : 'Employee not found')
              }
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const pageTitle = language === 'ja' ? '従業員詳細' : language === 'th' ? 'รายละเอียดพนักงาน' : 'Employee Details';

  return (
    <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle}>
      <EmployeeDetailContent 
        record={record} 
        locale={locale}
      />
    </DashboardLayout>
  );
}