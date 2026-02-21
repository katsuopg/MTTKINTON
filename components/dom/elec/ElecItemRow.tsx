'use client';

import React from 'react';
import EditableCell from '../shared/EditableCell';
import StatusBadge from '../shared/StatusBadge';
import type { DomElecItem, DomItemStatus, DomItemCategory } from '@/types/dom';

type Language = 'ja' | 'en' | 'th';

interface ElecItemRowProps {
  item: Partial<DomElecItem>;
  index: number;
  isNew?: boolean;
  language: Language;
  readOnly?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onChange: (field: string, value: string | number | null) => void;
}

// 日本語単位→英語表示マップ（en/thで使用）
const UNIT_EN_MAP: Record<string, string> = {
  '個': 'pcs',
  '本': 'pcs',
  '台': 'unit',
  'セット': 'set',
  '式': 'set',
  '枚': 'pcs',
  '組': 'set',
  '巻': 'roll',
};

function translateUnit(unit: string, language: Language): string {
  if (language === 'ja') return unit;
  return UNIT_EN_MAP[unit] || unit;
}

const CATEGORY_OPTIONS: { value: DomItemCategory; labels: Record<Language, string> }[] = [
  { value: 'make', labels: { ja: '製作品', en: 'Make', th: 'ผลิต' } },
  { value: 'buy', labels: { ja: '購入品', en: 'Buy', th: 'ซื้อ' } },
];

const STATUS_OPTIONS: DomItemStatus[] = [
  'designing', 'on_hold', 'quote_requesting', 'quote_done',
  'order_requesting', 'ordering', 'delivered',
];

const STATUS_LABELS: Record<DomItemStatus, Record<Language, string>> = {
  designing: { ja: '設計中', en: 'Designing', th: 'ออกแบบ' },
  on_hold: { ja: '保留', en: 'Hold', th: 'ระงับ' },
  quote_requesting: { ja: '見積依頼中', en: 'Quoting', th: 'ขอราคา' },
  quote_done: { ja: '見積完了', en: 'Quoted', th: 'เสนอราคาแล้ว' },
  order_requesting: { ja: '手配依頼', en: 'Order Req', th: 'ขอสั่ง' },
  ordering: { ja: '手配中', en: 'Ordering', th: 'สั่งซื้อ' },
  delivered: { ja: '入荷済', en: 'Delivered', th: 'ได้รับ' },
};

export default function ElecItemRow({
  item,
  index,
  isNew = false,
  language,
  readOnly = false,
  selected = false,
  onToggleSelect,
  onChange,
}: ElecItemRowProps) {
  const amount = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
  const categoryLabel = CATEGORY_OPTIONS.find((o) => o.value === item.category)?.labels[language] || '';

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="px-1 py-1 w-8">
        {!readOnly && !isNew && onToggleSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="rounded border-gray-300 dark:border-gray-600"
          />
        )}
      </td>

      {/* No */}
      <td className="px-1 py-1 w-8 text-center text-sm text-gray-500">
        {index + 1}
      </td>

      {/* 区分 */}
      <td className="px-1 py-1 w-10 text-center">
        {readOnly ? (
          <span className="block py-1 text-sm text-center text-gray-800 dark:text-gray-200">{categoryLabel}</span>
        ) : (
          <select
            value={item.category || 'buy'}
            onChange={(e) => onChange('category', e.target.value)}
            className="w-full py-1 text-sm text-center border-0 bg-transparent focus:ring-1 focus:ring-brand-500 dark:text-white"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.labels[language]}</option>
            ))}
          </select>
        )}
      </td>

      {/* MARK */}
      <td className="px-1 py-1 w-20">
        <EditableCell
          value={item.mark ?? null}
          onChange={(v) => onChange('mark', v)}
          placeholder="MARK"
          readOnly={readOnly}
        />
      </td>

      {/* 品名 */}
      <td className="px-1 py-1">
        <EditableCell
          value={item.part_name ?? null}
          onChange={(v) => onChange('part_name', v)}
          placeholder={language === 'ja' ? '品名' : 'Name'}
          readOnly={readOnly}
        />
      </td>

      {/* 型式 */}
      <td className="px-1 py-1">
        <EditableCell
          value={item.model_number ?? null}
          onChange={(v) => onChange('model_number', v)}
          placeholder={language === 'ja' ? '型式' : 'Model'}
          readOnly={readOnly}
        />
      </td>

      {/* メーカー */}
      <td className="px-1 py-1 w-24">
        <EditableCell
          value={item.manufacturer ?? null}
          onChange={(v) => onChange('manufacturer', v)}
          placeholder={language === 'ja' ? 'メーカー' : 'Maker'}
          readOnly={readOnly}
        />
      </td>

      {/* 数量 */}
      <td className="px-1 py-1 w-12">
        <EditableCell
          value={item.quantity ?? 1}
          onChange={(v) => onChange('quantity', v)}
          type="number"
          align="center"
          readOnly={readOnly}
        />
      </td>

      {/* 単位 */}
      <td className="px-1 py-1 w-10">
        <EditableCell
          value={readOnly ? translateUnit(item.unit ?? '個', language) : (item.unit ?? '個')}
          onChange={(v) => onChange('unit', v)}
          readOnly={readOnly}
        />
      </td>

      {/* 単価 */}
      <td className="px-1 py-1 w-20">
        <EditableCell
          value={item.unit_price ?? null}
          onChange={(v) => onChange('unit_price', v)}
          type="number"
          align="right"
          readOnly={readOnly}
        />
      </td>

      {/* 金額 */}
      <td className="px-1 py-1 w-20 text-right text-sm text-gray-700 dark:text-gray-300">
        {amount.toLocaleString()}
      </td>

      {/* LT(日) */}
      <td className="px-1 py-1 w-12">
        <EditableCell
          value={item.lead_time_days ?? null}
          onChange={(v) => onChange('lead_time_days', v)}
          type="number"
          placeholder={language === 'ja' ? '日' : 'd'}
          readOnly={readOnly}
        />
      </td>

      {/* ステータス */}
      <td className="px-1 py-1 w-24">
        {readOnly ? (
          <StatusBadge status={(item.status as DomItemStatus) || 'designing'} language={language} />
        ) : (
          <select
            value={item.status || 'designing'}
            onChange={(e) => onChange('status', e.target.value)}
            className="w-full py-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-brand-500 dark:text-white"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s][language]}</option>
            ))}
          </select>
        )}
      </td>

      {/* 備考 */}
      <td className="px-1 py-1 w-24">
        <EditableCell
          value={item.notes ?? null}
          onChange={(v) => onChange('notes', v)}
          placeholder={language === 'ja' ? '備考' : 'Notes'}
          readOnly={readOnly}
        />
      </td>
    </tr>
  );
}
