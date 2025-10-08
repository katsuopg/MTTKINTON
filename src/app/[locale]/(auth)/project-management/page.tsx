import { createClient } from '../../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import { KintoneClient } from '@/lib/kintone/client';
import { ProjectRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import { getStatusColor } from '@/lib/kintone/utils';
import Link from 'next/link';
import { tableStyles } from '@/components/ui/TableStyles';

interface ProjectManagementPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    search?: string;
  }>;
}

export default async function ProjectManagementPage({ params, searchParams }: ProjectManagementPageProps) {
  const { locale } = await params;
  const searchParamsResolved = await searchParams;
  const supabase = await createClient();

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Convert locale to Language type
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  
  // 検索クエリの取得
  const searchQuery = searchParamsResolved.search || '';
  
  // kintoneからProject managementアプリのレコードを取得
  let projectRecords: ProjectRecord[] = [];
  
  try {
    // Project managementアプリから受注前のプロジェクトを取得
    const projectClient = new KintoneClient(
      '114', // Project managementアプリID
      process.env.KINTONE_API_TOKEN_PROJECT!
    );
    projectRecords = await projectClient.getRecords<ProjectRecord>();
  } catch (error) {
    console.error('Error fetching kintone data:', error);
  }

  // 日付フォーマット関数
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '未定';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    if (language === 'ja') {
      return dateString; // YYYY-MM-DD
    } else {
      // DD/MM/YYYY for English and Thai
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  const pageTitle = language === 'ja' ? 'プロジェクト管理' : language === 'th' ? 'จัดการโครงการ' : 'Project Management';
  
  return (
    <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle}>
      <div className={tableStyles.contentWrapper}>
        {/* 検索バー */}
        <div className={tableStyles.searchWrapper}>
          <form method="get" action={`/${locale}/project-management`} className={tableStyles.searchForm}>
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder={language === 'ja' ? 'プロジェクトコード、プロジェクト名、顧客名で検索...' : language === 'th' ? 'ค้นหาตามรหัสโครงการ, ชื่อโครงการ, ชื่อลูกค้า...' : 'Search by project code, name, customer...'}
              className={tableStyles.searchInput}
            />
            <button
              type="submit"
              className={tableStyles.searchButton}
            >
              {language === 'ja' ? '検索' : language === 'th' ? 'ค้นหา' : 'Search'}
            </button>
            {searchQuery && (
              <a
                href={`/${locale}/project-management`}
                className={tableStyles.clearButton}
              >
                {language === 'ja' ? 'クリア' : language === 'th' ? 'ล้าง' : 'Clear'}
              </a>
            )}
          </form>
        </div>

        <div className={tableStyles.filterBar}>
          <p className={tableStyles.recordCount}>
            {searchQuery ? (
              <>{language === 'ja' ? `「${searchQuery}」の検索結果: ${projectRecords.length}件` : 
               language === 'th' ? `ผลการค้นหา "${searchQuery}": ${projectRecords.length} รายการ` : 
               `Search results for "${searchQuery}": ${projectRecords.length} items`}</>
            ) : (
              <>{language === 'ja' ? `${projectRecords.length}件のプロジェクト` : 
               language === 'th' ? `${projectRecords.length} โครงการ` : 
               `${projectRecords.length} projects`}</>
            )}
          </p>
        </div>

        <div className={tableStyles.tableContainer}>
          {projectRecords.length === 0 ? (
            <div className={tableStyles.emptyRow}>
              {language === 'ja' ? 'プロジェクトがありません' : 
               language === 'th' ? 'ไม่มีโครงการ' : 
               'No projects'}
            </div>
          ) : (
            <div className="max-w-7xl overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      {language === 'ja' ? 'コード' : language === 'th' ? 'รหัส' : 'Code'}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                      {language === 'ja' ? 'プロジェクト名' : language === 'th' ? 'ชื่อโครงการ' : 'Project Name'}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 hidden md:table-cell">
                      CS ID
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 hidden lg:table-cell">
                      {language === 'ja' ? '開始日' : language === 'th' ? 'วันเริ่มต้น' : 'Start Date'}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 hidden lg:table-cell">
                      {language === 'ja' ? '納期' : language === 'th' ? 'กำหนดส่ง' : 'Due Date'}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 hidden md:table-cell">
                      {language === 'ja' ? '工事番号' : language === 'th' ? 'หมายเลขงาน' : 'Work No.'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projectRecords.map((record) => (
                    <tr key={record.$id.value} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link
                          href={`/${locale}/project-management/${record.PJ_code?.value}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {record.PJ_code?.value || '-'}
                        </Link>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <div className="font-medium">
                          {record.PjName?.value || '-'}
                        </div>
                        {record.Description?.value && (
                          <div className="text-gray-500 truncate max-w-xs">
                            {record.Description.value}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                        {record.Cs_ID?.value || '-'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getStatusColor(record.Status?.value || '見積中')
                        }`}>
                          {record.Status?.value || '見積中'}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                        {formatDate(record.Start_date?.value)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                        {formatDate(record.Due_date?.value)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                        {record.WorkNo?.value ? (
                          <Link
                            href={`/${locale}/workno/${encodeURIComponent(record.WorkNo.value)}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {record.WorkNo.value}
                          </Link>
                        ) : (
                          <span className="text-gray-500">未割当</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}