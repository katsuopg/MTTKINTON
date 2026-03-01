'use client';

import React, { useState, useEffect } from 'react';
import type { FieldDefinition } from '@/types/dynamic-app';

interface EntityItem {
  id: string;
  label: string;
  label_en?: string | null;
  label_th?: string | null;
  sub?: string;
}

interface EntityDisplayProps {
  field: FieldDefinition;
  value: unknown;
  locale: string;
}

const entityTypeMap: Record<string, 'user' | 'org' | 'role'> = {
  user_select: 'user',
  org_select: 'org',
  group_select: 'role',
};

export default function EntityDisplay({ field, value, locale }: EntityDisplayProps) {
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const allowMultiple = field.validation?.allow_multiple === true;
  const entityType = entityTypeMap[field.field_type] || 'user';

  const ids: string[] = allowMultiple
    ? (Array.isArray(value) ? value as string[] : [])
    : (value && typeof value === 'string' ? [value] : []);

  const [resolved, setResolved] = useState<Map<string, EntityItem>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ids.length === 0) return;
    const unresolvedIds = ids.filter(id => !resolved.has(id));
    if (unresolvedIds.length === 0) return;

    setLoading(true);
    const resolve = async () => {
      try {
        const res = await fetch(`/api/apps/entity-search?type=${entityType}&ids=${unresolvedIds.join(',')}`);
        if (res.ok) {
          const data = await res.json();
          setResolved(prev => {
            const next = new Map(prev);
            for (const item of data.items as EntityItem[]) {
              next.set(item.id, item);
            }
            return next;
          });
        }
      } catch { /* skip */ }
      setLoading(false);
    };
    resolve();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(','), entityType]);

  if (ids.length === 0) {
    return <p className="text-sm text-gray-800 dark:text-white/90">-</p>;
  }

  const getDisplayName = (item: EntityItem): string => {
    if (lang === 'th' && item.label_th) return item.label_th;
    if (lang === 'en' && item.label_en) return item.label_en;
    return item.label;
  };

  if (loading && resolved.size === 0) {
    return <p className="text-sm text-gray-400">...</p>;
  }

  const names = ids.map(id => {
    const item = resolved.get(id);
    return item ? getDisplayName(item) : id.slice(0, 8);
  });

  if (allowMultiple) {
    return (
      <div className="flex flex-wrap gap-1">
        {names.map((name, i) => (
          <span
            key={ids[i]}
            className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {name}
          </span>
        ))}
      </div>
    );
  }

  return <p className="text-sm text-gray-800 dark:text-white/90">{names[0]}</p>;
}
