'use client';

import { useState, useMemo } from 'react';
import { CustomerRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import { Language } from '@/lib/kintone/field-mappings';
import { tableStyles } from '@/components/ui/TableStyles';
import { ListPageHeader } from '@/components/ui/ListPageHeader';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/Pagination';
import dynamic from 'next/dynamic';

const MiniSalesChart = dynamic(() => import('@/components/charts/MiniSalesChart'), {
  ssr: false,
  loading: () => <div className="h-8 w-32 bg-gray-50 rounded animate-pulse"></div>
});

interface CustomerListContentProps {
  customers: CustomerRecord[];
  locale: string;
  userEmail: string;
  salesSummary?: Record<string, { period: string; sales: number }[]>;
  userInfo?: { email: string; name: string; avatarUrl?: string };
}

export function CustomerListContent({ customers, locale, userEmail, salesSummary = {}, userInfo }: CustomerListContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'csId' | 'companyName' | 'rank'>('csId');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const pageTitle = language === 'ja' ? '顧客管理' : language === 'th' ? 'จัดการลูกค้า' : 'Customer Management';

  // フィルタリングとソート
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers;

    // 検索フィルタリング
    if (searchTerm) {
      filtered = customers.filter((customer) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          customer.文字列__1行_.value.toLowerCase().includes(searchLower) ||
          (customer.Cs_Name?.value || '').toLowerCase().includes(searchLower) ||
          customer.会社名.value.toLowerCase().includes(searchLower) ||
          (customer.文字列__1行__4?.value || '').toLowerCase().includes(searchLower) ||
          (customer.TEL?.value || '').toLowerCase().includes(searchLower)
        );
      });
    }

    // ソート
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortField) {
        case 'csId':
          aValue = a.文字列__1行_.value;
          bValue = b.文字列__1行_.value;
          break;
        case 'companyName':
          aValue = a.会社名.value;
          bValue = b.会社名.value;
          break;
        case 'rank':
          aValue = a.顧客ランク?.value || 'Z';
          bValue = b.顧客ランク?.value || 'Z';
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue, locale);
      } else {
        return bValue.localeCompare(aValue, locale);
      }
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

  return (
    <DashboardLayout locale={locale} userEmail={userEmail} title={pageTitle} userInfo={userInfo}>
      <div className={tableStyles.contentWrapper}>
        {/* テーブル - TailAdminスタイル */}
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
          />
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
                      {sortField === 'csId' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className={`${tableStyles.th} cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02]`}
                    onClick={() => handleSort('companyName')}
                  >
                    <div className="flex items-center gap-1">
                      {language === 'ja' ? '会社名' : language === 'th' ? 'ชื่อบริษัท' : 'Company Name'}
                      {sortField === 'companyName' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
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
                      {sortField === 'rank' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
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
                    key={customer.$id.value}
                    className={tableStyles.trClickable}
                    onClick={() => router.push(`/${locale}/customers/${customer.文字列__1行_.value}`)}
                  >
                    <td className={`${tableStyles.td} ${tableStyles.tdPrimary}`}>
                      {customer.Cs_Name?.value || customer.文字列__1行_.value.replace(/^\d{2}-\d{3}-/, '')}
                    </td>
                    <td className={`${tableStyles.td} text-gray-800 dark:text-white/90`}>
                      {customer.会社名.value}
                    </td>
                    <td className={`${tableStyles.td} hidden md:table-cell`}>
                      <div className="flex justify-center">
                        <MiniSalesChart salesData={salesSummary[customer.会社名.value]} />
                      </div>
                    </td>
                    <td className={tableStyles.td}>
                      <span className={`${tableStyles.statusBadge} ${
                        customer.顧客ランク?.value === 'A' ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500' :
                        customer.顧客ランク?.value === 'B' ? 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500' :
                        customer.顧客ランク?.value === 'C' ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400'
                      }`}>
                        {customer.顧客ランク?.value || '-'}
                      </span>
                    </td>
                    <td className={tableStyles.td}>
                      {customer.TEL?.value || '-'}
                    </td>
                    <td className={`${tableStyles.td} text-end`}>
                      <span className="text-sm text-gray-400">›</span>
                    </td>
                  </tr>
                ))}
                {paginatedCustomers.length === 0 && (
                  <tr>
                    <td colSpan={6} className={tableStyles.emptyRow}>
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
    </DashboardLayout>
  );
}