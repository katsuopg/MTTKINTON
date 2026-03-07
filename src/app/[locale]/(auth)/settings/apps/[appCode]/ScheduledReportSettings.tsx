'use client';

import { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Trash2, Clock, FileBarChart, Calendar } from 'lucide-react';

interface ScheduledReportSettingsProps {
  locale: string;
  appCode: string;
}

interface ScheduledReport {
  id: string;
  name: string;
  report_type: string;
  schedule_type: string;
  schedule_day: number | null;
  schedule_hour: number | null;
  notify_type: string;
  notify_target_id: string | null;
  last_run_at: string | null;
  last_result: Record<string, unknown> | null;
  created_at: string;
  app?: { code: string; name: string };
}

const translations = {
  ja: {
    title: '定期レポート',
    description: 'アプリデータの定期レポートを設定します。',
    add: 'レポート追加',
    name: 'レポート名',
    reportType: 'レポート種別',
    summary: 'サマリー',
    detail: '詳細',
    schedule: 'スケジュール',
    frequency: '頻度',
    daily: '毎日',
    weekly: '毎週',
    monthly: '毎月',
    dayOfWeek: '曜日',
    dayOfMonth: '日',
    hour: '時間',
    notifyType: '通知先タイプ',
    creator: '作成者',
    user: 'ユーザー',
    role: 'ロール',
    organization: '組織',
    save: '保存',
    cancel: 'キャンセル',
    delete: '削除',
    deleteConfirm: 'このレポートを削除しますか？',
    noReports: '定期レポートが設定されていません',
    lastRun: '最終実行',
    never: '未実行',
    result: '結果',
    records: '件',
    weekdays: ['日', '月', '火', '水', '木', '金', '土'],
  },
  en: {
    title: 'Scheduled Reports',
    description: 'Configure periodic reports for app data.',
    add: 'Add Report',
    name: 'Report Name',
    reportType: 'Report Type',
    summary: 'Summary',
    detail: 'Detail',
    schedule: 'Schedule',
    frequency: 'Frequency',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    dayOfWeek: 'Day of Week',
    dayOfMonth: 'Day',
    hour: 'Hour',
    notifyType: 'Notify Type',
    creator: 'Creator',
    user: 'User',
    role: 'Role',
    organization: 'Organization',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    deleteConfirm: 'Delete this report?',
    noReports: 'No scheduled reports configured',
    lastRun: 'Last Run',
    never: 'Never',
    result: 'Result',
    records: 'records',
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
  th: {
    title: 'รายงานตามกำหนด',
    description: 'กำหนดค่ารายงานเป็นระยะสำหรับข้อมูลแอป',
    add: 'เพิ่มรายงาน',
    name: 'ชื่อรายงาน',
    reportType: 'ประเภทรายงาน',
    summary: 'สรุป',
    detail: 'รายละเอียด',
    schedule: 'กำหนดการ',
    frequency: 'ความถี่',
    daily: 'ทุกวัน',
    weekly: 'ทุกสัปดาห์',
    monthly: 'ทุกเดือน',
    dayOfWeek: 'วันในสัปดาห์',
    dayOfMonth: 'วันที่',
    hour: 'เวลา',
    notifyType: 'ประเภทการแจ้งเตือน',
    creator: 'ผู้สร้าง',
    user: 'ผู้ใช้',
    role: 'บทบาท',
    organization: 'องค์กร',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    deleteConfirm: 'ลบรายงานนี้หรือไม่?',
    noReports: 'ยังไม่มีรายงานตามกำหนดที่กำหนดค่า',
    lastRun: 'รันล่าสุด',
    never: 'ไม่เคย',
    result: 'ผลลัพธ์',
    records: 'ระเบียน',
    weekdays: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'],
  },
};

interface FormData {
  name: string;
  report_type: string;
  schedule_type: string;
  schedule_day: number;
  schedule_hour: number;
  notify_type: string;
  notify_target_id: string;
}

const defaultForm: FormData = {
  name: '',
  report_type: 'summary',
  schedule_type: 'weekly',
  schedule_day: 1,
  schedule_hour: 9,
  notify_type: 'creator',
  notify_target_id: '',
};

export default function ScheduledReportSettings({ locale, appCode }: ScheduledReportSettingsProps) {
  const t = translations[locale as keyof typeof translations] || translations.ja;
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({ ...defaultForm });
  const [saving, setSaving] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch(`/api/scheduled-reports?appCode=${appCode}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch {
      console.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [appCode]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const resetForm = () => {
    setFormData({ ...defaultForm });
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: formData.name,
        app_code: appCode,
        report_type: formData.report_type,
        schedule_type: formData.schedule_type,
        schedule_day: formData.schedule_day,
        schedule_hour: formData.schedule_hour,
        notify_type: formData.notify_type,
      };
      if (formData.notify_target_id) body.notify_target_id = formData.notify_target_id;

      const res = await fetch('/api/scheduled-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await fetchReports();
        resetForm();
      }
    } catch {
      console.error('Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      const res = await fetch(`/api/scheduled-reports?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReports(reports.filter(r => r.id !== id));
      }
    } catch {
      console.error('Failed to delete report');
    }
  };

  const formatSchedule = (report: ScheduledReport) => {
    const hour = report.schedule_hour != null ? `${report.schedule_hour}:00` : '9:00';
    switch (report.schedule_type) {
      case 'daily':
        return `${t.daily} ${hour}`;
      case 'weekly': {
        const dayIdx = report.schedule_day != null ? report.schedule_day : 1;
        const dayName = t.weekdays[dayIdx] || t.weekdays[1];
        return `${t.weekly} ${dayName} ${hour}`;
      }
      case 'monthly': {
        const day = report.schedule_day != null ? report.schedule_day : 1;
        return `${t.monthly} ${day}${locale === 'ja' ? '日' : ''} ${hour}`;
      }
      default:
        return report.schedule_type;
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return t.never;
    const d = new Date(dateStr);
    return d.toLocaleString(locale === 'ja' ? 'ja-JP' : locale === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <LoadingSpinner />;

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent';
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300';

  const renderForm = () => (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.name} *</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className={inputClass}
            placeholder={t.name}
          />
        </div>
        <div>
          <label className={labelClass}>{t.reportType}</label>
          <select
            value={formData.report_type}
            onChange={e => setFormData({ ...formData, report_type: e.target.value })}
            className={inputClass}
          >
            <option value="summary">{t.summary}</option>
            <option value="detail">{t.detail}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>{t.frequency}</label>
          <select
            value={formData.schedule_type}
            onChange={e => setFormData({ ...formData, schedule_type: e.target.value })}
            className={inputClass}
          >
            <option value="daily">{t.daily}</option>
            <option value="weekly">{t.weekly}</option>
            <option value="monthly">{t.monthly}</option>
          </select>
        </div>

        {formData.schedule_type === 'weekly' && (
          <div>
            <label className={labelClass}>{t.dayOfWeek}</label>
            <select
              value={formData.schedule_day}
              onChange={e => setFormData({ ...formData, schedule_day: parseInt(e.target.value) })}
              className={inputClass}
            >
              {t.weekdays.map((day, idx) => (
                <option key={idx} value={idx}>{day}</option>
              ))}
            </select>
          </div>
        )}

        {formData.schedule_type === 'monthly' && (
          <div>
            <label className={labelClass}>{t.dayOfMonth}</label>
            <input
              type="number"
              min={1}
              max={31}
              value={formData.schedule_day}
              onChange={e => setFormData({ ...formData, schedule_day: parseInt(e.target.value) || 1 })}
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label className={labelClass}>{t.hour}</label>
          <select
            value={formData.schedule_hour}
            onChange={e => setFormData({ ...formData, schedule_hour: parseInt(e.target.value) })}
            className={inputClass}
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{`${i}:00`}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.notifyType}</label>
          <select
            value={formData.notify_type}
            onChange={e => setFormData({ ...formData, notify_type: e.target.value })}
            className={inputClass}
          >
            <option value="creator">{t.creator}</option>
            <option value="user">{t.user}</option>
            <option value="role">{t.role}</option>
            <option value="organization">{t.organization}</option>
          </select>
        </div>
        {formData.notify_type !== 'creator' && (
          <div>
            <label className={labelClass}>ID</label>
            <input
              type="text"
              value={formData.notify_target_id}
              onChange={e => setFormData({ ...formData, notify_target_id: e.target.value })}
              className={inputClass}
              placeholder="Target ID"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !formData.name}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {t.save}
        </button>
        <button
          onClick={resetForm}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {t.cancel}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t.title}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t.description}</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            {t.add}
          </button>
        )}
      </div>

      {showForm && renderForm()}

      {reports.length === 0 && !showForm && (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
          <FileBarChart className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t.noReports}</p>
        </div>
      )}

      <div className="space-y-3">
        {reports.map(report => (
          <div
            key={report.id}
            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileBarChart className="h-4 w-4 text-brand-500" />
                  <span className="font-medium text-gray-800 dark:text-white">{report.name}</span>
                  <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {report.report_type === 'summary' ? t.summary : t.detail}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatSchedule(report)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {t.lastRun}: {formatDateTime(report.last_run_at)}
                  </span>
                </div>

                {report.last_result && (
                  <div className="mt-2 rounded bg-gray-50 px-3 py-1.5 text-xs text-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
                    {t.result}: {(report.last_result as Record<string, unknown>).count != null
                      ? `${(report.last_result as Record<string, unknown>).count} ${t.records}`
                      : (report.last_result as Record<string, unknown>).summary
                        ? String((report.last_result as Record<string, unknown>).summary)
                        : JSON.stringify(report.last_result)}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleDelete(report.id)}
                className="ml-2 p-1 text-gray-400 hover:text-red-500"
                title={t.delete}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
