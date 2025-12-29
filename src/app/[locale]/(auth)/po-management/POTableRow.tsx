'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PORecord } from '@/types/kintone';
import { type Language } from '@/lib/kintone/field-mappings';
import { tableStyles } from '@/components/ui/TableStyles';

interface POTableRowProps {
  record: PORecord;
  locale: string;
  language: Language;
  isDelivered: boolean;
  isOverdue: boolean;
}

export default function POTableRow({ record, locale, language, isDelivered, isOverdue }: POTableRowProps) {
  const router = useRouter();
  const hasNoPO = !record.文字列__1行__1?.value;

  const handleRowClick = () => {
    if (hasNoPO) {
      router.push(`/${locale}/po-management/${record.$id.value}`);
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
        {record.ステータス?.value && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-theme-xs font-medium ${
            record.ステータス.value === 'Approval' || record.ステータス.value === 'Approved'
              ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500'
              : record.ステータス.value === 'Checking Boss' || record.ステータス.value === 'UnProcess'
              ? 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500'
              : record.ステータス.value === 'Cancelled' || record.ステータス.value === 'キャンセル'
              ? 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400'
          }`}>
            {record.ステータス.value}
          </span>
        )}
      </td>
      <td className={tableStyles.td}>
        {(record.ドロップダウン_1?.value === 'Arrived' ||
          record.ドロップダウン_1?.value === 'Delivered' ||
          record.ドロップダウン_1?.value === '納品済み') && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-theme-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
            {record.ドロップダウン_1.value}
          </span>
        )}
      </td>
      <td className={tableStyles.td}>
        {record.文字列__1行__1?.value ? (
          <Link
            href={`/${locale}/po-management/${record.$id.value}`}
            className={tableStyles.tdLink}
            onClick={(e) => e.stopPropagation()}
          >
            {record.文字列__1行__1.value}
          </Link>
        ) : '-'}
      </td>
      <td className={tableStyles.td}>
        {record.ルックアップ?.value ? (
          <Link
            href={`/${locale}/workno/${record.ルックアップ.value}`}
            className={tableStyles.tdLink}
            onClick={(e) => e.stopPropagation()}
          >
            {record.ルックアップ.value}
          </Link>
        ) : '-'}
      </td>
      <td className={tableStyles.td}>
        {record.ルックアップ_1?.value ? (
          <Link
            href={`/${locale}/suppliers?search=${encodeURIComponent(record.ルックアップ_1.value)}`}
            className={tableStyles.tdLink}
            onClick={(e) => e.stopPropagation()}
            title={record.ルックアップ_1.value}
          >
            {record.ルックアップ_1.value.length > 10 ? (
              <span>
                {record.ルックアップ_1.value.substring(0, 10)}...
              </span>
            ) : (
              record.ルックアップ_1.value
            )}
          </Link>
        ) : '-'}
      </td>
      <td className={tableStyles.td}>
        {record.日付?.value || '-'}
      </td>
      <td className={tableStyles.td}>
        <span className={!record.日付_0?.value ? 'text-error-600 dark:text-error-500 font-medium' : isOverdue && !isDelivered ? 'text-error-600 dark:text-error-500 font-medium' : 'text-gray-800 dark:text-white/90'}>
          {record.日付_0?.value || '-'}
        </span>
        {(isOverdue && !isDelivered) || !record.日付_0?.value ? (
          <span className="ml-1 text-error-500">⚠️</span>
        ) : null}
      </td>
      <td className={`${tableStyles.td} text-end font-medium text-gray-800 dark:text-white/90`}>
        {record.grand_total?.value ? `${parseFloat(record.grand_total.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} B` : '-'}
      </td>
    </tr>
  );
}