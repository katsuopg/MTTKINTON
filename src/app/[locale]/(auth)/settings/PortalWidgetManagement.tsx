'use client';

import { useState, useEffect, useCallback } from 'react';
import { tableStyles } from '@/components/ui/TableStyles';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Trash2, Pencil, X, LayoutGrid, Megaphone, Bell, BarChart3, Clock } from 'lucide-react';

interface PortalWidgetManagementProps {
  locale: string;
}

interface PortalWidget {
  id: string;
  title: string;
  widget_type: 'announcement' | 'notifications' | 'app_summary' | 'recent_records';
  config: Record<string, unknown>;
  width: 'half' | 'full';
  display_order: number;
}

type WidgetType = PortalWidget['widget_type'];

const WIDGET_TYPES: { value: WidgetType; label: { ja: string; en: string; th: string }; icon: typeof Megaphone }[] = [
  { value: 'announcement', label: { ja: 'お知らせ', en: 'Announcement', th: 'ประกาศ' }, icon: Megaphone },
  { value: 'notifications', label: { ja: '通知', en: 'Notifications', th: 'การแจ้งเตือน' }, icon: Bell },
  { value: 'app_summary', label: { ja: 'アプリ集計', en: 'App Summary', th: 'สรุปแอป' }, icon: BarChart3 },
  { value: 'recent_records', label: { ja: '最新レコード', en: 'Recent Records', th: 'บันทึกล่าสุด' }, icon: Clock },
];

const i18n = {
  ja: {
    title: 'ポータルウィジェット',
    createNew: '新規作成',
    edit: '編集',
    delete: '削除',
    noWidgets: 'ウィジェットはありません',
    loading: '読み込み中...',
    error: 'エラーが発生しました',
    // フォーム
    dialogTitleCreate: 'ウィジェットを作成',
    dialogTitleEdit: 'ウィジェットを編集',
    widgetTitle: 'タイトル',
    widgetTitlePlaceholder: '例: 今月のお知らせ',
    widgetType: 'ウィジェットタイプ',
    widgetWidth: '幅',
    widgetWidthHalf: '半分',
    widgetWidthFull: '全幅',
    displayOrder: '表示順',
    // タイプ別設定
    configSection: 'タイプ別設定',
    content: '内容',
    contentPlaceholder: 'お知らせの内容を入力...',
    limit: '表示件数',
    appCode: 'アプリコード',
    appCodePlaceholder: '例: sales_orders',
    groupBy: 'グループ化フィールド',
    groupByPlaceholder: '例: status（任意）',
    // ボタン
    cancel: 'キャンセル',
    save: '保存',
    saving: '保存中...',
    // 確認
    deleteConfirm: 'このウィジェットを削除してもよろしいですか？',
    titleRequired: 'タイトルを入力してください',
    // カード
    type: 'タイプ',
    width: '幅',
    order: '表示順',
    half: '半分',
    full: '全幅',
  },
  en: {
    title: 'Portal Widgets',
    createNew: 'Create New',
    edit: 'Edit',
    delete: 'Delete',
    noWidgets: 'No widgets found',
    loading: 'Loading...',
    error: 'An error occurred',
    dialogTitleCreate: 'Create Widget',
    dialogTitleEdit: 'Edit Widget',
    widgetTitle: 'Title',
    widgetTitlePlaceholder: 'e.g. Monthly Announcements',
    widgetType: 'Widget Type',
    widgetWidth: 'Width',
    widgetWidthHalf: 'Half',
    widgetWidthFull: 'Full',
    displayOrder: 'Display Order',
    configSection: 'Type Settings',
    content: 'Content',
    contentPlaceholder: 'Enter announcement content...',
    limit: 'Limit',
    appCode: 'App Code',
    appCodePlaceholder: 'e.g. sales_orders',
    groupBy: 'Group By Field',
    groupByPlaceholder: 'e.g. status (optional)',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
    deleteConfirm: 'Are you sure you want to delete this widget?',
    titleRequired: 'Please enter a title',
    type: 'Type',
    width: 'Width',
    order: 'Order',
    half: 'Half',
    full: 'Full',
  },
  th: {
    title: 'วิดเจ็ตพอร์ทัล',
    createNew: 'สร้างใหม่',
    edit: 'แก้ไข',
    delete: 'ลบ',
    noWidgets: 'ไม่พบวิดเจ็ต',
    loading: 'กำลังโหลด...',
    error: 'เกิดข้อผิดพลาด',
    dialogTitleCreate: 'สร้างวิดเจ็ต',
    dialogTitleEdit: 'แก้ไขวิดเจ็ต',
    widgetTitle: 'ชื่อ',
    widgetTitlePlaceholder: 'เช่น ประกาศประจำเดือน',
    widgetType: 'ประเภทวิดเจ็ต',
    widgetWidth: 'ความกว้าง',
    widgetWidthHalf: 'ครึ่ง',
    widgetWidthFull: 'เต็ม',
    displayOrder: 'ลำดับการแสดง',
    configSection: 'การตั้งค่าตามประเภท',
    content: 'เนื้อหา',
    contentPlaceholder: 'ป้อนเนื้อหาประกาศ...',
    limit: 'จำนวนจำกัด',
    appCode: 'รหัสแอป',
    appCodePlaceholder: 'เช่น sales_orders',
    groupBy: 'จัดกลุ่มตาม',
    groupByPlaceholder: 'เช่น status (ไม่บังคับ)',
    cancel: 'ยกเลิก',
    save: 'บันทึก',
    saving: 'กำลังบันทึก...',
    deleteConfirm: 'คุณแน่ใจหรือไม่ที่จะลบวิดเจ็ตนี้?',
    titleRequired: 'กรุณากรอกชื่อ',
    type: 'ประเภท',
    width: 'ความกว้าง',
    order: 'ลำดับ',
    half: 'ครึ่ง',
    full: 'เต็ม',
  },
} as const;

