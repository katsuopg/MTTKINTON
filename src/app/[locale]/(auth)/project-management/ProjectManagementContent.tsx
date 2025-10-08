'use client';

import { useState, useMemo } from 'react';
import { ProjectRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { Language } from '@/lib/kintone/field-mappings';
import { getStatusColor } from '@/lib/kintone/utils';
import { tableStyles } from '@/components/ui/TableStyles';

interface ProjectManagementContentProps {
  projectRecords: ProjectRecord[];
  locale: string;
  userEmail: string;
}

export function ProjectManagementContent({ projectRecords, locale, userEmail }: ProjectManagementContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const [searchTerm, setSearchTerm] = useState('');
  const pageTitle = language === 'ja' ? 'プロジェクト管理' : language === 'th' ? 'จัดการโครงการ' : 'Project Management';

  // フィルタリング
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projectRecords;
    
    return projectRecords.filter(record => {
      const pjCode = record.PJ_code?.value?.toLowerCase() || '';
      const pjName = record.PjName?.value?.toLowerCase() || '';
      const csId = record.Cs_ID?.value?.toLowerCase() || '';
      const status = record.Status?.value?.toLowerCase() || '';
      const query = searchTerm.toLowerCase();
      
      return pjCode.includes(query) || 
             pjName.includes(query) || 
             csId.includes(query) || 
             status.includes(query);
    });
  }, [projectRecords, searchTerm]);

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

  return (
    <DashboardLayout locale={locale} userEmail={userEmail} title={pageTitle}>
      <div className={tableStyles.contentWrapper}>
          {/* 検索バー */}
          <div className={tableStyles.searchWrapper}>
            <div className={tableStyles.searchForm}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  language === 'ja' ? 'プロジェクトコード、プロジェクト名、CS IDで検索...' : 
                  language === 'th' ? 'ค้นหาตามรหัสโครงการ, ชื่อโครงการ, CS ID...' : 
                  'Search by project code, name, CS ID...'
                }
                className={tableStyles.searchInput}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className={tableStyles.clearButton}
                >
                  {language === 'ja' ? 'クリア' : language === 'th' ? 'ล้าง' : 'Clear'}
                </button>
              )}
            </div>
          </div>

          {/* レコード数表示 */}
          <div className={tableStyles.filterBar}>
            <p className={tableStyles.recordCount}>
              {language === 'ja' ? `${filteredProjects.length} 件のプロジェクト` : 
               language === 'th' ? `${filteredProjects.length} โครงการ` : 
               `${filteredProjects.length} projects`}
            </p>
          </div>

          {/* テーブル */}
          <div className={tableStyles.tableContainer}>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? (
                  language === 'ja' ? '検索結果が見つかりませんでした' : 
                  language === 'th' ? 'ไม่พบผลการค้นหา' : 
                  'No search results found'
                ) : (
                  language === 'ja' ? 'プロジェクトがありません' : 
                  language === 'th' ? 'ไม่มีโครงการ' : 
                  'No projects'
                )}
              </div>
            ) : (
              <table className={tableStyles.table}>
                <thead className={tableStyles.thead}>
                  <tr>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? 'プロジェクトコード' : language === 'th' ? 'รหัสโครงการ' : 'Project Code'}
                    </th>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? 'プロジェクト名' : language === 'th' ? 'ชื่อโครงการ' : 'Project Name'}
                    </th>
                    <th className={tableStyles.th}>
                      CS ID
                    </th>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                    </th>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? '開始日' : language === 'th' ? 'วันเริ่มต้น' : 'Start Date'}
                    </th>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? '納期' : language === 'th' ? 'กำหนดส่ง' : 'Due Date'}
                    </th>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? '工事番号' : language === 'th' ? 'หมายเลขงาน' : 'Work No.'}
                    </th>
                  </tr>
                </thead>
                <tbody className={tableStyles.tbody}>
                  {filteredProjects.map((record) => (
                    <tr key={record.$id.value} className={tableStyles.tr}>
                      <td className={tableStyles.td}>
                        <Link
                          href={`/${locale}/project-management/${record.PJ_code?.value}`}
                          className={tableStyles.tdLink}
                        >
                          {record.PJ_code?.value || '-'}
                        </Link>
                      </td>
                      <td className={tableStyles.td}>
                        <div>{record.PjName?.value || '-'}</div>
                        {record.Description?.value && (
                          <div className="text-sm text-gray-500">
                            {record.Description.value}
                          </div>
                        )}
                      </td>
                      <td className={tableStyles.td}>
                        {record.Cs_ID?.value || '-'}
                      </td>
                      <td className={tableStyles.td}>
                        <span className={`${tableStyles.statusBadge} ${
                          getStatusColor(record.Status?.value || '見積中')
                        }`}>
                          {record.Status?.value || '見積中'}
                        </span>
                      </td>
                      <td className={tableStyles.td}>
                        {formatDate(record.Start_date?.value)}
                      </td>
                      <td className={tableStyles.td}>
                        {formatDate(record.Due_date?.value)}
                      </td>
                      <td className={tableStyles.td}>
                        {record.WorkNo?.value ? (
                          <Link
                            href={`/${locale}/workno/${encodeURIComponent(record.WorkNo.value)}`}
                            className={tableStyles.tdLink}
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
            )}
          </div>
      </div>
    </DashboardLayout>
  );
}