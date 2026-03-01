'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { detailStyles } from '@/components/ui/DetailStyles';
import { DetailPageHeader } from '@/components/ui/DetailPageHeader';
import Tabs, { TabPanel } from '@/components/ui/Tabs';
import { Pencil, Trash2, Loader2, Copy, MessageSquare, History, Send, X, Play, ArrowRight, Clock } from 'lucide-react';
import type { FieldDefinition, AppRecord } from '@/types/dynamic-app';
import { DECORATIVE_FIELD_TYPES, AUTO_FIELD_TYPES, NON_INPUT_FIELD_TYPES } from '@/types/dynamic-app';
import FieldDisplay from '@/components/dynamic-app/FieldDisplay';
import RelatedRecordsSection from '@/components/dynamic-app/RelatedRecordsSection';

interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  body: string;
  created_at: string;
  updated_at: string;
}

interface ProcessState {
  enabled: boolean;
  current_status_id: string | null;
  current_status_name: string | null;
  is_final: boolean;
  available_actions: Array<{
    id: string;
    name: string;
    to_status_id: string;
    to_status_name: string;
  }>;
  logs: Array<{
    id: string;
    from_status_name: string;
    to_status_name: string;
    executed_by_name: string;
    executed_at: string;
    comment: string | null;
    action_id: string;
  }>;
}

interface HistoryEntry {
  id: string;
  field_code: string;
  old_value: unknown;
  new_value: unknown;
  changed_by: string;
  changed_by_name: string;
  changed_at: string;
}

interface DynamicDetailContentProps {
  locale: string;
  appCode: string;
  appName: string;
  fields: FieldDefinition[];
  record: AppRecord;
  enableComments?: boolean;
  enableHistory?: boolean;
}

