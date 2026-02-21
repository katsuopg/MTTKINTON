'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { detailStyles } from '@/components/ui/DetailStyles';
import { ArrowLeft, Save, X, Upload, FileText, Image, File } from 'lucide-react';
import { extractCsName } from '@/lib/utils/customer-name';
import type { ProjectCreate, ProjectStatus, EmployeeSummary } from '@/types/project';

interface CustomerOption {
  customer_id: string;
  company_name: string;
}

interface WorkNoOption {
  workNo: string;
  csId: string;
  description: string;
}

interface ProjectFormProps {
  locale: string;
  language: 'ja' | 'en' | 'th';
}

const labels = {
  title: { ja: '新規プロジェクト登録', en: 'New Project', th: 'สร้างโครงการใหม่' },
  back: { ja: '一覧に戻る', en: 'Back to list', th: 'กลับไปยังรายการ' },
  submit: { ja: '登録', en: 'Create', th: 'สร้าง' },
  submitting: { ja: '登録中...', en: 'Creating...', th: 'กำลังสร้าง...' },
  projectCode: { ja: 'PJコード', en: 'PJ Code', th: 'รหัส PJ' },
  projectCodeHint: { ja: '空欄の場合は自動採番', en: 'Auto-generated if empty', th: 'สร้างอัตโนมัติหากว่าง' },
  projectName: { ja: 'プロジェクト名', en: 'Project Name', th: 'ชื่อโครงการ' },
  status: { ja: 'ステータス', en: 'Status', th: 'สถานะ' },
  customer: { ja: '顧客', en: 'Customer', th: 'ลูกค้า' },
  customerPlaceholder: { ja: '顧客名で検索...', en: 'Search customer...', th: 'ค้นหาลูกค้า...' },
  salesPerson: { ja: '担当営業', en: 'Sales Rep', th: 'พนักงานขาย' },
  salesPersonNone: { ja: '選択してください', en: 'Select...', th: 'เลือก...' },
  workNo: { ja: '工事番号', en: 'Work No.', th: 'หมายเลขงาน' },
  workNoPlaceholder: { ja: '工事番号で検索...', en: 'Search work no...', th: 'ค้นหาหมายเลขงาน...' },
  startDate: { ja: '開始日', en: 'Start Date', th: 'วันเริ่มต้น' },
  dueDate: { ja: '納期', en: 'Due Date', th: 'กำหนดส่ง' },
  description: { ja: '説明', en: 'Description', th: 'คำอธิบาย' },
  files: { ja: '資料', en: 'Documents', th: 'เอกสาร' },
  filesHint: { ja: '写真・仕様書などをアップロード', en: 'Upload photos, specs, etc.', th: 'อัปโหลดรูปภาพ ข้อมูลจำเพาะ ฯลฯ' },
  uploadButton: { ja: 'ファイルを選択', en: 'Choose file', th: 'เลือกไฟล์' },
  uploading: { ja: 'アップロード中...', en: 'Uploading...', th: 'กำลังอัปโหลด...' },
  error: { ja: 'エラーが発生しました', en: 'An error occurred', th: 'เกิดข้อผิดพลาด' },
  validationError: { ja: '必須項目を入力してください（プロジェクト名・顧客・開始日）', en: 'Please fill in required fields (Project Name, Customer, Start Date)', th: 'กรุณากรอกข้อมูลที่จำเป็น (ชื่อโครงการ, ลูกค้า, วันเริ่มต้น)' },
  noMatch: { ja: '該当なし', en: 'No match', th: 'ไม่พบ' },
};

const fileIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  image: Image,
  doc: FileText,
  dwg: File,
  other: File,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProjectForm({ locale, language }: ProjectFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [nextCode, setNextCode] = useState('');

  // 顧客検索
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const customerRef = useRef<HTMLDivElement>(null);

  // 工事番号検索
  const [workNos, setWorkNos] = useState<WorkNoOption[]>([]);
  const [workNoSearch, setWorkNoSearch] = useState('');
  const [workNoDropdownOpen, setWorkNoDropdownOpen] = useState(false);
  const [selectedWorkNo, setSelectedWorkNo] = useState<WorkNoOption | null>(null);
  const workNoRef = useRef<HTMLDivElement>(null);

  // ファイル（登録後にアップロード）
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProjectCreate>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      project_code: '',
      project_name: '',
      description: '',
      status_code: 'estimating',
      customer_code: '',
      customer_name: '',
      work_no: '',
      sales_person_id: '',
      start_date: today,
      due_date: '',
    };
  });

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [projRes, codeRes, empRes, custRes, workNoRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/projects/next-code'),
          fetch('/api/employees?status=Active'),
          fetch('/api/customers'),
          fetch('/api/workno/list'),
        ]);
        if (projRes.ok) {
          const data = await projRes.json();
          setStatuses(data.statuses || []);
        }
        if (codeRes.ok) {
          const data = await codeRes.json();
          setNextCode(data.next_code || '');
        }
        if (empRes.ok) {
          const data = await empRes.json();
          setEmployees(data.employees || []);
        }
        if (custRes.ok) {
          const data = await custRes.json();
          setCustomers(data.customers || []);
        }
        if (workNoRes.ok) {
          const data = await workNoRes.json();
          setWorkNos(data.items || []);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };
    fetchInitial();
  }, []);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setCustomerDropdownOpen(false);
      }
      if (workNoRef.current && !workNoRef.current.contains(e.target as Node)) {
        setWorkNoDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 顧客フィルタ
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.customer_id.toLowerCase().includes(q) ||
        c.company_name.toLowerCase().includes(q) ||
        extractCsName(c.customer_id).toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  // 工事番号フィルタ
  const filteredWorkNos = useMemo(() => {
    if (!workNoSearch) return workNos;
    const q = workNoSearch.toLowerCase();
    return workNos.filter(
      (w) =>
        w.workNo.toLowerCase().includes(q) ||
        extractCsName(w.csId).toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q)
    );
  }, [workNos, workNoSearch]);

  const handleSelectCustomer = (customer: CustomerOption) => {
    setSelectedCustomer(customer);
    setFormData((prev) => ({
      ...prev,
      customer_code: customer.customer_id,
      customer_name: customer.company_name,
    }));
    setCustomerSearch('');
    setCustomerDropdownOpen(false);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setFormData((prev) => ({ ...prev, customer_code: '', customer_name: '' }));
    setCustomerSearch('');
  };

  const handleSelectWorkNo = (workNo: WorkNoOption) => {
    setSelectedWorkNo(workNo);
    setFormData((prev) => ({ ...prev, work_no: workNo.workNo }));
    setWorkNoSearch('');
    setWorkNoDropdownOpen(false);
  };

  const handleClearWorkNo = () => {
    setSelectedWorkNo(null);
    setFormData((prev) => ({ ...prev, work_no: '' }));
    setWorkNoSearch('');
  };

  const handleFieldChange = (field: keyof ProjectCreate, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getStatusName = (status: ProjectStatus) => {
    if (language === 'ja') return status.name;
    if (language === 'en') return status.name_en || status.name;
    if (language === 'th') return status.name_th || status.name;
    return status.name;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setPendingFiles((prev) => [...prev, ...Array.from(files)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.project_name.trim() || !selectedCustomer || !formData.start_date) {
      setError(labels.validationError[language]);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create');
      }

      const created = await response.json();

      // ファイルアップロード（プロジェクト作成後）
      if (pendingFiles.length > 0) {
        await Promise.all(
          pendingFiles.map(async (file) => {
            const fd = new FormData();
            fd.append('file', file);
            await fetch(`/api/projects/${created.id}/files`, {
              method: 'POST',
              body: fd,
            });
          })
        );
      }

      router.push(`/${locale}/project-management/${created.project_code}`);
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err instanceof Error ? err.message : labels.error[language]);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white';

  // 検索ドロップダウン共通コンポーネント
  const SearchDropdown = ({
    containerRef,
    isOpen,
    selected,
    searchValue,
    onSearchChange,
    onFocus,
    onClear,
    placeholder,
    selectedDisplay,
    children,
  }: {
    containerRef: React.RefObject<HTMLDivElement | null>;
    isOpen: boolean;
    selected: boolean;
    searchValue: string;
    onSearchChange: (v: string) => void;
    onFocus: () => void;
    onClear: () => void;
    placeholder: string;
    selectedDisplay: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div ref={containerRef} className="relative">
      {selected ? (
        <div className={`${inputClass} flex items-center justify-between`}>
          <span className="truncate">{selectedDisplay}</span>
          <button
            type="button"
            onClick={onClear}
            className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={onFocus}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
      {isOpen && !selected && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className={detailStyles.pageWrapper}>
      <form onSubmit={handleSubmit}>
        {/* ヘッダーバー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/project-management`}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className={detailStyles.pageTitle}>
              {labels.title[language]}
            </h1>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className={`${detailStyles.primaryButton} ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Save size={16} className="mr-1.5" />
            {submitting ? labels.submitting[language] : labels.submit[language]}
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {/* フォーム本体 */}
        <div className={detailStyles.card}>
          <div className={detailStyles.cardContent}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PJコード */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {labels.projectCode[language]}
                </label>
                <input
                  type="text"
                  value={formData.project_code || ''}
                  onChange={(e) => handleFieldChange('project_code', e.target.value || null)}
                  placeholder={nextCode || 'P26001'}
                  className={`${inputClass} placeholder:text-gray-400`}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {labels.projectCodeHint[language]}
                  {nextCode && (
                    <span className="ml-1">
                      ({language === 'ja' ? '次番' : 'Next'}: {nextCode})
                    </span>
                  )}
                </p>
              </div>

              {/* プロジェクト名（必須） */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {labels.projectName[language]} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.project_name}
                  onChange={(e) => handleFieldChange('project_name', e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              {/* ステータス */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {labels.status[language]}
                </label>
                <select
                  value={formData.status_code || 'estimating'}
                  onChange={(e) => handleFieldChange('status_code', e.target.value)}
                  className={inputClass}
                >
                  {statuses.map((status) => (
                    <option key={status.id} value={status.code}>
                      {getStatusName(status)}
                    </option>
                  ))}
                </select>
              </div>

              {/* 顧客 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {labels.customer[language]} <span className="text-red-500">*</span>
                </label>
                <SearchDropdown
                  containerRef={customerRef}
                  isOpen={customerDropdownOpen}
                  selected={!!selectedCustomer}
                  searchValue={customerSearch}
                  onSearchChange={(v) => { setCustomerSearch(v); setCustomerDropdownOpen(true); }}
                  onFocus={() => setCustomerDropdownOpen(true)}
                  onClear={handleClearCustomer}
                  placeholder={labels.customerPlaceholder[language]}
                  selectedDisplay={selectedCustomer && (
                    <>
                      <span className="font-medium">{extractCsName(selectedCustomer.customer_id)}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">{selectedCustomer.company_name}</span>
                    </>
                  )}
                >
                  {filteredCustomers.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">{labels.noMatch[language]}</div>
                  ) : (
                    filteredCustomers.map((c) => (
                      <button
                        key={c.customer_id}
                        type="button"
                        onClick={() => handleSelectCustomer(c)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">{extractCsName(c.customer_id)}</span>
                        <span className="text-gray-500 dark:text-gray-400">{c.company_name}</span>
                      </button>
                    ))
                  )}
                </SearchDropdown>
              </div>

              {/* 工事番号 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {labels.workNo[language]}
                </label>
                <SearchDropdown
                  containerRef={workNoRef}
                  isOpen={workNoDropdownOpen}
                  selected={!!selectedWorkNo}
                  searchValue={workNoSearch}
                  onSearchChange={(v) => { setWorkNoSearch(v); setWorkNoDropdownOpen(true); }}
                  onFocus={() => setWorkNoDropdownOpen(true)}
                  onClear={handleClearWorkNo}
                  placeholder={labels.workNoPlaceholder[language]}
                  selectedDisplay={selectedWorkNo && (
                    <>
                      <span className="font-medium">{selectedWorkNo.workNo}</span>
                      {selectedWorkNo.csId && (
                        <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">{extractCsName(selectedWorkNo.csId)}</span>
                      )}
                    </>
                  )}
                >
                  {filteredWorkNos.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">{labels.noMatch[language]}</div>
                  ) : (
                    filteredWorkNos.map((w) => (
                      <button
                        key={w.workNo}
                        type="button"
                        onClick={() => handleSelectWorkNo(w)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <span>{w.workNo}</span>
                        {w.csId && <span>{extractCsName(w.csId)}</span>}
                        {w.description && <span className="truncate">{w.description}</span>}
                      </button>
                    ))
                  )}
                </SearchDropdown>
              </div>

              {/* 担当営業 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {labels.salesPerson[language]}
                </label>
                <select
                  value={formData.sales_person_id || ''}
                  onChange={(e) => handleFieldChange('sales_person_id', e.target.value || null)}
                  className={inputClass}
                >
                  <option value="">{labels.salesPersonNone[language]}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}{emp.nickname ? ` (${emp.nickname})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 開始日 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {labels.startDate[language]} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => handleFieldChange('start_date', e.target.value || null)}
                  onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                  className={`${inputClass} cursor-pointer`}
                />
              </div>

              {/* 納期 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {labels.dueDate[language]}
                </label>
                <input
                  type="date"
                  value={formData.due_date || ''}
                  onChange={(e) => handleFieldChange('due_date', e.target.value || null)}
                  onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                  className={`${inputClass} cursor-pointer`}
                />
              </div>

              {/* 説明 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {labels.description[language]}
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value || null)}
                  rows={4}
                  className={inputClass}
                />
              </div>

              {/* 資料アップロード */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {labels.files[language]}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {labels.filesHint[language]}
                </p>

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.dwg,.dxf"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    <Upload size={16} />
                    {labels.uploadButton[language]}
                  </button>

                  {/* 選択済みファイル一覧 */}
                  {pendingFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {pendingFiles.map((file, index) => {
                        const ext = file.name.split('.').pop()?.toLowerCase() || '';
                        let type = 'other';
                        if (['pdf'].includes(ext)) type = 'pdf';
                        else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) type = 'image';
                        else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) type = 'doc';
                        const IconComp = fileIcons[type] || File;

                        return (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <IconComp size={16} className="flex-shrink-0 text-gray-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                              <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(file.size)}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePendingFile(index)}
                              className="ml-2 text-gray-400 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
