'use client';

import { useState, useMemo } from 'react';
import { CustomerRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import { Language } from '@/lib/kintone/field-mappings';
import { tableStyles } from '@/components/ui/TableStyles';
import TransitionLink from '@/components/ui/TransitionLink';
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
}

export function CustomerListContent({ customers, locale, userEmail, salesSummary = {} }: CustomerListContentProps) {
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

  const handleSort = (field: 'csId' | 'companyName' | 'rank') => {
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
                language === 'ja' ? 'CS ID、会社名、国、電話番号で検索...' : 
                language === 'th' ? 'ค้นหาด้วย CS ID, ชื่อบริษัท, ประเทศ, เบอร์โทร...' : 
                'Search by CS ID, Company Name, Country, Phone...'
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
          <div className="max-w-6xl overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-24"
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
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-64"
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
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32 hidden md:table-cell">
                    {language === 'ja' ? '売上高' : language === 'th' ? 'ยอดขาย' : 'Sales'}
                  </th>
                  <th 
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20"
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
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    TEL
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedCustomers.map((customer) => (
                  <tr 
                    key={customer.$id.value} 
                    className="hover:bg-gray-50"
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      <TransitionLink
                        href={`/${locale}/customers/${customer.文字列__1行_.value}`}
                        className="text-indigo-600 hover:text-indigo-900 inline-block"
                      >
                        {customer.文字列__1行_.value}
                      </TransitionLink>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {customer.会社名.value}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                      <div className="flex justify-center">
                        <MiniSalesChart salesData={salesSummary[customer.会社名.value]} />
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.顧客ランク?.value === 'A' ? 'bg-green-100 text-green-800' :
                        customer.顧客ランク?.value === 'B' ? 'bg-yellow-100 text-yellow-800' :
                        customer.顧客ランク?.value === 'C' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.顧客ランク?.value || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {customer.TEL?.value || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <TransitionLink
                        href={`/${locale}/customers/${customer.文字列__1行_.value}`}
                        className="text-indigo-600 hover:text-indigo-900 inline-block"
                      >
                        {language === 'ja' ? '詳細' : language === 'th' ? 'รายละเอียด' : 'View'}
                      </TransitionLink>
                    </td>
                  </tr>
                ))}
                {filteredAndSortedCustomers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-2 text-sm text-gray-500 text-center">
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
      </div>
    </DashboardLayout>
  );
}