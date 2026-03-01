'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Language } from '@/lib/kintone/field-mappings';
import { tableStyles } from '@/components/ui/TableStyles';
import { ListPageHeader } from '@/components/ui/ListPageHeader';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/Pagination';
import { useNavPermissions } from '@/hooks/useNavPermissions';
import dynamic from 'next/dynamic';
import type { SupabaseCustomer } from './page';

const MiniSalesChart = dynamic(() => import('@/components/charts/MiniSalesChart'), {
  ssr: false,
  loading: () => <div className="h-8 w-32 bg-gray-50 rounded animate-pulse"></div>
});

interface CustomerListContentProps {
  customers: SupabaseCustomer[];
  locale: string;
  salesSummary?: Record<string, { period: string; sales: number }[]>;
}

export function CustomerListContent({ customers, locale, salesSummary = {} }: CustomerListContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const router = useRouter();
  const { canManageApp } = useNavPermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'csId' | 'companyName' | 'rank'>('csId');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = customers.filter((customer) => (
        customer.customer_id.toLowerCase().includes(searchLower) ||
        (customer.short_name || '').toLowerCase().includes(searchLower) ||
        customer.company_name.toLowerCase().includes(searchLower) ||
        (customer.country || '').toLowerCase().includes(searchLower) ||
        (customer.phone_number || '').toLowerCase().includes(searchLower)
      ));
    }

    const sorted = [...filtered].sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortField) {
        case 'csId':
          aValue = a.customer_id;
          bValue = b.customer_id;
          break;
        case 'companyName':
          aValue = a.company_name;
          bValue = b.company_name;
          break;
        case 'rank':
          aValue = a.customer_rank || 'Z';
          bValue = b.customer_rank || 'Z';
          break;
        default:
          aValue = '';
          bValue = '';
      }

      return sortDirection === 'asc' ? aValue.localeCompare(bValue, locale) : bValue.localeCompare(aValue, locale);
    });

    return sorted;
  }, [customers, searchTerm, sortField, sortDirection, locale]);

  const { paginatedItems: paginatedCustomers, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredAndSortedCustomers);

  const handleSort = (field: 'csId' | 'companyName' | 'rank') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getRankStyle = (rank: string | null) => {
    switch (rank) {
      case 'A': return 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500';
      case 'B': return 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500';
      case 'C': return 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400';
    }
  };

  return (
    <div className={tableStyles.contentWrapper}>
      <div className={tableStyles.tableContainer}>
        <ListPageHeader
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={
            language === 'ja' ? '顧客名、会社名、国、電話番号で検索...' :
            language === 'th' ? 'ค้นหาด้วยชื่อลูกค้า, ชื่อบริษัท, ประเทศ, เบอร์โทร...' :
            'Search by Customer Name, Company Name, Country, Phone...'
          }
          totalCount={filteredAndSortedCustomers.length}
          countLabel={language === 'ja' ? '件の顧客' : language === 'th' ? ' ราย' : ' customers'}
          settingsHref={canManageApp('customers') ? `/${locale}/settings/apps/customers` : undefined}
        />
        {/* モバイル: カードビュー */}
        <div className={tableStyles.mobileCardList}>
          {paginatedCustomers.length === 0 ? (
            <div className={tableStyles.emptyRow}>
              {searchTerm
                ? (language === 'ja' ? '検索結果が見つかりませんでした' : language === 'th' ? 'ไม่พบผลการค้นหา' : 'No search results found')
                : (language === 'ja' ? '顧客データがありません' : language === 'th' ? 'ไม่มีข้อมูลลูกค้า' : 'No customer data')}
            </div>
          ) : (
            paginatedCustomers.map((customer) => (
              <div
                key={customer.id}
                className={tableStyles.mobileCard}
                onClick={() => router.push(`/${locale}/customers/${customer.customer_id}`)}
              >
                <div className={tableStyles.mobileCardHeader}>
                  <span className={`${tableStyles.statusBadge} ${getRankStyle(customer.customer_rank)}`}>
                    {customer.customer_rank || '-'}
                  </span>
                </div>
                <div className={tableStyles.mobileCardTitle}>
                  {customer.company_name}
                </div>
                <div className={tableStyles.mobileCardSubtitle}>
                  {customer.short_name || customer.customer_id}
                </div>
                <div className={tableStyles.mobileCardFields}>
                  <span className={tableStyles.mobileCardFieldValue}>
                    TEL: {customer.phone_number || '-'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* デスクトップ: テーブルビュー */}
        <div className={tableStyles.desktopOnly}>
        <div className="max-w-full overflow-x-auto">
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th
                  className={`${tableStyles.th} cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02]`}
                  onClick={() => handleSort('csId')}
                >
                  <div className="flex items-center gap-1">
                    {language === 'ja' ? '顧客名' : language === 'th' ? 'ชื่อลูกค้า' : 'Customer'}
                    {sortField === 'csId' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th
                  className={`${tableStyles.th} cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02]`}
                  onClick={() => handleSort('companyName')}
                >
                  <div className="flex items-center gap-1">
                    {language === 'ja' ? '会社名' : language === 'th' ? 'ชื่อบริษัท' : 'Company Name'}
                    {sortField === 'companyName' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th className={`${tableStyles.th} text-center hidden md:table-cell`}>
                  {language === 'ja' ? '売上高' : language === 'th' ? 'ยอดขาย' : 'Sales'}
                </th>
                <th
                  className={`${tableStyles.th} cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02]`}
                  onClick={() => handleSort('rank')}
                >
                  <div className="flex items-center gap-1">
                    {language === 'ja' ? 'ランク' : language === 'th' ? 'ระดับ' : 'Rank'}
                    {sortField === 'rank' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th className={tableStyles.th}>TEL</th>
                <th className={`${tableStyles.th} text-end`}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {paginatedCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className={tableStyles.trClickable}
                  onClick={() => router.push(`/${locale}/customers/${customer.customer_id}`)}
                >
                  <td className={`${tableStyles.td} ${tableStyles.tdPrimary}`}>
                    {customer.short_name || customer.customer_id}
                  </td>
                  <td className={`${tableStyles.td} text-gray-800 dark:text-white/90`}>
                    {customer.company_name}
                  </td>
                  <td className={`${tableStyles.td} hidden md:table-cell`}>
                    <div className="flex justify-center">
                      <MiniSalesChart salesData={salesSummary[customer.company_name]} />
                    </div>
                  </td>
                  <td className={tableStyles.td}>
                    <span className={`${tableStyles.statusBadge} ${getRankStyle(customer.customer_rank)}`}>
                      {customer.customer_rank || '-'}
                    </span>
                  </td>
                  <td className={tableStyles.td}>
                    {customer.phone_number || '-'}
                  </td>
                  <td className={`${tableStyles.td} text-end`}>
                    <span className="text-sm text-gray-400">›</span>
                  </td>
                </tr>
              ))}
              {paginatedCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className={tableStyles.emptyRow}>
                    {searchTerm
                      ? (language === 'ja' ? '検索結果が見つかりませんでした' : language === 'th' ? 'ไม่พบผลการค้นหา' : 'No search results found')
                      : (language === 'ja' ? '顧客データがありません' : language === 'th' ? 'ไม่มีข้อมูลลูกค้า' : 'No customer data')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
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
