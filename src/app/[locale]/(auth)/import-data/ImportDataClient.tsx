'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { tableStyles } from '@/components/ui/TableStyles';

type DataSource = 'kintone' | 'supabase' | 'hybrid' | 'none';
type MigrationStage = 'completed' | 'in-progress' | 'planned';

type KintoneStatusKey =
  | 'project'
  | 'quotation'
  | 'order';

interface ActionResultDetail {
  label: string;
  value: string | number;
}

type SyncStatus = 'not-synced' | 'syncing' | 'success' | 'error' | 'not-needed';

interface ActionResult {
  status: 'success' | 'error';
  message: string;
  details?: ActionResultDetail[];
  timestamp?: string;
}

interface SupabaseImportAction {
  kind: 'supabase-import';
  endpoint: string;
  label?: string;
}

interface KintoneLoadAction {
  kind: 'kintone-load';
  appKey: KintoneStatusKey;
  label?: string;
}

type ActionConfig = SupabaseImportAction | KintoneLoadAction;

interface BaseAppStatus {
  id: string;
  name: string;
  route: string;
  description: string;
  dataTarget: {
    read: DataSource;
    write: DataSource;
  };
  migration: MigrationStage;
  notes?: string;
  action?: ActionConfig;
}

interface AppStatus extends BaseAppStatus {
  fullPath: string;
}

const DATA_SOURCE_LABEL: Record<DataSource, string> = {
  kintone: 'kintone',
  supabase: 'Supabase',
  hybrid: 'ハイブリッド',
  none: '未整備',
};

const DATA_SOURCE_STYLE: Record<DataSource, string> = {
  kintone: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
  supabase: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  hybrid: 'bg-amber-50 text-amber-600 border border-amber-100',
  none: 'bg-gray-100 text-gray-500 border border-gray-200',
};

const MIGRATION_LABEL: Record<MigrationStage, string> = {
  completed: '完了',
  'in-progress': '移行中',
  planned: '予定',
};

const MIGRATION_STYLE: Record<MigrationStage, string> = {
  completed: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  'in-progress': 'bg-amber-50 text-amber-600 border border-amber-100',
  planned: 'bg-slate-100 text-slate-500 border border-slate-200',
};

