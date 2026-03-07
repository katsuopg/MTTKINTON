'use client';

import { useState, useEffect, useCallback } from 'react';
import { tableStyles } from '@/components/ui/TableStyles';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Trash2, Copy, Check, AlertTriangle, Key, X, Shield } from 'lucide-react';

interface ApiTokenManagementProps {
  locale: string;
}

interface ApiToken {
  id: string;
  name: string;
  token_prefix: string;
  permissions: string[];
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  is_active: boolean;
}

const PERMISSIONS = [
  { value: 'read', label: { ja: '読み取り', en: 'Read', th: 'อ่าน' } },
  { value: 'write', label: { ja: '書き込み', en: 'Write', th: 'เขียน' } },
  { value: 'admin', label: { ja: '管理者', en: 'Admin', th: 'ผู้ดูแล' } },
];

const EXPIRY_OPTIONS = [
  { value: 30, label: { ja: '30日', en: '30 days', th: '30 วัน' } },
  { value: 60, label: { ja: '60日', en: '60 days', th: '60 วัน' } },
  { value: 90, label: { ja: '90日', en: '90 days', th: '90 วัน' } },
  { value: 365, label: { ja: '365日', en: '365 days', th: '365 วัน' } },
  { value: 0, label: { ja: '無期限', en: 'No expiry', th: 'ไม่มีวันหมดอายุ' } },
];

const i18n = {
  ja: {
    title: 'APIトークン管理',
    createNew: '新規作成',
    name: 'トークン名',
    prefix: 'プレフィックス',
    permissions: '権限',
    lastUsed: '最終使用日時',
    expiresAt: '有効期限',
    createdAt: '作成日',
    actions: '操作',
    delete: '削除',
    noTokens: 'APIトークンはありません',
    loading: '読み込み中...',
    error: 'エラーが発生しました',
    active: '有効',
    inactive: '無効',
    expired: '期限切れ',
    never: '未使用',
    noExpiry: '無期限',
    // ダイアログ
    dialogTitle: '新しいAPIトークンを作成',
    tokenName: 'トークン名',
    tokenNamePlaceholder: '例: CI/CDパイプライン',
    selectPermissions: '権限を選択',
    expiryPeriod: '有効期限',
    cancel: 'キャンセル',
    create: '作成',
    creating: '作成中...',
    // トークン表示
    tokenCreated: 'トークンが作成されました',
    tokenWarning: 'このトークンは一度しか表示されません。安全な場所に保存してください。',
    copied: 'コピーしました',
    copyToken: 'コピー',
    close: '閉じる',
    // 確認
    deleteConfirm: 'このトークンを削除してもよろしいですか？',
    nameRequired: 'トークン名を入力してください',
    permRequired: '権限を1つ以上選択してください',
  },
  en: {
    title: 'API Token Management',
    createNew: 'Create New',
    name: 'Name',
    prefix: 'Prefix',
    permissions: 'Permissions',
    lastUsed: 'Last Used',
    expiresAt: 'Expires',
    createdAt: 'Created',
    actions: 'Actions',
    delete: 'Delete',
    noTokens: 'No API tokens found',
    loading: 'Loading...',
    error: 'An error occurred',
    active: 'Active',
    inactive: 'Inactive',
    expired: 'Expired',
    never: 'Never',
    noExpiry: 'No expiry',
    dialogTitle: 'Create New API Token',
    tokenName: 'Token Name',
    tokenNamePlaceholder: 'e.g. CI/CD Pipeline',
    selectPermissions: 'Select Permissions',
    expiryPeriod: 'Expiry Period',
    cancel: 'Cancel',
    create: 'Create',
    creating: 'Creating...',
    tokenCreated: 'Token Created',
    tokenWarning: 'This token will only be shown once. Please save it in a secure location.',
    copied: 'Copied!',
    copyToken: 'Copy',
    close: 'Close',
    deleteConfirm: 'Are you sure you want to delete this token?',
    nameRequired: 'Please enter a token name',
    permRequired: 'Please select at least one permission',
  },
  th: {
    title: 'จัดการ API Token',
    createNew: 'สร้างใหม่',
    name: 'ชื่อ',
    prefix: 'คำนำหน้า',
    permissions: 'สิทธิ์',
    lastUsed: 'ใช้ล่าสุด',
    expiresAt: 'หมดอายุ',
    createdAt: 'สร้างเมื่อ',
    actions: 'การดำเนินการ',
    delete: 'ลบ',
    noTokens: 'ไม่พบ API Token',
    loading: 'กำลังโหลด...',
    error: 'เกิดข้อผิดพลาด',
    active: 'ใช้งาน',
    inactive: 'ไม่ใช้งาน',
    expired: 'หมดอายุ',
    never: 'ไม่เคย',
    noExpiry: 'ไม่มีวันหมดอายุ',
    dialogTitle: 'สร้าง API Token ใหม่',
    tokenName: 'ชื่อ Token',
    tokenNamePlaceholder: 'เช่น CI/CD Pipeline',
    selectPermissions: 'เลือกสิทธิ์',
    expiryPeriod: 'ระยะเวลาหมดอายุ',
    cancel: 'ยกเลิก',
    create: 'สร้าง',
    creating: 'กำลังสร้าง...',
    tokenCreated: 'สร้าง Token สำเร็จ',
    tokenWarning: 'Token นี้จะแสดงเพียงครั้งเดียว กรุณาบันทึกไว้ในที่ปลอดภัย',
    copied: 'คัดลอกแล้ว!',
    copyToken: 'คัดลอก',
    close: 'ปิด',
    deleteConfirm: 'คุณแน่ใจหรือไม่ที่จะลบ Token นี้?',
    nameRequired: 'กรุณากรอกชื่อ Token',
    permRequired: 'กรุณาเลือกสิทธิ์อย่างน้อย 1 รายการ',
  },
} as const;

