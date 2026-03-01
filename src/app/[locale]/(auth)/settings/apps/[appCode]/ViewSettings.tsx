'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Table, Calendar, BarChart3 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { ViewType, ChartType, AggregationType } from '@/types/dynamic-app';

interface ViewSettingsProps {
  locale: string;
  appCode: string;
}

interface FieldInfo {
  field_code: string;
  field_type: string;
  label: { ja?: string; en?: string; th?: string };
}

interface ViewData {
  id?: string;
  name: string;
  view_type: ViewType;
  config: Record<string, unknown>;
  is_default: boolean;
}

const t = (locale: string, ja: string, th: string, en: string) =>
  locale === 'ja' ? ja : locale === 'th' ? th : en;

const VIEW_TYPE_OPTIONS: { value: ViewType; label: { ja: string; en: string; th: string }; icon: typeof Table }[] = [
  { value: 'table', label: { ja: 'テーブル', en: 'Table', th: 'ตาราง' }, icon: Table },
  { value: 'calendar', label: { ja: 'カレンダー', en: 'Calendar', th: 'ปฏิทิน' }, icon: Calendar },
  { value: 'chart', label: { ja: 'グラフ', en: 'Chart', th: 'กราฟ' }, icon: BarChart3 },
];

const CHART_TYPE_OPTIONS: { value: ChartType; label: { ja: string; en: string; th: string } }[] = [
  { value: 'bar', label: { ja: '棒グラフ', en: 'Bar Chart', th: 'กราฟแท่ง' } },
  { value: 'line', label: { ja: '折れ線グラフ', en: 'Line Chart', th: 'กราฟเส้น' } },
  { value: 'pie', label: { ja: '円グラフ', en: 'Pie Chart', th: 'กราฟวงกลม' } },
  { value: 'area', label: { ja: '面グラフ', en: 'Area Chart', th: 'กราฟพื้นที่' } },
];

const AGGREGATION_OPTIONS: { value: AggregationType; label: { ja: string; en: string; th: string } }[] = [
  { value: 'count', label: { ja: 'レコード数', en: 'Count', th: 'จำนวน' } },
  { value: 'sum', label: { ja: '合計', en: 'Sum', th: 'ผลรวม' } },
  { value: 'avg', label: { ja: '平均', en: 'Average', th: 'เฉลี่ย' } },
  { value: 'max', label: { ja: '最大値', en: 'Max', th: 'ค่าสูงสุด' } },
  { value: 'min', label: { ja: '最小値', en: 'Min', th: 'ค่าต่ำสุด' } },
];

