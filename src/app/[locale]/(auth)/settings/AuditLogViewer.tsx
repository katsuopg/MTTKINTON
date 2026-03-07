'use client';

import { useState, useEffect, useCallback } from 'react';
import { tableStyles } from '@/components/ui/TableStyles';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Search, Filter, Calendar, RefreshCw } from 'lucide-react';

interface AuditLogViewerProps {
  locale: string;
}

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  user_name: string;
  details: Record<string, unknown> | null;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const ACTION_OPTIONS = [
  { value: '', label: { ja: 'すべて', en: 'All', th: 'ทั้งหมด' } },
  { value: 'record.create', label: { ja: 'レコード作成', en: 'Record Create', th: 'สร้างเรคอร์ด' } },
  { value: 'record.update', label: { ja: 'レコード更新', en: 'Record Update', th: 'อัปเดตเรคอร์ด' } },
  { value: 'record.delete', label: { ja: 'レコード削除', en: 'Record Delete', th: 'ลบเรคอร์ด' } },
  { value: 'login', label: { ja: 'ログイン', en: 'Login', th: 'เข้าสู่ระบบ' } },
  { value: 'logout', label: { ja: 'ログアウト', en: 'Logout', th: 'ออกจากระบบ' } },
  { value: 'permission.change', label: { ja: '権限変更', en: 'Permission Change', th: 'เปลี่ยนสิทธิ์' } },
  { value: 'settings.update', label: { ja: '設定変更', en: 'Settings Update', th: 'อัปเดตการตั้งค่า' } },
];

const i18n = {
  ja: {
    title: '監査ログ',
    datetime: '日時',
    userName: 'ユーザー名',
    action: 'アクション',
    entity: 'エンティティ',
    details: '詳細',
    ipAddress: 'IP',
    filterAction: 'アクション種別',
    dateFrom: '開始日',
    dateTo: '終了日',
    noLogs: '監査ログはありません',
    loading: '読み込み中...',
    error: 'エラーが発生しました',
    refresh: '更新',
  },
  en: {
    title: 'Audit Logs',
    datetime: 'Date/Time',
    userName: 'User',
    action: 'Action',
    entity: 'Entity',
    details: 'Details',
    ipAddress: 'IP',
    filterAction: 'Action Type',
    dateFrom: 'From',
    dateTo: 'To',
    noLogs: 'No audit logs found',
    loading: 'Loading...',
    error: 'An error occurred',
    refresh: 'Refresh',
  },
  th: {
    title: 'บันทึกการตรวจสอบ',
    datetime: 'วันที่/เวลา',
    userName: 'ผู้ใช้',
    action: 'การกระทำ',
    entity: 'เอนทิตี',
    details: 'รายละเอียด',
    ipAddress: 'IP',
    filterAction: 'ประเภทการกระทำ',
    dateFrom: 'จาก',
    dateTo: 'ถึง',
    noLogs: 'ไม่พบบันทึกการตรวจสอบ',
    loading: 'กำลังโหลด...',
    error: 'เกิดข้อผิดพลาด',
    refresh: 'รีเฟรช',
  },
} as const;

