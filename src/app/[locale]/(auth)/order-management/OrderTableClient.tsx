'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { tableStyles } from '@/components/ui/TableStyles';
import { type Language } from '@/lib/kintone/field-mappings';

interface OrderRecord {
  $id: { type: "__ID__"; value: string };
  文字列__1行_?: { type: "SINGLE_LINE_TEXT"; value: string };
  文字列__1行__2?: { type: "SINGLE_LINE_TEXT"; value: string };
  文字列__1行__4?: { type: "SINGLE_LINE_TEXT"; value: string };
  文字列__1行__7?: { type: "SINGLE_LINE_TEXT"; value: string };
  McItem?: { type: "SINGLE_LINE_TEXT"; value: string };
  文字列__1行__9?: { type: "SINGLE_LINE_TEXT"; value: string };
  日付?: { type: "DATE"; value: string };
  amount?: { type: "CALC"; value: string };
  Drop_down?: { type: "DROP_DOWN"; value: string };
}

interface OrderTableClientProps {
  locale: string;
  language: Language;
  orderRecords: OrderRecord[];
}

export default function OrderTableClient({ locale, language, orderRecords }: OrderTableClientProps) {
  const router = useRouter();

  const handleRowClick = useCallback((recordId: string) => {
    router.push(`/${locale}/order-management/${recordId}`);
  }, [router, locale]);

  const handleRowKeyDown = useCallback((e: React.KeyboardEvent, recordId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRowClick(recordId);
    }
  }, [handleRowClick]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}/${month}/${day}`;
  };

  return (
    <div className={tableStyles.tableContainer}>
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
            <th className={tableStyles.th}>
              M/C ITEM
            </th>
            <th className={tableStyles.th}>
              MODEL
            </th>
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
          {orderRecords.map((record) => (
            <tr
              key={record.$id.value}
              className={tableStyles.trClickable}
              onClick={() => handleRowClick(record.$id.value)}
              onKeyDown={(e) => handleRowKeyDown(e, record.$id.value)}
              role="link"
              tabIndex={0}
            >
              <td className={`${tableStyles.td} font-medium text-indigo-600`}>
                {record.文字列__1行_?.value || '-'}
              </td>
              <td className={tableStyles.td}>
                {record.文字列__1行__2?.value || '-'}
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
          ))}
          {orderRecords.length === 0 && (
            <tr>
              <td colSpan={9} className={`${tableStyles.td} text-center`}>
                {language === 'ja' ? 'データがありません' : 'No data available'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
