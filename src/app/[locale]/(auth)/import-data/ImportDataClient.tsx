'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { tableStyles } from '@/components/ui/TableStyles';

type DataSource = 'kintone' | 'supabase' | 'hybrid' | 'none';
type MigrationStage = 'completed' | 'in-progress' | 'planned';

type KintoneStatusKey =
  | 'dashboard'
  | 'workno'
  | 'project'
  | 'quotation'
  | 'po'
  | 'order'
  | 'cost'
  | 'employees'
  | 'suppliers'
  | 'staff';

interface ActionResultDetail {
  label: string;
  value: string | number;
}

interface ActionResult {
  status: 'success' | 'error';
  message: string;
  details?: ActionResultDetail[];
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
    dataTarget: { read: 'kintone', write: 'none' },
    migration: 'planned',
    notes: 'Work No.アプリからリアルタイム参照',
    action: { kind: 'kintone-load', appKey: 'dashboard', label: 'kintone読み込み' },
  },
  {
    id: 'project-management',
    name: 'プロジェクト管理',
    route: '/project-management',
    description: '案件進捗をProject managementアプリから取得します。',
    dataTarget: { read: 'kintone', write: 'kintone' },
    migration: 'planned',
    notes: '検索・詳細参照をkintone APIで実行',
    action: { kind: 'kintone-load', appKey: 'project', label: 'kintone読み込み' },
  },
  {
    id: 'workno',
    name: '工事番号管理',
    route: '/workno',
    description: '工事番号の進捗・請求状況を監視します。',
    dataTarget: { read: 'kintone', write: 'kintone' },
    migration: 'in-progress',
    notes: 'Work No.アプリと請求書キャッシュを使用',
    action: { kind: 'kintone-load', appKey: 'workno', label: 'kintone読み込み' },
  },
  {
    id: 'quotation',
    name: '見積管理',
    route: '/quotation',
    description: '見積一覧・編集をkintoneアプリで実行します。',
    dataTarget: { read: 'kintone', write: 'kintone' },
    migration: 'in-progress',
    notes: '編集フォームはkintoneレコードを直接更新',
    action: { kind: 'kintone-load', appKey: 'quotation', label: 'kintone読み込み' },
  },
  {
    id: 'order-management',
    name: '注文書管理',
    route: '/order-management',
    description: '注文書の履歴をkintoneから取得して表示します。',
    dataTarget: { read: 'kintone', write: 'kintone' },
    migration: 'planned',
    notes: '注文書アプリ（PO管理）と連携',
    action: { kind: 'kintone-load', appKey: 'order', label: 'kintone読み込み' },
  },
  {
    id: 'po-management',
    name: '発注管理',
    route: '/po-management',
    description: '発注書の状況をkintoneのPO管理アプリで管理します。',
    dataTarget: { read: 'kintone', write: 'kintone' },
    migration: 'planned',
    notes: '納期遅延アラートなどを表示',
    action: { kind: 'kintone-load', appKey: 'po', label: 'kintone読み込み' },
  },
  {
    id: 'cost-management',
    name: 'コスト管理',
    route: '/cost-management',
    description: '工事別原価をkintone Costアプリから取得します。',
    dataTarget: { read: 'kintone', write: 'kintone' },
    migration: 'planned',
    notes: '工事番号と紐付いて原価参照',
    action: { kind: 'kintone-load', appKey: 'cost', label: 'kintone読み込み' },
  },
  {
    id: 'employees',
    name: '従業員管理',
    route: '/employees',
    description: '従業員台帳をkintone Employeeアプリで閲覧します。',
    dataTarget: { read: 'kintone', write: 'kintone' },
    migration: 'planned',
    notes: '社員証番号などを直接管理',
    action: { kind: 'kintone-load', appKey: 'employees', label: 'kintone読み込み' },
  },
  {
    id: 'suppliers',
    name: '仕入業者管理',
    route: '/suppliers',
    description: '仕入先マスタをkintone Supplierアプリから取得します。',
    dataTarget: { read: 'kintone', write: 'kintone' },
    migration: 'planned',
    notes: 'APIトークンとアプリIDの設定が必要',
    action: { kind: 'kintone-load', appKey: 'suppliers', label: 'kintone読み込み' },
  },
  {
    id: 'staff',
    name: '顧客担当者',
    route: '/staff',
    description: '顧客別担当者リストをkintoneで管理します。',
    dataTarget: { read: 'kintone', write: 'kintone' },
    migration: 'planned',
    notes: '顧客情報と連動した担当者データ',
    action: { kind: 'kintone-load', appKey: 'staff', label: 'kintone読み込み' },
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
  },
];

interface ImportDataClientProps {
  locale: string;
}

export default function ImportDataClient({ locale }: ImportDataClientProps) {
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const [actionResults, setActionResults] = useState<Record<string, ActionResult | undefined>>({});

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

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (response.ok && data?.success) {
        const details: ActionResultDetail[] = [
          { label: '全レコード数', value: data.totalRecords ?? '-' },
          { label: '取り込み成功', value: data.imported ?? 0 },
          { label: 'エラー件数', value: data.errors ?? 0 },
          { label: 'Supabase総件数', value: data.supabaseCount ?? '-' },
        ];

        setResult(id, {
          status: 'success',
          message: '取り込みが完了しました。',
          details,
        });
      } else {
        setResult(id, {
          status: 'error',
          message: data?.error ?? '取り込みに失敗しました。',
        });
      }
    } catch (error) {
      console.error('Supabase import error:', error);
      setResult(id, {
        status: 'error',
        message: '取り込み処理でエラーが発生しました。',
      });
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

  return (
    <div data-testid="import-data-container" className={`${tableStyles.contentWrapper} space-y-6`}>
      <section>
        <h1 className="text-3xl font-bold text-slate-900">データ同期ステータス</h1>
        <p className="mt-2 text-sm text-slate-600">
          各アプリが参照・更新しているデータソースとSupabase移行の進捗を整理した一覧です。kintone参照中のアプリは読み込みボタンで接続確認ができます。
        </p>
        <p className="mt-1 text-xs text-slate-500">
          ※ Supabase移行が完了したアプリは、このページでの手動同期が順次不要になる予定です。
        </p>
      </section>

      <section className={tableStyles.tableContainer}>
        <div className="overflow-x-auto">
          <table className={`table-fixed ${tableStyles.table}`}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={`${tableStyles.th} w-56`}>
                  アプリ
                </th>
                <th className={`${tableStyles.th} w-32`}>
                  読み込み
                </th>
                <th className={`${tableStyles.th} w-32`}>
                  書き込み
                </th>
                <th className={`${tableStyles.th} w-32`}>
                  移行状況
                </th>
                <th className={tableStyles.th}>
                  備考
                </th>
                <th className={`${tableStyles.th} w-48`}>
                  アクション
                </th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {appStatuses.map((status) => {
                const loading = Boolean(loadingActions[status.id]);
                const result = actionResults[status.id];

                return (
                  <tr key={status.id} className={tableStyles.tr}>
                    <td className={`${tableStyles.td} w-56`}>
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
                      {status.action ? (
                        <div>
                          <button
                            type="button"
                            onClick={() => handleAction(status)}
                            disabled={loading}
                            className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
                              loading
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
