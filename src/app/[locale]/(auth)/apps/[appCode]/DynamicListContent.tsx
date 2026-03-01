'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { tableStyles } from '@/components/ui/TableStyles';
import { ListPageHeader } from '@/components/ui/ListPageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, ArrowUp, ArrowDown, Trash2, Loader2, Table, Calendar, BarChart3 } from 'lucide-react';
import { useNavPermissions } from '@/hooks/useNavPermissions';
import type { FieldDefinition, AppRecord, ViewDefinition, ViewType, ChartViewConfig, CalendarViewConfig } from '@/types/dynamic-app';
import { NON_INPUT_FIELD_TYPES, HIDDEN_IN_LIST_TYPES } from '@/types/dynamic-app';
import FieldDisplay from '@/components/dynamic-app/FieldDisplay';
import DynamicCalendarView from '@/components/dynamic-app/DynamicCalendarView';
import DynamicChartView from '@/components/dynamic-app/DynamicChartView';

interface DynamicListContentProps {
  locale: string;
  appCode: string;
  appName: string;
  fields: FieldDefinition[];
  enableBulkDelete?: boolean;
}

const VIEW_ICONS: Record<ViewType, typeof Table> = {
  table: Table,
  calendar: Calendar,
  chart: BarChart3,
};

export default function DynamicListContent({ locale, appCode, appName, fields, enableBulkDelete = true }: DynamicListContentProps) {
  const router = useRouter();
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const { canManageApp } = useNavPermissions();

  const [records, setRecords] = useState<AppRecord[]>([]);
  const [allRecords, setAllRecords] = useState<AppRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('record_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // ビュー管理
  const [views, setViews] = useState<ViewDefinition[]>([]);
  const [activeViewId, setActiveViewId] = useState<string>('default-table');

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // テーブルに表示するフィールド（file_upload, rich_editor, related_records等は除外）
  const defaultDisplayFields = fields.filter((f) => !NON_INPUT_FIELD_TYPES.has(f.field_type) && !HIDDEN_IN_LIST_TYPES.has(f.field_type)).slice(0, 6);

  const activeView = views.find(v => v.id === activeViewId);
  const activeViewType: ViewType = activeView?.view_type || 'table';

  // テーブルビューの表示カラム（ビュー設定があればそれを使用）
  const displayFields = (() => {
    if (activeView?.view_type === 'table' && activeView.config) {
      const cols = (activeView.config as { columns?: string[] }).columns;
      if (cols && cols.length > 0) {
        return cols
          .map(code => fields.find(f => f.field_code === code))
          .filter((f): f is FieldDefinition => !!f);
      }
    }
    return defaultDisplayFields;
  })();

  // ビュー一覧取得
  useEffect(() => {
    fetch(`/api/apps/${appCode}/views`)
      .then(res => res.ok ? res.json() : { views: [] })
      .then(data => {
        setViews(data.views || []);
        const def = (data.views || []).find((v: ViewDefinition) => v.is_default);
        if (def) setActiveViewId(def.id);
      })
      .catch(() => {});
  }, [appCode]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(pageSize),
        search,
        sortField,
        sortOrder,
      });
      const res = await fetch(`/api/apps/${appCode}/records?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch records:', err);
    } finally {
      setLoading(false);
    }
  }, [appCode, currentPage, search, sortField, sortOrder]);

  // カレンダー/グラフ用に全レコード取得
  const fetchAllRecords = useCallback(async () => {
    if (activeViewType === 'table') return;
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '500',
        search,
      });
      const res = await fetch(`/api/apps/${appCode}/records?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAllRecords(data.records || []);
      }
    } catch {
      // ignore
    }
  }, [appCode, activeViewType, search]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    fetchAllRecords();
  }, [fetchAllRecords]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage]);

  const handleRowClick = (recordId: string) => {
    router.push(`/${locale}/apps/${appCode}/records/${recordId}`);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 inline" />
      : <ArrowDown className="w-3 h-3 ml-1 inline" />;
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map((r) => r.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmMsg = lang === 'ja'
      ? `${selectedIds.size}件のレコードを削除しますか？`
      : lang === 'th'
      ? `ลบ ${selectedIds.size} รายการหรือไม่?`
      : `Delete ${selectedIds.size} records?`;
    if (!confirm(confirmMsg)) return;

    setBulkDeleting(true);
    try {
      const res = await fetch(`/api/apps/${appCode}/records/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (res.ok) {
        setSelectedIds(new Set());
        fetchRecords();
      }
    } catch (err) {
      console.error('Bulk delete failed:', err);
    } finally {
      setBulkDeleting(false);
    }
  };

  const fieldLabels: Record<string, string> = {};
  for (const f of fields) {
    fieldLabels[f.field_code] = f.label[lang] || f.label.ja || f.field_code;
  }

  const noDataText = lang === 'ja' ? 'データがありません' : lang === 'th' ? 'ไม่มีข้อมูล' : 'No data';
  const countLabel = lang === 'ja' ? '件' : lang === 'th' ? 'รายการ' : 'records';
  const addLabel = lang === 'ja' ? '新規追加' : lang === 'th' ? 'เพิ่มใหม่' : 'Add New';
  const searchPlaceholder = lang === 'ja' ? 'レコードを検索...' : lang === 'th' ? 'ค้นหาระเบียน...' : 'Search records...';
  const numberLabel = lang === 'ja' ? 'No.' : 'No.';
  const deleteSelectedLabel = lang === 'ja' ? '選択削除' : lang === 'th' ? 'ลบที่เลือก' : 'Delete Selected';
  const deletingLabel = lang === 'ja' ? '削除中...' : lang === 'th' ? 'กำลังลบ...' : 'Deleting...';

  const allSelected = records.length > 0 && selectedIds.size === records.length;

  // デフォルトテーブルビュー + カスタムビューのタブリスト
  const viewTabs = [
    { id: 'default-table', name: lang === 'ja' ? '一覧' : lang === 'th' ? 'ตาราง' : 'Table', view_type: 'table' as ViewType },
    ...views.map(v => ({ id: v.id, name: v.name, view_type: v.view_type })),
  ];

  return (
    <div className={tableStyles.contentWrapper}>
      <div className={tableStyles.tableContainer}>
        <ListPageHeader
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={searchPlaceholder}
          totalCount={total}
          countLabel={countLabel}
          settingsHref={canManageApp(appCode) ? `/${locale}/apps/${appCode}/settings/form` : undefined}
          exportHref={`/api/apps/${appCode}/records/export`}
          exportLabel={lang === 'ja' ? 'CSVエクスポート' : lang === 'th' ? 'ส่งออก CSV' : 'Export CSV'}
          addButton={{
            label: addLabel,
            onClick: () => router.push(`/${locale}/apps/${appCode}/records/new`),
            icon: <Plus className="w-4 h-4" />,
          }}
        />

        {/* ビュータブ（複数ビューがある場合のみ表示） */}
        {views.length > 0 && (
          <div className="flex items-center gap-1 border-b border-gray-200 px-4 dark:border-gray-700">
            {viewTabs.map(tab => {
              const Icon = VIEW_ICONS[tab.view_type];
              const isActive = activeViewId === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveViewId(tab.id)}
                  className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        )}

        {/* 一括削除バー */}
        {enableBulkDelete && activeViewType === 'table' && selectedIds.size > 0 && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center gap-3">
            <span className="text-sm text-red-700 dark:text-red-300">
              {selectedIds.size}{lang === 'ja' ? '件選択中' : lang === 'th' ? ' รายการที่เลือก' : ' selected'}
            </span>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
            >
              {bulkDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              {bulkDeleting ? deletingLabel : deleteSelectedLabel}
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* テーブルビュー */}
            {activeViewType === 'table' && (
              <>
                {/* デスクトップテーブル */}
                <div className={tableStyles.desktopOnly}>
                  <div className="overflow-x-auto">
                    <table className={tableStyles.table}>
                      <thead className={tableStyles.thead}>
                        <tr>
                          {enableBulkDelete && (
                            <th className={`${tableStyles.th} w-10`}>
                              <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={toggleSelectAll}
                                className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                              />
                            </th>
                          )}
                          <th
                            className={`${tableStyles.th} cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800`}
                            onClick={() => handleSort('record_number')}
                          >
                            {numberLabel}<SortIcon field="record_number" />
                          </th>
                          {displayFields.map((field) => (
                            <th key={field.id} className={tableStyles.th}>
                              {field.label[lang] || field.label.ja || field.field_code}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className={tableStyles.tbody}>
                        {records.length === 0 ? (
                          <tr>
                            <td colSpan={displayFields.length + (enableBulkDelete ? 2 : 1)} className={tableStyles.emptyRow}>
                              {noDataText}
                            </td>
                          </tr>
                        ) : (
                          records.map((record) => (
                            <tr
                              key={record.id}
                              className={`${tableStyles.trClickable} ${selectedIds.has(record.id) ? 'bg-brand-50 dark:bg-brand-900/10' : ''}`}
                              onClick={() => handleRowClick(record.id)}
                            >
                              {enableBulkDelete && (
                                <td className={`${tableStyles.td} w-10`} onClick={(e) => toggleSelect(record.id, e)}>
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.has(record.id)}
                                    onChange={() => {}}
                                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                                  />
                                </td>
                              )}
                              <td className={`${tableStyles.td} ${tableStyles.tdPrimary}`}>
                                {record.record_number}
                              </td>
                              {displayFields.map((field) => (
                                <td key={field.id} className={tableStyles.td}>
                                  <FieldDisplay
                                    field={field}
                                    value={record.data[field.field_code]}
                                    locale={locale}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* モバイルカードビュー */}
                <div className={tableStyles.mobileCardList}>
                  {records.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      {noDataText}
                    </div>
                  ) : (
                    records.map((record) => {
                      const firstField = displayFields[0];
                      const titleValue = firstField ? String(record.data[firstField.field_code] || '') : '';
                      return (
                        <div
                          key={record.id}
                          className={tableStyles.mobileCard}
                          onClick={() => handleRowClick(record.id)}
                        >
                          <div className={tableStyles.mobileCardHeader}>
                            <span className={tableStyles.mobileCardTitle}>
                              #{record.record_number} {titleValue}
                            </span>
                          </div>
                          <div className={tableStyles.mobileCardFields}>
                            {displayFields.slice(1, 4).map((field) => (
                              <div key={field.id}>
                                <span className={tableStyles.mobileCardFieldLabel}>
                                  {field.label[lang] || field.label.ja || field.field_code}:
                                </span>{' '}
                                <span className={tableStyles.mobileCardFieldValue}>
                                  {String(record.data[field.field_code] ?? '-')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {/* カレンダービュー */}
            {activeViewType === 'calendar' && activeView && (() => {
              const cfg = activeView.config as unknown as CalendarViewConfig;
              return (
                <div className="p-4">
                  <DynamicCalendarView
                    records={allRecords as unknown as { id: string; record_number: number; data: Record<string, unknown> }[]}
                    dateField={cfg.date_field || ''}
                    titleField={cfg.title_field}
                    locale={locale}
                    onRecordClick={handleRowClick}
                  />
                </div>
              );
            })()}

            {/* グラフビュー */}
            {activeViewType === 'chart' && activeView && (() => {
              const cfg = activeView.config as unknown as ChartViewConfig;
              return (
                <div className="p-4">
                  <DynamicChartView
                    records={allRecords as unknown as { data: Record<string, unknown> }[]}
                    chartType={cfg.chart_type || 'bar'}
                    xField={cfg.x_field || ''}
                    yField={cfg.y_field}
                    groupField={cfg.group_field}
                    aggregation={cfg.aggregation || 'count'}
                    locale={locale}
                    fieldLabels={fieldLabels}
                  />
                </div>
              );
            })()}
          </>
        )}

        {activeViewType === 'table' && total > pageSize && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
