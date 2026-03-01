'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Language } from '@/lib/kintone/field-mappings';
import Link from 'next/link';
import { tableStyles } from '@/components/ui/TableStyles';
import { ListPageHeader } from '@/components/ui/ListPageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { extractCsName } from '@/lib/utils/customer-name';
import { useNavPermissions } from '@/hooks/useNavPermissions';

export interface SupabaseQuotation {
  id: string;
  kintone_record_id: string;
  quotation_no: string | null;
  quotation_date: string | null;
  expected_order_date: string | null;
  delivery_date: string | null;
  valid_until: string | null;
  sales_staff: string | null;
  status: string | null;
  probability: string | null;
  title: string | null;
  customer_id: string | null;
  customer_name: string | null;
  company_name: string | null;
  project_name: string | null;
  work_no: string | null;
  type: string | null;
  vendor: string | null;
  model: string | null;
  machine_no: string | null;
  serial_no: string | null;
  contact_person: string | null;
  cc: string | null;
  sales_forecast: string | null;
  sub_total: number | null;
  discount: number | null;
  grand_total: number | null;
  gross_profit: number | null;
  gross_profit_rate: string | null;
  sales_profit: number | null;
  sales_profit_rate: string | null;
  cost_total: number | null;
  other_total: number | null;
  payment_terms_1: string | null;
  payment_terms_2: string | null;
  payment_terms_3: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

interface QuotationListContentProps {
  quotations: SupabaseQuotation[];
  locale: string;
}

export default function QuotationListContent({ quotations, locale }: QuotationListContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const { canManageApp } = useNavPermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSalesStaff, setSelectedSalesStaff] = useState('');
  const router = useRouter();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    if (language === 'ja') {
      return dateString;
    } else {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();
    quotations.forEach(qt => {
      if (qt.status) {
        statuses.add(qt.status);
      }
    });
    return Array.from(statuses).sort();
  }, [quotations]);

  const salesStaffOptions = useMemo(() => {
    const staff = new Set<string>();
    quotations.forEach(qt => {
      if (qt.sales_staff) {
        staff.add(qt.sales_staff);
      }
    });
    return Array.from(staff).sort();
  }, [quotations]);

  const filteredQuotations = useMemo(() => {
    return quotations.filter(quotation => {
      if (searchQuery && searchQuery.trim() !== '') {
        const searchLower = searchQuery.toLowerCase();
        const qtNo = (quotation.quotation_no || '').toLowerCase();
        const csId = (quotation.customer_id || '').toLowerCase();
        const customerName = (quotation.customer_name || '').toLowerCase();
        const title = (quotation.title || '').toLowerCase();
        const projectName = (quotation.project_name || '').toLowerCase();

        if (!qtNo.includes(searchLower) &&
            !csId.includes(searchLower) &&
            !customerName.includes(searchLower) &&
            !title.includes(searchLower) &&
            !projectName.includes(searchLower)) {
          return false;
        }
      }

      if (selectedStatus && quotation.status !== selectedStatus) {
        return false;
      }

      if (selectedSalesStaff && quotation.sales_staff !== selectedSalesStaff) {
        return false;
      }

      return true;
    });
  }, [quotations, searchQuery, selectedStatus, selectedSalesStaff]);

  const { paginatedItems, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredQuotations);

  const getStatusLabel = (status: string) => {
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
            settingsHref={canManageApp('quotations') ? `/${locale}/settings/apps/quotations` : undefined}
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
                    key={quotation.id}
                    className={tableStyles.trClickable}
                    onClick={() => router.push(`/${locale}/quotation/${quotation.kintone_record_id}`)}
                  >
                    <td className={tableStyles.td}>
                      {formatDate(quotation.quotation_date)}
                    </td>
                    <td className={tableStyles.td}>
                      {quotation.quotation_no || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {quotation.customer_id ? (
                        <Link
                          href={`/${locale}/customers/${quotation.customer_id}`}
                          className={tableStyles.tdLink}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {extractCsName(quotation.customer_id)}
                        </Link>
                      ) : '-'}
                    </td>
                    <td className={tableStyles.td}>
                      <div>
                        {quotation.title || '-'}
                      </div>
                      {quotation.project_name && (
                        <div className="text-sm text-gray-500">
                          {quotation.project_name}
                        </div>
                      )}
                    </td>
                    <td className={tableStyles.td}>
                      {quotation.status ? getStatusLabel(quotation.status) : '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {quotation.probability ? getProbabilityLabel(quotation.probability) : '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {quotation.sales_staff || '-'}
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
