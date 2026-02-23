'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { tableStyles } from '@/components/ui/TableStyles';
import { ListPageHeader } from '@/components/ui/ListPageHeader';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/Pagination';
import { Plus } from 'lucide-react';
import { extractCsName } from '@/lib/utils/customer-name';
import type {
  ProjectStatus,
  ProjectWithRelations,
} from '@/types/project';

type SortField = 'status' | 'project_code' | 'work_no' | 'project_name' | 'customer' | 'start_date' | 'due_date' | 'sales_person';
type SortDirection = 'asc' | 'desc';

interface ProjectManagementContentProps {
  locale: string;
  language: 'ja' | 'en' | 'th';
  initialFilters: {
    status_code?: string;
    search?: string;
  };
}

const labels = {
  newProject: { ja: '新規登録', en: 'New Project', th: 'โครงการใหม่' },
  searchPlaceholder: { ja: 'コード・プロジェクト名・顧客で検索', en: 'Search by code, name, customer...', th: 'ค้นหาตามรหัส ชื่อ ลูกค้า...' },
  allStatuses: { ja: 'すべてのステータス', en: 'All Statuses', th: 'ทุกสถานะ' },
  status: { ja: 'ステータス', en: 'Status', th: 'สถานะ' },
  code: { ja: 'コード', en: 'Code', th: 'รหัส' },
  workNo: { ja: '工事番号', en: 'Work No.', th: 'หมายเลขงาน' },
  projectName: { ja: 'プロジェクト名', en: 'Project Name', th: 'ชื่อโครงการ' },
  customer: { ja: '顧客', en: 'Customer', th: 'ลูกค้า' },
  startDate: { ja: '開始日', en: 'Start', th: 'เริ่มต้น' },
  dueDate: { ja: '納期', en: 'Due', th: 'กำหนดส่ง' },
  salesPerson: { ja: '担当営業', en: 'Sales Rep', th: 'พนักงานขาย' },
  noData: { ja: 'プロジェクトがありません', en: 'No projects', th: 'ไม่มีโครงการ' },
  records: { ja: '件', en: 'records', th: 'รายการ' },
  loading: { ja: '読み込み中...', en: 'Loading...', th: 'กำลังโหลด...' },
  tbd: { ja: '未定', en: 'TBD', th: 'ยังไม่กำหนด' },
};

