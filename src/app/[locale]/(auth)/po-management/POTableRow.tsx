'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PORecord } from '@/types/kintone';
import { type Language } from '@/lib/kintone/field-mappings';

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
        ${isDelivered ? 'bg-indigo-50' : isOverdue && !isDelivered ? 'bg-red-50' : ''} 
        ${hasNoPO ? 'cursor-pointer hover:bg-slate-50' : ''}
      `}
      onClick={hasNoPO ? handleRowClick : undefined}
    >
      <td className="pl-2 pr-1 py-2 whitespace-nowrap">
        {record.ステータス?.value && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            record.ステータス.value === 'Approval' || record.ステータス.value === 'Approved'
              ? 'bg-emerald-100 text-emerald-800'
              : record.ステータス.value === 'Checking Boss' || record.ステータス.value === 'UnProcess' 
              ? 'bg-yellow-100 text-yellow-800'
              : record.ステータス.value === 'Cancelled' || record.ステータス.value === 'キャンセル'
              ? 'bg-red-100 text-red-800'
              : 'bg-slate-100 text-slate-800'
          }`}>
            {record.ステータス.value}
          </span>
        )}
      </td>
      <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap">
        {(record.ドロップダウン_1?.value === 'Arrived' || 
          record.ドロップダウン_1?.value === 'Delivered' || 
          record.ドロップダウン_1?.value === '納品済み') && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {record.ドロップダウン_1.value}
          </span>
        )}
      </td>
      <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm">
        {record.文字列__1行__1?.value ? (
          <Link 
            href={`/${locale}/po-management/${record.$id.value}`}
            className="text-indigo-600 hover:text-indigo-900"
            onClick={(e) => e.stopPropagation()}
          >
            {record.文字列__1行__1.value}
          </Link>
        ) : '-'}
      </td>
      <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm">
        {record.ルックアップ?.value ? (
          <Link 
            href={`/${locale}/workno/${record.ルックアップ.value}`}
            className="text-indigo-600 hover:text-indigo-900"
            onClick={(e) => e.stopPropagation()}
          >
            {record.ルックアップ.value}
          </Link>
        ) : '-'}
      </td>
      <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900">
        {record.ルックアップ_1?.value ? (
          <Link 
            href={`/${locale}/suppliers?search=${encodeURIComponent(record.ルックアップ_1.value)}`}
            className="text-indigo-600 hover:text-indigo-900"
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
      <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900">
        {record.日付?.value || '-'}
      </td>
      <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm">
        <span className={!record.日付_0?.value ? 'text-red-600 font-medium' : isOverdue && !isDelivered ? 'text-red-600 font-medium' : 'text-slate-900'}>
          {record.日付_0?.value || '-'}
        </span>
        {(isOverdue && !isDelivered) || !record.日付_0?.value ? (
          <span className="ml-1 text-red-600">⚠️</span>
        ) : null}
      </td>
      <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900 text-right">
        {record.grand_total?.value ? `${parseFloat(record.grand_total.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} B` : '-'}
      </td>
    </tr>
  );
}