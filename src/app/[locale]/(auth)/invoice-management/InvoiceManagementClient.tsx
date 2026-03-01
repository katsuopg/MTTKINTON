'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type Language } from '@/lib/kintone/field-mappings';
import { ListPageHeader } from '@/components/ui/ListPageHeader';
import { tableStyles } from '@/components/ui/TableStyles';
import { useToast } from '@/components/ui/Toast';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/Pagination';
import { useNavPermissions } from '@/hooks/useNavPermissions';
import type { SupabaseInvoice } from './page';

interface InvoiceManagementClientProps {
  locale: string;
  language: Language;
  initialSearchQuery: string;
  initialInvoiceRecords: SupabaseInvoice[];
}

export default function InvoiceManagementClient({
  locale,
  language,
  initialSearchQuery,
  initialInvoiceRecords,
}: InvoiceManagementClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { canManageApp } = useNavPermissions();

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedPeriod, setSelectedPeriod] = useState(searchParams.get('period') || '14');
  const [invoiceRecords, setInvoiceRecords] = useState(initialInvoiceRecords);
  const [isLoading, setIsLoading] = useState(false);

  // 会計期間が変更されたときにデータを取得
  const fetchInvoiceRecords = useCallback(async (period: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/invoice-management/period/${period}`);
      const data = await response.json();
      if (data.records) {
        setInvoiceRecords(data.records);
      }
    } catch (error) {
      console.error('Error fetching invoice records:', error);
      toast({ type: 'error', title: language === 'ja' ? 'データの取得に失敗しました' : language === 'th' ? 'ดึงข้อมูลไม่สำเร็จ' : 'Failed to fetch data' });
    }
    setIsLoading(false);
  }, [language, toast]);

  // URL更新
  const updateURL = useCallback((search: string, period?: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (period) params.set('period', period);

    const query = params.toString();
    const newURL = `/${locale}/invoice-management${query ? `?${query}` : ''}`;
    router.replace(newURL, { scroll: false });
  }, [locale, router]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    updateURL(value, selectedPeriod);
  }, [updateURL, selectedPeriod]);

  const handlePeriodChange = useCallback(async (value: string) => {
    setSelectedPeriod(value);
    updateURL(searchQuery, value);
    if (value !== '') {
      await fetchInvoiceRecords(value);
    }
  }, [updateURL, searchQuery, fetchInvoiceRecords]);

  const availablePeriods = (): string[] => {
    return ['14', '13', '12', '11', '10', '9'];
  };

  // フィルタリング処理
  const filteredInvoices = invoiceRecords.filter(record => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        record.work_no?.toLowerCase().includes(query) ||
        record.invoice_no?.toLowerCase().includes(query) ||
        record.customer_name?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    return true;
  });

  const searchPlaceholder = language === 'ja'
    ? 'キーワード'
    : language === 'th'
    ? 'คำค้นหา'
    : 'Keyword';

  const countLabel = language === 'ja'
    ? '件の請求書'
    : language === 'th'
    ? ' ใบแจ้งหนี้'
    : ' invoices';

  const { paginatedItems: paginatedInvoices, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredInvoices);

  const formatNumber = (value: number | null | undefined): string => {
    if (value == null) return '-';
    return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'B';
  };

  const getStatusClass = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400';
    if (status.includes('Payment date confirmed') || status.includes('ชำระ'))
      return 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500';
    if (status.includes('Pending') || status.includes('รอ'))
      return 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400';
  };

  return (
    <div className={tableStyles.contentWrapper}>
      <div className={tableStyles.tableContainer}>
        <ListPageHeader
          searchValue={searchQuery}
          onSearchChange={handleSearchChange}
          searchPlaceholder={searchPlaceholder}
          totalCount={filteredInvoices.length}
          countLabel={countLabel}
          filters={
            <div className="flex items-center gap-2 whitespace-nowrap">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'ja' ? '会計期間:' : language === 'th' ? 'ปีบัญชี:' : 'Fiscal Year:'}
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="h-9 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
              >
                <option value="">{language === 'ja' ? '全期間' : 'All Periods'}</option>
                {availablePeriods().map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>
          }
          settingsHref={canManageApp('invoices') ? `/${locale}/settings/apps/invoices` : undefined}
        />
        {isLoading ? (
          <div className={tableStyles.emptyRow}>
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-brand-500"></div>
              <span>{language === 'ja' ? '読み込み中...' : language === 'th' ? 'กำลังโหลด...' : 'Loading...'}</span>
            </div>
          </div>
        ) : paginatedInvoices.length === 0 ? (
          <div className={tableStyles.emptyRow}>
            {language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}
          </div>
        ) : (
          <>
            {/* モバイル: カードビュー */}
            <div className={tableStyles.mobileCardList}>
              {paginatedInvoices.map((record) => (
                <div
                  key={record.id}
                  className={tableStyles.mobileCard}
                  onClick={() => window.location.href = `/${locale}/workno/${record.work_no}`}
                >
                  <div className={tableStyles.mobileCardHeader}>
                    <span className={`${tableStyles.statusBadge} ${getStatusClass(record.status)}`}>
                      {record.status || '-'}
                    </span>
                    <span className={tableStyles.mobileCardMeta}>
                      {record.invoice_date?.replace(/-/g, '/') || '-'}
                    </span>
                  </div>
                  <div className={tableStyles.mobileCardTitle}>
                    {record.invoice_no || '-'} / {record.work_no || '-'}
                  </div>
                  <div className={tableStyles.mobileCardFields}>
                    <span className={tableStyles.mobileCardFieldValue}>
                      {record.customer_name || '-'}
                    </span>
                    <span className={tableStyles.mobileCardFieldValue}>
                      {formatNumber(record.grand_total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* デスクトップ: テーブルビュー */}
            <div className={tableStyles.desktopOnly}>
            <div className="max-w-full overflow-x-auto">
              <table className={tableStyles.table}>
                <thead className={tableStyles.thead}>
                  <tr>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? '工事番号' : 'Work No.'}
                    </th>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? '請求書番号' : 'Invoice No.'}
                    </th>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? '請求書日付' : 'Invoice Date'}
                    </th>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? '顧客名' : 'Customer'}
                    </th>
                    <th className={`${tableStyles.th} text-end`}>
                      {language === 'ja' ? '金額' : 'Amount'}
                    </th>
                    <th className={`${tableStyles.th} text-center`}>
                      {language === 'ja' ? 'ステータス' : 'Status'}
                    </th>
                  </tr>
                </thead>
                <tbody className={tableStyles.tbody}>
                  {paginatedInvoices.map((record) => (
                    <tr key={record.id} className={tableStyles.tr}>
                      <td className={tableStyles.td}>
                        <a href={`/${locale}/workno/${record.work_no}`} className={tableStyles.tdLink}>
                          {record.work_no || '-'}
                        </a>
                      </td>
                      <td className={`${tableStyles.td} text-gray-800 dark:text-white/90`}>
                        {record.invoice_no || '-'}
                      </td>
                      <td className={tableStyles.td}>
                        {record.invoice_date?.replace(/-/g, '/') || '-'}
                      </td>
                      <td className={tableStyles.td}>
                        {record.customer_name || '-'}
                      </td>
                      <td className={`${tableStyles.td} text-end font-medium text-gray-800 dark:text-white/90`}>
                        {formatNumber(record.grand_total)}
                      </td>
                      <td className={`${tableStyles.td} text-center`}>
                        <span className={`inline-flex px-2.5 py-0.5 text-theme-xs font-medium rounded-full ${getStatusClass(record.status)}`}>
                          {record.status || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
