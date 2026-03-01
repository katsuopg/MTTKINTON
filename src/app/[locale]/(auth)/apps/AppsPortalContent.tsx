'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { detailStyles } from '@/components/ui/DetailStyles';
import { useNavPermissions } from '@/hooks/useNavPermissions';
import {
  Plus, FileText, Hash, Calendar, ChevronDown, CheckSquare, AlignLeft,
  Briefcase, Users, ShoppingCart, Clipboard, Database, Settings,
  Star, Heart, Zap, Globe, BookOpen, Layers, Package, Truck,
  Search, Copy, Save, Trash2, RotateCcw, MoreVertical, AlertTriangle,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  FileText, Hash, Calendar, ChevronDown, CheckSquare, AlignLeft,
  Briefcase, Users, ShoppingCart, Clipboard, Database, Settings,
  Star, Heart, Zap, Globe, BookOpen, Layers, Package, Truck,
};

interface App {
  id: string;
  code: string;
  name: string;
  name_en: string | null;
  name_th: string | null;
  description: string | null;
  app_type: string;
  icon: string | null;
  color: string | null;
  deleted_at?: string | null;
}

interface AppsPortalContentProps {
  locale: string;
  apps: App[];
  recordCounts: Record<string, number>;
}

export default function AppsPortalContent({ locale, apps, recordCounts }: AppsPortalContentProps) {
  const router = useRouter();
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const { isAdmin } = useNavPermissions();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'static' | 'dynamic'>('all');
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedApps, setDeletedApps] = useState<App[]>([]);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // コピーモーダル
  const [copyTarget, setCopyTarget] = useState<App | null>(null);
  const [copyCode, setCopyCode] = useState('');
  const [copyName, setCopyName] = useState('');

  // テンプレート保存モーダル
  const [templateTarget, setTemplateTarget] = useState<App | null>(null);
  const [templateName, setTemplateName] = useState('');

  // 確認ダイアログ
  const [confirmAction, setConfirmAction] = useState<{ type: 'restore' | 'permanentDelete'; app: App } | null>(null);

  // テンプレート一覧
  const [templates, setTemplates] = useState<{ id: string; name: string; name_en?: string; name_th?: string; description?: string; icon?: string; color?: string; is_system?: boolean }[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  const t = {
    ja: {
      static: 'システム', dynamic: 'カスタム', all: 'すべて', deleted: '削除済み',
      add: '新規アプリ作成', search: 'アプリを検索...', records: '件',
      noApps: 'アプリが見つかりません', noDeletedApps: '削除済みアプリはありません',
      copy: 'コピー', saveTemplate: 'テンプレート保存', delete: '削除',
      restore: '復旧', permanentDelete: '完全削除',
      copyTitle: 'アプリをコピー', copyCode: '新しいアプリコード', copyAppName: '新しいアプリ名',
      copySubmit: 'コピー作成', copying: 'コピー中...',
      templateTitle: 'テンプレートとして保存', templateNameLabel: 'テンプレート名',
      templateSubmit: '保存', templateSaving: '保存中...',
      restoreConfirm: 'このアプリを復旧しますか？', permanentDeleteConfirm: 'このアプリを完全に削除しますか？この操作は取り消せません。',
      yes: 'はい', cancel: 'キャンセル', deletedAt: '削除日時',
    },
    en: {
      static: 'System', dynamic: 'Custom', all: 'All', deleted: 'Deleted',
      add: 'Create New App', search: 'Search apps...', records: 'records',
      noApps: 'No apps found', noDeletedApps: 'No deleted apps',
      copy: 'Copy', saveTemplate: 'Save as Template', delete: 'Delete',
      restore: 'Restore', permanentDelete: 'Permanently Delete',
      copyTitle: 'Copy App', copyCode: 'New App Code', copyAppName: 'New App Name',
      copySubmit: 'Create Copy', copying: 'Copying...',
      templateTitle: 'Save as Template', templateNameLabel: 'Template Name',
      templateSubmit: 'Save', templateSaving: 'Saving...',
      restoreConfirm: 'Restore this app?', permanentDeleteConfirm: 'Permanently delete this app? This cannot be undone.',
      yes: 'Yes', cancel: 'Cancel', deletedAt: 'Deleted at',
    },
    th: {
      static: 'ระบบ', dynamic: 'กำหนดเอง', all: 'ทั้งหมด', deleted: 'ลบแล้ว',
      add: 'สร้างแอปใหม่', search: 'ค้นหาแอป...', records: 'รายการ',
      noApps: 'ไม่พบแอป', noDeletedApps: 'ไม่มีแอปที่ลบแล้ว',
      copy: 'คัดลอก', saveTemplate: 'บันทึกเป็นเทมเพลต', delete: 'ลบ',
      restore: 'กู้คืน', permanentDelete: 'ลบถาวร',
      copyTitle: 'คัดลอกแอป', copyCode: 'รหัสแอปใหม่', copyAppName: 'ชื่อแอปใหม่',
      copySubmit: 'สร้างสำเนา', copying: 'กำลังคัดลอก...',
      templateTitle: 'บันทึกเป็นเทมเพลต', templateNameLabel: 'ชื่อเทมเพลต',
      templateSubmit: 'บันทึก', templateSaving: 'กำลังบันทึก...',
      restoreConfirm: 'กู้คืนแอปนี้หรือไม่?', permanentDeleteConfirm: 'ลบแอปนี้ถาวรหรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้',
      yes: 'ใช่', cancel: 'ยกเลิก', deletedAt: 'ลบเมื่อ',
    },
  }[lang];

  const filteredApps = apps.filter((app) => {
    if (filter !== 'all' && app.app_type !== filter) return false;
    if (search) {
      const name = app.name.toLowerCase();
      const nameEn = (app.name_en || '').toLowerCase();
      const q = search.toLowerCase();
      if (!name.includes(q) && !nameEn.includes(q) && !app.code.includes(q)) return false;
    }
    return true;
  });

  // 削除済みアプリ取得
  const fetchDeletedApps = useCallback(async () => {
    setLoadingDeleted(true);
    try {
      const res = await fetch('/api/apps?include_deleted=true&type=dynamic');
      if (res.ok) {
        const data = await res.json();
        setDeletedApps(data.apps || []);
      }
    } catch { /* skip */ }
    setLoadingDeleted(false);
  }, []);

  const handleShowDeleted = () => {
    setShowDeleted(!showDeleted);
    if (!showDeleted) fetchDeletedApps();
  };

  // アプリコピー
  const handleCopy = async () => {
    if (!copyTarget || !copyCode || !copyName) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/apps/${copyTarget.code}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: copyCode, name: copyName }),
      });
      if (res.ok) {
        setCopyTarget(null);
        router.refresh();
      }
    } catch { /* skip */ }
    setActionLoading(false);
  };

  // テンプレート保存
  const handleSaveTemplate = async () => {
    if (!templateTarget || !templateName) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/apps/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appCode: templateTarget.code, name: templateName }),
      });
      if (res.ok) {
        setTemplateTarget(null);
      }
    } catch { /* skip */ }
    setActionLoading(false);
  };

  // アプリ復旧
  const handleRestore = async (app: App) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/apps/${app.code}/restore`, { method: 'POST' });
      if (res.ok) {
        setDeletedApps(prev => prev.filter(a => a.id !== app.id));
        setConfirmAction(null);
        router.refresh();
      }
    } catch { /* skip */ }
    setActionLoading(false);
  };

  // テンプレート取得
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/apps/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch { /* skip */ }
    setTemplatesLoaded(true);
  }, []);

  const handleShowTemplates = () => {
    setShowTemplates(!showTemplates);
    if (!templatesLoaded) fetchTemplates();
  };

  // テンプレート削除
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/apps/templates/${templateId}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
      }
    } catch { /* skip */ }
  };

  // 完全削除
  const handlePermanentDelete = async (app: App) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/apps/${app.code}/permanent-delete`, { method: 'DELETE' });
      if (res.ok) {
        setDeletedApps(prev => prev.filter(a => a.id !== app.id));
        setConfirmAction(null);
      }
    } catch { /* skip */ }
    setActionLoading(false);
  };

  const getAppName = (app: App) => {
    if (lang === 'en' && app.name_en) return app.name_en;
    if (lang === 'th' && app.name_th) return app.name_th;
    return app.name;
  };

  const getAppPath = (app: App) => {
    if (app.app_type === 'dynamic') return `/${locale}/apps/${app.code}`;
    // 静的アプリは既存のルートへ
    const staticRouteMap: Record<string, string> = {
      work_numbers: 'workno',
      projects: 'project-management',
      customers: 'customers',
      suppliers: 'suppliers',
      employees: 'employees',
      quotations: 'quotation',
      orders: 'order-management',
      purchase_orders: 'po-management',
      invoices: 'invoice-management',
      machines: 'machines',
    };
    const route = staticRouteMap[app.code] || app.code;
    return `/${locale}/${route}`;
  };

  return (
    <div className={detailStyles.pageWrapper}>
      {/* 検索・フィルター・作成ボタン */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'static', 'dynamic'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                filter === f
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? t.all : f === 'static' ? t.static : t.dynamic}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <button
              onClick={handleShowTemplates}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                showTemplates
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <Layers className="w-3 h-3 inline mr-1" />
              {lang === 'ja' ? 'テンプレート' : lang === 'th' ? 'เทมเพลต' : 'Templates'}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={handleShowDeleted}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                showDeleted
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <Trash2 className="w-3 h-3 inline mr-1" />
              {t.deleted}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => router.push(`/${locale}/apps/new`)}
              className={detailStyles.primaryButton}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {t.add}
            </button>
          )}
        </div>
      </div>

      {/* テンプレートセクション */}
      {showTemplates && isAdmin && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            {lang === 'ja' ? 'テンプレート' : lang === 'th' ? 'เทมเพลต' : 'Templates'}
          </h3>
          {!templatesLoaded ? (
            <p className="text-sm text-gray-400 py-4">Loading...</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-4">
              {lang === 'ja' ? 'テンプレートがありません' : lang === 'th' ? 'ไม่มีเทมเพลต' : 'No templates'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {templates.map((tmpl) => {
                const Icon = ICON_MAP[tmpl.icon || ''] || FileText;
                const tmplName = lang === 'en' && tmpl.name_en ? tmpl.name_en : lang === 'th' && tmpl.name_th ? tmpl.name_th : tmpl.name;
                return (
                  <div
                    key={tmpl.id}
                    className="relative rounded-xl border border-purple-200 bg-purple-50/30 dark:border-purple-900/50 dark:bg-purple-900/10 p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                        style={{ backgroundColor: tmpl.color || '#8B5CF6' }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate">{tmplName}</h3>
                        {tmpl.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{tmpl.description}</p>
                        )}
                        {tmpl.is_system && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded mt-1 inline-block">
                            System
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => router.push(`/${locale}/apps/new?templateId=${tmpl.id}`)}
                        className="flex-1 py-1.5 px-2 text-xs font-medium rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50 transition-colors"
                      >
                        <Plus className="w-3 h-3 inline mr-1" />
                        {lang === 'ja' ? 'このテンプレートから作成' : lang === 'th' ? 'สร้างจากเทมเพลตนี้' : 'Create from template'}
                      </button>
                      {!tmpl.is_system && (
                        <button
                          onClick={() => handleDeleteTemplate(tmpl.id)}
                          className="py-1.5 px-2 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <hr className="mt-6 border-gray-200 dark:border-gray-700" />
        </div>
      )}

      {/* 削除済みアプリセクション */}
      {showDeleted && isAdmin && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-1.5">
            <Trash2 className="w-4 h-4" />
            {t.deleted}
          </h3>
          {loadingDeleted ? (
            <p className="text-sm text-gray-400 py-4">Loading...</p>
          ) : deletedApps.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-4">{t.noDeletedApps}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {deletedApps.map((app) => {
                const Icon = ICON_MAP[app.icon || ''] || FileText;
                return (
                  <div
                    key={app.id}
                    className="relative rounded-xl border border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-900/10 p-5 opacity-70"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-300 text-white flex-shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 truncate">
                          {getAppName(app)}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{app.code}</p>
                        {app.deleted_at && (
                          <p className="text-[10px] text-red-500 mt-1">
                            {t.deletedAt}: {new Date(app.deleted_at).toLocaleDateString(lang === 'ja' ? 'ja-JP' : lang === 'th' ? 'th-TH' : 'en-US')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setConfirmAction({ type: 'restore', app })}
                        className="flex-1 py-1.5 px-2 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3 inline mr-1" />
                        {t.restore}
                      </button>
                      <button
                        onClick={() => setConfirmAction({ type: 'permanentDelete', app })}
                        className="flex-1 py-1.5 px-2 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 inline mr-1" />
                        {t.permanentDelete}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <hr className="mt-6 border-gray-200 dark:border-gray-700" />
        </div>
      )}

      {/* アプリカード一覧 */}
      {filteredApps.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">{t.noApps}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredApps.map((app) => {
            const Icon = ICON_MAP[app.icon || ''] || FileText;
            const color = app.color || '#6366F1';
            const isMenuOpen = menuOpenFor === app.id;
            return (
              <div
                key={app.id}
                className="group relative rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/[0.03] p-5 cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all"
              >
                {/* コンテキストメニューボタン（動的アプリ + 管理者のみ） */}
                {isAdmin && app.app_type === 'dynamic' && (
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenFor(isMenuOpen ? null : app.id);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {isMenuOpen && (
                      <div
                        className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setCopyTarget(app);
                            setCopyCode(app.code + '_copy');
                            setCopyName(app.name + ' (Copy)');
                            setMenuOpenFor(null);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {t.copy}
                        </button>
                        <button
                          onClick={() => {
                            setTemplateTarget(app);
                            setTemplateName(app.name + ' Template');
                            setMenuOpenFor(null);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {t.saveTemplate}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div onClick={() => router.push(getAppPath(app))}>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                        {getAppName(app)}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                        {app.code}
                      </p>
                    </div>
                  </div>
                  {app.description && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {app.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      app.app_type === 'dynamic'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {app.app_type === 'dynamic' ? t.dynamic : t.static}
                    </span>
                    {app.app_type === 'dynamic' && recordCounts[app.code] !== undefined && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {recordCounts[app.code]} {t.records}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* メニュー外クリックで閉じる */}
      {menuOpenFor && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenFor(null)} />
      )}

      {/* コピーモーダル */}
      {copyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t.copyTitle}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.copyAppName}</label>
                <input
                  type="text"
                  value={copyName}
                  onChange={(e) => setCopyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.copyCode}</label>
                <input
                  type="text"
                  value={copyCode}
                  onChange={(e) => setCopyCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setCopyTarget(null)}
                className={detailStyles.secondaryButton}
              >
                {t.cancel}
              </button>
              <button
                onClick={handleCopy}
                disabled={actionLoading || !copyCode || !copyName}
                className={`${detailStyles.primaryButton} ${actionLoading ? 'opacity-50' : ''}`}
              >
                {actionLoading ? t.copying : t.copySubmit}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* テンプレート保存モーダル */}
      {templateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t.templateTitle}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.templateNameLabel}</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setTemplateTarget(null)}
                className={detailStyles.secondaryButton}
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={actionLoading || !templateName}
                className={`${detailStyles.primaryButton} ${actionLoading ? 'opacity-50' : ''}`}
              >
                {actionLoading ? t.templateSaving : t.templateSubmit}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 確認ダイアログ */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className={`w-6 h-6 ${confirmAction.type === 'permanentDelete' ? 'text-red-500' : 'text-amber-500'}`} />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {confirmAction.type === 'restore' ? t.restore : t.permanentDelete}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium">{getAppName(confirmAction.app)}</span> ({confirmAction.app.code})
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {confirmAction.type === 'restore' ? t.restoreConfirm : t.permanentDeleteConfirm}
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setConfirmAction(null)}
                className={detailStyles.secondaryButton}
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'restore') handleRestore(confirmAction.app);
                  else handlePermanentDelete(confirmAction.app);
                }}
                disabled={actionLoading}
                className={`${confirmAction.type === 'permanentDelete'
                  ? 'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700'
                  : detailStyles.primaryButton
                } ${actionLoading ? 'opacity-50' : ''}`}
              >
                {t.yes}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