export default function ViewSettings({ locale, appCode }: ViewSettingsProps) {
  const [views, setViews] = useState<ViewData[]>([]);
  const [fields, setFields] = useState<FieldInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [viewsRes, fieldsRes] = await Promise.all([
        fetch(`/api/apps/${appCode}/views`),
        fetch(`/api/apps/${appCode}/fields`),
      ]);
      if (viewsRes.ok) {
        const { views: v } = await viewsRes.json();
        setViews(v || []);
      }
      if (fieldsRes.ok) {
        const { fields: f } = await fieldsRes.json();
        setFields((f || []).filter((fd: FieldInfo) =>
          !['label', 'space', 'hr', 'file_upload', 'rich_editor'].includes(fd.field_type)
        ));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [appCode]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getFieldLabel = (fieldCode: string) => {
    const f = fields.find(fd => fd.field_code === fieldCode);
    if (!f) return fieldCode;
    return (f.label as Record<string, string>)[locale] || f.label.en || f.label.ja || fieldCode;
  };

  const dateFields = fields.filter(f => ['date', 'datetime', 'created_time', 'modified_time'].includes(f.field_type));
  const numericFields = fields.filter(f => f.field_type === 'number');
  const groupableFields = fields.filter(f => ['single_line_text', 'dropdown', 'radio_button', 'checkbox', 'multi_select'].includes(f.field_type));

  const addView = () => {
    const newView: ViewData = {
      name: t(locale, '新しいビュー', 'มุมมองใหม่', 'New View'),
      view_type: 'table',
      config: { columns: fields.slice(0, 5).map(f => f.field_code) },
      is_default: views.length === 0,
    };
    setViews([...views, newView]);
    setExpandedId('new-' + views.length);
  };

  const updateView = (index: number, updates: Partial<ViewData>) => {
    setViews(prev => prev.map((v, i) => i === index ? { ...v, ...updates } : v));
  };

  const removeView = async (index: number) => {
    const view = views[index];
    if (view.id) {
      await fetch(`/api/apps/${appCode}/views`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: view.id }),
      });
    }
    setViews(prev => prev.filter((_, i) => i !== index));
  };

  const saveView = async (index: number) => {
    setSaving(true);
    try {
      const view = views[index];
      const method = view.id ? 'PUT' : 'POST';
      const payload = view.id
        ? { id: view.id, name: view.name, view_type: view.view_type, config: view.config, is_default: view.is_default }
        : { name: view.name, view_type: view.view_type, config: view.config, is_default: view.is_default };

      const res = await fetch(`/api/apps/${appCode}/views`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const { view: saved } = await res.json();
        setViews(prev => prev.map((v, i) => i === index ? { ...v, id: saved.id } : v));
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const toggleColumn = (index: number, fieldCode: string) => {
    const view = views[index];
    const columns = ((view.config as Record<string, unknown>).columns as string[]) || [];
    const newColumns = columns.includes(fieldCode)
      ? columns.filter(c => c !== fieldCode)
      : [...columns, fieldCode];
    updateView(index, { config: { ...view.config, columns: newColumns } });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t(locale, 'ビュー管理', 'การจัดการมุมมอง', 'View Management')}
        </h3>
        <button
          onClick={addView}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm text-white hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          {t(locale, 'ビュー追加', 'เพิ่มมุมมอง', 'Add View')}
        </button>
      </div>

      {views.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t(locale, 'ビューが設定されていません。追加ボタンでビューを作成してください。', 'ยังไม่มีมุมมอง กรุณาเพิ่ม', 'No views configured. Click Add View to create one.')}
        </p>
      )}

      {views.map((view, idx) => {
        const viewId = view.id || `new-${idx}`;
        const isExpanded = expandedId === viewId;

        return (
          <div key={viewId} className="rounded-lg border border-gray-200 dark:border-gray-700">
            <div
              className="flex cursor-pointer items-center justify-between p-4"
              onClick={() => setExpandedId(isExpanded ? null : viewId)}
            >
              <div className="flex items-center gap-3">
                {view.view_type === 'table' && <Table className="h-4 w-4 text-gray-500" />}
                {view.view_type === 'calendar' && <Calendar className="h-4 w-4 text-blue-500" />}
                {view.view_type === 'chart' && <BarChart3 className="h-4 w-4 text-green-500" />}
                <span className="font-medium text-gray-900 dark:text-white">{view.name}</span>
                {view.is_default && (
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                    {t(locale, 'デフォルト', 'ค่าเริ่มต้น', 'Default')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); removeView(idx); }}
                  className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                <div className="space-y-4">
                  {/* ビュー名 */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t(locale, 'ビュー名', 'ชื่อมุมมอง', 'View Name')}
                    </label>
                    <input
                      type="text"
                      value={view.name}
                      onChange={(e) => updateView(idx, { name: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  {/* ビュー種類 */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t(locale, 'ビュー種類', 'ประเภทมุมมอง', 'View Type')}
                    </label>
                    <div className="flex gap-2">
                      {VIEW_TYPE_OPTIONS.map(opt => {
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => {
                              const defaultConfig = opt.value === 'table'
                                ? { columns: fields.slice(0, 5).map(f => f.field_code) }
                                : opt.value === 'calendar'
                                  ? { date_field: dateFields[0]?.field_code || '', title_field: '' }
                                  : { chart_type: 'bar', x_field: groupableFields[0]?.field_code || '', aggregation: 'count' };
                              updateView(idx, { view_type: opt.value, config: defaultConfig });
                            }}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                              view.view_type === opt.value
                                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                                : 'border-gray-300 text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {opt.label[locale as keyof typeof opt.label] || opt.label.en}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* デフォルト設定 */}
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={view.is_default}
                      onChange={(e) => updateView(idx, { is_default: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {t(locale, 'デフォルトビューにする', 'ตั้งเป็นมุมมองเริ่มต้น', 'Set as default view')}
                    </span>
                  </label>

                  {/* テーブルビュー設定 */}
                  {view.view_type === 'table' && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t(locale, '表示カラム', 'คอลัมน์ที่แสดง', 'Display Columns')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {fields.map(f => {
                          const cols = ((view.config as Record<string, unknown>).columns as string[]) || [];
                          const isSelected = cols.includes(f.field_code);
                          return (
                            <button
                              key={f.field_code}
                              onClick={() => toggleColumn(idx, f.field_code)}
                              className={`rounded-full border px-3 py-1 text-xs ${
                                isSelected
                                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                                  : 'border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {getFieldLabel(f.field_code)}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                            {t(locale, 'ソートフィールド', 'จัดเรียงตาม', 'Sort Field')}
                          </label>
                          <select
                            value={((view.config as Record<string, unknown>).sort_field as string) || ''}
                            onChange={(e) => updateView(idx, { config: { ...view.config, sort_field: e.target.value || undefined } })}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="">{t(locale, 'デフォルト', 'ค่าเริ่มต้น', 'Default')}</option>
                            {fields.map(f => (
                              <option key={f.field_code} value={f.field_code}>{getFieldLabel(f.field_code)}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                            {t(locale, 'ソート順', 'ลำดับ', 'Sort Order')}
                          </label>
                          <select
                            value={((view.config as Record<string, unknown>).sort_order as string) || 'desc'}
                            onChange={(e) => updateView(idx, { config: { ...view.config, sort_order: e.target.value } })}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="asc">{t(locale, '昇順', 'น้อยไปมาก', 'Ascending')}</option>
                            <option value="desc">{t(locale, '降順', 'มากไปน้อย', 'Descending')}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* カレンダービュー設定 */}
                  {view.view_type === 'calendar' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t(locale, '日付フィールド', 'ฟิลด์วันที่', 'Date Field')} *
                        </label>
                        <select
                          value={((view.config as Record<string, unknown>).date_field as string) || ''}
                          onChange={(e) => updateView(idx, { config: { ...view.config, date_field: e.target.value } })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="">{t(locale, '選択してください', 'กรุณาเลือก', 'Select...')}</option>
                          {dateFields.map(f => (
                            <option key={f.field_code} value={f.field_code}>{getFieldLabel(f.field_code)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t(locale, 'タイトルフィールド', 'ฟิลด์ชื่อ', 'Title Field')}
                        </label>
                        <select
                          value={((view.config as Record<string, unknown>).title_field as string) || ''}
                          onChange={(e) => updateView(idx, { config: { ...view.config, title_field: e.target.value || undefined } })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="">{t(locale, 'レコード番号', 'เลขที่ระเบียน', 'Record Number')}</option>
                          {fields.filter(f => ['single_line_text', 'number', 'dropdown'].includes(f.field_type)).map(f => (
                            <option key={f.field_code} value={f.field_code}>{getFieldLabel(f.field_code)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* グラフビュー設定 */}
                  {view.view_type === 'chart' && (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t(locale, 'グラフ種類', 'ประเภทกราฟ', 'Chart Type')}
                        </label>
                        <div className="flex gap-2">
                          {CHART_TYPE_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => updateView(idx, { config: { ...view.config, chart_type: opt.value } })}
                              className={`rounded-lg border px-3 py-1.5 text-sm ${
                                (view.config as Record<string, unknown>).chart_type === opt.value
                                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                                  : 'border-gray-300 text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300'
                              }`}
                            >
                              {opt.label[locale as keyof typeof opt.label] || opt.label.en}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t(locale, '分類（X軸）', 'แกน X', 'Category (X-axis)')} *
                          </label>
                          <select
                            value={((view.config as Record<string, unknown>).x_field as string) || ''}
                            onChange={(e) => updateView(idx, { config: { ...view.config, x_field: e.target.value } })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="">{t(locale, '選択してください', 'กรุณาเลือก', 'Select...')}</option>
                            {[...groupableFields, ...dateFields].map(f => (
                              <option key={f.field_code} value={f.field_code}>{getFieldLabel(f.field_code)}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t(locale, '集計方法', 'วิธีรวม', 'Aggregation')}
                          </label>
                          <select
                            value={((view.config as Record<string, unknown>).aggregation as string) || 'count'}
                            onChange={(e) => updateView(idx, { config: { ...view.config, aggregation: e.target.value } })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          >
                            {AGGREGATION_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label[locale as keyof typeof opt.label] || opt.label.en}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t(locale, '集計対象（数値）', 'ฟิลด์ตัวเลข', 'Value Field (numeric)')}
                          </label>
                          <select
                            value={((view.config as Record<string, unknown>).y_field as string) || ''}
                            onChange={(e) => updateView(idx, { config: { ...view.config, y_field: e.target.value || undefined } })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="">{t(locale, 'なし（レコード数）', 'ไม่มี (จำนวน)', 'None (count)')}</option>
                            {numericFields.map(f => (
                              <option key={f.field_code} value={f.field_code}>{getFieldLabel(f.field_code)}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t(locale, 'グループ化', 'จัดกลุ่ม', 'Group By')}
                          </label>
                          <select
                            value={((view.config as Record<string, unknown>).group_field as string) || ''}
                            onChange={(e) => updateView(idx, { config: { ...view.config, group_field: e.target.value || undefined } })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="">{t(locale, 'なし', 'ไม่มี', 'None')}</option>
                            {groupableFields.map(f => (
                              <option key={f.field_code} value={f.field_code}>{getFieldLabel(f.field_code)}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 保存ボタン */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => saveView(idx)}
                      disabled={saving}
                      className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600 disabled:opacity-50"
                    >
                      {saving
                        ? t(locale, '保存中...', 'กำลังบันทึก...', 'Saving...')
                        : t(locale, '保存', 'บันทึก', 'Save')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