export default function DynamicDetailContent({
  locale,
  appCode,
  appName,
  fields,
  record,
  enableComments = true,
  enableHistory = true,
}: DynamicDetailContentProps) {
  const router = useRouter();
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';

  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('detail');

  // コメント状態
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // 履歴状態
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // プロセス状態
  const [processState, setProcessState] = useState<ProcessState | null>(null);
  const [processLoading, setProcessLoading] = useState(true);
  const [executingAction, setExecutingAction] = useState<string | null>(null);

  // ラベル
  const editLabel = lang === 'ja' ? '編集' : lang === 'th' ? 'แก้ไข' : 'Edit';
  const copyLabel = lang === 'ja' ? 'コピー' : lang === 'th' ? 'คัดลอก' : 'Copy';
  const deleteLabel = lang === 'ja' ? '削除' : lang === 'th' ? 'ลบ' : 'Delete';
  const deleteConfirm = lang === 'ja' ? 'このレコードを削除しますか？' : lang === 'th' ? 'ลบระเบียนนี้หรือไม่?' : 'Delete this record?';
  const detailTitle = lang === 'ja' ? 'レコード詳細' : lang === 'th' ? 'รายละเอียดระเบียน' : 'Record Details';
  const createdLabel = lang === 'ja' ? '作成日時' : lang === 'th' ? 'สร้างเมื่อ' : 'Created';
  const updatedLabel = lang === 'ja' ? '更新日時' : lang === 'th' ? 'อัปเดตเมื่อ' : 'Updated';

  const tabDetailLabel = lang === 'ja' ? '詳細' : lang === 'th' ? 'รายละเอียด' : 'Details';
  const tabCommentLabel = lang === 'ja' ? 'コメント' : lang === 'th' ? 'ความคิดเห็น' : 'Comments';
  const tabHistoryLabel = lang === 'ja' ? '変更履歴' : lang === 'th' ? 'ประวัติ' : 'History';
  const commentPlaceholder = lang === 'ja' ? 'コメントを入力...' : lang === 'th' ? 'พิมพ์ความคิดเห็น...' : 'Write a comment...';
  const noCommentsText = lang === 'ja' ? 'コメントはありません' : lang === 'th' ? 'ไม่มีความคิดเห็น' : 'No comments yet';
  const noHistoryText = lang === 'ja' ? '変更履歴はありません' : lang === 'th' ? 'ไม่มีประวัติ' : 'No history yet';
  const deleteCommentLabel = lang === 'ja' ? '削除' : lang === 'th' ? 'ลบ' : 'Delete';
  const changedLabel = lang === 'ja' ? 'が変更されました' : lang === 'th' ? 'ถูกเปลี่ยน' : 'was changed';
  const fromLabel = lang === 'ja' ? 'から' : lang === 'th' ? 'จาก' : 'from';
  const toLabel = lang === 'ja' ? 'へ' : lang === 'th' ? 'เป็น' : 'to';

  // プロセス状態取得
  const fetchProcessState = useCallback(async () => {
    try {
      const res = await fetch(`/api/apps/${appCode}/records/${record.id}/process-action`);
      if (res.ok) {
        const data = await res.json();
        setProcessState(data);
      }
    } catch (err) {
      console.error('Failed to fetch process state:', err);
    } finally {
      setProcessLoading(false);
    }
  }, [appCode, record.id]);

  useEffect(() => {
    fetchProcessState();
  }, [fetchProcessState]);

  // アクション実行
  const handleExecuteAction = async (actionId: string, actionName: string) => {
    const confirmMsg = lang === 'ja'
      ? `「${actionName}」を実行しますか？`
      : lang === 'th'
      ? `ดำเนินการ "${actionName}" หรือไม่?`
      : `Execute "${actionName}"?`;
    if (!confirm(confirmMsg)) return;

    setExecutingAction(actionId);
    try {
      const res = await fetch(`/api/apps/${appCode}/records/${record.id}/process-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_id: actionId }),
      });
      if (res.ok) {
        // プロセス状態を再取得
        fetchProcessState();
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to execute action:', err);
    } finally {
      setExecutingAction(null);
    }
  };

  // コメント取得
  const fetchComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/apps/${appCode}/records/${record.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  }, [appCode, record.id]);

  // 履歴取得
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/apps/${appCode}/records/${record.id}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [appCode, record.id]);

  // タブ切替時にデータ取得
  useEffect(() => {
    if (activeTab === 'comments' && comments.length === 0 && !commentsLoading) {
      fetchComments();
    }
    if (activeTab === 'history' && history.length === 0 && !historyLoading) {
      fetchHistory();
    }
  }, [activeTab, comments.length, commentsLoading, fetchComments, history.length, historyLoading, fetchHistory]);

  const handleCopy = () => {
    const copyData: Record<string, unknown> = {};
    for (const field of fields) {
      if (NON_INPUT_FIELD_TYPES.has(field.field_type)) continue;
      if (record.data[field.field_code] !== undefined) {
        copyData[field.field_code] = record.data[field.field_code];
      }
    }
    const encoded = encodeURIComponent(JSON.stringify(copyData));
    router.push(`/${locale}/apps/${appCode}/records/new?prefill=${encoded}`);
  };

  const handleDelete = async () => {
    if (!confirm(deleteConfirm)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/apps/${appCode}/records/${record.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push(`/${locale}/apps/${appCode}`);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/apps/${appCode}/records/${record.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: commentText.trim() }),
      });
      if (res.ok) {
        setCommentText('');
        fetchComments();
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const msg = lang === 'ja' ? 'コメントを削除しますか？' : lang === 'th' ? 'ลบความคิดเห็นหรือไม่?' : 'Delete this comment?';
    if (!confirm(msg)) return;
    try {
      const res = await fetch(`/api/apps/${appCode}/records/${record.id}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  // フィールドラベル解決
  const getFieldLabel = (fieldCode: string): string => {
    const field = fields.find((f) => f.field_code === fieldCode);
    if (!field) return fieldCode;
    return field.label[lang] || field.label.ja || field.field_code;
  };

  // 値の表示用フォーマット
  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return '(empty)';
    if (Array.isArray(val)) return val.join(', ') || '(empty)';
    return String(val) || '(empty)';
  };

  const localeStr = lang === 'ja' ? 'ja-JP' : lang === 'th' ? 'th-TH' : 'en-US';

  // 表示対象フィールド（related_recordsは別セクションで表示）
  const displayFields = fields.filter((f) => !DECORATIVE_FIELD_TYPES.has(f.field_type) && f.field_type !== 'related_records');
  const relatedRecordsFields = fields.filter((f) => f.field_type === 'related_records' && f.validation?.related_app_code);
  const hasAutoFields = fields.some((f) => AUTO_FIELD_TYPES.has(f.field_type));

  // フィールドのグリッド配置
  const fieldRows: FieldDefinition[][] = [];
  let currentRow: FieldDefinition[] = [];
  let currentRowWidth = 0;

  for (const field of displayFields) {
    const span = (field.field_type === 'subtable') ? 2 : (field.col_span || 2);
    if (currentRowWidth + span > 2 && currentRow.length > 0) {
      fieldRows.push(currentRow);
      currentRow = [];
      currentRowWidth = 0;
    }
    currentRow.push(field);
    currentRowWidth += span;
    if (currentRowWidth >= 2) {
      fieldRows.push(currentRow);
      currentRow = [];
      currentRowWidth = 0;
    }
  }
  if (currentRow.length > 0) fieldRows.push(currentRow);

  const tabItems = [
    { key: 'detail', label: tabDetailLabel },
    ...(enableComments ? [{ key: 'comments', label: tabCommentLabel, icon: <MessageSquare className="w-4 h-4" />, badge: comments.length > 0 ? comments.length : undefined }] : []),
    ...(enableHistory ? [{ key: 'history', label: tabHistoryLabel, icon: <History className="w-4 h-4" /> }] : []),
  ];

  return (
    <div className={detailStyles.pageWrapper}>
      <DetailPageHeader
        title={`${appName} - #${record.record_number}`}
        backHref={`/${locale}/apps/${appCode}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/apps/${appCode}/records/${record.id}/edit`)}
              className={detailStyles.secondaryButton}
            >
              <Pencil className="w-4 h-4 mr-1.5" />
              {editLabel}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className={detailStyles.secondaryButton}
            >
              <Copy className="w-4 h-4 mr-1.5" />
              {copyLabel}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={detailStyles.dangerButton}
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
              {deleteLabel}
            </button>
          </div>
        }
      />

      {/* プロセス管理セクション */}
      {!processLoading && processState?.enabled && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* 現在のステータス */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {lang === 'ja' ? 'ステータス' : lang === 'th' ? 'สถานะ' : 'Status'}:
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                processState.is_final
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
              }`}>
                {processState.current_status_name || '-'}
              </span>
            </div>

            {/* アクションボタン */}
            {!processState.is_final && processState.available_actions.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                {processState.available_actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => handleExecuteAction(action.id, action.name)}
                    disabled={executingAction !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {executingAction === action.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    {action.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* プロセスログ */}
          {processState.logs.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <details className="group">
                <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {lang === 'ja' ? 'プロセス履歴' : lang === 'th' ? 'ประวัติกระบวนการ' : 'Process Log'}
                  ({processState.logs.length})
                </summary>
                <div className="mt-2 space-y-1.5">
                  {processState.logs.map((log) => (
                    <div key={log.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="text-gray-400 dark:text-gray-500 min-w-[100px]">
                        {new Date(log.executed_at).toLocaleString(localeStr)}
                      </span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{log.executed_by_name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{log.from_status_name}</span>
                      <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{log.to_status_name}</span>
                      {log.comment && (
                        <span className="text-gray-400 italic truncate max-w-[200px]">{log.comment}</span>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      )}

      {/* タブ */}
      <div className="mb-4">
        <Tabs tabs={tabItems} activeTab={activeTab} onTabChange={setActiveTab} variant="underline" />
      </div>

      {/* 詳細タブ */}
      <TabPanel value="detail" activeValue={activeTab}>
        <div className={detailStyles.card}>
          <div className={detailStyles.cardHeaderWithBg}>
            <h3 className={detailStyles.cardTitle}>{detailTitle}</h3>
          </div>
          <div className={detailStyles.cardContent}>
            <div className="space-y-4">
              {fieldRows.map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className={row.length > 1 || row[0]?.col_span === 1 ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}
                >
                  {row.map((field) => (
                    <div key={field.id}>
                      <p className={detailStyles.fieldLabel}>
                        {field.label[lang] || field.label.ja || field.field_code}
                      </p>
                      <FieldDisplay
                        field={field}
                        value={record.data[field.field_code]}
                        locale={locale}
                        record={record}
                      />
                    </div>
                  ))}
                </div>
              ))}

              {!hasAutoFields && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className={detailStyles.fieldLabel}>{createdLabel}</p>
                      <p className={detailStyles.fieldValue}>
                        {new Date(record.created_at).toLocaleString(localeStr)}
                      </p>
                    </div>
                    <div>
                      <p className={detailStyles.fieldLabel}>{updatedLabel}</p>
                      <p className={detailStyles.fieldValue}>
                        {new Date(record.updated_at).toLocaleString(localeStr)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 関連レコードセクション */}
              {relatedRecordsFields.map((rrField) => (
                <RelatedRecordsSection
                  key={rrField.id}
                  field={rrField}
                  record={record}
                  appCode={appCode}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        </div>
      </TabPanel>

      {/* コメントタブ */}
      <TabPanel value="comments" activeValue={activeTab}>
        <div className={detailStyles.card}>
          <div className={detailStyles.cardContent}>
            {/* コメント投稿フォーム */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={commentPlaceholder}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:placeholder-gray-500 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleSubmitComment();
                    }
                  }}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {lang === 'ja' ? '⌘+Enter で送信' : lang === 'th' ? '⌘+Enter เพื่อส่ง' : '⌘+Enter to send'}
                  </span>
                  <button
                    type="button"
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || submittingComment}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submittingComment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {lang === 'ja' ? '送信' : lang === 'th' ? 'ส่ง' : 'Send'}
                  </button>
                </div>
              </div>
            </div>

            {/* コメント一覧 */}
            {commentsLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="w-5 h-5 mx-auto animate-spin text-gray-400" />
              </div>
            ) : comments.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {noCommentsText}
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="group flex gap-3">
                    {/* アバター */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                      <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
                        {comment.user_name.charAt(0)}
                      </span>
                    </div>
                    {/* 吹き出し */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {comment.user_name}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(comment.created_at).toLocaleString(localeStr)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="ml-auto opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 transition-all"
                            title={deleteCommentLabel}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                          {comment.body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </TabPanel>

      {/* 変更履歴タブ */}
      <TabPanel value="history" activeValue={activeTab}>
        <div className={detailStyles.card}>
          <div className={detailStyles.cardContent}>
            {historyLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="w-5 h-5 mx-auto animate-spin text-gray-400" />
              </div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {noHistoryText}
              </div>
            ) : (
              <div className="relative">
                {/* タイムライン */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-6">
                  {history.map((entry) => (
                    <div key={entry.id} className="relative flex gap-4 pl-10">
                      {/* タイムラインドット */}
                      <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-brand-500 dark:bg-brand-400 ring-2 ring-white dark:ring-gray-900" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {entry.changed_by_name}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(entry.changed_at).toLocaleString(localeStr)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {getFieldLabel(entry.field_code)}
                          </span>
                          {' '}{changedLabel}
                        </div>
                        <div className="mt-1.5 flex items-start gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 max-w-[45%] truncate">
                            {fromLabel}: {formatValue(entry.old_value)}
                          </span>
                          <span className="text-gray-400 mt-1">→</span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 max-w-[45%] truncate">
                            {toLabel}: {formatValue(entry.new_value)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </TabPanel>
    </div>
  );
}