const BASE_APP_STATUSES: BaseAppStatus[] = [
  {
    id: 'dashboard',
    name: 'ダッシュボード',
    route: '/dashboard',
    description: '工事番号とプロジェクトの状況を集計表示します。',
    dataTarget: { read: 'supabase', write: 'none' },
    migration: 'completed',
    notes: 'work_orders・invoices・projectsテーブルから集計',
  },
  {
    id: 'project-management',
    name: 'プロジェクト管理',
    route: '/project-management',
    description: 'Supabaseに移行済みのプロジェクトデータを管理します。',
    dataTarget: { read: 'supabase', write: 'supabase' },
    migration: 'completed',
    notes: 'プロジェクトステータス・部品表・見積依頼をSupabaseで管理',
  },
  {
    id: 'workno',
    name: '工事番号管理',
    route: '/workno',
    description: '工事番号の進捗・請求状況を監視します。',
    dataTarget: { read: 'supabase', write: 'supabase' },
    migration: 'completed',
    notes: 'Kintone→Supabase同期済み（work_ordersテーブル）',
    action: { kind: 'supabase-import', endpoint: '/api/import-workorders', label: '再取り込み' },
  },
  {
    id: 'quotation',
    name: '見積管理',
    route: '/quotation',
    description: 'Supabaseに移行した見積データを表示します。',
    dataTarget: { read: 'supabase', write: 'supabase' },
    migration: 'completed',
    notes: 'Kintone→Supabase同期済み（quotationsテーブル）',
    action: { kind: 'supabase-import', endpoint: '/api/import-quotations', label: '再取り込み' },
  },
  {
    id: 'order-management',
    name: '注文書管理',
    route: '/order-management',
    description: 'Supabaseに移行した注文書データを表示します。',
    dataTarget: { read: 'supabase', write: 'supabase' },
    migration: 'completed',
    notes: 'Kintone→Supabase同期済み（customer_ordersテーブル）',
    action: { kind: 'supabase-import', endpoint: '/api/import-orders', label: '再取り込み' },
  },
  {
    id: 'po-management',
    name: '発注管理',
    route: '/po-management',
    description: 'Supabaseに移行したPOデータを参照します。',
    dataTarget: { read: 'supabase', write: 'supabase' },
    migration: 'completed',
    notes: '納期遅延アラートなどを表示',
    action: { kind: 'supabase-import', endpoint: '/api/import-po', label: '再取り込み' },
  },
  {
    id: 'cost-management',
    name: 'コスト管理',
    route: '/cost-management',
    description: 'Supabaseに移行したコストデータを参照します。',
    dataTarget: { read: 'supabase', write: 'supabase' },
    migration: 'completed',
    notes: 'Kintone→Supabase同期済み・工事番号と紐付いて原価参照',
    action: { kind: 'supabase-import', endpoint: '/api/import-costs', label: '再取り込み' },
  },
  {
    id: 'employees',
    name: '従業員管理',
    route: '/employees',
    description: 'Supabaseに移行した従業員マスタを表示します。',
    dataTarget: { read: 'supabase', write: 'supabase' },
    migration: 'completed',
    notes: 'プロフィール編集・アバターアップロード機能付き',
    action: { kind: 'supabase-import', endpoint: '/api/import-employees', label: '再取り込み' },
  },
  {
    id: 'suppliers',
    name: '仕入業者管理',
    route: '/suppliers',
    description: 'Supabaseに移行済みの仕入先マスタを表示します。',
    dataTarget: { read: 'supabase', write: 'supabase' },
    migration: 'completed',
    notes: 'Kintone→Supabase同期済み（460件）',
    action: { kind: 'supabase-import', endpoint: '/api/import-suppliers', label: '再取り込み' },
  },
  {
    id: 'staff',
    name: '顧客担当者',
    route: '/staff',
    description: '顧客別担当者リストを管理します。',
    dataTarget: { read: 'supabase', write: 'supabase' },
    migration: 'completed',
    notes: 'Kintone→Supabase同期済み（customer_staffテーブル）',
    action: { kind: 'supabase-import', endpoint: '/api/import-customer-staff', label: '再取り込み' },
  },
  {
    id: 'customers',
    name: '顧客一覧',
    route: '/customers',
    description: 'Supabaseへ同期済みの顧客マスタを表示します。',
    dataTarget: { read: 'supabase', write: 'supabase' },
    migration: 'completed',
    notes: 'Kintone→Supabase同期ボタンで再取り込み',
    action: { kind: 'supabase-import', endpoint: '/api/import-customers', label: '再取り込み' },
  },
  {
    id: 'invoice-management',
    name: '請求書管理',
    route: '/invoice-management',
    description: 'Supabaseに移行した請求書データを参照します。',
    dataTarget: { read: 'supabase', write: 'supabase' },
    migration: 'completed',
    notes: '期別フィルタなどはSupabaseに対して実行',
    action: { kind: 'supabase-import', endpoint: '/api/import-invoices', label: '再取り込み' },
  },
  {
    id: 'machines',
    name: '機械管理',
    route: '/machines',
    description: 'Supabaseへ移植した機械マスタを表示します。',
    dataTarget: { read: 'supabase', write: 'supabase' },
    migration: 'completed',
    notes: 'Quotation/WorkNo件数をSupabase集計で表示',
    action: { kind: 'supabase-import', endpoint: '/api/import-machines', label: '再取り込み' },
  },
];

interface ImportDataClientProps {
  locale: string;
}

