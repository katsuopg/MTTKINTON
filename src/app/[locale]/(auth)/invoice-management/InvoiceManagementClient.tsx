'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type Language } from '@/lib/kintone/field-mappings';
import { ListPageHeader } from '@/components/ui/ListPageHeader';
import { tableStyles } from '@/components/ui/TableStyles';
import { InvoiceRecord } from '@/types/kintone';
import { useToast } from '@/components/ui/Toast';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/Pagination';

interface InvoiceManagementClientProps {
  locale: string;
  language: Language;
  initialSearchQuery: string;
  initialInvoiceRecords: InvoiceRecord[];
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
  
  console.log('=== InvoiceManagementClient ===');
  console.log('Initial records count:', initialInvoiceRecords?.length || 0);
  console.log('First record:', initialInvoiceRecords?.[0]);
  
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
        console.log(`第${period}期のデータ取得完了:`, data.records.length);
      }
    } catch (error) {
      console.error('Error fetching invoice records:', error);
      toast({ type: 'error', title: language === 'ja' ? 'データの取得に失敗しました' : language === 'th' ? 'ดึงข้อมูลไม่สำเร็จ' : 'Failed to fetch data' });
    }
    setIsLoading(false);
  }, []);

  // URL更新のデバウンス処理
  const updateURL = useCallback((search: string, period?: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (period) params.set('period', period);
    
    const query = params.toString();
    const newURL = `/${locale}/invoice-management${query ? `?${query}` : ''}`;
    router.replace(newURL, { scroll: false });
  }, [locale, router]);

  // 検索処理
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    updateURL(value, selectedPeriod);
  }, [updateURL, selectedPeriod]);

  // 会計期処理
  const handlePeriodChange = useCallback(async (value: string) => {
    setSelectedPeriod(value);
    updateURL(searchQuery, value);
    if (value !== '') {
      await fetchInvoiceRecords(value);
    }
  }, [updateURL, searchQuery, fetchInvoiceRecords]);

  // 会計期を計算するヘルパー関数
  const getFiscalYear = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    // 7月始まりの会計期
    if (month >= 7) {
      return `${year - 2011}`;
    } else {
      return `${year - 2012}`;
    }
  };

  // 利用可能な会計期を生成
  const availablePeriods = (): string[] => {
    // 第9期から第14期までを固定で表示
    return ['14', '13', '12', '11', '10', '9'];
  };

  // フィルタリング処理（検索のみ、会計期間フィルタはAPIで実行済み）
  const filteredInvoices = invoiceRecords.filter(record => {
    // 検索キーワードフィルター
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        record.文字列__1行_?.value?.toLowerCase().includes(query) ||
        record.文字列__1行__0?.value?.toLowerCase().includes(query) ||
        record.CS_name?.value?.toLowerCase().includes(query);
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

  // 数値フォーマット
  const formatNumber = (value: string | undefined): string => {
    if (!value) return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'B';
  };

  return (
    <div className={tableStyles.contentWrapper}>
      {/* テーブル表示 */}
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
        />
        <div className="max-w-full overflow-x-auto">
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
                  <tr key={record.$id.value} className={tableStyles.tr}>
                    <td className={tableStyles.td}>
                      <a href={`/${locale}/workno/${record.文字列__1行_?.value}`} className={tableStyles.tdLink}>
                        {record.文字列__1行_?.value || '-'}
                      </a>
                    </td>
                    <td className={`${tableStyles.td} text-gray-800 dark:text-white/90`}>
                      {record.文字列__1行__0?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {record.日付?.value?.replace(/-/g, '/') || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {record.CS_name?.value || '-'}
                    </td>
                    <td className={`${tableStyles.td} text-end font-medium text-gray-800 dark:text-white/90`}>
                      {formatNumber(record.計算?.value || record.total?.value)}
                    </td>
                    <td className={`${tableStyles.td} text-center`}>
                      <span className={`inline-flex px-2.5 py-0.5 text-theme-xs font-medium rounded-full ${
                        record.ラジオボタン?.value?.includes('Payment date confirmed') || record.ラジオボタン?.value?.includes('ชำระ')
                          ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500'
                          : record.ラジオボタン?.value?.includes('Pending') || record.ラジオボタン?.value?.includes('รอ')
                          ? 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400'
                      }`}>
                        {record.ラジオボタン?.value || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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