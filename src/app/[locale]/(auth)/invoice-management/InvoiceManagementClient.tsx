'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type Language } from '@/lib/kintone/field-mappings';
import SearchFilter from '@/components/ui/SearchFilter';
import { tableStyles } from '@/components/ui/TableStyles';
import { InvoiceRecord } from '@/types/kintone';

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

  // 数値フォーマット
  const formatNumber = (value: string | undefined): string => {
    if (!value) return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'B';
  };

  return (
    <div className={tableStyles.contentWrapper}>
      {/* 検索フィルターコンポーネント */}
      <SearchFilter
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder={searchPlaceholder}
        totalCount={filteredInvoices.length}
        countLabel={countLabel}
        showPeriodFilter={true}
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        availablePeriods={availablePeriods()}
        language={language}
      />

      {/* テーブル表示 */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {language === 'ja' ? '読み込み中...' : language === 'th' ? 'กำลังโหลด...' : 'Loading...'}
            </p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ja' ? '工事番号' : 'Work No.'}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ja' ? '請求書番号' : 'Invoice No.'}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ja' ? '請求書日付' : 'Invoice Date'}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ja' ? '顧客名' : 'Customer'}
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ja' ? '金額' : 'Amount'}
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ja' ? 'ステータス' : 'Status'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((record) => (
                <tr key={record.$id.value} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-indigo-600">
                    <a href={`/${locale}/workno/${record.文字列__1行_?.value}`} className="hover:text-indigo-900">
                      {record.文字列__1行_?.value || '-'}
                    </a>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {record.文字列__1行__0?.value || '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {record.日付?.value?.replace(/-/g, '/') || '-'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">
                    {record.CS_name?.value || '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatNumber(record.計算?.value || record.total?.value)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.ラジオボタン?.value?.includes('Payment date confirmed') || record.ラジオボタン?.value?.includes('ชำระ')
                        ? 'bg-green-100 text-green-800'
                        : record.ラジオボタン?.value?.includes('Pending') || record.ラジオボタン?.value?.includes('รอ')
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
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
    </div>
  );
}