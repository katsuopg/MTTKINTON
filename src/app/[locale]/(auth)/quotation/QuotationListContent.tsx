'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QuotationRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Language } from '@/lib/kintone/field-mappings';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { tableStyles } from '@/components/ui/TableStyles';

interface QuotationListContentProps {
  quotations: QuotationRecord[];
  locale: string;
  userEmail: string;
}

export default function QuotationListContent({ quotations, locale, userEmail }: QuotationListContentProps) {
  const router = useRouter();
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSalesStaff, setSelectedSalesStaff] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const handleRowClick = useCallback((recordId: string) => {
    router.push(`/${locale}/quotation/${recordId}`);
  }, [router, locale]);

  const handleRowKeyDown = useCallback((e: React.KeyboardEvent, recordId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRowClick(recordId);
    }
  }, [handleRowClick]);
  
  // 日付フォーマット関数
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    if (language === 'ja') {
      // 日本語: YYYY-MM-DD
      return dateString;
    } else {
      // 英語・タイ語: DD/MM/YYYY
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  // ステータスの選択肢を取得（重複を排除）
  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();
    quotations.forEach(qt => {
      if (qt.ドロップダウン?.value) {
        statuses.add(qt.ドロップダウン.value);
      }
    });
    return Array.from(statuses).sort();
  }, [quotations]);

  // 営業担当者の選択肢を取得（重複を排除）
  const salesStaffOptions = useMemo(() => {
    const staff = new Set<string>();
    quotations.forEach(qt => {
      if (qt.sales_staff?.value) {
        if (typeof qt.sales_staff.value === 'string') {
          staff.add(qt.sales_staff.value);
        } else if (Array.isArray(qt.sales_staff.value) && qt.sales_staff.value[0]?.name) {
          staff.add(qt.sales_staff.value[0].name);
        }
      }
    });
    return Array.from(staff).sort();
  }, [quotations]);

  // フィルタリングされた見積もりリスト
  const filteredQuotations = useMemo(() => {
    return quotations.filter(quotation => {
      // 検索クエリでフィルタリング
      if (searchQuery && searchQuery.trim() !== '') {
        const searchLower = searchQuery.toLowerCase();
        const qtNo = quotation.qtno2?.value?.toLowerCase() || '';
        const csId = quotation.文字列__1行__10?.value?.toLowerCase() || '';
        const title = quotation.文字列__1行__4?.value?.toLowerCase() || '';
        const projectName = quotation.ドロップダウン_0?.value?.toLowerCase() || '';
        
        if (!qtNo.includes(searchLower) && 
            !csId.includes(searchLower) &&
            !title.includes(searchLower) &&
            !projectName.includes(searchLower)) {
          return false;
        }
      }

      // ステータスでフィルタリング
      if (selectedStatus && quotation.ドロップダウン?.value !== selectedStatus) {
        return false;
      }

      // 営業担当者でフィルタリング
      if (selectedSalesStaff) {
        const staffValue = typeof quotation.sales_staff?.value === 'string'
          ? quotation.sales_staff.value
          : quotation.sales_staff?.value?.[0]?.name;
        if (staffValue !== selectedSalesStaff) {
          return false;
        }
      }

      return true;
    });
  }, [quotations, searchQuery, selectedStatus, selectedSalesStaff]);

  const pageTitle = language === 'ja' ? '見積もり管理' : language === 'th' ? 'จัดการใบเสนอราคา' : 'Quotation Management';

  // ステータスの表示ラベルを取得
  const getStatusLabel = (status: string) => {
    // ステータスに応じた色を返す
    const statusColors: { [key: string]: string } = {
      '見積中': 'bg-yellow-100 text-yellow-800',
      '提出済': 'bg-blue-100 text-blue-800',
      '受注': 'bg-green-100 text-green-800',
      '失注': 'bg-red-100 text-red-800',
      'キャンセル': 'bg-gray-100 text-gray-800'
    };
    
    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
        {status}
      </span>
    );
  };

  // 確率の表示
  const getProbabilityLabel = (probability: string) => {
    const probColors: { [key: string]: string } = {
      '90%': 'text-green-600',
      '75%': 'text-green-500',
      '50%': 'text-yellow-600',
      '25%': 'text-orange-600',
      '10%': 'text-red-600',
      '0%': 'text-gray-600'
    };
    
    const colorClass = probColors[probability] || 'text-gray-600';
    
    return <span className={`font-medium ${colorClass}`}>{probability}</span>;
  };

  // ページネーションの計算
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedQuotations = filteredQuotations.slice(startIndex, endIndex);

  // ページ変更時にスクロールをトップに
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return (
    <DashboardLayout locale={locale} userEmail={userEmail} title={pageTitle}>
      <div className="py-4 px-4">
        {/* 検索バー */}
        <div className={tableStyles.searchWrapper}>
          <div className={tableStyles.searchForm}>
            {/* 検索ボックス */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'ja' ? '見積もり番号、CS ID、タイトルで検索...' : 
                  language === 'th' ? 'ค้นหาด้วยเลขที่ใบเสนอราคา, CS ID, หัวข้อ...' :
                  'Search by quotation no, CS ID, title...'
                }
                className={`${tableStyles.searchInput} pl-10`}
              />
            </div>

            {/* ステータスフィルター */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">
                {language === 'ja' ? '全ステータス' : language === 'th' ? 'ทุกสถานะ' : 'All Status'}
              </option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            {/* 営業担当者フィルター */}
            <select
              value={selectedSalesStaff}
              onChange={(e) => setSelectedSalesStaff(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">
                {language === 'ja' ? '全営業担当' : language === 'th' ? 'ทุกผู้ขาย' : 'All Sales Staff'}
              </option>
              {salesStaffOptions.map((staff) => (
                <option key={staff} value={staff}>
                  {staff}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* フィルターバー */}
        <div className={tableStyles.filterBar}>
          <p className={tableStyles.recordCount}>
            {language === 'ja' ? `${filteredQuotations.length}件の見積もり` : 
             language === 'th' ? `${filteredQuotations.length} ใบเสนอราคา` : 
             `${filteredQuotations.length} quotations`}
            {totalPages > 1 && (
              <span className="ml-2 text-sm text-gray-600">
                ({startIndex + 1}-{Math.min(endIndex, filteredQuotations.length)} 表示中)
              </span>
            )}
          </p>
        </div>

        {/* 見積もりリスト */}
        <div className={tableStyles.tableContainer}>
          {filteredQuotations.length === 0 ? (
            <div className={tableStyles.emptyRow}>
              <p>
                {language === 'ja' ? '該当する見積もりが見つかりません' : 
                 language === 'th' ? 'ไม่พบใบเสนอราคาที่ตรงกัน' : 
                 'No quotations found'}
              </p>
            </div>
          ) : (
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '見積日' : language === 'th' ? 'วันที่เสนอราคา' : 'Date'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '見積番号' : language === 'th' ? 'เลขที่ใบเสนอราคา' : 'Quotation No.'}
                  </th>
                  <th className={tableStyles.th}>
                    CS ID
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? 'タイトル' : language === 'th' ? 'หัวข้อ' : 'Title'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '確率' : language === 'th' ? 'โอกาส' : 'Probability'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '営業担当' : language === 'th' ? 'ผู้ขาย' : 'Sales'}
                  </th>
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
                {paginatedQuotations.map((quotation) => (
                  <tr
                    key={quotation.$id.value}
                    className={tableStyles.trClickable}
                    onClick={() => handleRowClick(quotation.$id.value)}
                    onKeyDown={(e) => handleRowKeyDown(e, quotation.$id.value)}
                    role="link"
                    tabIndex={0}
                  >
                    <td className={tableStyles.td}>
                      {formatDate(quotation.日付?.value)}
                    </td>
                    <td className={`${tableStyles.td} font-medium text-indigo-600`}>
                      {quotation.qtno2?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {quotation.文字列__1行__10?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      <div>
                        {quotation.文字列__1行__4?.value || '-'}
                      </div>
                      {quotation.ドロップダウン_0?.value && (
                        <div className="text-sm text-gray-500">
                          {quotation.ドロップダウン_0.value}
                        </div>
                      )}
                    </td>
                    <td className={tableStyles.td}>
                      {quotation.ドロップダウン?.value ? getStatusLabel(quotation.ドロップダウン.value) : '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {quotation.Drop_down?.value ? getProbabilityLabel(quotation.Drop_down.value) : '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {typeof quotation.sales_staff?.value === 'string'
                        ? quotation.sales_staff.value
                        : quotation.sales_staff?.value?.[0]?.name || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {language === 'ja' ? '前へ' : 'Previous'}
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {language === 'ja' ? '次へ' : 'Next'}
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  {language === 'ja' ? `${filteredQuotations.length}件中 ` : `Showing `}
                  <span className="font-medium">{startIndex + 1}</span>
                  {language === 'ja' ? ' から ' : ' to '}
                  <span className="font-medium">{Math.min(endIndex, filteredQuotations.length)}</span>
                  {language === 'ja' ? ' を表示' : ' of '}
                  {language !== 'ja' && (
                    <>
                      <span className="font-medium">{filteredQuotations.length}</span> results
                    </>
                  )}
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            page === currentPage
                              ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span
                          key={page}
                          className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  }).filter((item, index, self) => item !== null && (index === 0 || self[index - 1] !== item))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}