'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getStatusLabel, type Language } from '@/lib/kintone/field-mappings';
import { ListPageHeader } from '@/components/ui/ListPageHeader';
import { tableStyles } from '@/components/ui/TableStyles';
import { extractCsName } from '@/lib/utils/customer-name';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/Pagination';
import { useNavPermissions } from '@/hooks/useNavPermissions';
import type { SupabaseWorkOrder } from './page';


const STATUS_TABS = [
  { key: 'all', labelJa: '全て', labelEn: 'All', labelTh: 'ทั้งหมด' },
  { key: 'Working', labelJa: '作業中', labelEn: 'Working', labelTh: 'กำลังทำงาน' },
  { key: 'Wating PO', labelJa: 'PO待ち', labelEn: 'Waiting PO', labelTh: 'รอ PO' },
  { key: 'Pending', labelJa: '保留', labelEn: 'Pending', labelTh: 'รอดำเนินการ' },
  { key: 'Stock', labelJa: '在庫', labelEn: 'Stock', labelTh: 'สต็อก' },
  { key: 'Finished', labelJa: '完了', labelEn: 'Finished', labelTh: 'เสร็จสิ้น' },
  { key: 'Expenses', labelJa: '経費', labelEn: 'Expenses', labelTh: 'ค่าใช้จ่าย' },
  { key: 'Cancel', labelJa: 'キャンセル', labelEn: 'Cancel', labelTh: 'ยกเลิก' },
];

interface WorkNoClientProps {
  locale: string;
  language: Language;
  initialRecords: SupabaseWorkOrder[];
  invoiceCountMap: Record<string, number>;
  initialFiscalYear: number;
  initialSearchQuery: string;
}

