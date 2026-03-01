'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import type { FieldDefinition, AppRecord } from '@/types/dynamic-app';

interface RelatedRecord {
  id: string;
  record_number: number;
  data: Record<string, unknown>;
}

interface RemoteField {
  field_code: string;
  label: { ja?: string; en?: string; th?: string };
}

interface RelatedRecordsSectionProps {
  field: FieldDefinition;
  record: AppRecord;
  appCode: string;
  locale: string;
}

export default function RelatedRecordsSection({ field, record, appCode, locale }: RelatedRecordsSectionProps) {
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';

  const [records, setRecords] = useState<RelatedRecord[]>([]);
  const [remoteFields, setRemoteFields] = useState<RemoteField[]>([]);
  const [loading, setLoading] = useState(true);

  const relatedAppCode = field.validation?.related_app_code || '';
  const relatedKeyField = field.validation?.related_key_field || '';
  const relatedThisField = field.validation?.related_this_field || '';
  const displayFieldCodes = field.validation?.related_display_fields || [];

  const label = field.label[lang] || field.label.ja || field.field_code;
  const thisFieldValue = record.data[relatedThisField];

  useEffect(() => {
    if (!relatedAppCode || !relatedKeyField || !relatedThisField || thisFieldValue === undefined || thisFieldValue === null) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // 関連アプリのフィールド定義を取得
        const fieldsRes = await fetch(`/api/apps/${relatedAppCode}/fields`);
        if (fieldsRes.ok) {
          const fieldsData = await fieldsRes.json();
          setRemoteFields((fieldsData.fields || []).map((f: FieldDefinition) => ({
            field_code: f.field_code,
            label: f.label,
          })));
        }

        // 関連レコードを検索
        const searchRes = await fetch(`/api/apps/${relatedAppCode}/records?pageSize=50&search=${encodeURIComponent(String(thisFieldValue))}`);
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          // キーフィールドの値でフィルタリング
          const matched = (searchData.records || []).filter((r: RelatedRecord) => {
            const val = String(r.data[relatedKeyField] ?? '');
            return val === String(thisFieldValue);
          });
          setRecords(matched);
        }
      } catch (err) {
        console.error('Related records fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [relatedAppCode, relatedKeyField, relatedThisField, thisFieldValue]);

  // 表示するフィールド
  const visibleFields = displayFieldCodes.length > 0
    ? remoteFields.filter(f => displayFieldCodes.includes(f.field_code))
    : remoteFields.slice(0, 5);

  if (!relatedAppCode || !relatedKeyField || !relatedThisField) {
    return null;
  }

  return (
    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        {label}
        <span className="text-xs font-normal text-gray-400">({records.length})</span>
      </h4>

      {loading ? (
        <div className="py-4 text-center">
          <Loader2 className="w-5 h-5 mx-auto animate-spin text-gray-400" />
        </div>
      ) : records.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-2">
          {lang === 'ja' ? '関連レコードがありません' : lang === 'th' ? 'ไม่มีระเบียนที่เกี่ยวข้อง' : 'No related records'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">#</th>
                {visibleFields.map(f => (
                  <th key={f.field_code} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    {f.label[lang] || f.label.ja || f.field_code}
                  </th>
                ))}
                <th className="px-3 py-2 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-3 py-2 text-xs text-gray-500">{r.record_number}</td>
                  {visibleFields.map(f => (
                    <td key={f.field_code} className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                      {String(r.data[f.field_code] ?? '-')}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <a
                      href={`/${locale}/apps/${relatedAppCode}/records/${r.id}`}
                      className="text-brand-500 hover:text-brand-600"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