function formatDatetime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  if (locale === 'ja') {
    return date.toLocaleString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }
  if (locale === 'th') {
    return date.toLocaleString('th-TH', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }
  return date.toLocaleString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function getActionBadgeColor(action: string): string {
  if (action.includes('create')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (action.includes('update')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (action.includes('delete')) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
  if (action === 'login') return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400';
  if (action === 'logout') return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
}

function summarizeDetails(details: Record<string, unknown> | null): string {
  if (!details) return '-';
  if (typeof details === 'object') {
    const keys = Object.keys(details);
    if (keys.length === 0) return '-';
    if (keys.length <= 3) return keys.join(', ');
    return `${keys.slice(0, 3).join(', ')} +${keys.length - 3}`;
  }
  return String(details);
}

export default function AuditLogViewer({ locale }: AuditLogViewerProps) {
  const lang = (locale === 'ja' || locale === 'th' ? locale : 'en') as keyof typeof i18n;
  const t = i18n[lang];

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(pageSize),
      });
      if (actionFilter) params.set('action', actionFilter);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, actionFilter, dateFrom, dateTo, t.error]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const selectStyle = 'h-9 px-3 text-theme-sm rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300';
  const inputStyle = 'h-9 px-3 text-theme-sm rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300';

  return (
    <div>
      {/* フィルターバー */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            {t.filterAction}
          </label>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); handleFilterChange(); }}
            className={selectStyle}
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label[lang]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {t.dateFrom}
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); handleFilterChange(); }}
            className={inputStyle}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {t.dateTo}
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); handleFilterChange(); }}
            className={inputStyle}
          />
        </div>

        <button
          onClick={fetchLogs}
          className="h-9 px-3 inline-flex items-center gap-1.5 text-theme-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {t.refresh}
        </button>
      </div>

      {/* テーブル */}
      <div className={tableStyles.tableContainer}>
        {loading ? (
          <LoadingSpinner message={t.loading} />
        ) : error ? (
          <div className="px-5 py-10 text-center text-rose-500 dark:text-rose-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{t.error}: {error}</p>
          </div>
        ) : (
          <>
            <div className={tableStyles.desktopOnly}>
              <table className={tableStyles.table}>
                <thead className={tableStyles.thead}>
                  <tr>
                    <th className={tableStyles.th}>{t.datetime}</th>
                    <th className={tableStyles.th}>{t.userName}</th>
                    <th className={tableStyles.th}>{t.action}</th>
                    <th className={tableStyles.th}>{t.entity}</th>
                    <th className={tableStyles.th}>{t.details}</th>
                    <th className={tableStyles.th}>{t.ipAddress}</th>
                  </tr>
                </thead>
                <tbody className={tableStyles.tbody}>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={tableStyles.emptyRow}>{t.noLogs}</td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className={tableStyles.tr}>
                        <td className={`${tableStyles.td} whitespace-nowrap tabular-nums`}>
                          {formatDatetime(log.created_at, locale)}
                        </td>
                        <td className={`${tableStyles.td} ${tableStyles.tdPrimary}`}>
                          {log.user_name || '-'}
                        </td>
                        <td className={tableStyles.td}>
                          <span className={`${tableStyles.statusBadge} ${getActionBadgeColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className={tableStyles.td}>
                          <span className="text-gray-700 dark:text-gray-300">{log.entity_type}</span>
                          {log.entity_id && (
                            <span className="ml-1 text-gray-400 dark:text-gray-500 text-theme-xs">
                              #{log.entity_id.substring(0, 8)}
                            </span>
                          )}
                        </td>
                        <td className={`${tableStyles.td} max-w-[200px] truncate`} title={JSON.stringify(log.details)}>
                          {summarizeDetails(log.details)}
                        </td>
                        <td className={`${tableStyles.td} text-theme-xs tabular-nums`}>
                          {log.ip_address || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* モバイルカードビュー */}
            <div className={tableStyles.mobileCardList}>
              {logs.length === 0 ? (
                <div className="px-4 py-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                  {t.noLogs}
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className={tableStyles.mobileCard}>
                    <div className={tableStyles.mobileCardHeader}>
                      <span className={tableStyles.mobileCardTitle}>{log.user_name || '-'}</span>
                      <span className={`${tableStyles.statusBadge} ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </div>
                    <div className={tableStyles.mobileCardSubtitle}>
                      {formatDatetime(log.created_at, locale)}
                    </div>
                    <div className={tableStyles.mobileCardFields}>
                      <div>
                        <span className={tableStyles.mobileCardFieldLabel}>{t.entity}: </span>
                        <span className={tableStyles.mobileCardFieldValue}>{log.entity_type}</span>
                      </div>
                      <div>
                        <span className={tableStyles.mobileCardFieldLabel}>{t.ipAddress}: </span>
                        <span className={tableStyles.mobileCardFieldValue}>{log.ip_address || '-'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              locale={locale}
            />
          </>
        )}
      </div>
    </div>
  );
}
