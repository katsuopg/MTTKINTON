'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { QuotationRecord } from '@/types/kintone';
import { Language } from '@/lib/kintone/field-mappings';
import Link from 'next/link';
import { tableStyles } from '@/components/ui/TableStyles';
import { ListPageHeader } from '@/components/ui/ListPageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { extractCsName } from '@/lib/utils/customer-name';

interface QuotationListContentProps {
  quotations: QuotationRecord[];
  locale: string;
}

export default function QuotationListContent({ quotations, locale }: QuotationListContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSalesStaff, setSelectedSalesStaff] = useState('');
  const router = useRouter();
  
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

  // sales_staffのvalueから表示名を抽出（string or {code, name}対応）
  const getSalesStaffName = (value: unknown): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null && 'name' in value) {
      return String((value as { name: string }).name);
    }
    return String(value);
  };

  // 営業担当者の選択肢を取得（重複を排除）
  const salesStaffOptions = useMemo(() => {
    const staff = new Set<string>();
    quotations.forEach(qt => {
      const name = getSalesStaffName(qt.sales_staff?.value);
      if (name) {
        staff.add(name);
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
        const customerName = quotation.name?.value?.toLowerCase() || '';
        const title = quotation.文字列__1行__4?.value?.toLowerCase() || '';
        const projectName = quotation.ドロップダウン_0?.value?.toLowerCase() || '';

        if (!qtNo.includes(searchLower) &&
            !csId.includes(searchLower) &&
            !customerName.includes(searchLower) &&
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
        if (getSalesStaffName(quotation.sales_staff?.value) !== selectedSalesStaff) {
          return false;
        }
      }

      return true;
    });
  }, [quotations, searchQuery, selectedStatus, selectedSalesStaff]);

  const { paginatedItems, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredQuotations);

  // ステータスの表示ラベルを取得
  const getStatusLabel = (status: string) => {
    // TailAdmin badge style
    const statusColors: { [key: string]: string } = {
      '見積中': 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500',
      '提出済': 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
      '受注': 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500',
      '失注': 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500',
      'キャンセル': 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400'
    };

    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400';

    return (
      <span className={`px-2.5 py-0.5 inline-flex text-theme-xs font-medium rounded-full ${colorClass}`}>
        {status}
      </span>
    );
  };

  // 確率の表示
  const getProbabilityLabel = (probability: string) => {
    const probColors: { [key: string]: string } = {
      '90%': 'text-success-600 dark:text-success-500',
      '75%': 'text-success-500 dark:text-success-400',
      '50%': 'text-warning-600 dark:text-warning-500',
      '25%': 'text-warning-700 dark:text-warning-400',
      '10%': 'text-error-600 dark:text-error-500',
      '0%': 'text-gray-600 dark:text-gray-400'
    };

    const colorClass = probColors[probability] || 'text-gray-600 dark:text-gray-400';

    return <span className={`font-medium ${colorClass}`}>{probability}</span>;
  };

  return (
      <div className={tableStyles.contentWrapper}>
        {/* 見積もりリスト */}
        <div className={tableStyles.tableContainer}>
          <ListPageHeader
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={
              language === 'ja' ? '見積もり番号、顧客名、タイトルで検索...' :
              language === 'th' ? 'ค้นหาด้วยเลขที่ใบเสนอราคา, ลูกค้า, หัวข้อ...' :
              'Search by quotation no, customer, title...'
            }
            totalCount={filteredQuotations.length}
            countLabel={language === 'ja' ? '件の見積もり' : language === 'th' ? ' ใบเสนอราคา' : ' quotations'}
            filters={
              <>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-9 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
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
                <select
                  value={selectedSalesStaff}
                  onChange={(e) => setSelectedSalesStaff(e.target.value)}
                  className="h-9 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
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
              </>
            }
          />
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
                    {language === 'ja' ? '顧客名' : language === 'th' ? 'ลูกค้า' : 'Customer'}
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
                  <th className={`${tableStyles.th} relative`}>
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
                {paginatedItems.map((quotation) => (
                  <tr
                    key={quotation.$id.value}
                    className={tableStyles.trClickable}
                    onClick={() => router.push(`/${locale}/quotation/${quotation.$id.value}`)}
                  >
                    <td className={tableStyles.td}>
                      {formatDate(quotation.日付?.value)}
                    </td>
                    <td className={tableStyles.td}>
                      {quotation.qtno2?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {quotation.文字列__1行__10?.value ? (
                        <Link
                          href={`/${locale}/customers/${quotation.文字列__1行__10.value}`}
                          className={tableStyles.tdLink}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {extractCsName(quotation.文字列__1行__10.value)}
                        </Link>
                      ) : '-'}
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
                      {getSalesStaffName(quotation.sales_staff?.value) || '-'}
                    </td>
                    <td className={`${tableStyles.td} text-right`}>
                      <span className="text-sm text-gray-400">›</span>
                    </td>
                  </tr>
                ))}
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