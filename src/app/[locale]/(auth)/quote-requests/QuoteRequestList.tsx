'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { tableStyles } from '@/components/ui/TableStyles';
import { ListPageHeader } from '@/components/ui/ListPageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { Plus } from 'lucide-react';
import type {
  QuoteRequestStatus,
  QuoteRequestWithRelations,
  QuoteRequestSearchParams,
  QUOTE_REQUEST_STATUS_COLORS,
} from '@/types/quote-request';

interface QuoteRequestListProps {
  locale: string;
  language: 'ja' | 'en' | 'th';
  initialFilters: {
    status_code?: string;
    search?: string;
    from_date?: string;
    to_date?: string;
  };
}

const labels = {
  newRequest: { ja: '新規依頼', en: 'New Request', th: 'คำขอใหม่' },
  search: { ja: '検索', en: 'Search', th: 'ค้นหา' },
  searchPlaceholder: { ja: '依頼番号・依頼者名で検索', en: 'Search by request no. or requester', th: 'ค้นหาตามหมายเลขคำขอหรือชื่อผู้ขอ' },
  allStatuses: { ja: 'すべてのステータス', en: 'All Statuses', th: 'ทุกสถานะ' },
  requestNo: { ja: '依頼番号', en: 'Request No.', th: 'หมายเลขคำขอ' },
  requester: { ja: '依頼者', en: 'Requester', th: 'ผู้ขอ' },
  workNo: { ja: '工事番号', en: 'Work No.', th: 'หมายเลขงาน' },
  status: { ja: 'ステータス', en: 'Status', th: 'สถานะ' },
  itemsCount: { ja: '明細数', en: 'Items', th: 'รายการ' },
  desiredDate: { ja: '希望納期', en: 'Desired Date', th: 'วันที่ต้องการ' },
  createdAt: { ja: '依頼日', en: 'Created', th: 'วันที่สร้าง' },
  noData: { ja: 'データがありません', en: 'No data available', th: 'ไม่มีข้อมูล' },
  records: { ja: '件', en: 'records', th: 'รายการ' },
  loading: { ja: '読み込み中...', en: 'Loading...', th: 'กำลังโหลด...' },
};

// ステータス色マップ
const statusColors: Record<string, string> = {
  requested: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  quoting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  quoted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  order_requested: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  po_issued: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function QuoteRequestList({
  locale,
  language,
  initialFilters,
}: QuoteRequestListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<QuoteRequestStatus[]>([]);
  const [allRequests, setAllRequests] = useState<QuoteRequestWithRelations[]>([]);
  const [searchText, setSearchText] = useState(initialFilters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(initialFilters.status_code || '');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status_code', selectedStatus);
      if (searchText) params.append('search', searchText);
      if (initialFilters.from_date) params.append('from_date', initialFilters.from_date);
      if (initialFilters.to_date) params.append('to_date', initialFilters.to_date);

      const response = await fetch(`/api/quote-requests?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setStatuses(data.statuses || []);
      setAllRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching quote requests:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, searchText, initialFilters.from_date, initialFilters.to_date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { paginatedItems: requests, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(allRequests);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  const getStatusName = (status?: QuoteRequestStatus) => {
    if (!status) return '-';
    if (language === 'ja') return status.name;
    if (language === 'en') return status.name_en || status.name;
    if (language === 'th') return status.name_th || status.name;
    return status.name;
  };

  return (
    <div className={tableStyles.contentWrapper}>
      {/* テーブル */}
      <div className={tableStyles.tableContainer}>
        <ListPageHeader
          searchValue={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder={labels.searchPlaceholder[language]}
          totalCount={allRequests.length}
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
            label: labels.newRequest[language],
            onClick: () => router.push(`/${locale}/quote-requests/new`),
            icon: <Plus className="w-4 h-4 mr-2" />,
          }}
        />
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            <span className="ml-3 text-gray-500">{labels.loading[language]}</span>
          </div>
        ) : (
          <>
            {/* モバイル: カードビュー */}
            <div className={tableStyles.mobileCardList}>
              {requests.length === 0 ? (
                <div className={tableStyles.emptyRow}>{labels.noData[language]}</div>
              ) : (
                requests.map((request) => {
                  const itemsCount = Array.isArray(request.items)
                    ? request.items.length
                    : (request as any).items?.[0]?.count || 0;
                  return (
                    <div
                      key={request.id}
                      className={tableStyles.mobileCard}
                      onClick={() => router.push(`/${locale}/quote-requests/${request.id}`)}
                    >
                      <div className={tableStyles.mobileCardHeader}>
                        {request.status && (
                          <span className={`${tableStyles.statusBadge} ${statusColors[request.status.code] || 'bg-gray-100 text-gray-800'}`}>
                            {getStatusName(request.status)}
                          </span>
                        )}
                        <span className={tableStyles.mobileCardMeta}>{formatDate(request.created_at)}</span>
                      </div>
                      <div className={tableStyles.mobileCardTitle}>
                        {request.request_no}{request.work_no ? ` / ${request.work_no}` : ''}
                      </div>
                      <div className={tableStyles.mobileCardFields}>
                        <span className={tableStyles.mobileCardFieldValue}>
                          {request.requester_name || '-'}
                        </span>
                        <span className={tableStyles.mobileCardFieldValue}>
                          {labels.itemsCount[language]}: {itemsCount}
                        </span>
                        {request.desired_delivery_date && (
                          <span className={tableStyles.mobileCardFieldValue}>
                            {labels.desiredDate[language]}: {formatDate(request.desired_delivery_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* デスクトップ: テーブルビュー */}
            <div className={tableStyles.desktopOnly}>
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th}>{labels.requestNo[language]}</th>
                  <th className={tableStyles.th}>{labels.requester[language]}</th>
                  <th className={tableStyles.th}>{labels.workNo[language]}</th>
                  <th className={tableStyles.th}>{labels.status[language]}</th>
                  <th className={`${tableStyles.th} text-center`}>{labels.itemsCount[language]}</th>
                  <th className={tableStyles.th}>{labels.desiredDate[language]}</th>
                  <th className={tableStyles.th}>{labels.createdAt[language]}</th>
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
                {requests.map((request) => {
                  const itemsCount = Array.isArray(request.items)
                    ? request.items.length
                    : (request as any).items?.[0]?.count || 0;

                  return (
                    <tr
                      key={request.id}
                      className={tableStyles.trClickable}
                      onClick={() => router.push(`/${locale}/quote-requests/${request.id}`)}
                    >
                      <td className={`${tableStyles.td} font-medium`}>
                        <span className={tableStyles.tdLink}>
                          {request.request_no}
                        </span>
                      </td>
                      <td className={tableStyles.td}>
                        {request.requester_name || '-'}
                      </td>
                      <td className={tableStyles.td}>
                        {request.work_no ? (
                          <a
                            href={`/${locale}/workno/${request.work_no}`}
                            className={tableStyles.tdLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {request.work_no}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className={tableStyles.td}>
                        {request.status && (
                          <span
                            className={`${tableStyles.statusBadge} ${
                              statusColors[request.status.code] || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {getStatusName(request.status)}
                          </span>
                        )}
                      </td>
                      <td className={`${tableStyles.td} text-center`}>
                        {itemsCount}
                      </td>
                      <td className={tableStyles.td}>
                        {formatDate(request.desired_delivery_date)}
                      </td>
                      <td className={tableStyles.td}>
                        {formatDate(request.created_at)}
                      </td>
                    </tr>
                  );
                })}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={7} className={tableStyles.emptyRow}>
                      {labels.noData[language]}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </>
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
