'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { tableStyles } from '@/components/ui/TableStyles';
import { AppListToolbar } from '@/components/ui/AppListToolbar';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, ArrowUp, ArrowDown, ArrowUpDown, Trash2, Loader2, Table, Calendar, BarChart3, Filter, X, ChevronRight, ChevronDown, FolderTree, Paintbrush, Trash } from 'lucide-react';
import { useNavPermissions } from '@/hooks/useNavPermissions';
import type { FieldDefinition, AppRecord, ViewDefinition, ViewType, ChartViewConfig, CalendarViewConfig, FilterCondition, FilterMatchType, TableViewConfig, ConditionalFormatRule } from '@/types/dynamic-app';
import { NON_INPUT_FIELD_TYPES, HIDDEN_IN_LIST_TYPES } from '@/types/dynamic-app';
import FieldDisplay from '@/components/dynamic-app/FieldDisplay';
import InlineEditCell from '@/components/dynamic-app/InlineEditCell';
import DynamicCalendarView from '@/components/dynamic-app/DynamicCalendarView';
import DynamicChartView from '@/components/dynamic-app/DynamicChartView';
import FilterConditionBuilder from '@/components/dynamic-app/FilterConditionBuilder';

interface CategoryNode {
  id: string;
  name: string;
  parent_id: string | null;
  display_order: number;
  children: CategoryNode[];
}

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
  const [sortFields, setSortFields] = useState<{field: string; order: 'asc' | 'desc'}[]>([
    { field: 'record_number', order: 'desc' }
  ]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // カテゴリ管理
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // ビュー管理
  const [views, setViews] = useState<ViewDefinition[]>([]);
  const [activeViewId, setActiveViewId] = useState<string>('default-table');

  // ソートパネル
  const [showSortPanel, setShowSortPanel] = useState(false);

  // アドホックフィルター
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [adHocFilters, setAdHocFilters] = useState<FilterCondition[]>([]);
  const [adHocFilterMatchType, setAdHocFilterMatchType] = useState<FilterMatchType>('and');

  // カラム幅管理
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const resizingRef = useRef<{ field: string; startX: number; startWidth: number } | null>(null);
  const columnWidthSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 条件付き書式
  const [conditionalFormatRules, setConditionalFormatRules] = useState<ConditionalFormatRule[]>([]);
  const [showFormatPanel, setShowFormatPanel] = useState(false);

  const [pageSize, setPageSize] = useState(20);
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

  // ビュー切替時にビュー設定を反映
  const applyViewSettings = useCallback((view: ViewDefinition | undefined) => {
    if (!view) {
      // デフォルトテーブルに戻す
      setSortFields([{ field: 'record_number', order: 'desc' }]);
      setColumnWidths({});
      setConditionalFormatRules([]);
      return;
    }
    const cfg = view.config as unknown as Record<string, unknown>;
    // sort_fields（マルチソート）があればそちらを優先
    if (cfg.sort_fields && Array.isArray(cfg.sort_fields) && (cfg.sort_fields as {field: string; order: 'asc'|'desc'}[]).length > 0) {
      setSortFields(cfg.sort_fields as {field: string; order: 'asc'|'desc'}[]);
    } else if (cfg.sort_field) {
      // 後方互換: 単一ソート
      setSortFields([{ field: cfg.sort_field as string, order: (cfg.sort_order as 'asc' | 'desc') || 'desc' }]);
    }
    if (cfg.page_size) setPageSize(Math.min(100, Math.max(1, cfg.page_size as number)));
    // カラム幅を復元
    if (cfg.column_widths && typeof cfg.column_widths === 'object') {
      setColumnWidths(cfg.column_widths as Record<string, number>);
    } else {
      setColumnWidths({});
    }
    // 条件付き書式を復元
    if (cfg.conditional_format_rules && Array.isArray(cfg.conditional_format_rules)) {
      setConditionalFormatRules(cfg.conditional_format_rules as ConditionalFormatRule[]);
    } else {
      setConditionalFormatRules([]);
    }
    setCurrentPage(1);
  }, []);

  // カテゴリ取得
  useEffect(() => {
    fetch(`/api/apps/${appCode}/categories`)
      .then(res => res.ok ? res.json() : { categories: [] })
      .then(data => {
        setCategories(data.categories || []);
        // 最初はすべてのトップレベルを展開
        const topIds = new Set<string>((data.categories || []).map((c: CategoryNode) => c.id));
        setExpandedCategories(topIds);
      })
      .catch(() => {});
  }, [appCode]);

  // カテゴリ展開/折りたたみ
  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  // カテゴリ選択
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1);
  };

  // ビュー一覧取得
  useEffect(() => {
    fetch(`/api/apps/${appCode}/views`)
      .then(res => res.ok ? res.json() : { views: [] })
      .then(data => {
        setViews(data.views || []);
        const def = (data.views || []).find((v: ViewDefinition) => v.is_default);
        if (def) {
          setActiveViewId(def.id);
          applyViewSettings(def);
        }
      })
      .catch(() => {});
  }, [appCode, applyViewSettings]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const effectiveSortFields = sortFields.length > 0 ? sortFields : [{ field: 'record_number', order: 'desc' as const }];
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(pageSize),
        search,
        sortFields: JSON.stringify(effectiveSortFields),
      });
      // ビューID送信
      if (activeViewId && activeViewId !== 'default-table') {
        params.set('viewId', activeViewId);
      }
      // カテゴリフィルター
      if (selectedCategoryId) {
        params.set('categoryId', selectedCategoryId);
      }
      // アドホックフィルター
      const validFilters = adHocFilters.filter(f => f.field_code && f.operator);
      if (validFilters.length > 0) {
        params.set('filters', JSON.stringify(validFilters));
        params.set('filterMatchType', adHocFilterMatchType);
      }
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
  }, [appCode, currentPage, pageSize, search, sortFields, activeViewId, adHocFilters, adHocFilterMatchType, selectedCategoryId]);

  // カレンダー/グラフ用に全レコード取得
  const fetchAllRecords = useCallback(async () => {
    if (activeViewType === 'table') return;
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '500',
        search,
      });
      if (activeViewId && activeViewId !== 'default-table') {
        params.set('viewId', activeViewId);
      }
      if (selectedCategoryId) {
        params.set('categoryId', selectedCategoryId);
      }
      const validFilters = adHocFilters.filter(f => f.field_code && f.operator);
      if (validFilters.length > 0) {
        params.set('filters', JSON.stringify(validFilters));
        params.set('filterMatchType', adHocFilterMatchType);
      }
      const res = await fetch(`/api/apps/${appCode}/records?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAllRecords(data.records || []);
      }
    } catch {
      // ignore
    }
  }, [appCode, activeViewType, search, activeViewId, adHocFilters, adHocFilterMatchType, selectedCategoryId]);

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
    const first = sortFields[0];
    if (first && first.field === field) {
      // 同じフィールド: 昇順/降順トグル
      setSortFields(prev => [
        { field, order: (prev[0].order === 'asc' ? 'desc' : 'asc') as 'asc' | 'desc' },
        ...prev.slice(1),
      ]);
    } else {
      // 新しいフィールド: 1番目に設定、残りは維持
      setSortFields(prev => {
        const next: {field: string; order: 'asc' | 'desc'}[] = [
          { field, order: 'asc' },
          ...prev.filter(s => s.field !== field),
        ];
        return next.slice(0, 5);
      });
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    const entry = sortFields.find(s => s.field === field);
    if (!entry) return null;
    const idx = sortFields.indexOf(entry);
    return (
      <span className="inline-flex items-center ml-1">
        {entry.order === 'asc'
          ? <ArrowUp className="w-3 h-3 inline" />
          : <ArrowDown className="w-3 h-3 inline" />}
        {sortFields.length > 1 && (
          <span className="text-[9px] text-gray-400 dark:text-gray-500 ml-0.5">{idx + 1}</span>
        )}
      </span>
    );
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

  // ========== カラム幅リサイズ ==========
  const saveColumnWidthsToView = useCallback((widths: Record<string, number>) => {
    if (!activeView || activeViewId === 'default-table') return;
    if (columnWidthSaveTimerRef.current) clearTimeout(columnWidthSaveTimerRef.current);
    columnWidthSaveTimerRef.current = setTimeout(() => {
      const updatedConfig = { ...(activeView.config as TableViewConfig), column_widths: widths };
      fetch(`/api/apps/${appCode}/views`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeView.id, config: updatedConfig }),
      }).catch(() => {});
    }, 500);
  }, [activeView, activeViewId, appCode]);

  const handleResizeStart = useCallback((field: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const th = (e.target as HTMLElement).parentElement;
    const startWidth = th ? th.getBoundingClientRect().width : 150;
    resizingRef.current = { field, startX: e.clientX, startWidth };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const diff = ev.clientX - resizingRef.current.startX;
      const newWidth = Math.min(500, Math.max(80, resizingRef.current.startWidth + diff));
      setColumnWidths(prev => {
        const updated = { ...prev, [resizingRef.current!.field]: newWidth };
        return updated;
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (resizingRef.current) {
        // 保存
        setColumnWidths(prev => {
          saveColumnWidthsToView(prev);
          return prev;
        });
      }
      resizingRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [saveColumnWidthsToView]);

  // ========== 条件付き書式の評価 ==========
  const evaluateConditionalFormat = useCallback((record: AppRecord): { backgroundColor?: string; textColor?: string } => {
    if (conditionalFormatRules.length === 0) return {};
    for (const rule of conditionalFormatRules) {
      const rawValue = rule.field_code === 'record_number'
        ? record.record_number
        : record.data[rule.field_code];
      const cellStr = rawValue != null ? String(rawValue) : '';
      const ruleVal = rule.value ?? '';
      let matched = false;

      switch (rule.operator) {
        case 'eq': matched = cellStr === ruleVal; break;
        case 'neq': matched = cellStr !== ruleVal; break;
        case 'gt': matched = Number(cellStr) > Number(ruleVal); break;
        case 'gte': matched = Number(cellStr) >= Number(ruleVal); break;
        case 'lt': matched = Number(cellStr) < Number(ruleVal); break;
        case 'lte': matched = Number(cellStr) <= Number(ruleVal); break;
        case 'contains': matched = cellStr.includes(ruleVal); break;
        case 'not_contains': matched = !cellStr.includes(ruleVal); break;
        case 'empty': matched = cellStr === '' || rawValue == null; break;
        case 'not_empty': matched = cellStr !== '' && rawValue != null; break;
      }
      if (matched) {
        return {
          backgroundColor: rule.row_bg_color || undefined,
          textColor: rule.cell_text_color || undefined,
        };
      }
    }
    return {};
  }, [conditionalFormatRules]);

  // ========== 条件付き書式ルールの保存 ==========
  const saveConditionalFormatRules = useCallback((rules: ConditionalFormatRule[]) => {
    setConditionalFormatRules(rules);
    if (!activeView || activeViewId === 'default-table') return;
    const updatedConfig = { ...(activeView.config as TableViewConfig), conditional_format_rules: rules };
    fetch(`/api/apps/${appCode}/views`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: activeView.id, config: updatedConfig }),
    }).catch(() => {});
  }, [activeView, activeViewId, appCode]);

  const addFormatRule = useCallback(() => {
    const newRule: ConditionalFormatRule = {
      id: crypto.randomUUID(),
      field_code: displayFields[0]?.field_code || 'record_number',
      operator: 'eq',
      value: '',
      row_bg_color: '#FEF3C7',
    };
    saveConditionalFormatRules([...conditionalFormatRules, newRule]);
  }, [conditionalFormatRules, displayFields, saveConditionalFormatRules]);

  const updateFormatRule = useCallback((id: string, updates: Partial<ConditionalFormatRule>) => {
    const updated = conditionalFormatRules.map(r => r.id === id ? { ...r, ...updates } : r);
    saveConditionalFormatRules(updated);
  }, [conditionalFormatRules, saveConditionalFormatRules]);

  const removeFormatRule = useCallback((id: string) => {
    saveConditionalFormatRules(conditionalFormatRules.filter(r => r.id !== id));
  }, [conditionalFormatRules, saveConditionalFormatRules]);

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
  const filterLabel = lang === 'ja' ? '絞り込み' : lang === 'th' ? 'กรอง' : 'Filter';
  const sortLabel = lang === 'ja' ? 'ソート' : lang === 'th' ? 'เรียงลำดับ' : 'Sort';
  const addSortLabel = lang === 'ja' ? 'ソート追加' : lang === 'th' ? 'เพิ่มการเรียง' : 'Add Sort';
  const ascLabel = lang === 'ja' ? '昇順' : lang === 'th' ? 'น้อยไปมาก' : 'Ascending';
  const descLabel = lang === 'ja' ? '降順' : lang === 'th' ? 'มากไปน้อย' : 'Descending';
  const clearAllLabel = lang === 'ja' ? 'すべてクリア' : lang === 'th' ? 'ล้างทั้งหมด' : 'Clear All';
  const activeFilterCount = adHocFilters.filter(f => f.field_code && f.operator).length;
  const activeSortCount = sortFields.length;

  const allCategoryLabel = lang === 'ja' ? 'すべて' : lang === 'th' ? 'ทั้งหมด' : 'All';
  const categoryLabel = lang === 'ja' ? 'カテゴリ' : lang === 'th' ? 'หมวดหมู่' : 'Categories';
  const conditionalFormatLabel = lang === 'ja' ? '条件付き書式' : lang === 'th' ? 'การจัดรูปแบบตามเงื่อนไข' : 'Conditional Format';
  const addRuleLabel = lang === 'ja' ? 'ルール追加' : lang === 'th' ? 'เพิ่มกฎ' : 'Add Rule';
  const fieldSelectLabel = lang === 'ja' ? 'フィールド' : lang === 'th' ? 'ฟิลด์' : 'Field';
  const conditionLabel = lang === 'ja' ? '条件' : lang === 'th' ? 'เงื่อนไข' : 'Condition';
  const valueLabel = lang === 'ja' ? '値' : lang === 'th' ? 'ค่า' : 'Value';
  const bgColorLabel = lang === 'ja' ? '背景色' : lang === 'th' ? 'สีพื้นหลัง' : 'Background';

  const OPERATOR_LABELS: Record<string, Record<string, string>> = {
    eq: { ja: '=', en: '=', th: '=' },
    neq: { ja: '!=', en: '!=', th: '!=' },
    gt: { ja: '>', en: '>', th: '>' },
    gte: { ja: '>=', en: '>=', th: '>=' },
    lt: { ja: '<', en: '<', th: '<' },
    lte: { ja: '<=', en: '<=', th: '<=' },
    contains: { ja: '含む', en: 'Contains', th: 'มี' },
    not_contains: { ja: '含まない', en: 'Not contains', th: 'ไม่มี' },
    empty: { ja: '空', en: 'Empty', th: 'ว่าง' },
    not_empty: { ja: '空でない', en: 'Not empty', th: 'ไม่ว่าง' },
  };
  const NO_VALUE_FORMAT_OPS = new Set(['empty', 'not_empty']);

  const allSelected = records.length > 0 && selectedIds.size === records.length;
  const hasCategories = categories.length > 0;

  // カテゴリツリーレンダリング（再帰）
  const renderCategoryTree = (nodes: CategoryNode[], depth: number = 0): React.ReactNode => {
    return nodes.map(node => {
      const isExpanded = expandedCategories.has(node.id);
      const isSelected = selectedCategoryId === node.id;
      const hasChildren = node.children && node.children.length > 0;

      return (
        <div key={node.id}>
          <button
            type="button"
            onClick={() => handleCategorySelect(node.id)}
            className={`flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
              isSelected
                ? 'bg-brand-50 text-brand-600 font-medium dark:bg-brand-900/20 dark:text-brand-400'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
            }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {hasChildren ? (
              <span
                className="flex-shrink-0 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategoryExpand(node.id);
                }}
              >
                {isExpanded
                  ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                }
              </span>
            ) : (
              <span className="w-3.5 flex-shrink-0" />
            )}
            <span className="truncate">{node.name}</span>
          </button>
          {hasChildren && isExpanded && depth < 2 && (
            <div>{renderCategoryTree(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  // デフォルトテーブルビュー + カスタムビューのタブリスト
  const viewTabs = [
    { id: 'default-table', name: lang === 'ja' ? '一覧' : lang === 'th' ? 'ตาราง' : 'Table', view_type: 'table' as ViewType },
    ...views.map(v => ({ id: v.id, name: v.name, view_type: v.view_type })),
  ];

  return (
    <div className={tableStyles.contentWrapper}>
      <div className={hasCategories ? 'flex gap-0' : ''}>
        {/* カテゴリツリーサイドバー */}
        {hasCategories && (
          <div className="hidden md:block w-[200px] flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-l-xl overflow-hidden">
            <div className="px-3 py-3">
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <FolderTree className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {categoryLabel}
                </span>
              </div>
              {/* すべて */}
              <button
                type="button"
                onClick={() => handleCategorySelect(null)}
                className={`flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-left text-xs transition-colors mb-0.5 ${
                  selectedCategoryId === null
                    ? 'bg-brand-50 text-brand-600 font-medium dark:bg-brand-900/20 dark:text-brand-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
              >
                <span className="w-3.5 flex-shrink-0" />
                <span>{allCategoryLabel}</span>
              </button>
              {/* カテゴリツリー */}
              {renderCategoryTree(categories)}
            </div>
          </div>
        )}
      <div className={`${tableStyles.tableContainer} ${hasCategories ? 'flex-1 min-w-0 rounded-l-none' : ''}`}>
        <AppListToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={searchPlaceholder}
          totalCount={total}
          countLabel={countLabel}
          settingsHref={canManageApp(appCode) ? `/${locale}/apps/${appCode}/settings/form` : undefined}
          addButton={{
            label: addLabel,
            onClick: () => router.push(`/${locale}/apps/${appCode}/records/new`),
            icon: <Plus className="w-4 h-4" />,
          }}
          inlineFilters={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilterPanel((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  activeFilterCount > 0
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                {filterLabel}
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowSortPanel((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  activeSortCount > 1
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400'
                }`}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {sortLabel}
                {activeSortCount > 1 && (
                  <span className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] text-white">
                    {activeSortCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowFormatPanel((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  conditionalFormatRules.length > 0
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400'
                }`}
              >
                <Paintbrush className="h-3.5 w-3.5" />
                {conditionalFormatLabel}
                {conditionalFormatRules.length > 0 && (
                  <span className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] text-white">
                    {conditionalFormatRules.length}
                  </span>
                )}
              </button>
            </div>
          }
          moreMenu={{
            pageSize: { current: pageSize, options: [20, 40, 60, 80, 100], onChange: (size) => { setPageSize(size); setCurrentPage(1); } },
            exportCsv: {
              href: `/api/apps/${appCode}/records/export${activeFilterCount > 0 ? `?filters=${encodeURIComponent(JSON.stringify(adHocFilters.filter(f => f.field_code && f.operator)))}&filterMatchType=${adHocFilterMatchType}` : ''}${activeViewId !== 'default-table' ? `${activeFilterCount > 0 ? '&' : '?'}viewId=${activeViewId}` : ''}`,
              label: lang === 'ja' ? 'CSVエクスポート' : lang === 'th' ? 'ส่งออก CSV' : 'Export CSV',
            },
          }}
          locale={locale}
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
                  onClick={() => {
                    setActiveViewId(tab.id);
                    applyViewSettings(views.find(v => v.id === tab.id));
                  }}
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

        {/* アドホックフィルターパネル */}
        {showFilterPanel && (
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {filterLabel}
              </span>
              <div className="flex items-center gap-2">
                {adHocFilters.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setAdHocFilters([]); setCurrentPage(1); }}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    {lang === 'ja' ? 'すべてクリア' : lang === 'th' ? 'ล้างทั้งหมด' : 'Clear All'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFilterPanel(false)}
                  className="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <FilterConditionBuilder
              fields={fields}
              conditions={adHocFilters}
              matchType={adHocFilterMatchType}
              onConditionsChange={(conds) => { setAdHocFilters(conds); setCurrentPage(1); }}
              onMatchTypeChange={setAdHocFilterMatchType}
              locale={locale}
              compact
            />
          </div>
        )}

        {/* ソートパネル */}
        {showSortPanel && (
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {sortLabel}
              </span>
              <div className="flex items-center gap-2">
                {sortFields.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setSortFields([]); setCurrentPage(1); }}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    {clearAllLabel}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowSortPanel(false)}
                  className="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {sortFields.map((sf, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={sf.field}
                    onChange={(e) => {
                      setSortFields(prev => prev.map((s, i) => i === idx ? { ...s, field: e.target.value } : s));
                      setCurrentPage(1);
                    }}
                    className="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  >
                    <option value="record_number">{numberLabel}</option>
                    {fields
                      .filter(f => !NON_INPUT_FIELD_TYPES.has(f.field_type) && !HIDDEN_IN_LIST_TYPES.has(f.field_type))
                      .map(f => (
                        <option key={f.field_code} value={f.field_code}>
                          {f.label[lang] || f.label.ja || f.field_code}
                        </option>
                      ))}
                  </select>
                  <select
                    value={sf.order}
                    onChange={(e) => {
                      setSortFields(prev => prev.map((s, i) => i === idx ? { ...s, order: e.target.value as 'asc' | 'desc' } : s));
                      setCurrentPage(1);
                    }}
                    className="w-28 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  >
                    <option value="asc">{ascLabel}</option>
                    <option value="desc">{descLabel}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setSortFields(prev => prev.filter((_, i) => i !== idx));
                      setCurrentPage(1);
                    }}
                    className="rounded p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {sortFields.length < 5 && (
                <button
                  type="button"
                  onClick={() => {
                    setSortFields(prev => [...prev, { field: 'record_number', order: 'asc' }]);
                  }}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  <Plus className="h-3 w-3" />
                  {addSortLabel}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 条件付き書式パネル */}
        {showFormatPanel && (
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {conditionalFormatLabel}
              </span>
              <div className="flex items-center gap-2">
                {conditionalFormatRules.length > 0 && (
                  <button
                    type="button"
                    onClick={() => saveConditionalFormatRules([])}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    {clearAllLabel}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFormatPanel(false)}
                  className="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {conditionalFormatRules.map((rule) => (
                <div key={rule.id} className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-white p-2 dark:border-gray-600 dark:bg-gray-700">
                  {/* フィールド選択 */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{fieldSelectLabel}</span>
                    <select
                      value={rule.field_code}
                      onChange={(e) => updateFormatRule(rule.id, { field_code: e.target.value })}
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    >
                      <option value="record_number">{numberLabel}</option>
                      {fields
                        .filter(f => !NON_INPUT_FIELD_TYPES.has(f.field_type) && !HIDDEN_IN_LIST_TYPES.has(f.field_type))
                        .map(f => (
                          <option key={f.field_code} value={f.field_code}>
                            {f.label[lang] || f.label.ja || f.field_code}
                          </option>
                        ))}
                    </select>
                  </div>
                  {/* 条件選択 */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{conditionLabel}</span>
                    <select
                      value={rule.operator}
                      onChange={(e) => updateFormatRule(rule.id, { operator: e.target.value as ConditionalFormatRule['operator'] })}
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    >
                      {Object.entries(OPERATOR_LABELS).map(([key, labels]) => (
                        <option key={key} value={key}>{labels[lang] || labels.en}</option>
                      ))}
                    </select>
                  </div>
                  {/* 値入力 */}
                  {!NO_VALUE_FORMAT_OPS.has(rule.operator) && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{valueLabel}</span>
                      <input
                        type="text"
                        value={rule.value || ''}
                        onChange={(e) => updateFormatRule(rule.id, { value: e.target.value })}
                        className="w-32 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        placeholder={valueLabel}
                      />
                    </div>
                  )}
                  {/* 背景色 */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{bgColorLabel}</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={rule.row_bg_color || '#FEF3C7'}
                        onChange={(e) => updateFormatRule(rule.id, { row_bg_color: e.target.value })}
                        className="h-7 w-7 cursor-pointer rounded border border-gray-300 p-0.5 dark:border-gray-600"
                      />
                    </div>
                  </div>
                  {/* プレビュー & 削除 */}
                  <div className="flex items-end gap-1 ml-auto">
                    <div
                      className="flex h-7 items-center rounded px-2 text-[10px]"
                      style={{ backgroundColor: rule.row_bg_color || '#FEF3C7', color: rule.cell_text_color || undefined }}
                    >
                      {lang === 'ja' ? 'プレビュー' : lang === 'th' ? 'ตัวอย่าง' : 'Preview'}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFormatRule(rule.id)}
                      className="rounded p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addFormatRule}
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                <Plus className="h-3 w-3" />
                {addRuleLabel}
              </button>
            </div>
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
                    <table className={tableStyles.table} style={{ tableLayout: Object.keys(columnWidths).length > 0 ? 'fixed' : undefined, width: Object.keys(columnWidths).length > 0 ? 'max-content' : undefined, minWidth: '100%' }}>
                      <thead className={tableStyles.thead}>
                        <tr>
                          {enableBulkDelete && (
                            <th className={`${tableStyles.th} w-10`} style={{ width: 40 }}>
                              <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={toggleSelectAll}
                                className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                              />
                            </th>
                          )}
                          <th
                            className={`${tableStyles.th} group/resize relative cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800`}
                            style={{ width: columnWidths['record_number'] || undefined }}
                            onClick={() => handleSort('record_number')}
                          >
                            {numberLabel}<SortIcon field="record_number" />
                            <div
                              className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent opacity-0 transition-opacity hover:bg-brand-400 hover:opacity-100 group-hover/resize:opacity-50"
                              onMouseDown={(e) => handleResizeStart('record_number', e)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </th>
                          {displayFields.map((field) => (
                            <th
                              key={field.id}
                              className={`${tableStyles.th} group/resize relative cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800`}
                              style={{ width: columnWidths[field.field_code] || undefined }}
                              onClick={() => handleSort(field.field_code)}
                            >
                              {field.label[lang] || field.label.ja || field.field_code}
                              <SortIcon field={field.field_code} />
                              <div
                                className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent opacity-0 transition-opacity hover:bg-brand-400 hover:opacity-100 group-hover/resize:opacity-50"
                                onMouseDown={(e) => handleResizeStart(field.field_code, e)}
                                onClick={(e) => e.stopPropagation()}
                              />
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
                          records.map((record) => {
                            const fmt = evaluateConditionalFormat(record);
                            return (
                              <tr
                                key={record.id}
                                className={`${tableStyles.trClickable} ${selectedIds.has(record.id) ? 'bg-brand-50 dark:bg-brand-900/10' : ''}`}
                                style={{
                                  backgroundColor: !selectedIds.has(record.id) ? fmt.backgroundColor : undefined,
                                  color: fmt.textColor || undefined,
                                }}
                                onClick={() => handleRowClick(record.id)}
                              >
                                {enableBulkDelete && (
                                  <td className={`${tableStyles.td} w-10`} style={{ width: 40 }} onClick={(e) => toggleSelect(record.id, e)}>
                                    <input
                                      type="checkbox"
                                      checked={selectedIds.has(record.id)}
                                      onChange={() => {}}
                                      className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                                    />
                                  </td>
                                )}
                                <td
                                  className={`${tableStyles.td} ${tableStyles.tdPrimary}`}
                                  style={{ width: columnWidths['record_number'] || undefined }}
                                >
                                  {record.record_number}
                                </td>
                                {displayFields.map((field) => (
                                  <td
                                    key={field.id}
                                    className={tableStyles.td}
                                    style={{ width: columnWidths[field.field_code] || undefined }}
                                  >
                                    <InlineEditCell
                                      field={field}
                                      value={record.data[field.field_code]}
                                      recordId={record.id}
                                      appCode={appCode}
                                      locale={locale}
                                      onSaved={fetchRecords}
                                    >
                                      <FieldDisplay
                                        field={field}
                                        value={record.data[field.field_code]}
                                        locale={locale}
                                      />
                                    </InlineEditCell>
                                  </td>
                                ))}
                              </tr>
                            );
                          })
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
            locale={locale}
          />
        )}
      </div>
      </div>
    </div>
  );
}
