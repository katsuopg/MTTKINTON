'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorkNoRecord, InvoiceRecord } from '@/types/kintone';
import { getFieldLabel, getStatusLabel, type Language } from '@/lib/kintone/field-mappings';
import { ListPageHeader } from '@/components/ui/ListPageHeader';
import { tableStyles } from '@/components/ui/TableStyles';
import { extractCsName } from '@/lib/utils/customer-name';

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
      <ListPageHeader
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder={searchPlaceholder}
        totalCount={filteredRecords.length}
        countLabel={countLabel}
        filters={
          <div className="flex items-center gap-2 whitespace-nowrap">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === 'ja' ? '会計期間:' : language === 'th' ? 'ปีบัญชี:' : 'Fiscal Year:'}
            </label>
            <select
              value={fiscalYear.toString()}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="h-9 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* テーブル表示 - TailAdminスタイル */}
      <div className={tableStyles.tableContainer}>
        <div className="max-w-full overflow-x-auto">
          {filteredRecords.length === 0 ? (
            <div className={tableStyles.emptyRow}>
              {language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}
            </div>
          ) : (
            <table className={tableStyles.table} style={{minWidth: '1200px'}}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '工事番号' : language === 'th' ? 'หมายเลขงาน' : 'Work No.'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                  </th>
                  <th className={`${tableStyles.th} text-center`}>
                    PO
                  </th>
                  <th className={`${tableStyles.th} text-center`}>
                    INV
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '顧客名' : language === 'th' ? 'ชื่อลูกค้า' : 'Customer'}
                  </th>
                  <th className={tableStyles.th}>
                    Category
                  </th>
                  <th className={tableStyles.th}>
                    Description
                  </th>
                  <th className={tableStyles.th}>
                    Model
                  </th>
                  <th className={`${tableStyles.th} text-end`}>
                    Grand Total
                  </th>
                  <th className={`${tableStyles.th} text-end`}>
                    Gross Profit
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '売上予定日' : language === 'th' ? 'วันที่ขายที่คาดการณ์' : 'Sales Date'}
                  </th>
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
              {filteredRecords.filter(item => item?.record?.$id?.value).map((item) => (
                <tr
                  key={item.record.$id.value}
                  className={`${tableStyles.trClickable} ${item.record.Status?.value === 'Finished' ? 'bg-success-50 dark:bg-success-500/10' : ''}`}
                  onClick={() => router.push(`/${locale}/workno/${encodeURIComponent(item.record.WorkNo?.value || '')}`)}
                >
                  <td className={tableStyles.td}>
                    <div className="flex items-center">
                      {item.isChild && (
                        <span className="mr-2 text-gray-400 dark:text-gray-500">└</span>
                      )}
                      <a
                        href={`/${locale}/workno/${encodeURIComponent(item.record.WorkNo?.value || '')}`}
                        className={tableStyles.tdLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.record.WorkNo?.value}
                      </a>
                      {/* 売上予定日が過ぎているかチェック */}
                      {item.record.Salesdate?.value &&
                       new Date(item.record.Salesdate.value) < new Date() &&
                       item.record.Status?.value !== 'Finished' &&
                       item.record.Status?.value !== 'Cancel' && (
                        <div className="relative ml-1 group inline-flex">
                          <span className="text-warning-500 cursor-help">⚠️</span>
                          <div className="absolute z-10 invisible group-hover:visible bg-gray-800 dark:bg-gray-700 text-white text-theme-xs rounded-lg px-3 py-2 whitespace-nowrap left-full ml-1 top-1/2 transform -translate-y-1/2 shadow-theme-lg">
                            {language === 'ja'
                              ? '売上予定日が過ぎています。担当営業に再確認をしてください。'
                              : language === 'th'
                              ? 'วันที่ขายที่คาดการณ์ผ่านไปแล้ว กรุณาตรวจสอบกับฝ่ายขายอีกครั้ง'
                              : 'Sales date has passed. Please reconfirm with sales staff.'}
                            <div className="absolute w-2 h-2 bg-gray-800 dark:bg-gray-700 transform rotate-45 -left-1 top-1/2 -translate-y-1/2"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={tableStyles.td}>
                    <span
                      className={`${tableStyles.statusBadge} ${
                        item.record.Status?.value === 'Working' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400' :
                        item.record.Status?.value === 'Finished' ? 'bg-success-500 text-white' :
                        item.record.Status?.value === 'Wating PO' ? 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400' :
                        item.record.Status?.value === 'Stock' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400' :
                        item.record.Status?.value === 'Pending' ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400' :
                        item.record.Status?.value === 'Cancel' ? 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400' :
                        item.record.Status?.value === 'Expenses' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400'
                      }`}
                    >
                      {getStatusLabel(item.record.Status?.value || '', language)}
                    </span>
                  </td>
                  <td className={`${tableStyles.td} text-center`}>
                    {item.record.ルックアップ?.value && (
                      <span className={`${tableStyles.statusBadge} bg-success-500 text-white`}>
                        PO
                      </span>
                    )}
                  </td>
                  <td className={`${tableStyles.td} text-center`}>
                    {hasInvoice(item.record) && (
                      <span className={`${tableStyles.statusBadge} bg-success-500 text-white`}>
                        INV
                        {getInvoiceCount(item.record) > 1 && (
                          <span className="ml-1 text-theme-xs">({getInvoiceCount(item.record)})</span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className={tableStyles.td}>
                    {item.record.文字列__1行__8?.value ? (
                      <a
                        href={`/${locale}/customers/${item.record.文字列__1行__8.value}`}
                        className={tableStyles.tdLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {extractCsName(item.record.文字列__1行__8.value)}
                      </a>
                    ) : '-'}
                  </td>
                  <td className={tableStyles.td}>
                    {item.record.文字列__1行__1?.value || '-'}
                  </td>
                  <td className={`${tableStyles.td} whitespace-normal`}>
                    {item.record.文字列__1行__2?.value || '-'}
                  </td>
                  <td className={tableStyles.td}>
                    {item.record.文字列__1行__9?.value || '-'}
                  </td>
                  <td className={`${tableStyles.td} text-end text-gray-800 dark:text-white/90`}>
                    {formatNumber(item.record.grand_total?.value)}
                  </td>
                  <td className={`${tableStyles.td} text-end text-gray-800 dark:text-white/90`}>
                    {formatNumber(item.record.profit?.value)}
                  </td>
                  <td className={tableStyles.td}>
                    <span className={
                      item.record.Salesdate?.value &&
                      new Date(item.record.Salesdate.value) < new Date() &&
                      item.record.Status?.value !== 'Finished' &&
                      item.record.Status?.value !== 'Cancel'
                        ? 'text-error-500 font-medium'
                        : 'text-gray-800 dark:text-white/90'
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
    </div>
  );
}