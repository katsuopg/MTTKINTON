'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CustomerRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Language } from '@/lib/kintone/field-mappings';
import { tableStyles } from '@/components/ui/TableStyles';
import dynamic from 'next/dynamic';
import type { CustomerSalesMetrics } from '@/lib/supabase/invoices';

const MiniSalesChart = dynamic(() => import('@/components/charts/MiniSalesChart'), {
  ssr: false,
  loading: () => <div className="h-10 w-32 bg-gray-50 rounded animate-pulse"></div>
});

interface CustomerListContentProps {
  customers: CustomerRecord[];
  locale: string;
  userEmail: string;
  salesSummary?: Record<string, CustomerSalesMetrics>;
}

export function CustomerListContent({ customers, locale, userEmail, salesSummary = {} }: CustomerListContentProps) {
  const router = useRouter();
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'csId' | 'companyName' | 'rank' | 'sales' | 'lastInvoice'>('csId');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const pageTitle = language === 'ja' ? '顧客管理' : language === 'th' ? 'จัดการลูกค้า' : 'Customer Management';

  const handleRowClick = useCallback((csId: string) => {
    router.push(`/${locale}/customers/${csId}`);
  }, [router, locale]);

  const handleRowKeyDown = useCallback((e: React.KeyboardEvent, csId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRowClick(csId);
    }
  }, [handleRowClick]);

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // フィルタリングとソート
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers;

    // 検索フィルタリング
    if (searchTerm) {
      filtered = customers.filter((customer) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          customer.文字列__1行_.value.toLowerCase().includes(searchLower) ||
          customer.会社名.value.toLowerCase().includes(searchLower) ||
          (customer.文字列__1行__4?.value || '').toLowerCase().includes(searchLower) ||
          (customer.TEL?.value || '').toLowerCase().includes(searchLower)
        );
      });
    }

    // ソート
    const sorted = [...filtered].sort((a, b) => {
      const aId = a.文字列__1行_.value;
      const bId = b.文字列__1行_.value;
      const aMetrics = salesSummary[aId];
      const bMetrics = salesSummary[bId];

      switch (sortField) {
        case 'sales': {
          const aSales = aMetrics?.totalSales ?? 0;
          const bSales = bMetrics?.totalSales ?? 0;
          return sortDirection === 'asc' ? aSales - bSales : bSales - aSales;
        }
        case 'lastInvoice': {
          const aDate = aMetrics?.lastInvoiceDate ? new Date(aMetrics.lastInvoiceDate).getTime() : 0;
          const bDate = bMetrics?.lastInvoiceDate ? new Date(bMetrics.lastInvoiceDate).getTime() : 0;
          return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
        }
        case 'companyName': {
          const aValue = a.会社名.value;
          const bValue = b.会社名.value;
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue, locale)
            : bValue.localeCompare(aValue, locale);
        }
        case 'rank': {
          const aValue = a.顧客ランク?.value || 'Z';
          const bValue = b.顧客ランク?.value || 'Z';
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue, locale)
            : bValue.localeCompare(aValue, locale);
        }
        case 'csId':
        default: {
          const aValue = a.文字列__1行_.value;
          const bValue = b.文字列__1行_.value;
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue, locale)
            : bValue.localeCompare(aValue, locale);
        }
      }
    });

    return sorted;
  }, [customers, searchTerm, sortField, sortDirection, locale, salesSummary]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <DashboardLayout locale={locale} userEmail={userEmail} title={pageTitle}>
      <div className={tableStyles.contentWrapper}>
        {/* 検索バー */}
        <div className={tableStyles.searchWrapper}>
          <form className={tableStyles.searchForm} onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                language === 'ja' ? 'CS ID、会社名、国で検索...' : 
                language === 'th' ? 'ค้นหาด้วย CS ID, ชื่อบริษัท, ประเทศ...' : 
                'Search by CS ID, Company Name, Country...'
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
          </form>
        </div>

        {/* レコード数表示 */}
        <div className={tableStyles.filterBar}>
          <p className={tableStyles.recordCount}>
            {language === 'ja' ? `${filteredAndSortedCustomers.length} 件の顧客` : 
             language === 'th' ? `ลูกค้า ${filteredAndSortedCustomers.length} ราย` : 
             `${filteredAndSortedCustomers.length} customers`}
          </p>
        </div>

        {/* テーブル */}
        <div className={tableStyles.tableContainer}>
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th
                  className={`${tableStyles.th} cursor-pointer hover:bg-gray-100`}
                  onClick={() => handleSort('csId')}
                >
                  <div className="flex items-center">
                    CS ID
                    {sortField === 'csId' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className={`${tableStyles.th} cursor-pointer hover:bg-gray-100`}
                  onClick={() => handleSort('companyName')}
                >
                  <div className="flex items-center">
                    {language === 'ja' ? '会社名' : language === 'th' ? 'ชื่อบริษัท' : 'Company Name'}
                    {sortField === 'companyName' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className={`${tableStyles.th} hidden md:table-cell cursor-pointer hover:bg-gray-100`}
                  onClick={() => handleSort('sales')}
                >
                  <div className="flex items-center justify-center">
                    {language === 'ja' ? '売上高' : language === 'th' ? 'ยอดขาย' : 'Sales'}
                    {sortField === 'sales' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className={`${tableStyles.th} cursor-pointer hover:bg-gray-100`}
                  onClick={() => handleSort('rank')}
                >
                  <div className="flex items-center">
                    {language === 'ja' ? 'ランク' : language === 'th' ? 'ระดับ' : 'Rank'}
                    {sortField === 'rank' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className={`${tableStyles.th} cursor-pointer hover:bg-gray-100`}
                  onClick={() => handleSort('lastInvoice')}
                >
                  <div className="flex items-center">
                    {language === 'ja' ? '最終取引日' : language === 'th' ? 'วันทำการล่าสุด' : 'Last Transaction'}
                    {sortField === 'lastInvoice' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {filteredAndSortedCustomers.map((customer) => (
                <tr
                  key={customer.$id.value}
                  className={tableStyles.trClickable}
                  onClick={() => handleRowClick(customer.文字列__1行_.value)}
                  onKeyDown={(e) => handleRowKeyDown(e, customer.文字列__1行_.value)}
                  role="link"
                  tabIndex={0}
                >
                  <td className={`${tableStyles.td} font-medium text-indigo-600`}>
                    {customer.文字列__1行_.value}
                  </td>
                  <td className={tableStyles.td}>
                    {customer.会社名.value}
                  </td>
                  <td className={`${tableStyles.td} hidden md:table-cell`}>
                    <div className="flex justify-center">
                      <MiniSalesChart salesData={salesSummary[customer.文字列__1行_.value]?.summary} />
                    </div>
                  </td>
                  <td className={tableStyles.td}>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      customer.顧客ランク?.value === 'A' ? 'bg-green-100 text-green-800' :
                      customer.顧客ランク?.value === 'B' ? 'bg-yellow-100 text-yellow-800' :
                      customer.顧客ランク?.value === 'C' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {customer.顧客ランク?.value || '-'}
                    </span>
                  </td>
                  <td className={tableStyles.td}>
                    {formatDate(salesSummary[customer.文字列__1行_.value]?.lastInvoiceDate)}
                  </td>
                </tr>
              ))}
              {filteredAndSortedCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className={`${tableStyles.td} text-center`}>
                    {searchTerm ? (
                      language === 'ja' ? '検索結果が見つかりませんでした' :
                      language === 'th' ? 'ไม่พบผลการค้นหา' :
                      'No search results found'
                    ) : (
                      language === 'ja' ? '顧客データがありません' :
                      language === 'th' ? 'ไม่มีข้อมูลลูกค้า' :
                      'No customer data'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