export default function WorkNoClient({
  locale,
  language,
  initialRecords,
  invoiceCountMap,
  initialFiscalYear,
  initialSearchQuery,
}: WorkNoClientProps) {
  const router = useRouter();
  const { canManageApp } = useNavPermissions();

  const [records] = useState<SupabaseWorkOrder[]>(initialRecords);
  const [fiscalYear, setFiscalYear] = useState(initialFiscalYear);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [activeStatusTab, setActiveStatusTab] = useState('all');
  const [filteredRecords, setFilteredRecords] = useState<Array<{record: SupabaseWorkOrder, isChild: boolean}>>([]);

  // URL更新のデバウンス処理（検索時のみ使用）
  const updateURL = useCallback((search: string, year: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (year !== 14) params.set('fiscalYear', year.toString());

    const query = params.toString();
    const newURL = `/${locale}/workno${query ? `?${query}` : ''}`;
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
  const sortWorkNumbers = useCallback((records: SupabaseWorkOrder[]) => {
    return [...records].sort((a, b) => {
      const workNoA = a.work_no || '';
      const workNoB = b.work_no || '';

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
  const buildHierarchy = useCallback((sortedRecords: SupabaseWorkOrder[]) => {
    const result: Array<{record: SupabaseWorkOrder, isChild: boolean}> = [];
    const workNoMap = new Map<string, SupabaseWorkOrder>();
    const processed = new Set<string>();

    // 工事番号でマップを作成
    sortedRecords.forEach(record => {
      const workNo = record.work_no || '';
      workNoMap.set(workNo, record);
    });

    // まず親レコード（-0で終わる）だけを抽出して処理
    const parentRecords = sortedRecords.filter(record => {
      const workNo = record.work_no || '';
      const lastPartMatch = workNo.match(/-(\d+)$/);
      if (!lastPartMatch) return true;
      return parseInt(lastPartMatch[1]) === 0;
    });

    parentRecords.forEach(record => {
      const workNo = record.work_no || '';

      const lastPartMatch = workNo.match(/-(\d+)$/);
      if (!lastPartMatch) {
        if (!processed.has(workNo)) {
          result.push({record, isChild: false});
          processed.add(workNo);
        }
        return;
      }

      const lastNumber = parseInt(lastPartMatch[1]);

      if (lastNumber === 0) {
        if (!processed.has(workNo)) {
          result.push({record, isChild: false});
          processed.add(workNo);

          // 同じベースの子番号を探して追加
          const basePattern = workNo.replace(/-0$/, '');
          for (let i = 1; i <= 10; i++) {
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
      const workNo = record.work_no || '';
      if (!processed.has(workNo)) {
        result.push({record, isChild: false});
        processed.add(workNo);
      }
    });

    return result;
  }, []);

  // 数値フォーマット関数
  const formatNumber = (value: number | null | undefined) => {
    if (value == null || value === 0) return '-';
    return `${Number(value).toLocaleString()}B`;
  };

  // 工事番号に請求書があるかチェックする関数
  const hasInvoice = (record: SupabaseWorkOrder) => {
    const workNo = record.work_no;
    if (!workNo) return false;

    // 請求書管理テーブルのデータをチェック
    if (invoiceCountMap[workNo] > 0) return true;

    // フォールバック: work_ordersレコード内のフィールドを使用
    return !!(
      (record.invoice_no_1 && record.invoice_no_1.trim() !== '') ||
      (record.invoice_no_2 && record.invoice_no_2.trim() !== '') ||
      (record.invoice_no_3 && record.invoice_no_3.trim() !== '') ||
      (record.invoice_no_4 && record.invoice_no_4.trim() !== '')
    );
  };

  // 工事番号の請求書数を取得する関数
  const getInvoiceCount = (record: SupabaseWorkOrder) => {
    return invoiceCountMap[record.work_no] || 0;
  };

  // クライアントサイドフィルタリングとソート
  useEffect(() => {
    let filtered = records;

    // ステータスフィルター
    if (activeStatusTab !== 'all') {
      filtered = filtered.filter(record => record.status === activeStatusTab);
    }

    if (searchQuery) {
      filtered = filtered.filter(record => {
        const workNo = (record.work_no || '').toLowerCase();
        const csId = (record.customer_id || '').toLowerCase();
        const category = (record.category || '').toLowerCase();
        const description = (record.description || '').toLowerCase();
        const model = (record.model || '').toLowerCase();
        const mcItem = (record.machine_item || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return workNo.includes(query) || csId.includes(query) || category.includes(query) ||
               description.includes(query) || model.includes(query) || mcItem.includes(query);
      });
    }

    const sorted = sortWorkNumbers(filtered);
    const hierarchy = buildHierarchy(sorted);
    setFilteredRecords(hierarchy);
  }, [records, searchQuery, activeStatusTab, sortWorkNumbers, buildHierarchy]);

  // 日付フォーマット関数
  const formatDate = (dateString: string | null | undefined) => {
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

  const getTabLabel = (tab: typeof STATUS_TABS[number]) => {
    if (language === 'ja') return tab.labelJa;
    if (language === 'th') return tab.labelTh;
    return tab.labelEn;
  };

  const handleStatusTabChange = (tab: string) => {
    setActiveStatusTab(tab);
  };

  // 利益計算
  const computeProfit = (record: SupabaseWorkOrder) => {
    const grandTotal = record.grand_total || 0;
    const costTotal = record.cost_total || 0;
    return grandTotal - costTotal;
  };

  const { paginatedItems: paginatedWorkItems, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredRecords);

  return (
    <div className={tableStyles.contentWrapper}>
      <div className={tableStyles.tableContainer}>
        <ListPageHeader
          searchValue={searchQuery}
          onSearchChange={handleSearchChange}
          searchPlaceholder={searchPlaceholder}
          totalCount={filteredRecords.length}
          countLabel={countLabel}
          filters={
            <>
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
              {/* デスクトップ: ステータスタブ */}
              <div className="hidden sm:flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleStatusTabChange(tab.key)}
                    className={`px-2.5 py-1.5 font-medium rounded-md text-theme-xs transition-colors hover:text-gray-900 dark:hover:text-white ${
                      activeStatusTab === tab.key
                        ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {getTabLabel(tab)}
                  </button>
                ))}
              </div>
              {/* モバイル: セレクト */}
              <select
                value={activeStatusTab}
                onChange={(e) => handleStatusTabChange(e.target.value)}
                className="sm:hidden h-9 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
              >
                {STATUS_TABS.map((tab) => (
                  <option key={tab.key} value={tab.key}>
                    {getTabLabel(tab)}
                  </option>
                ))}
              </select>
            </>
          }
          settingsHref={canManageApp('work_numbers') ? `/${locale}/settings/apps/work_numbers` : undefined}
        />
        {/* モバイル: カードビュー */}
        <div className={tableStyles.mobileCardList}>
          {filteredRecords.length === 0 ? (
            <div className={tableStyles.emptyRow}>
              {language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}
            </div>
          ) : (
            paginatedWorkItems.map((item) => {
              const statusBadgeClass =
                item.record.status === 'Working' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400' :
                item.record.status === 'Finished' ? 'bg-success-500 text-white' :
                item.record.status === 'Wating PO' ? 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400' :
                item.record.status === 'Stock' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400' :
                item.record.status === 'Pending' ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400' :
                item.record.status === 'Cancel' ? 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400' :
                item.record.status === 'Expenses' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400' :
                'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400';

              return (
                <div
                  key={item.record.kintone_record_id}
                  className={tableStyles.mobileCard}
                  onClick={() => router.push(`/${locale}/workno/${encodeURIComponent(item.record.work_no || '')}`)}
                >
                  <div className={tableStyles.mobileCardHeader}>
                    <span className={`${tableStyles.statusBadge} ${statusBadgeClass}`}>
                      {getStatusLabel(item.record.status || '', language)}
                    </span>
                    <span className={tableStyles.mobileCardMeta}>
                      {formatDate(item.record.sales_date)}
                    </span>
                  </div>
                  <div className={tableStyles.mobileCardTitle}>
                    {item.isChild && <span className="text-gray-400 mr-1">└</span>}
                    {item.record.work_no}
                  </div>
                  <div className={tableStyles.mobileCardSubtitle}>
                    {item.record.customer_id
                      ? extractCsName(item.record.customer_id)
                      : '-'}
                    {item.record.description && ` - ${item.record.description}`}
                  </div>
                  <div className={tableStyles.mobileCardFields}>
                    <span className={tableStyles.mobileCardFieldValue}>
                      {formatNumber(item.record.grand_total)}
                    </span>
                    {item.record.po_list && (
                      <span className={`${tableStyles.statusBadge} bg-success-500 text-white text-[10px] px-1.5 py-0`}>PO</span>
                    )}
                    {hasInvoice(item.record) && (
                      <span className={`${tableStyles.statusBadge} bg-success-500 text-white text-[10px] px-1.5 py-0`}>INV</span>
                    )}
                    {item.record.sales_date &&
                     new Date(item.record.sales_date) < new Date() &&
                     item.record.status !== 'Finished' &&
                     item.record.status !== 'Cancel' && (
                      <span className="text-warning-500 text-xs">⚠</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* デスクトップ: テーブルビュー */}
        <div className={tableStyles.desktopOnly}>
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
              {paginatedWorkItems.map((item) => (
                <tr
                  key={item.record.kintone_record_id}
                  className={`${tableStyles.trClickable} ${item.record.status === 'Finished' ? 'bg-success-50 dark:bg-success-500/10' : ''}`}
                  onClick={() => router.push(`/${locale}/workno/${encodeURIComponent(item.record.work_no || '')}`)}
                >
                  <td className={tableStyles.td}>
                    <div className="flex items-center">
                      {item.isChild && (
                        <span className="mr-2 text-gray-400 dark:text-gray-500">└</span>
                      )}
                      <a
                        href={`/${locale}/workno/${encodeURIComponent(item.record.work_no || '')}`}
                        className={tableStyles.tdLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.record.work_no}
                      </a>
                      {item.record.sales_date &&
                       new Date(item.record.sales_date) < new Date() &&
                       item.record.status !== 'Finished' &&
                       item.record.status !== 'Cancel' && (
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
                        item.record.status === 'Working' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400' :
                        item.record.status === 'Finished' ? 'bg-success-500 text-white' :
                        item.record.status === 'Wating PO' ? 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400' :
                        item.record.status === 'Stock' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400' :
                        item.record.status === 'Pending' ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400' :
                        item.record.status === 'Cancel' ? 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400' :
                        item.record.status === 'Expenses' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400'
                      }`}
                    >
                      {getStatusLabel(item.record.status || '', language)}
                    </span>
                  </td>
                  <td className={`${tableStyles.td} text-center`}>
                    {item.record.po_list && (
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
                    {item.record.customer_id ? (
                      <a
                        href={`/${locale}/customers/${item.record.customer_id}`}
                        className={tableStyles.tdLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {extractCsName(item.record.customer_id)}
                      </a>
                    ) : '-'}
                  </td>
                  <td className={tableStyles.td}>
                    {item.record.category || '-'}
                  </td>
                  <td className={`${tableStyles.td} whitespace-normal`}>
                    {item.record.description || '-'}
                  </td>
                  <td className={tableStyles.td}>
                    {item.record.model || '-'}
                  </td>
                  <td className={`${tableStyles.td} text-end text-gray-800 dark:text-white/90`}>
                    {formatNumber(item.record.grand_total)}
                  </td>
                  <td className={`${tableStyles.td} text-end text-gray-800 dark:text-white/90`}>
                    {formatNumber(computeProfit(item.record))}
                  </td>
                  <td className={tableStyles.td}>
                    <span className={
                      item.record.sales_date &&
                      new Date(item.record.sales_date) < new Date() &&
                      item.record.status !== 'Finished' &&
                      item.record.status !== 'Cancel'
                        ? 'text-error-500 font-medium'
                        : 'text-gray-800 dark:text-white/90'
                    }>
                      {formatDate(item.record.sales_date)}
                    </span>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          )}
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