const statusColors: Record<string, string> = {
  estimating: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ordered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  on_hold: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function ProjectManagementContent({
  locale,
  language,
  initialFilters,
}: ProjectManagementContentProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [searchText, setSearchText] = useState(initialFilters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(initialFilters.status_code || '');
  const [sortField, setSortField] = useState<SortField>('project_code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status_code', selectedStatus);
      if (searchText) params.append('search', searchText);

      const response = await fetch(`/api/projects?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setStatuses(data.statuses || []);
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, searchText]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    if (language === 'ja') return dateString;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getStatusName = (status?: ProjectStatus) => {
    if (!status) return '-';
    if (language === 'ja') return status.name;
    if (language === 'en') return status.name_en || status.name;
    if (language === 'th') return status.name_th || status.name;
    return status.name;
  };

  // customer_code から短縮名を取得（例: 61-046-MNB-BPI → MNB-BPI）
  const getCustomerDisplay = (project: ProjectWithRelations) => {
    const shortName = extractCsName(project.customer_code);
    return shortName || project.customer_name || '-';
  };

  const sortedProjects = useMemo(() => {
    const sorted = [...projects].sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (sortField) {
        case 'status':
          valA = a.status?.name || '';
          valB = b.status?.name || '';
          break;
        case 'project_code':
          valA = a.project_code || '';
          valB = b.project_code || '';
          break;
        case 'work_no':
          valA = a.work_no || '';
          valB = b.work_no || '';
          break;
        case 'project_name':
          valA = a.project_name || '';
          valB = b.project_name || '';
          break;
        case 'customer':
          valA = getCustomerDisplay(a);
          valB = getCustomerDisplay(b);
          break;
        case 'start_date':
          valA = a.start_date || '';
          valB = b.start_date || '';
          break;
        case 'due_date':
          valA = a.due_date || '';
          valB = b.due_date || '';
          break;
        case 'sales_person':
          valA = a.sales_person?.name || '';
          valB = b.sales_person?.name || '';
          break;
      }

      const cmp = valA.localeCompare(valB, 'ja');
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [projects, sortField, sortDirection]);

  const { paginatedItems: paginatedProjects, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(sortedProjects);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const thSortable = `${tableStyles.th} cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700`;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className={tableStyles.contentWrapper}>
      {/* テーブル */}
      <div className={tableStyles.tableContainer}>
        <ListPageHeader
          searchValue={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder={labels.searchPlaceholder[language]}
          totalCount={projects.length}
          countLabel={labels.records[language]}
          filters={
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
            >
              <option value="">{labels.allStatuses[language]}</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.code}>
                  {getStatusName(status)}
                </option>
              ))}
            </select>
          }
          addButton={{
            label: labels.newProject[language],
            onClick: () => router.push(`/${locale}/project-management/new`),
            icon: <Plus className="w-4 h-4 mr-2" />,
          }}
        />
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            <span className="ml-3 text-gray-500">{labels.loading[language]}</span>
          </div>
        ) : (
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={thSortable} onClick={() => handleSort('status')}>
                  {labels.status[language]}<SortIcon field="status" />
                </th>
                <th className={thSortable} onClick={() => handleSort('project_code')}>
                  {labels.code[language]}<SortIcon field="project_code" />
                </th>
                <th className={thSortable} onClick={() => handleSort('work_no')}>
                  {labels.workNo[language]}<SortIcon field="work_no" />
                </th>
                <th className={thSortable} onClick={() => handleSort('project_name')}>
                  {labels.projectName[language]}<SortIcon field="project_name" />
                </th>
                <th className={thSortable} onClick={() => handleSort('customer')}>
                  {labels.customer[language]}<SortIcon field="customer" />
                </th>
                <th className={thSortable} onClick={() => handleSort('start_date')}>
                  {labels.startDate[language]}<SortIcon field="start_date" />
                </th>
                <th className={thSortable} onClick={() => handleSort('due_date')}>
                  {labels.dueDate[language]}<SortIcon field="due_date" />
                </th>
                <th className={thSortable} onClick={() => handleSort('sales_person')}>
                  {labels.salesPerson[language]}<SortIcon field="sales_person" />
                </th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {paginatedProjects.map((project) => (
                <tr
                  key={project.id}
                  className={tableStyles.trClickable}
                  onClick={() => router.push(`/${locale}/project-management/${project.project_code}`)}
                >
                  {/* ステータス */}
                  <td className={tableStyles.td}>
                    {project.status && (
                      <span
                        className={`${tableStyles.statusBadge} ${
                          statusColors[project.status.code] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {getStatusName(project.status)}
                      </span>
                    )}
                  </td>
                  {/* コード */}
                  <td className={`${tableStyles.td} font-medium`}>
                    <span className={tableStyles.tdLink}>
                      {project.project_code}
                    </span>
                  </td>
                  {/* 工事番号 */}
                  <td className={tableStyles.td}>
                    {project.work_no ? (
                      <a
                        href={`/${locale}/workno/${encodeURIComponent(project.work_no)}`}
                        className={tableStyles.tdLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {project.work_no}
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  {/* プロジェクト名 */}
                  <td className={tableStyles.td}>
                    {project.project_name || '-'}
                  </td>
                  {/* 顧客（短縮名） */}
                  <td className={tableStyles.td}>
                    {project.customer_code ? (
                      <a
                        href={`/${locale}/customers/${project.customer_code}`}
                        className={tableStyles.tdLink}
                        onClick={(e) => e.stopPropagation()}
                        title={project.customer_name || ''}
                      >
                        {getCustomerDisplay(project)}
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  {/* 開始日 */}
                  <td className={tableStyles.td}>
                    {formatDate(project.start_date) || <span className="text-gray-400">-</span>}
                  </td>
                  {/* 納期 */}
                  <td className={tableStyles.td}>
                    {formatDate(project.due_date) || <span className="text-gray-400">-</span>}
                  </td>
                  {/* 担当営業 */}
                  <td className={tableStyles.td}>
                    {project.sales_person
                      ? (project.sales_person.nickname || project.sales_person.name)
                      : <span className="text-gray-400">-</span>}
                  </td>
                </tr>
              ))}
              {paginatedProjects.length === 0 && (
                <tr>
                  <td colSpan={8} className={tableStyles.emptyRow}>
                    {labels.noData[language]}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={goToPage}
          locale={locale}
        />
      </div>
    </div>
  );
}
