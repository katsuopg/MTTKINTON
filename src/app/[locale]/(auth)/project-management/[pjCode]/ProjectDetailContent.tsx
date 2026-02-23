'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Tabs, { TabPanel } from '@/components/ui/Tabs';
import DomContainer from '@/components/dom/DomContainer';
import { detailStyles } from '@/components/ui/DetailStyles';
import { DetailPageHeader } from '@/components/ui/DetailPageHeader';
import { FileText, Package, ArrowLeft, Pencil, Save, X, Upload, Image, File, Trash2, ExternalLink } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { ProjectWithRelations, ProjectStatus, EmployeeSummary } from '@/types/project';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';

interface ProjectFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  description: string | null;
  uploaded_at: string;
  url: string | null;
}

interface ProjectDetailContentProps {
  projectCode: string;
  locale: string;
  language: 'ja' | 'en' | 'th';
}

const labels = {
  overview: { ja: '概要', en: 'Overview', th: 'ภาพรวม' },
  parts: { ja: 'DOM', en: 'DOM', th: 'DOM' },
  projectName: { ja: 'プロジェクト名', en: 'Project Name', th: 'ชื่อโครงการ' },
  customer: { ja: '顧客名', en: 'Customer', th: 'ลูกค้า' },
  customerCode: { ja: '顧客コード', en: 'Customer Code', th: 'รหัสลูกค้า' },
  salesPerson: { ja: '担当営業', en: 'Sales Rep', th: 'พนักงานขาย' },
  salesPersonNone: { ja: '未設定', en: 'Not set', th: 'ไม่ได้ตั้งค่า' },
  workNo: { ja: '工事番号', en: 'Work No.', th: 'หมายเลขงาน' },
  status: { ja: 'ステータス', en: 'Status', th: 'สถานะ' },
  startDate: { ja: '開始日', en: 'Start Date', th: 'วันเริ่มต้น' },
  dueDate: { ja: '納期', en: 'Due Date', th: 'กำหนดส่ง' },
  description: { ja: '説明', en: 'Description', th: 'คำอธิบาย' },
  back: { ja: '一覧に戻る', en: 'Back to list', th: 'กลับไปยังรายการ' },
  edit: { ja: '編集', en: 'Edit', th: 'แก้ไข' },
  save: { ja: '保存', en: 'Save', th: 'บันทึก' },
  saving: { ja: '保存中...', en: 'Saving...', th: 'กำลังบันทึก...' },
  cancel: { ja: 'キャンセル', en: 'Cancel', th: 'ยกเลิก' },
  tbd: { ja: '未定', en: 'TBD', th: 'ยังไม่กำหนด' },
  loading: { ja: '読み込み中...', en: 'Loading...', th: 'กำลังโหลด...' },
  notFound: { ja: 'プロジェクトが見つかりません', en: 'Project not found', th: 'ไม่พบโครงการ' },
  error: { ja: 'エラーが発生しました', en: 'An error occurred', th: 'เกิดข้อผิดพลาด' },
  files: { ja: '資料', en: 'Documents', th: 'เอกสาร' },
  uploadFile: { ja: 'ファイルを追加', en: 'Add file', th: 'เพิ่มไฟล์' },
  uploading: { ja: 'アップロード中...', en: 'Uploading...', th: 'กำลังอัปโหลด...' },
  noFiles: { ja: '資料はまだありません', en: 'No documents yet', th: 'ยังไม่มีเอกสาร' },
  deleteConfirm: { ja: '削除しますか？', en: 'Delete this file?', th: 'ลบไฟล์นี้?' },
};