export default function ImportDataClient({ locale }: ImportDataClientProps) {
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const [actionResults, setActionResults] = useState<Record<string, ActionResult | undefined>>({});
  const [lastSyncDates, setLastSyncDates] = useState<Record<string, string>>({});
  const [syncStatuses, setSyncStatuses] = useState<Record<string, SyncStatus>>({});
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // localStorageから最終同期日と同期状態を読み込む
  useEffect(() => {
    const stored = localStorage.getItem('import-data-last-sync');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLastSyncDates(parsed);
        // 同期日があるアプリは成功状態として初期化
        const statuses: Record<string, SyncStatus> = {};
        Object.keys(parsed).forEach((id) => {
          statuses[id] = 'success';
        });
        setSyncStatuses(statuses);
      } catch (e) {
        console.error('Failed to parse last sync dates:', e);
      }
    }
  }, []);

  // 最終同期日を保存（関数型更新で確実に保存）
  const saveLastSyncDate = (id: string, timestamp?: string) => {
    const now = timestamp || new Date().toISOString();
    setLastSyncDates((prev) => {
      const updated = { ...prev, [id]: now };
      // localStorageに即座に保存
      try {
        localStorage.setItem('import-data-last-sync', JSON.stringify(updated));
        console.log(`Saved sync date for ${id}:`, now);
      } catch (error) {
        console.error('Failed to save last sync date to localStorage:', error);
      }
      return updated;
    });
    // 同期状態も更新
    setSyncStatuses((prev) => ({ ...prev, [id]: 'success' }));
  };

  const appStatuses: AppStatus[] = useMemo(
    () =>
      BASE_APP_STATUSES.map((status) => ({
        ...status,
        fullPath: `/${locale}${status.route}`,
      })),
    [locale]
  );

  const setLoading = (id: string, value: boolean) => {
    setLoadingActions((prev) => ({ ...prev, [id]: value }));
  };

  const setResult = (id: string, result: ActionResult | undefined) => {
    setActionResults((prev) => ({ ...prev, [id]: result }));
  };

  const handleSupabaseImport = async (id: string, endpoint: string) => {
    setLoading(id, true);
    setResult(id, undefined);
    setSyncStatuses((prev) => ({ ...prev, [id]: 'syncing' }));

    const startTime = new Date().toISOString();

    try {
      let totalImported = 0;
      let totalErrors = 0;
      let supabaseCount: number | string = '-';
      let offset = 0;
      let hasMore = true;

      // バッチ対応: hasMore=true の間ループ（各リクエスト2分タイムアウト）
      while (hasMore) {
        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `${endpoint}${separator}offset=${offset}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2 * 60 * 1000);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const data = await response.json();

        if (!response.ok || !data?.success) {
          setResult(id, {
            status: 'error',
            message: data?.error ?? `バッチ取り込みに失敗 (offset=${offset})`,
            timestamp: startTime,
          });
          setSyncStatuses((prev) => ({ ...prev, [id]: 'error' }));
          setLoading(id, false);
          return;
        }

        totalImported += data.imported ?? 0;
        totalErrors += data.errors ?? 0;

        // hasMoreがレスポンスにない場合は従来の単発APIとして終了
        if (data.hasMore === undefined) {
          supabaseCount = data.supabaseCount ?? '-';
          hasMore = false;
        } else {
          hasMore = data.hasMore;
          offset = data.nextOffset ?? offset + 500;
          if (!hasMore) {
            supabaseCount = data.supabaseCount ?? '-';
          }
        }
      }

      const details: ActionResultDetail[] = [
        { label: '取り込み成功', value: totalImported },
        { label: 'エラー件数', value: totalErrors },
        { label: 'Supabase総件数', value: supabaseCount },
      ];

      const timestamp = new Date().toISOString();
      setResult(id, {
        status: 'success',
        message: '取り込みが完了しました。',
        details,
        timestamp,
      });
      saveLastSyncDate(id, timestamp);
      setSyncStatuses((prev) => ({ ...prev, [id]: 'success' }));
    } catch (error: any) {
      console.error('Supabase import error:', error);
      if (error.name === 'AbortError') {
        setResult(id, {
          status: 'error',
          message: '取り込みがタイムアウトしました。',
          timestamp: startTime,
        });
      } else {
        setResult(id, {
          status: 'error',
          message: '取り込み処理でエラーが発生しました。',
          timestamp: startTime,
        });
      }
      setSyncStatuses((prev) => ({ ...prev, [id]: 'error' }));
    } finally {
      setLoading(id, false);
    }
  };

  const handleKintoneLoad = async (id: string, appKey: KintoneStatusKey) => {
    setLoading(id, true);
    setResult(id, undefined);

    try {
      const response = await fetch(`/api/kintone/app-status?app=${appKey}`, {
        method: 'GET',
      });
      const data = await response.json();

      if (response.ok && data?.success) {
        const details: ActionResultDetail[] = [
          { label: '取得件数', value: data.count ?? 0 },
        ];

        if (data.sampleId) {
          details.push({ label: 'サンプルID', value: data.sampleId });
        }
        if (data.lastUpdated) {
          const date = new Date(data.lastUpdated);
          details.push({
            label: '最終更新',
            value: isNaN(date.getTime())
              ? data.lastUpdated
              : date.toLocaleString('ja-JP'),
          });
        }

        setResult(id, {
          status: 'success',
          message: 'kintoneから最新データを取得しました。',
          details,
        });
      } else {
        setResult(id, {
          status: 'error',
          message: data?.error ?? 'kintoneデータの取得に失敗しました。',
        });
      }
    } catch (error) {
      console.error('Kintone load error:', error);
      setResult(id, {
        status: 'error',
        message: 'kintone取得でエラーが発生しました。',
      });
    } finally {
      setLoading(id, false);
    }
  };

  const handleAction = async (status: AppStatus) => {
    if (!status.action) {
      return;
    }

    if (status.action.kind === 'supabase-import') {
      await handleSupabaseImport(status.id, status.action.endpoint);
      return;
    }

    if (status.action.kind === 'kintone-load') {
      await handleKintoneLoad(status.id, status.action.appKey);
    }
  };

  // 全件取得（Supabase移行済みアプリのみ）- 並列処理で高速化
  const handleBulkImport = async () => {
    setIsBulkLoading(true);
    const supabaseApps = appStatuses.filter(
      (app) => app.migration === 'completed' && app.action?.kind === 'supabase-import'
    );

    // 並列処理で全アプリを同時に実行
    const importPromises = supabaseApps.map((app) => {
      if (app.action?.kind === 'supabase-import') {
        return handleSupabaseImport(app.id, app.action.endpoint);
      }
      return Promise.resolve();
    });

    // すべての処理を並列実行
    await Promise.all(importPromises);

    setIsBulkLoading(false);
  };

  // 最終同期日のフォーマット
  const formatLastSyncDate = (id: string): string => {
    const dateStr = lastSyncDates[id];
    if (!dateStr) return '未同期';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '未同期';
    }
  };

  // 同期状態の取得
  const getSyncStatus = (status: AppStatus): SyncStatus => {
    const appId = status.id;
    
    // 同期不要なアプリ（アクションがない、またはkintone-loadのみ）
    if (!status.action || status.action.kind === 'kintone-load') {
      return 'not-needed';
    }

    // 同期中
    if (loadingActions[appId]) {
      return 'syncing';
    }

    // 結果から判定
    const result = actionResults[appId];
    if (result) {
      return result.status === 'success' ? 'success' : 'error';
    }

    // 最終同期日があるかどうか
    if (lastSyncDates[appId]) {
      return 'success';
    }

    return 'not-synced';
  };

  // 同期状態のラベルとスタイル
  const getSyncStatusLabel = (status: SyncStatus): { label: string; style: string } => {
    switch (status) {
      case 'not-synced':
        return { label: '未同期', style: 'bg-gray-100 text-gray-600 border border-gray-200' };
      case 'syncing':
        return { label: '同期中', style: 'bg-blue-100 text-blue-600 border border-blue-200' };
      case 'success':
        return { label: '同期済み', style: 'bg-emerald-100 text-emerald-600 border border-emerald-200' };
      case 'error':
        return { label: '同期失敗', style: 'bg-rose-100 text-rose-600 border border-rose-200' };
      case 'not-needed':
        return { label: '同期不要', style: 'bg-slate-100 text-slate-500 border border-slate-200' };
      default:
        return { label: '不明', style: 'bg-gray-100 text-gray-500 border border-gray-200' };
    }
  };

  return (
    <div data-testid="import-data-container" className={`${tableStyles.contentWrapper} space-y-6`}>
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">データ同期ステータス</h1>
            <p className="mt-2 text-sm text-slate-600">
              各アプリが参照・更新しているデータソースとSupabase移行の進捗を整理した一覧です。kintone参照中のアプリは読み込みボタンで接続確認ができます。
            </p>
            <p className="mt-1 text-xs text-slate-500">
              ※ Supabase移行が完了したアプリは、このページでの手動同期が順次不要になる予定です。
            </p>
          </div>
          <button
            type="button"
            onClick={handleBulkImport}
            disabled={isBulkLoading}
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
              isBulkLoading
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isBulkLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-2.209 1.343-4.209 3.207-5.593L10.707 5.293A1 1 0 0112 6v4a1 1 0 01-1 1H7a1 1 0 01-.707-1.707l2-2z"></path>
                </svg>
                同期中（並列処理）...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                全件取得（並列）
              </>
            )}
          </button>
        </div>
      </section>

      <section className={tableStyles.tableContainer}>
        {/* デスクトップ表示（テーブル） */}
        <div className="hidden md:block overflow-x-auto">
          <table className={`w-full ${tableStyles.table}`}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={`${tableStyles.th} w-48`}>アプリ</th>
                <th className={`${tableStyles.th} w-28`}>読み込み</th>
                <th className={`${tableStyles.th} w-28`}>書き込み</th>
                <th className={`${tableStyles.th} w-28`}>移行状況</th>
                <th className={tableStyles.th}>備考</th>
                <th className={`${tableStyles.th} w-40`}>同期状態</th>
                <th className={`${tableStyles.th} w-48`}>アクション</th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {appStatuses.map((status) => {
                const loading = Boolean(loadingActions[status.id]);
                const result = actionResults[status.id];
                const lastSync = formatLastSyncDate(status.id);
                const syncStatus = getSyncStatus(status);
                const syncStatusInfo = getSyncStatusLabel(syncStatus);

                return (
                  <tr key={status.id} className={tableStyles.tr}>
                    <td className={tableStyles.td}>
                      <Link
                        href={status.fullPath}
                        className="block font-semibold text-slate-900 hover:text-indigo-600"
                      >
                        {status.name}
                      </Link>
                    </td>
                    <td className={tableStyles.td}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${DATA_SOURCE_STYLE[status.dataTarget.read]}`}>
                        {DATA_SOURCE_LABEL[status.dataTarget.read]}
                      </span>
                    </td>
                    <td className={tableStyles.td}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${DATA_SOURCE_STYLE[status.dataTarget.write]}`}>
                        {DATA_SOURCE_LABEL[status.dataTarget.write]}
                      </span>
                    </td>
                    <td className={tableStyles.td}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${MIGRATION_STYLE[status.migration]}`}>
                        {MIGRATION_LABEL[status.migration]}
                      </span>
                    </td>
                    <td className={`${tableStyles.td} align-top text-sm text-slate-600`}>
                      {status.notes || '―'}
                    </td>
                    <td className={tableStyles.td}>
                      <div className="space-y-1">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${syncStatusInfo.style}`}>
                          {syncStatus === 'syncing' && (
                            <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-2.209 1.343-4.209 3.207-5.593L10.707 5.293A1 1 0 0112 6v4a1 1 0 01-1 1H7a1 1 0 01-.707-1.707l2-2z"></path>
                            </svg>
                          )}
                          {syncStatusInfo.label}
                        </div>
                        <div className="text-xs text-slate-500">
                          {lastSync}
                        </div>
                      </div>
                    </td>
                    <td className={tableStyles.td}>
                      {status.action ? (
                        <div>
                          <button
                            type="button"
                            onClick={() => handleAction(status)}
                            disabled={loading || isBulkLoading}
                            className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
                              loading || isBulkLoading
                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                : status.action.kind === 'supabase-import'
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                          >
                            {loading ? '実行中...' : status.action.label ?? '実行'}
                          </button>
                          {result && (
                            <div
                              className={`mt-3 rounded-md border px-3 py-2 text-sm ${
                                result.status === 'success'
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-rose-200 bg-rose-50 text-rose-700'
                              }`}
                            >
                              <p className="font-medium">{result.message}</p>
                              {result.details && (
                                <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                                  {result.details.map((detail) => (
                                    <li key={`${status.id}-${detail.label}`}>
                                      <span className="font-medium text-slate-500">{detail.label}:</span>{' '}
                                      {detail.value}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">手動操作なし</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* モバイル表示（カード） */}
        <div className="md:hidden space-y-4">
          {appStatuses.map((status) => {
            const loading = Boolean(loadingActions[status.id]);
            const result = actionResults[status.id];
            const lastSync = formatLastSyncDate(status.id);
            const syncStatus = getSyncStatus(status);
            const syncStatusInfo = getSyncStatusLabel(syncStatus);

            return (
              <div key={status.id} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <Link
                    href={status.fullPath}
                    className="font-semibold text-slate-900 hover:text-indigo-600"
                  >
                    {status.name}
                  </Link>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${MIGRATION_STYLE[status.migration]}`}>
                    {MIGRATION_LABEL[status.migration]}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-500">読み込み:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${DATA_SOURCE_STYLE[status.dataTarget.read]}`}>
                      {DATA_SOURCE_LABEL[status.dataTarget.read]}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">書き込み:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${DATA_SOURCE_STYLE[status.dataTarget.write]}`}>
                      {DATA_SOURCE_LABEL[status.dataTarget.write]}
                    </span>
                  </div>
                </div>

                {status.notes && (
                  <div className="text-sm text-slate-600">
                    <span className="text-slate-500">備考:</span> {status.notes}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    <span className="font-medium">最終同期日:</span> {lastSync}
                  </div>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${syncStatusInfo.style}`}>
                    {syncStatus === 'syncing' && (
                      <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-2.209 1.343-4.209 3.207-5.593L10.707 5.293A1 1 0 0112 6v4a1 1 0 01-1 1H7a1 1 0 01-.707-1.707l2-2z"></path>
                      </svg>
                    )}
                    {syncStatusInfo.label}
                  </div>
                </div>

                {status.action && (
                  <div>
                    <button
                      type="button"
                      onClick={() => handleAction(status)}
                      disabled={loading || isBulkLoading}
                      className={`w-full inline-flex justify-center rounded-md px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
                        loading || isBulkLoading
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : status.action.kind === 'supabase-import'
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {loading ? '実行中...' : status.action.label ?? '実行'}
                    </button>
                    {result && (
                      <div
                        className={`mt-3 rounded-md border px-3 py-2 text-sm ${
                          result.status === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-rose-200 bg-rose-50 text-rose-700'
                        }`}
                      >
                        <p className="font-medium">{result.message}</p>
                        {result.details && (
                          <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                            {result.details.map((detail) => (
                              <li key={`${status.id}-${detail.label}`}>
                                <span className="font-medium text-slate-500">{detail.label}:</span>{' '}
                                {detail.value}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900">ショートカット</h2>
        <p className="mt-1 text-sm text-slate-600">
          Supabaseへ移行済みの画面を素早く確認するためのリンクです。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/test-supabase`}
            className="inline-flex items-center rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-900"
          >
            Supabaseデータを確認
          </Link>
          <Link
            href={`/${locale}/customers`}
            className="inline-flex items-center rounded-md bg-slate-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-600"
          >
            Supabase顧客一覧へ
          </Link>
        </div>
      </section>
    </div>
  );
}
