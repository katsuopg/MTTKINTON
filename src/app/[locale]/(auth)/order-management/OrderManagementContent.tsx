'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { tableStyles } from '@/components/ui/TableStyles';
import { ListPageHeader } from '@/components/ui/ListPageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { type Language } from '@/lib/kintone/field-mappings';

// 注文書レコードの型定義
export interface OrderRecord {
  $id: { type: "__ID__"; value: string };
  レコード番号: { type: "RECORD_NUMBER"; value: string };
  文字列__1行_: { type: "SINGLE_LINE_TEXT"; value: string }; // PO番号
  文字列__1行__0: { type: "SINGLE_LINE_TEXT"; value: string }; // CS ID
  文字列__1行__2: { type: "SINGLE_LINE_TEXT"; value: string }; // 工事番号
  文字列__1行__4: { type: "SINGLE_LINE_TEXT"; value: string }; // 顧客名
  文字列__1行__7: { type: "SINGLE_LINE_TEXT"; value: string }; // 件名
  McItem: { type: "SINGLE_LINE_TEXT"; value: string }; // M/C ITEM
  文字列__1行__9: { type: "SINGLE_LINE_TEXT"; value: string }; // Model
  日付: { type: "DATE"; value: string }; // 注文日
  日付_0: { type: "DATE"; value: string }; // 見積日
  ルックアップ: { type: "SINGLE_LINE_TEXT"; value: string }; // 見積番号
  数値_3: { type: "NUMBER"; value: string }; // 値引き前金額
  数値_4: { type: "NUMBER"; value: string }; // 値引き額
  AF: { type: "NUMBER"; value: string }; // 値引き後金額
  amount: { type: "CALC"; value: string }; // 合計金額（税込）
  vat: { type: "CALC"; value: string }; // 消費税額
  Drop_down: { type: "DROP_DOWN"; value: string }; // ステータス
  添付ファイル: { type: "FILE"; value: Array<{
    fileKey: string;
    name: string;
    contentType: string;
    size: string;
  }> };
  更新日時: { type: "UPDATED_TIME"; value: string };
}

interface OrderManagementContentProps {
  orderRecords: OrderRecord[];
  locale: string;
  language: Language;
  currentFiscalYear: number;
  initialKeyword: string;
}

export default function OrderManagementContent({
  orderRecords,
  locale,
  language,
  currentFiscalYear,
  initialKeyword,
}: OrderManagementContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearchChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('keyword', value);
    } else {
      params.delete('keyword');
    }
    router.push(`/${locale}/order-management?${params.toString()}`);
  }, [locale, router, searchParams]);

  const handleYearChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('fiscalYear', e.target.value);
    router.push(`/${locale}/order-management?${params.toString()}`);
  }, [locale, router, searchParams]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}/${month}/${day}`;
  };

  const { paginatedItems, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(orderRecords);

  const searchPlaceholder = language === 'ja'
    ? 'PO番号、顧客名、工事番号で検索...'
    : language === 'th'
    ? 'ค้นหาตาม PO, ลูกค้า, หมายเลขงาน...'
    : 'Search by PO No., Customer, Work No...';

  const countLabel = language === 'ja'
    ? '件の注文書'
    : language === 'th'
    ? ' ใบสั่งซื้อ'
    : ' orders';

  return (
    <div className={tableStyles.contentWrapper}>
      <div className={tableStyles.tableContainer}>
        <ListPageHeader
          searchValue={initialKeyword}
          onSearchChange={handleSearchChange}
          searchPlaceholder={searchPlaceholder}
          totalCount={orderRecords.length}
          countLabel={countLabel}
          filters={
            <div className="flex items-center gap-2 whitespace-nowrap">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'ja' ? '会計期間:' : language === 'th' ? 'ปีงบประมาณ:' : 'Fiscal Year:'}
              </label>
              <select
                value={currentFiscalYear}
                onChange={handleYearChange}
                className="h-9 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
              >
                {[14, 13, 12, 11, 10, 9, 8].map((year) => (
                  <option key={year} value={year}>
                    {language === 'ja' ? `第${year}期` : language === 'th' ? `ปีที่ ${year}` : `FY ${year}`}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        <div className="overflow-x-auto">
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>
                  {language === 'ja' ? 'PO番号' : language === 'th' ? 'เลขที่ PO' : 'PO No.'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? '工事番号' : language === 'th' ? 'หมายเลขงาน' : 'Work No.'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? '顧客名' : language === 'th' ? 'ชื่อลูกค้า' : 'Customer'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? '件名' : language === 'th' ? 'ชื่องาน' : 'Subject'}
                </th>
                <th className={tableStyles.th}>M/C ITEM</th>
                <th className={tableStyles.th}>MODEL</th>
                <th className={`${tableStyles.th} text-right`}>
                  {language === 'ja' ? '金額' : language === 'th' ? 'จำนวนเงิน' : 'Amount'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? 'PO日' : language === 'th' ? 'วันที่ PO' : 'PO Date'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                </th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className={tableStyles.emptyRow}>
                    {language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((record) => (
                  <tr
                    key={record.$id.value}
                    className={tableStyles.trClickable}
                    onClick={() => router.push(`/${locale}/order-management/${record.$id.value}`)}
                  >
                    <td className={tableStyles.td}>
                      <span className="font-medium text-brand-500">
                        {record.文字列__1行_?.value || '-'}
                      </span>
                    </td>
                    <td className={tableStyles.td}>
                      <span
                        className={tableStyles.tdLink}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/${locale}/workno/${record.文字列__1行__2?.value}`);
                        }}
                      >
                        {record.文字列__1行__2?.value || '-'}
                      </span>
                    </td>
                    <td className={tableStyles.td}>
                      {record.文字列__1行__4?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {record.文字列__1行__7?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {record.McItem?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {record.文字列__1行__9?.value || '-'}
                    </td>
                    <td className={`${tableStyles.td} text-right font-medium`}>
                      {record.amount?.value ? `${Number(record.amount.value).toLocaleString()}B` : '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {formatDate(record.日付?.value)}
                    </td>
                    <td className={tableStyles.td}>
                      {record.Drop_down?.value || '-'}
                    </td>
                  </tr>
                ))
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
  );
}