const statusColors: Record<string, string> = {
  estimating: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ordered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  on_hold: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

interface EditForm {
  project_name: string;
  description: string;
  status_code: string;
  customer_code: string;
  customer_name: string;
  work_no: string;
  sales_person_id: string;
  start_date: string;
  due_date: string;
}

export default function ProjectDetailContent({
  projectCode,
  locale,
  language,
}: ProjectDetailContentProps) {
  const { toast } = useToast();
  const { confirmDialog } = useConfirmDialog();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [project, setProject] = useState<ProjectWithRelations | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // URLハッシュからタブ状態を復元（言語切り替え時の状態保持）
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'parts') {
      setActiveTab('parts');
    }
  }, []);

  // タブ切り替え時にURLハッシュも更新
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    const newHash = tab === 'overview' ? '' : `#${tab}`;
    window.history.replaceState(null, '', window.location.pathname + window.location.search + newHash);
  }, []);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [form, setForm] = useState<EditForm>({
    project_name: '',
    description: '',
    status_code: '',
    customer_code: '',
    customer_name: '',
    work_no: '',
    sales_person_id: '',
    start_date: '',
    due_date: '',
  });

  // ファイル関連
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProject = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectCode)}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        if (response.status === 404) {
          setProject(null);
        } else {
          throw new Error('Failed to fetch');
        }
        return;
      }
      const data = await response.json();
      setProject(data);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [projectCode]);

  const fetchFiles = useCallback(async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/files`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  }, []);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // プロジェクト取得後にファイルも取得
  useEffect(() => {
    if (project?.id) {
      fetchFiles(project.id);
    }
  }, [project?.id, fetchFiles]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;

    setUploadingFile(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/projects/${project.id}/files`, {
        method: 'POST',
        body: fd,
      });
      if (res.ok) {
        await fetchFiles(project.id);
        toast({ type: 'success', title: labels.files[language] + ' ' + (language === 'ja' ? 'アップロード完了' : language === 'th' ? 'อัปโหลดสำเร็จ' : 'uploaded') });
      } else {
        toast({ type: 'error', title: language === 'ja' ? 'アップロードに失敗しました' : language === 'th' ? 'อัปโหลดไม่สำเร็จ' : 'Upload failed' });
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      toast({ type: 'error', title: language === 'ja' ? 'アップロードに失敗しました' : language === 'th' ? 'อัปโหลดไม่สำเร็จ' : 'Upload failed' });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!project) return;

    const confirmed = await confirmDialog({
      title: language === 'ja' ? 'ファイル削除' : language === 'th' ? 'ลบไฟล์' : 'Delete File',
      message: labels.deleteConfirm[language],
      variant: 'danger',
      confirmLabel: language === 'ja' ? '削除' : language === 'th' ? 'ลบ' : 'Delete',
      cancelLabel: language === 'ja' ? 'キャンセル' : language === 'th' ? 'ยกเลิก' : 'Cancel',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/projects/${project.id}/files?file_id=${fileId}`, {
        method: 'DELETE',
      });
      await fetchFiles(project.id);
      toast({ type: 'success', title: language === 'ja' ? 'ファイルを削除しました' : language === 'th' ? 'ลบไฟล์สำเร็จ' : 'File deleted' });
    } catch (err) {
      console.error('Error deleting file:', err);
      toast({ type: 'error', title: language === 'ja' ? 'ファイル削除に失敗しました' : language === 'th' ? 'ลบไฟล์ไม่สำเร็จ' : 'Failed to delete file' });
    }
  };

  const getFileIcon = (type: string) => {
    if (type === 'image') return Image;
    if (type === 'pdf' || type === 'doc') return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 編集開始時にマスタデータを取得
  const startEditing = async () => {
    if (!project) return;

    // フォームに現在値をセット
    setForm({
      project_name: project.project_name || '',
      description: project.description || '',
      status_code: project.status?.code || 'estimating',
      customer_code: project.customer_code || '',
      customer_name: project.customer_name || '',
      work_no: project.work_no || '',
      sales_person_id: project.sales_person_id || '',
      start_date: project.start_date || '',
      due_date: project.due_date || '',
    });
    setSaveError(null);

    // ステータス・従業員を取得（未取得の場合）
    if (statuses.length === 0 || employees.length === 0) {
      try {
        const [projRes, empRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/employees?status=Active'),
        ]);
        if (projRes.ok) {
          const data = await projRes.json();
          setStatuses(data.statuses || []);
        }
        if (empRes.ok) {
          const data = await empRes.json();
          setEmployees(data.employees || []);
        }
      } catch (err) {
        console.error('Error fetching master data:', err);
      }
    }

    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!project) return;
    setSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: form.project_name,
          description: form.description || null,
          status_code: form.status_code,
          customer_code: form.customer_code || null,
          customer_name: form.customer_name || null,
          work_no: form.work_no || null,
          sales_person_id: form.sales_person_id || null,
          start_date: form.start_date || null,
          due_date: form.due_date || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update');
      }

      const updated = await response.json();
      setProject(updated);
      setEditing(false);
      toast({ type: 'success', title: language === 'ja' ? '保存しました' : language === 'th' ? 'บันทึกสำเร็จ' : 'Saved successfully' });
    } catch (err) {
      console.error('Error saving project:', err);
      setSaveError(err instanceof Error ? err.message : labels.error[language]);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return labels.tbd[language];
    if (language === 'ja') return dateString;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getStatusName = (status?: ProjectStatus) => {
    if (!status) return '-';
    if (language === 'ja') return status.name;
    if (language === 'en') return status.name_en || status.name;
    if (language === 'th') return status.name_th || status.name;
    return status.name;
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white';

  if (loading) {
    return <LoadingSpinner message={labels.loading[language]} />;
  }

  if (error || !project) {
    return (
      <div className={detailStyles.pageWrapper}>
        {/* ヘッダーバー */}
        <div className="flex items-center justify-between">
          <Link
            href={`/${locale}/project-management`}
            className={detailStyles.secondaryButton}
          >
            <ArrowLeft size={16} className="mr-2" />
            {labels.back[language]}
          </Link>
        </div>
        <div className={detailStyles.card}>
          <div className={detailStyles.cardContent}>
            <p className="text-red-600">
              {error ? labels.error[language] : labels.notFound[language]}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const mainTabs = [
    { key: 'overview', label: labels.overview[language], icon: <FileText size={16} /> },
    { key: 'parts', label: labels.parts[language], icon: <Package size={16} /> },
  ];

  return (
    <div className={detailStyles.pageWrapper}>
      <DetailPageHeader
        backHref={`/${locale}/project-management`}
        title={[
          project.project_code,
          project.customer_name,
          project.project_name,
        ].filter(Boolean).join(' - ')}
        statusBadge={project.status ? (
          <span className={`${detailStyles.badge} ${statusColors[project.status.code] || detailStyles.badgeDefault}`}>
            {getStatusName(project.status)}
          </span>
        ) : undefined}
        actions={
          activeTab === 'overview' ? (
            editing ? (
              <>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className={detailStyles.secondaryButton}
                >
                  <X size={16} className="mr-1.5" />
                  {labels.cancel[language]}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`${detailStyles.primaryButton} ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Save size={16} className="mr-1.5" />
                  {saving ? labels.saving[language] : labels.save[language]}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={startEditing}
                className={detailStyles.primaryButton}
              >
                <Pencil size={16} className="mr-1.5" />
                {labels.edit[language]}
              </button>
            )
          ) : undefined
        }
      />

      {/* 保存エラー */}
      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {saveError}
        </div>
      )}

      {/* メインカード */}
      <div className={detailStyles.card}>
        <div className={detailStyles.cardContent}>
          {/* タブ */}
          <Tabs
            tabs={mainTabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            variant="underline"
            className="mb-6"
          />

          {/* 概要タブ */}
          <TabPanel value="overview" activeValue={activeTab}>
            {editing ? (
              /* ===== 編集モード ===== */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {labels.projectName[language]}
                  </label>
                  <input
                    type="text"
                    value={form.project_name}
                    onChange={(e) => setForm((p) => ({ ...p, project_name: e.target.value }))}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {labels.status[language]}
                  </label>
                  <select
                    value={form.status_code}
                    onChange={(e) => setForm((p) => ({ ...p, status_code: e.target.value }))}
                    className={inputClass}
                  >
                    {statuses.map((s) => (
                      <option key={s.id} value={s.code}>{getStatusName(s)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {labels.customerCode[language]}
                  </label>
                  <input
                    type="text"
                    value={form.customer_code}
                    onChange={(e) => setForm((p) => ({ ...p, customer_code: e.target.value }))}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {labels.customer[language]}
                  </label>
                  <input
                    type="text"
                    value={form.customer_name}
                    onChange={(e) => setForm((p) => ({ ...p, customer_name: e.target.value }))}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {labels.workNo[language]}
                  </label>
                  <input
                    type="text"
                    value={form.work_no}
                    onChange={(e) => setForm((p) => ({ ...p, work_no: e.target.value }))}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {labels.salesPerson[language]}
                  </label>
                  <select
                    value={form.sales_person_id}
                    onChange={(e) => setForm((p) => ({ ...p, sales_person_id: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">-</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}{emp.nickname ? ` (${emp.nickname})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {labels.startDate[language]}
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                    onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                    className={`${inputClass} cursor-pointer`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {labels.dueDate[language]}
                  </label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
                    onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                    className={`${inputClass} cursor-pointer`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {labels.description[language]}
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    rows={4}
                    className={inputClass}
                  />
                </div>
              </div>
            ) : (
              /* ===== 閲覧モード ===== */
              <>
                <div className={detailStyles.grid2}>
                  <div className="space-y-4">
                    <div>
                      <h3 className={detailStyles.fieldLabel}>{labels.projectName[language]}</h3>
                      <p className={`mt-1 ${detailStyles.fieldValue}`}>{project.project_name || '-'}</p>
                    </div>

                    <div>
                      <h3 className={detailStyles.fieldLabel}>{labels.customer[language]}</h3>
                      <p className={`mt-1 ${detailStyles.fieldValue}`}>{project.customer_name || '-'}</p>
                    </div>

                    {project.customer_code && (
                      <div>
                        <h3 className={detailStyles.fieldLabel}>{labels.customerCode[language]}</h3>
                        <p className={`mt-1 ${detailStyles.fieldValue}`}>
                          <Link href={`/${locale}/customers/${project.customer_code}`} className={detailStyles.link}>
                            {project.customer_code}
                          </Link>
                        </p>
                      </div>
                    )}

                    {project.work_no && (
                      <div>
                        <h3 className={detailStyles.fieldLabel}>{labels.workNo[language]}</h3>
                        <Link
                          href={`/${locale}/workno/${encodeURIComponent(project.work_no)}`}
                          className={`mt-1 text-lg ${detailStyles.link}`}
                        >
                          {project.work_no}
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className={detailStyles.fieldLabel}>{labels.salesPerson[language]}</h3>
                      <p className={`mt-1 ${detailStyles.fieldValue}`}>
                        {project.sales_person
                          ? `${project.sales_person.name}${project.sales_person.nickname ? ` (${project.sales_person.nickname})` : ''}`
                          : '-'}
                      </p>
                    </div>

                    <div>
                      <h3 className={detailStyles.fieldLabel}>{labels.startDate[language]}</h3>
                      <p className={`mt-1 ${detailStyles.fieldValue}`}>{formatDate(project.start_date)}</p>
                    </div>

                    <div>
                      <h3 className={detailStyles.fieldLabel}>{labels.dueDate[language]}</h3>
                      <p className={`mt-1 ${detailStyles.fieldValue}`}>{formatDate(project.due_date)}</p>
                    </div>
                  </div>
                </div>

                {project.description && (
                  <div className={detailStyles.sectionSpace}>
                    <h3 className={`${detailStyles.fieldLabel} mb-2`}>{labels.description[language]}</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{project.description}</p>
                    </div>
                  </div>
                )}

                {/* 資料セクション */}
                <div className={detailStyles.sectionSpace}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={detailStyles.fieldLabel}>{labels.files[language]}</h3>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.dwg,.dxf"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        <Upload size={14} />
                        {uploadingFile ? labels.uploading[language] : labels.uploadFile[language]}
                      </button>
                    </div>
                  </div>

                  {files.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500">{labels.noFiles[language]}</p>
                  ) : (
                    <div className="space-y-2">
                      {files.map((f) => {
                        const IconComp = getFileIcon(f.file_type);
                        return (
                          <div
                            key={f.id}
                            className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <IconComp size={16} className="flex-shrink-0 text-gray-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{f.file_name}</span>
                              <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(f.file_size)}</span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                              {f.url && (
                                <a
                                  href={f.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-400 hover:text-brand-500 rounded"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink size={14} />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteFile(f.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabPanel>

          {/* DOMタブ */}
          <TabPanel value="parts" activeValue={activeTab}>
            <DomContainer
              projectId={project.id}
              locale={locale}
              customerName={project.customer_name || undefined}
              machineName={project.project_name || undefined}
            />
          </TabPanel>
        </div>
      </div>
    </div>
  );
}