function formatDate(dateStr: string | null, locale: string, fallback: string): string {
  if (!dateStr) return fallback;
  const date = new Date(dateStr);
  if (locale === 'ja') return date.toLocaleDateString('ja-JP');
  if (locale === 'th') return date.toLocaleDateString('th-TH');
  return date.toLocaleDateString('en-US');
}

function formatDatetime(dateStr: string | null, locale: string, fallback: string): string {
  if (!dateStr) return fallback;
  const date = new Date(dateStr);
  const opts: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  };
  if (locale === 'ja') return date.toLocaleString('ja-JP', opts);
  if (locale === 'th') return date.toLocaleString('th-TH', opts);
  return date.toLocaleString('en-US', opts);
}

function getTokenStatus(token: ApiToken): 'active' | 'inactive' | 'expired' {
  if (!token.is_active) return 'inactive';
  if (token.expires_at && new Date(token.expires_at) < new Date()) return 'expired';
  return 'active';
}

function getStatusBadge(status: 'active' | 'inactive' | 'expired'): string {
  switch (status) {
    case 'active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'inactive': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    case 'expired': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
  }
}

function getPermBadgeColor(perm: string): string {
  switch (perm) {
    case 'read': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'write': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'admin': return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
}

export default function ApiTokenManagement({ locale }: ApiTokenManagementProps) {
  const lang = (locale === 'ja' || locale === 'th' ? locale : 'en') as keyof typeof i18n;
  const t = i18n[lang];

  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 作成ダイアログ
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPermissions, setNewPermissions] = useState<Set<string>>(new Set());
  const [newExpiryDays, setNewExpiryDays] = useState(90);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // トークン表示
  const [rawToken, setRawToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/api-tokens');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTokens(data.tokens || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setLoading(false);
    }
  }, [t.error]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleCreate = async () => {
    if (!newName.trim()) {
      setCreateError(t.nameRequired);
      return;
    }
    if (newPermissions.size === 0) {
      setCreateError(t.permRequired);
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      const body: Record<string, unknown> = {
        name: newName.trim(),
        permissions: Array.from(newPermissions),
      };
      if (newExpiryDays > 0) {
        body.expires_in_days = newExpiryDays;
      }

      const res = await fetch('/api/api-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRawToken(data.token?.raw_token || null);
      await fetchTokens();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t.error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      const res = await fetch(`/api/api-tokens?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchTokens();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    }
  };

  const handleCopy = async () => {
    if (!rawToken) return;
    try {
      await navigator.clipboard.writeText(rawToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // フォールバック
      const textarea = document.createElement('textarea');
      textarea.value = rawToken;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeCreateDialog = () => {
    setShowCreateDialog(false);
    setNewName('');
    setNewPermissions(new Set());
    setNewExpiryDays(90);
    setCreateError(null);
    setRawToken(null);
    setCopied(false);
  };

  const togglePermission = (perm: string) => {
    setNewPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  };

  const inputStyle = 'w-full h-10 px-3 text-theme-sm rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300';
  const selectStyle = 'w-full h-10 px-3 text-theme-sm rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300';

  return (
    <div>
      {/* ヘッダー */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Key className="w-4 h-4" />
          <span className="text-theme-sm">{tokens.length} tokens</span>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className={tableStyles.addButton}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          {t.createNew}
        </button>
      </div>

      {/* トークン一覧テーブル */}
      <div className={tableStyles.tableContainer}>
        {loading ? (
          <LoadingSpinner message={t.loading} />
        ) : error ? (
          <div className="px-5 py-10 text-center text-rose-500 dark:text-rose-400">
            <p>{t.error}: {error}</p>
          </div>
        ) : (
          <>
            <div className={tableStyles.desktopOnly}>
              <table className={tableStyles.table}>
                <thead className={tableStyles.thead}>
                  <tr>
                    <th className={tableStyles.th}>{t.name}</th>
                    <th className={tableStyles.th}>{t.prefix}</th>
                    <th className={tableStyles.th}>{t.permissions}</th>
                    <th className={tableStyles.th}>{t.lastUsed}</th>
                    <th className={tableStyles.th}>{t.expiresAt}</th>
                    <th className={tableStyles.th}>{t.actions}</th>
                  </tr>
                </thead>
                <tbody className={tableStyles.tbody}>
                  {tokens.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={tableStyles.emptyRow}>{t.noTokens}</td>
                    </tr>
                  ) : (
                    tokens.map((token) => {
                      const status = getTokenStatus(token);
                      const statusLabel = status === 'active' ? t.active : status === 'expired' ? t.expired : t.inactive;
                      return (
                        <tr key={token.id} className={tableStyles.tr}>
                          <td className={`${tableStyles.td} ${tableStyles.tdPrimary}`}>
                            <div className="flex items-center gap-2">
                              {token.name}
                              <span className={`${tableStyles.statusBadge} ${getStatusBadge(status)}`}>
                                {statusLabel}
                              </span>
                            </div>
                          </td>
                          <td className={tableStyles.td}>
                            <code className="text-theme-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 font-mono">
                              {token.token_prefix}...
                            </code>
                          </td>
                          <td className={tableStyles.td}>
                            <div className="flex items-center gap-1">
                              {token.permissions.map((perm) => (
                                <span key={perm} className={`${tableStyles.statusBadge} ${getPermBadgeColor(perm)}`}>
                                  {perm}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className={`${tableStyles.td} tabular-nums`}>
                            {formatDatetime(token.last_used_at, locale, t.never)}
                          </td>
                          <td className={`${tableStyles.td} tabular-nums`}>
                            {token.expires_at
                              ? formatDate(token.expires_at, locale, t.noExpiry)
                              : t.noExpiry}
                          </td>
                          <td className={tableStyles.td}>
                            <button
                              onClick={() => handleDelete(token.id)}
                              className={tableStyles.deleteButton}
                              title={t.delete}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* モバイルカードビュー */}
            <div className={tableStyles.mobileCardList}>
              {tokens.length === 0 ? (
                <div className="px-4 py-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                  {t.noTokens}
                </div>
              ) : (
                tokens.map((token) => {
                  const status = getTokenStatus(token);
                  const statusLabel = status === 'active' ? t.active : status === 'expired' ? t.expired : t.inactive;
                  return (
                    <div key={token.id} className={tableStyles.mobileCard}>
                      <div className={tableStyles.mobileCardHeader}>
                        <span className={tableStyles.mobileCardTitle}>{token.name}</span>
                        <span className={`${tableStyles.statusBadge} ${getStatusBadge(status)}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <div className={tableStyles.mobileCardSubtitle}>
                        <code className="font-mono">{token.token_prefix}...</code>
                      </div>
                      <div className={tableStyles.mobileCardFields}>
                        <div>
                          <span className={tableStyles.mobileCardFieldLabel}>{t.permissions}: </span>
                          <span className={tableStyles.mobileCardFieldValue}>{token.permissions.join(', ')}</span>
                        </div>
                        <div>
                          <span className={tableStyles.mobileCardFieldLabel}>{t.expiresAt}: </span>
                          <span className={tableStyles.mobileCardFieldValue}>
                            {token.expires_at ? formatDate(token.expires_at, locale, t.noExpiry) : t.noExpiry}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button onClick={() => handleDelete(token.id)} className={tableStyles.deleteButton}>
                          <Trash2 className="w-4 h-4 mr-1" />
                          {t.delete}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* 作成ダイアログ（モーダル） */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* オーバーレイ */}
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            onClick={closeCreateDialog}
          />

          {/* ダイアログ本体 */}
          <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-500" />
                {t.dialogTitle}
              </h3>
              <button
                onClick={closeCreateDialog}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-white/[0.05] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {/* トークンが作成された場合 */}
              {rawToken ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">{t.tokenCreated}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-theme-sm text-amber-700 dark:text-amber-300">{t.tokenWarning}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-theme-sm font-mono text-gray-800 dark:text-gray-200 break-all select-all">
                      {rawToken}
                    </code>
                    <button
                      onClick={handleCopy}
                      className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-theme-sm font-medium transition-colors ${
                        copied
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-brand-500 text-white hover:bg-brand-600'
                      }`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? t.copied : t.copyToken}
                    </button>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={closeCreateDialog}
                      className="px-4 py-2 rounded-lg text-theme-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                    >
                      {t.close}
                    </button>
                  </div>
                </div>
              ) : (
                /* 作成フォーム */
                <div className="space-y-4">
                  {createError && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 dark:bg-rose-900/20 dark:border-rose-700">
                      <p className="text-theme-sm text-rose-600 dark:text-rose-400">{createError}</p>
                    </div>
                  )}

                  {/* トークン名 */}
                  <div>
                    <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t.tokenName}
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={t.tokenNamePlaceholder}
                      className={inputStyle}
                      autoFocus
                    />
                  </div>

                  {/* 権限 */}
                  <div>
                    <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t.selectPermissions}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PERMISSIONS.map((perm) => (
                        <label
                          key={perm.value}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                            newPermissions.has(perm.value)
                              ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-900/20 dark:text-brand-300'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={newPermissions.has(perm.value)}
                            onChange={() => togglePermission(perm.value)}
                            className="sr-only"
                          />
                          <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                            newPermissions.has(perm.value)
                              ? 'bg-brand-500 border-brand-500'
                              : 'border-gray-400 dark:border-gray-500'
                          }`}>
                            {newPermissions.has(perm.value) && <Check className="w-3 h-3 text-white" />}
                          </span>
                          <span className="text-theme-sm font-medium">{perm.label[lang]}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 有効期限 */}
                  <div>
                    <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t.expiryPeriod}
                    </label>
                    <select
                      value={newExpiryDays}
                      onChange={(e) => setNewExpiryDays(Number(e.target.value))}
                      className={selectStyle}
                    >
                      {EXPIRY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label[lang]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ボタン */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={closeCreateDialog}
                      className="px-4 py-2 rounded-lg text-theme-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                    >
                      {t.cancel}
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={creating}
                      className={`${tableStyles.addButton} ${creating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {creating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                          {t.creating}
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1.5" />
                          {t.create}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