function getWidgetTypeInfo(type: WidgetType) {
  return WIDGET_TYPES.find((wt) => wt.value === type);
}

function getTypeBadgeColor(type: WidgetType): string {
  switch (type) {
    case 'announcement': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'notifications': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'app_summary': return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400';
    case 'recent_records': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  }
}

interface FormState {
  id?: string;
  title: string;
  widget_type: WidgetType;
  width: 'half' | 'full';
  display_order: number;
  config: Record<string, unknown>;
}

const emptyForm: FormState = {
  title: '',
  widget_type: 'announcement',
  width: 'half',
  display_order: 0,
  config: {},
};

export default function PortalWidgetManagement({ locale }: PortalWidgetManagementProps) {
  const lang = (locale === 'ja' || locale === 'th' ? locale : 'en') as keyof typeof i18n;
  const t = i18n[lang];

  const [widgets, setWidgets] = useState<PortalWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フォームダイアログ
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const fetchWidgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/portal-widgets');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWidgets(data.widgets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setLoading(false);
    }
  }, [t.error]);

  useEffect(() => {
    fetchWidgets();
  }, [fetchWidgets]);

  const openCreate = () => {
    setForm({ ...emptyForm, display_order: widgets.length });
    setIsEditMode(false);
    setFormError(null);
    setShowDialog(true);
  };

  const openEdit = (widget: PortalWidget) => {
    setForm({
      id: widget.id,
      title: widget.title,
      widget_type: widget.widget_type,
      width: widget.width,
      display_order: widget.display_order,
      config: { ...widget.config },
    });
    setIsEditMode(true);
    setFormError(null);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setForm(emptyForm);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setFormError(t.titleRequired);
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        widget_type: form.widget_type,
        config: form.config,
        width: form.width,
        display_order: form.display_order,
      };
      if (form.id) {
        body.id = form.id;
      }

      const res = await fetch('/api/portal-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchWidgets();
      closeDialog();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      const res = await fetch(`/api/portal-widgets?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchWidgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    }
  };

  const updateConfig = (key: string, value: unknown) => {
    setForm((prev) => ({
      ...prev,
      config: { ...prev.config, [key]: value },
    }));
  };

  const inputStyle = 'w-full h-10 px-3 text-theme-sm rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300';
  const selectStyle = inputStyle;
  const textareaStyle = 'w-full px-3 py-2 text-theme-sm rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 resize-vertical';
  const labelStyle = 'block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

  const renderTypeConfig = () => {
    switch (form.widget_type) {
      case 'announcement':
        return (
          <div>
            <label className={labelStyle}>{t.content}</label>
            <textarea
              value={(form.config.content as string) || ''}
              onChange={(e) => updateConfig('content', e.target.value)}
              placeholder={t.contentPlaceholder}
              className={textareaStyle}
              rows={4}
            />
          </div>
        );
      case 'notifications':
        return (
          <div>
            <label className={labelStyle}>{t.limit}</label>
            <input
              type="number"
              value={(form.config.limit as number) || 10}
              onChange={(e) => updateConfig('limit', Number(e.target.value))}
              min={1}
              max={100}
              className={inputStyle}
            />
          </div>
        );
      case 'app_summary':
        return (
          <>
            <div>
              <label className={labelStyle}>{t.appCode}</label>
              <input
                type="text"
                value={(form.config.app_code as string) || ''}
                onChange={(e) => updateConfig('app_code', e.target.value)}
                placeholder={t.appCodePlaceholder}
                className={inputStyle}
              />
            </div>
            <div>
              <label className={labelStyle}>{t.groupBy}</label>
              <input
                type="text"
                value={(form.config.group_by as string) || ''}
                onChange={(e) => updateConfig('group_by', e.target.value)}
                placeholder={t.groupByPlaceholder}
                className={inputStyle}
              />
            </div>
          </>
        );
      case 'recent_records':
        return (
          <>
            <div>
              <label className={labelStyle}>{t.appCode}</label>
              <input
                type="text"
                value={(form.config.app_code as string) || ''}
                onChange={(e) => updateConfig('app_code', e.target.value)}
                placeholder={t.appCodePlaceholder}
                className={inputStyle}
              />
            </div>
            <div>
              <label className={labelStyle}>{t.limit}</label>
              <input
                type="number"
                value={(form.config.limit as number) || 5}
                onChange={(e) => updateConfig('limit', Number(e.target.value))}
                min={1}
                max={100}
                className={inputStyle}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {/* ヘッダー */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <LayoutGrid className="w-4 h-4" />
          <span className="text-theme-sm">{widgets.length} widgets</span>
        </div>
        <button
          onClick={openCreate}
          className={tableStyles.addButton}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          {t.createNew}
        </button>
      </div>

      {/* ウィジェット一覧 */}
      {loading ? (
        <LoadingSpinner message={t.loading} />
      ) : error ? (
        <div className="px-5 py-10 text-center text-rose-500 dark:text-rose-400">
          <p>{t.error}: {error}</p>
        </div>
      ) : widgets.length === 0 ? (
        <div className="px-5 py-12 text-center text-gray-500 dark:text-gray-400">
          <LayoutGrid className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-theme-sm">{t.noWidgets}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {widgets.map((widget) => {
            const typeInfo = getWidgetTypeInfo(widget.widget_type);
            const TypeIcon = typeInfo?.icon || LayoutGrid;
            const typeLabel = typeInfo?.label[lang] || widget.widget_type;

            return (
              <div
                key={widget.id}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-white/[0.03] transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <TypeIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <h3 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90 truncate">
                      {widget.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                      onClick={() => openEdit(widget)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:text-brand-400 dark:hover:bg-brand-900/20 transition-colors"
                      title={t.edit}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(widget.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-900/20 transition-colors"
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`${tableStyles.statusBadge} ${getTypeBadgeColor(widget.widget_type)}`}>
                    {typeLabel}
                  </span>
                  <span className={`${tableStyles.statusBadge} bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300`}>
                    {widget.width === 'full' ? t.full : t.half}
                  </span>
                  <span className="text-theme-xs text-gray-400 dark:text-gray-500">
                    {t.order}: {widget.display_order}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 作成/編集ダイアログ */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            onClick={closeDialog}
          />
          <div className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 max-h-[90vh] flex flex-col">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-brand-500" />
                {isEditMode ? t.dialogTitleEdit : t.dialogTitleCreate}
              </h3>
              <button
                onClick={closeDialog}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-white/[0.05] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* フォーム */}
            <div className="p-5 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 dark:bg-rose-900/20 dark:border-rose-700">
                  <p className="text-theme-sm text-rose-600 dark:text-rose-400">{formError}</p>
                </div>
              )}

              {/* タイトル */}
              <div>
                <label className={labelStyle}>{t.widgetTitle} *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={t.widgetTitlePlaceholder}
                  className={inputStyle}
                  autoFocus
                />
              </div>

              {/* ウィジェットタイプ */}
              <div>
                <label className={labelStyle}>{t.widgetType}</label>
                <select
                  value={form.widget_type}
                  onChange={(e) => setForm((prev) => ({ ...prev, widget_type: e.target.value as WidgetType, config: {} }))}
                  className={selectStyle}
                >
                  {WIDGET_TYPES.map((wt) => (
                    <option key={wt.value} value={wt.value}>
                      {wt.label[lang]}
                    </option>
                  ))}
                </select>
              </div>

              {/* 幅 */}
              <div>
                <label className={labelStyle}>{t.widgetWidth}</label>
                <select
                  value={form.width}
                  onChange={(e) => setForm((prev) => ({ ...prev, width: e.target.value as 'half' | 'full' }))}
                  className={selectStyle}
                >
                  <option value="half">{t.widgetWidthHalf}</option>
                  <option value="full">{t.widgetWidthFull}</option>
                </select>
              </div>

              {/* 表示順 */}
              <div>
                <label className={labelStyle}>{t.displayOrder}</label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm((prev) => ({ ...prev, display_order: Number(e.target.value) }))}
                  min={0}
                  className={inputStyle}
                />
              </div>

              {/* タイプ別設定 */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-theme-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  {t.configSection}
                </p>
                <div className="space-y-4">
                  {renderTypeConfig()}
                </div>
              </div>

              {/* ボタン */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={closeDialog}
                  className="px-4 py-2 rounded-lg text-theme-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`${tableStyles.addButton} ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                      {t.saving}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1.5" />
                      {t.save}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
