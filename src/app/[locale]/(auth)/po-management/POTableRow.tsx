'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type Language } from '@/lib/kintone/field-mappings';
import { tableStyles } from '@/components/ui/TableStyles';
import type { SupabasePORecord } from './POManagementContent';

interface POTableRowProps {
  record: SupabasePORecord;
  locale: string;
  language: Language;
  isDelivered: boolean;
  isOverdue: boolean;
}

export default function POTableRow({ record, locale, language, isDelivered, isOverdue }: POTableRowProps) {
  const router = useRouter();
  const hasNoPO = !record.po_no;

  const handleRowClick = () => {
    if (hasNoPO) {
      router.push(`/${locale}/po-management/${record.kintone_record_id}`);
    }
  };

  return (
    <tr
      className={`
        ${isDelivered ? 'bg-brand-50/50 dark:bg-brand-500/10' : isOverdue && !isDelivered ? 'bg-error-50/50 dark:bg-error-500/10' : ''}
        ${hasNoPO ? 'cursor-pointer' : ''}
        ${tableStyles.tr}
      `}
      onClick={hasNoPO ? handleRowClick : undefined}
    >
      <td className={tableStyles.td}>
        {record.approval_status && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-theme-xs font-medium ${
            record.approval_status === 'Approval' || record.approval_status === 'Approved'
              ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500'
              : record.approval_status === 'Checking Boss' || record.approval_status === 'UnProcess'
              ? 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500'
              : record.approval_status === 'Cancelled' || record.approval_status === 'キャンセル'
              ? 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400'
          }`}>
            {record.approval_status}
          </span>
        )}
      </td>
      <td className={tableStyles.td}>
        {(record.po_status === 'Arrived' ||
          record.po_status === 'Delivered' ||
          record.po_status === '納品済み') && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-theme-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
            {record.po_status}
          </span>
        )}
      </td>
      <td className={tableStyles.td}>
        {record.po_no ? (
          <Link
            href={`/${locale}/po-management/${record.kintone_record_id}`}
            className={tableStyles.tdLink}
            onClick={(e) => e.stopPropagation()}
          >
            {record.po_no}
          </Link>
        ) : '-'}
      </td>
      <td className={tableStyles.td}>
        {record.work_no ? (
          <Link
            href={`/${locale}/workno/${record.work_no}`}
            className={tableStyles.tdLink}
            onClick={(e) => e.stopPropagation()}
          >
            {record.work_no}
          </Link>
        ) : '-'}
      </td>
      <td className={tableStyles.td}>
        {record.supplier_name ? (
          <Link
            href={`/${locale}/suppliers?search=${encodeURIComponent(record.supplier_name)}`}
            className={tableStyles.tdLink}
            onClick={(e) => e.stopPropagation()}
            title={record.supplier_name}
          >
            {record.supplier_name.length > 10 ? (
              <span>
                {record.supplier_name.substring(0, 10)}...
              </span>
            ) : (
              record.supplier_name
            )}
          </Link>
        ) : '-'}
      </td>
      <td className={tableStyles.td}>
        {record.po_date || '-'}
      </td>
      <td className={tableStyles.td}>
        <span className={!record.delivery_date ? 'text-error-600 dark:text-error-500 font-medium' : isOverdue && !isDelivered ? 'text-error-600 dark:text-error-500 font-medium' : 'text-gray-800 dark:text-white/90'}>
          {record.delivery_date || '-'}
        </span>
        {(isOverdue && !isDelivered) || !record.delivery_date ? (
          <span className="ml-1 text-error-500">⚠️</span>
        ) : null}
      </td>
      <td className={`${tableStyles.td} text-end font-medium text-gray-800 dark:text-white/90`}>
        {record.grand_total != null ? `${record.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} B` : '-'}
      </td>
    </tr>
  );
}
