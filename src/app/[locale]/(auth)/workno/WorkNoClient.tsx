'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorkNoRecord, InvoiceRecord } from '@/types/kintone';
import { getFieldLabel, getStatusLabel, type Language } from '@/lib/kintone/field-mappings';
import SearchFilter from '@/components/ui/SearchFilter';
import { tableStyles } from '@/components/ui/TableStyles';

interface WorkNoClientProps {
  locale: string;
  language: Language;
  initialRecords: WorkNoRecord[];
  initialInvoiceRecords: InvoiceRecord[];
  initialFiscalYear: number;
  initialSearchQuery: string;
}

export default function WorkNoClient({
  locale,
  language,
  initialRecords,
  initialInvoiceRecords,
  initialFiscalYear,
  initialSearchQuery,
}: WorkNoClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [records, setRecords] = useState<WorkNoRecord[]>(initialRecords);
  const [fiscalYear, setFiscalYear] = useState(initialFiscalYear);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [filteredRecords, setFilteredRecords] = useState<Array<{record: WorkNoRecord, isChild: boolean}>>([]);
  
  // 請求書データから工事番号ごとのマップを作成
  const [invoicesByWorkNo, setInvoicesByWorkNo] = useState<Map<string, InvoiceRecord[]>>(new Map());

  // URL更新のデバウンス処理（検索時のみ使用）
  const updateURL = useCallback((search: string, year: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (year !== 14) params.set('fiscalYear', year.toString());
    
    const query = params.toString();
    const newURL = `/${locale}/workno${query ? `?${query}` : ''}`;
    // router.replaceを削除（URLパラメータの更新のみ行い、画面は再レンダリングしない）
    window.history.replaceState({}, '', newURL);
  }, [locale]);

  // 検索処理
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    updateURL(value, fiscalYear);
  }, [fiscalYear, updateURL]);

  // 期間変更処理
  const handlePeriodChange = useCallback((period: string) => {
    const year = parseInt(period);
    setFiscalYear(year);
    updateURL(searchQuery, year);
    
    // 期間が変わったときはサーバーサイドで再取得が必要
    window.location.href = `/${locale}/workno?fiscalYear=${year}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`;
  }, [locale, searchQuery]);

  // 工事番号ソート関数
  const sortWorkNumbers = useCallback((records: WorkNoRecord[]) => {
    return [...records].sort((a, b) => {
      const workNoA = a.WorkNo?.value || '';
      const workNoB = b.WorkNo?.value || '';
      
      // Eで終わるものは最下位（14-000E のような形式）
      const aEndsWithE = /E$/.test(workNoA);
      const bEndsWithE = /E$/.test(workNoB);
      
      if (aEndsWithE && !bEndsWithE) return 1;
      if (!aEndsWithE && bEndsWithE) return -1;
      
      // 通常の文字列比較（降順）
      return workNoB.localeCompare(workNoA);
    });
  }, []);

  // 親子関係を構築する関数
  const buildHierarchy = useCallback((sortedRecords: WorkNoRecord[]) => {
    const result: Array<{record: WorkNoRecord, isChild: boolean}> = [];
    const workNoMap = new Map<string, WorkNoRecord>();
    const processed = new Set<string>();
    
    // 工事番号でマップを作成
    sortedRecords.forEach(record => {
      const workNo = record.WorkNo?.value || '';
      workNoMap.set(workNo, record);
    });
    
    // まず親レコード（-0で終わる）だけを抽出して処理
    const parentRecords = sortedRecords.filter(record => {
      const workNo = record.WorkNo?.value || '';
      const lastPartMatch = workNo.match(/-(\d+)$/);
      if (!lastPartMatch) return true; // 末尾に数字がない場合は親
      return parseInt(lastPartMatch[1]) === 0; // -0で終わる場合は親
    });
    
    parentRecords.forEach(record => {
      const workNo = record.WorkNo?.value || '';
      
      // 末尾の番号を取得
      const lastPartMatch = workNo.match(/-(\d+)$/);
      if (!lastPartMatch) {
        // 末尾に数字がない場合は親として追加
        if (!processed.has(workNo)) {
          result.push({record, isChild: false});
          processed.add(workNo);
        }
        return;
      }
      
      const lastNumber = parseInt(lastPartMatch[1]);
      
      if (lastNumber === 0) {
        // -0で終わる場合は親
        if (!processed.has(workNo)) {
          result.push({record, isChild: false});
          processed.add(workNo);
          
          // 同じベースの子番号を探して追加
          const basePattern = workNo.replace(/-0$/, '');
          for (let i = 1; i <= 10; i++) { // 最大10個の子を検索
            const childWorkNo = `${basePattern}-${i}`;
            const childRecord = workNoMap.get(childWorkNo);
            if (childRecord && !processed.has(childWorkNo)) {
              result.push({record: childRecord, isChild: true});
              processed.add(childWorkNo);
            }
          }
        }
      }
    });
    
    // 残った子レコード（親がないもの）を処理
    sortedRecords.forEach(record => {
      const workNo = record.WorkNo?.value || '';
      if (!processed.has(workNo)) {
        result.push({record, isChild: false});
        processed.add(workNo);
      }
    });
    
    return result;
  }, []);

  // 数値フォーマット関数
  const formatNumber = (value: string | undefined) => {
    if (!value || value === '0') return '-';
    const formatted = Number(value).toLocaleString();
    return `${formatted}B`;
  };

  // 工事番号に請求書があるかチェックする関数
  const hasInvoice = (record: WorkNoRecord) => {
    const workNo = record.WorkNo?.value;
    if (!workNo) return false;
    
    // まず請求書管理アプリのデータをチェック
    const invoicesFromApp = invoicesByWorkNo.get(workNo);
    if (invoicesFromApp && invoicesFromApp.length > 0) {
      return true;
    }
    
    // フォールバック: Work No.レコード内のフィールドを使用
    const inv3 = record.文字列__1行__3?.value;
    const inv4 = record.文字列__1行__4?.value;
    const inv6 = record.文字列__1行__6?.value;
    const inv7 = record.文字列__1行__7?.value;
    
    // 空文字列、null、undefinedをすべて除外
    const hasValidInvoice = (inv3 && inv3.trim() !== '') || 
                           (inv4 && inv4.trim() !== '') || 
                           (inv6 && inv6.trim() !== '') || 
                           (inv7 && inv7.trim() !== '');
    
    return hasValidInvoice;
  };
  
  // 工事番号の請求書数を取得する関数
  const getInvoiceCount = (record: WorkNoRecord) => {
    const workNo = record.WorkNo?.value;
    if (!workNo) return 0;
    
    const invoicesFromApp = invoicesByWorkNo.get(workNo);
    return invoicesFromApp ? invoicesFromApp.length : 0;
  };



  // 請求書データの初期化
  useEffect(() => {
    // 請求書データから工事番号ごとのマップを作成
    const invoiceMap = new Map<string, InvoiceRecord[]>();
    initialInvoiceRecords.forEach(invoice => {
      const workNo = invoice.文字列__1行_?.value; // 工事番号フィールド
      if (workNo) {
        if (!invoiceMap.has(workNo)) {
          invoiceMap.set(workNo, []);
        }
        invoiceMap.get(workNo)!.push(invoice);
      }
    });
    setInvoicesByWorkNo(invoiceMap);
  }, [initialInvoiceRecords]);

  // クライアントサイドフィルタリングとソート
  useEffect(() => {
    let filtered = records;
    
    if (searchQuery) {
      filtered = records.filter(record => {
        const workNo = record.WorkNo?.value?.toLowerCase() || '';
        const csId = record.文字列__1行__8?.value?.toLowerCase() || '';
        const category = record.文字列__1行__1?.value?.toLowerCase() || '';
        const description = record.文字列__1行__2?.value?.toLowerCase() || '';
        const model = record.文字列__1行__9?.value?.toLowerCase() || '';
        const mcItem = record.McItem?.value?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return workNo.includes(query) || csId.includes(query) || category.includes(query) || 
               description.includes(query) || model.includes(query) || mcItem.includes(query);
      });
    }

    const sorted = sortWorkNumbers(filtered);
    const hierarchy = buildHierarchy(sorted);
    setFilteredRecords(hierarchy);
  }, [records, searchQuery, sortWorkNumbers, buildHierarchy]);

  // 日付フォーマット関数
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '未定';
    
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

  const periodOptions = [
    { value: '14', label: language === 'ja' ? '第14期' : language === 'th' ? 'ช่วงเวลาที่ 14' : 'Period 14' },
    { value: '13', label: language === 'ja' ? '第13期' : language === 'th' ? 'ช่วงเวลาที่ 13' : 'Period 13' },
    { value: '12', label: language === 'ja' ? '第12期' : language === 'th' ? 'ช่วงเวลาที่ 12' : 'Period 12' },
    { value: '11', label: language === 'ja' ? '第11期' : language === 'th' ? 'ช่วงเวลาที่ 11' : 'Period 11' },
    { value: '10', label: language === 'ja' ? '第10期' : language === 'th' ? 'ช่วงเวลาที่ 10' : 'Period 10' },
  ];

  const searchPlaceholder = language === 'ja' 
    ? 'キーワード' 
    : language === 'th' 
    ? 'คำค้นหา' 
    : 'Keyword';

  const countLabel = language === 'ja'
    ? '件の工事番号'
    : language === 'th'
    ? ' หมายเลขงาน'
    : ' work numbers';

  return (
    <div className={tableStyles.contentWrapper}>
      {/* 検索フィルターコンポーネント */}
      <SearchFilter
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder={searchPlaceholder}
        periodOptions={periodOptions}
        selectedPeriod={fiscalYear.toString()}
        onPeriodChange={handlePeriodChange}
        periodLabel={language === 'ja' ? '会計期間:' : language === 'th' ? 'ปีบัญชี:' : 'Fiscal Year:'}
        totalCount={filteredRecords.length}
        countLabel={countLabel}
      />

      {/* テーブル表示 */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200" style={{minWidth: '1200px'}}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ja' ? '工事番号' : language === 'th' ? 'หมายเลขงาน' : 'Work No.'}
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  INV
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CS ID
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grand Total
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Profit
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ja' ? '売上予定日' : language === 'th' ? 'วันที่ขายที่คาดการณ์' : 'Sales Date'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.filter(item => item?.record?.$id?.value).map((item) => (
                <tr key={item.record.$id.value} className="transition-colors duration-150" style={{
                  backgroundColor: item.record.Status?.value === 'Finished' ? '#f0fdf4' : 'transparent'
                }}>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      {item.isChild && (
                        <span className="mr-2 text-gray-400">└</span>
                      )}
                      <a
                        href={`/${locale}/projects/${item.record.WorkNo?.value}`}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                        style={{transform: 'scaleX(0.9)', transformOrigin: 'left', display: 'inline-block'}}
                      >
                        {item.record.WorkNo?.value}
                      </a>
                      {/* 売上予定日が過ぎているかチェック */}
                      {item.record.Salesdate?.value && 
                       new Date(item.record.Salesdate.value) < new Date() &&
                       item.record.Status?.value !== 'Finished' &&
                       item.record.Status?.value !== 'Cancel' && (
                        <div className="relative ml-1 group inline-flex">
                          <span className="text-yellow-500 cursor-help">⚠️</span>
                          <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded-md px-3 py-2 whitespace-nowrap left-full ml-1 top-1/2 transform -translate-y-1/2">
                            {language === 'ja' 
                              ? '売上予定日が過ぎています。担当営業に再確認をしてください。'
                              : language === 'th'
                              ? 'วันที่ขายที่คาดการณ์ผ่านไปแล้ว กรุณาตรวจสอบกับฝ่ายขายอีกครั้ง'
                              : 'Sales date has passed. Please reconfirm with sales staff.'}
                            <div className="absolute w-2 h-2 bg-gray-800 transform rotate-45 -left-1 top-1/2 -translate-y-1/2"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                    <span 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: 
                          item.record.Status?.value === 'Working' ? '#dbeafe' :
                          item.record.Status?.value === 'Finished' ? '#10b981' :
                          item.record.Status?.value === 'Wating PO' ? '#fef08a' :
                          item.record.Status?.value === 'Stock' ? '#f3e8ff' :
                          item.record.Status?.value === 'Pending' ? '#fed7aa' :
                          item.record.Status?.value === 'Cancel' ? '#fee2e2' :
                          item.record.Status?.value === 'Expenses' ? '#e0e7ff' :
                          '#f3f4f6',
                        color:
                          item.record.Status?.value === 'Working' ? '#1e40af' :
                          item.record.Status?.value === 'Finished' ? '#ffffff' :
                          item.record.Status?.value === 'Wating PO' ? '#a16207' :
                          item.record.Status?.value === 'Stock' ? '#7c3aed' :
                          item.record.Status?.value === 'Pending' ? '#ea580c' :
                          item.record.Status?.value === 'Cancel' ? '#dc2626' :
                          item.record.Status?.value === 'Expenses' ? '#4338ca' :
                          '#6b7280'
                      }}
                    >
                      {getStatusLabel(item.record.Status?.value || '', language)}
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                    {item.record.ルックアップ?.value && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white justify-center">
                        PO
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                    {hasInvoice(item.record) && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white justify-center">
                        INV
                        {getInvoiceCount(item.record) > 1 && (
                          <span className="ml-1 text-xs">({getInvoiceCount(item.record)})</span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.record.文字列__1行__8?.value ? (
                      <a
                        href={`/${locale}/customers/${item.record.文字列__1行__8.value}`}
                        className="text-indigo-600 hover:text-indigo-900"
                        style={{transform: 'scaleX(0.9)', transformOrigin: 'left', display: 'inline-block'}}
                      >
                        {item.record.文字列__1行__8.value}
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.record.文字列__1行__1?.value || '-'}
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-900">
                    {item.record.文字列__1行__2?.value || '-'}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.record.文字列__1行__9?.value || '-'}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatNumber(item.record.grand_total?.value)}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatNumber(item.record.profit?.value)}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm">
                    <span className={
                      item.record.Salesdate?.value && 
                      new Date(item.record.Salesdate.value) < new Date() &&
                      item.record.Status?.value !== 'Finished' &&
                      item.record.Status?.value !== 'Cancel' 
                        ? 'text-red-600 font-medium' 
                        : 'text-gray-900'
                    }>
                      {formatDate(item.record.Salesdate?.value)}
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