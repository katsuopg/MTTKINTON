'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Database } from '@/types/supabase';
import { type Language } from '@/lib/kintone/field-mappings';
import { detailStyles } from '@/components/ui/DetailStyles';
import { DetailPageHeader } from '@/components/ui/DetailPageHeader';
import Tabs, { TabPanel } from '@/components/ui/Tabs';
import { Pencil, Save, X, Upload } from 'lucide-react';

type Employee = Database['public']['Tables']['employees']['Row'];

interface EmployeeDetailContentProps {
  employee: Employee;
  locale: string;
}

interface DocumentFile {
  name: string;
  url: string;
  uploadedAt?: string;
}

export default function EmployeeDetailContent({
  employee,
  locale
}: EmployeeDetailContentProps) {
  const router = useRouter();
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: employee.name || '',
    gender: employee.gender || '',
    department: employee.department || '',
    position: employee.position || '',
    date_of_birth: employee.date_of_birth || '',
    hire_date: employee.hire_date || '',
    employment_type: employee.employment_type || '',
    salary_type: employee.salary_type || '',
    tel: employee.tel || '',
    email: employee.email || '',
    company_email: employee.company_email || '',
    address: employee.address || '',
    passport_number: employee.passport_number || '',
    passport_expiry: employee.passport_expiry || '',
    id_expiry: employee.id_expiry || '',
    emergency_contact_name: employee.emergency_contact_name || '',
    emergency_contact_tel: employee.emergency_contact_tel || '',
    status: employee.status || 'Active',
    visa_number: employee.visa_number || '',
    visa_expiry: employee.visa_expiry || '',
    visa_type: employee.visa_type || '',
    license_number: employee.license_number || '',
    license_expiry: employee.license_expiry || '',
  });

  // File upload refs
  const passportFileRef = useRef<HTMLInputElement>(null);
  const visaFileRef = useRef<HTMLInputElement>(null);
  const licenseFileRef = useRef<HTMLInputElement>(null);
  const idCardFileRef = useRef<HTMLInputElement>(null);
  const contractFileRef = useRef<HTMLInputElement>(null);
  const resumeFileRef = useRef<HTMLInputElement>(null);

  // Initialize uploaded files from employee data
  const initialFiles = {
    passport: employee.passport_image_url
      ? [{ name: 'パスポート画像', url: employee.passport_image_url }]
      : [],
    visa: employee.visa_image_url
      ? [{ name: 'ビザ画像', url: employee.visa_image_url }]
      : [],
    license: [],
    idCard: employee.id_image_url
      ? [{ name: 'IDカード画像', url: employee.id_image_url }]
      : [],
    contract: [],
    resume: [],
  };

  // Uploaded files state
  const [uploadedFiles, setUploadedFiles] = useState<{
    passport: DocumentFile[];
    visa: DocumentFile[];
    license: DocumentFile[];
    idCard: DocumentFile[];
    contract: DocumentFile[];
    resume: DocumentFile[];
  }>(initialFiles);

  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<'idCard' | 'license' | 'passport' | 'visa'>('idCard');

  // 所属組織
  const [orgNames, setOrgNames] = useState<string[]>([]);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await fetch('/api/organization-members');
        if (!res.ok) return;
        const data = await res.json();
        if (!data.members) return;

        // この従業員の所属組織をフィルタ
        const myOrgs = data.members.filter(
          (m: { employee_uuid: string | null }) => m.employee_uuid === employee.id
        );

        const names = myOrgs.map((m: { organizations: { name: string; name_en?: string; name_th?: string } | null }) => {
          const org = m.organizations;
          if (!org) return '';
          if (language === 'en' && org.name_en) return org.name_en;
          if (language === 'th' && org.name_th) return org.name_th;
          return org.name;
        }).filter(Boolean);

        setOrgNames(names);
      } catch (err) {
        console.error('Error fetching org memberships:', err);
      }
    };
    fetchOrgs();
  }, [employee.id, language]);

  // Get employee data
  const isActive = employee.status === '在籍' || employee.status === 'Active';
  const isResigned = employee.status === '退職' || employee.status === 'Resigned' || employee.status === 'Inactive';

  const labels = {
    ja: {
      profile: 'プロフィール',
      basicInfo: '基本情報',
      contactInfo: '連絡先情報',
      documentInfo: 'パスポート情報',
      visaInfo: 'ビザ情報',
      licenseInfo: '運転免許証',
      emergencyContact: '緊急連絡先',
      documents: '書類アップロード',
      employeeNo: '社員番号',
      idNo: '国民ID番号',
      gender: '性別',
      genderMale: '男性',
      genderFemale: '女性',
      department: '配属',
      position: '役職',
      birthDate: '生年月日',
      hireDate: '入社日',
      employmentType: '雇用形態',
      salaryPayment: '給与支払形態',
      status: '在籍状況',
      phone: '電話番号',
      email: 'メールアドレス',
      companyEmail: '社内メールアドレス',
      address: '住所',
      passportNo: 'パスポート番号',
      passportExpiry: 'パスポート有効期限',
      passportImage: 'パスポート画像',
      visaNo: 'ビザ番号',
      visaExpiry: 'ビザ有効期限',
      visaType: 'ビザ種類',
      visaImage: 'ビザ画像',
      licenseNo: '免許証番号',
      licenseExpiry: '免許証有効期限',
      licenseImage: '免許証画像',
      idExpiry: '国民ID有効期限',
      idCardImage: '国民IDカード画像',
      nationalIdCard: '国民IDカード',
      emergencyName: '氏名',
      emergencyPhone: '電話番号',
      contract: '労働契約書',
      resume: '履歴書',
      edit: '編集',
      save: '保存',
      cancel: 'キャンセル',
      saving: '保存中...',
      saveSuccess: '保存しました',
      saveError: '保存に失敗しました',
      backToList: '一覧に戻る',
      expiresWithin6Months: '6ヶ月以内に期限切れ',
      active: '在籍',
      resigned: '退職',
      uploadFile: 'ファイルを選択',
      uploading: 'アップロード中...',
      noFiles: 'ファイルなし',
    },
    en: {
      profile: 'Profile',
      basicInfo: 'Basic Information',
      contactInfo: 'Contact Information',
      documentInfo: 'Passport Information',
      visaInfo: 'Visa Information',
      licenseInfo: "Driver's License",
      emergencyContact: 'Emergency Contact',
      documents: 'Document Upload',
      employeeNo: 'Employee No.',
      idNo: 'National ID No.',
      gender: 'Gender',
      genderMale: 'Male',
      genderFemale: 'Female',
      department: 'Department',
      position: 'Position',
      birthDate: 'Date of Birth',
      hireDate: 'Hire Date',
      employmentType: 'Employment Type',
      salaryPayment: 'Salary Payment',
      status: 'Status',
      phone: 'Phone',
      email: 'Email',
      companyEmail: 'Company Email',
      address: 'Address',
      passportNo: 'Passport No.',
      passportExpiry: 'Passport Expiry',
      passportImage: 'Passport Image',
      visaNo: 'Visa No.',
      visaExpiry: 'Visa Expiry',
      visaType: 'Visa Type',
      visaImage: 'Visa Image',
      licenseNo: 'License No.',
      licenseExpiry: 'License Expiry',
      licenseImage: 'License Image',
      idExpiry: 'National ID Expiry',
      idCardImage: 'National ID Card Image',
      nationalIdCard: 'National ID Card',
      emergencyName: 'Name',
      emergencyPhone: 'Phone',
      contract: 'Labor Contract',
      resume: 'Resume',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      saving: 'Saving...',
      saveSuccess: 'Saved successfully',
      saveError: 'Failed to save',
      backToList: 'Back to List',
      expiresWithin6Months: 'Expires within 6 months',
      active: 'Active',
      resigned: 'Resigned',
      uploadFile: 'Choose File',
      uploading: 'Uploading...',
      noFiles: 'No files',
    },
    th: {
      profile: 'โปรไฟล์',
      basicInfo: 'ข้อมูลพื้นฐาน',
      contactInfo: 'ข้อมูลติดต่อ',
      documentInfo: 'ข้อมูลหนังสือเดินทาง',
      visaInfo: 'ข้อมูลวีซ่า',
      licenseInfo: 'ใบขับขี่',
      emergencyContact: 'ผู้ติดต่อฉุกเฉิน',
      documents: 'อัปโหลดเอกสาร',
      employeeNo: 'รหัสพนักงาน',
      idNo: 'เลขบัตรประชาชน',
      gender: 'เพศ',
      genderMale: 'ชาย',
      genderFemale: 'หญิง',
      department: 'แผนก',
      position: 'ตำแหน่ง',
      birthDate: 'วันเกิด',
      hireDate: 'วันเข้าทำงาน',
      employmentType: 'ประเภทการจ้าง',
      salaryPayment: 'รูปแบบการจ่ายเงินเดือน',
      status: 'สถานะ',
      phone: 'โทรศัพท์',
      email: 'อีเมล',
      companyEmail: 'อีเมลบริษัท',
      address: 'ที่อยู่',
      passportNo: 'หมายเลขหนังสือเดินทาง',
      passportExpiry: 'วันหมดอายุหนังสือเดินทาง',
      passportImage: 'รูปหนังสือเดินทาง',
      visaNo: 'หมายเลขวีซ่า',
      visaExpiry: 'วันหมดอายุวีซ่า',
      visaType: 'ประเภทวีซ่า',
      visaImage: 'รูปวีซ่า',
      licenseNo: 'หมายเลขใบขับขี่',
      licenseExpiry: 'วันหมดอายุใบขับขี่',
      licenseImage: 'รูปใบขับขี่',
      idExpiry: 'วันหมดอายุบัตรประชาชน',
      idCardImage: 'รูปบัตรประชาชน',
      nationalIdCard: 'บัตรประชาชน',
      emergencyName: 'ชื่อ',
      emergencyPhone: 'โทรศัพท์',
      contract: 'สัญญาจ้างงาน',
      resume: 'ประวัติย่อ',
      edit: 'แก้ไข',
      save: 'บันทึก',
      cancel: 'ยกเลิก',
      saving: 'กำลังบันทึก...',
      saveSuccess: 'บันทึกเรียบร้อย',
      saveError: 'บันทึกไม่สำเร็จ',
      backToList: 'กลับไปยังรายการ',
      expiresWithin6Months: 'หมดอายุภายใน 6 เดือน',
      active: 'ทำงานอยู่',
      resigned: 'ลาออก',
      uploadFile: 'เลือกไฟล์',
      uploading: 'กำลังอัปโหลด...',
      noFiles: 'ไม่มีไฟล์',
    },
  };

  const t = labels[language];

  // Date format function
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      language === 'ja' ? 'ja-JP' : language === 'th' ? 'th-TH' : 'en-US',
      { year: 'numeric', month: '2-digit', day: '2-digit' }
    );
  };

  // Check if date is expiring within 6 months
  const isExpiringSoon = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: t.saveSuccess });
        setIsEditing(false);
        router.refresh();
      } else {
        setMessage({ type: 'error', text: t.saveError });
      }
    } catch {
      setMessage({ type: 'error', text: t.saveError });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: employee.name || '',
      gender: employee.gender || '',
      department: employee.department || '',
      position: employee.position || '',
      date_of_birth: employee.date_of_birth || '',
      hire_date: employee.hire_date || '',
      employment_type: employee.employment_type || '',
      salary_type: employee.salary_type || '',
      tel: employee.tel || '',
      email: employee.email || '',
      company_email: employee.company_email || '',
      address: employee.address || '',
      passport_number: employee.passport_number || '',
      passport_expiry: employee.passport_expiry || '',
      id_expiry: employee.id_expiry || '',
      emergency_contact_name: employee.emergency_contact_name || '',
      emergency_contact_tel: employee.emergency_contact_tel || '',
      status: employee.status || 'Active',
      visa_number: employee.visa_number || '',
      visa_expiry: employee.visa_expiry || '',
      visa_type: employee.visa_type || '',
      license_number: employee.license_number || '',
      license_expiry: employee.license_expiry || '',
    });
    setIsEditing(false);
    setMessage(null);
  };

  const handleFileUpload = async (type: string, file: File) => {
    setUploadingType(type);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', type);
      formDataUpload.append('employeeId', employee.id);

      const response = await fetch('/api/employees/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedFiles(prev => ({
          ...prev,
          [type]: [...prev[type as keyof typeof prev], { name: file.name, url: data.url }],
        }));
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploadingType(null);
    }
  };

  const inputClass = "w-full px-4 py-2.5 text-theme-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300";

  // Render field - either display or input based on edit mode
  const renderField = (label: string, fieldName: string, value: string, type: 'text' | 'date' | 'email' | 'tel' = 'text') => (
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      {isEditing ? (
        <input
          type={type}
          name={fieldName}
          value={formData[fieldName as keyof typeof formData]}
          onChange={handleChange}
          className={inputClass}
        />
      ) : (
        <p className="text-sm text-gray-800 dark:text-white/90">
          {type === 'date' ? formatDate(value) : (value || '-')}
        </p>
      )}
    </div>
  );

  // File upload section component
  const FileUploadSection = ({
    label,
    type,
    fileRef,
    files
  }: {
    label: string;
    type: string;
    fileRef: React.RefObject<HTMLInputElement | null>;
    files: DocumentFile[];
  }) => (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm text-gray-800 dark:text-white/90">{label}</h4>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploadingType === type}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-theme-xs font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 disabled:opacity-50"
        >
          <Upload size={16} />
          {uploadingType === type ? t.uploading : t.uploadFile}
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(type, file);
          }}
        />
      </div>
      {files.length > 0 ? (
        <div className="space-y-3">
          {files.map((file, index) => (
            <div key={index} className="space-y-2">
              {/* Preview - Image or PDF */}
              {file.url && (
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="block">
                  {file.url.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={file.url}
                      title={file.name}
                      className="w-full h-64 rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.url}
                      alt={file.name}
                      className="max-w-full max-h-48 rounded-lg border border-gray-200 dark:border-gray-700 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  )}
                </a>
              )}
              {/* File info */}
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-theme-xs text-gray-600 dark:text-gray-400 truncate">{file.name}</span>
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-600 text-theme-xs flex-shrink-0 ml-2">
                  {language === 'ja' ? '新しいタブで開く' : 'Open in new tab'}
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-theme-xs text-gray-400">{t.noFiles}</p>
      )}
    </div>
  );

  return (
    <div className={detailStyles.pageWrapper}>
      {/* DetailPageHeader: 1行構成 */}
      <DetailPageHeader
        backHref={`/${locale}/employees`}
        title={[
          employee.employee_number,
          formData.name,
          formData.department,
        ].filter(Boolean).join(' - ')}
        statusBadge={
          <span className={`${detailStyles.badge} ${
            isActive ? detailStyles.badgeSuccess
              : isResigned ? detailStyles.badgeDanger
              : detailStyles.badgeWarning
          }`}>
            {isActive ? t.active : isResigned ? t.resigned : (employee.status || t.active)}
          </span>
        }
        actions={
          isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className={detailStyles.secondaryButton}
              >
                <X size={16} className="mr-1.5" />
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={`${detailStyles.primaryButton} ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save size={16} className="mr-1.5" />
                {isSaving ? t.saving : t.save}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={detailStyles.secondaryButton}
            >
              <Pencil size={16} className="mr-1.5" />
              {t.edit}
            </button>
          )
        }
      />

      {/* Profile Card */}
      <div className={detailStyles.card}>
        <div className={detailStyles.cardContent}>
          <div className="flex items-center gap-4">
            {employee.profile_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={employee.profile_image_url}
                alt={formData.name || ''}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-500 flex items-center justify-center text-white text-2xl font-bold">
                {formData.name?.charAt(0) || '?'}
              </div>
            )}
            <div>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-brand-500 focus:outline-none"
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {formData.name || '-'}
                  {employee.name_th && (
                    <span className="ml-2 text-lg font-normal text-gray-500 dark:text-gray-400">
                      ({employee.name_th})
                    </span>
                  )}
                </h2>
              )}
              <div className="flex items-center gap-3 mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                <span className="font-mono">{employee.employee_number}</span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span>{formData.position || '-'}</span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span>{formData.department || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-3 rounded-lg text-theme-sm ${
          message.type === 'success'
            ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500'
            : 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500'
        }`}>
          {message.text}
        </div>
      )}

      {/* Basic Information Card */}
      <div className={detailStyles.card}>
        <div className={detailStyles.cardHeaderWithBg}>
          <h2 className={detailStyles.cardTitle}>{t.basicInfo}</h2>
        </div>
        <div className={detailStyles.cardContent}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Gender Select */}
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.gender}</p>
              {isEditing ? (
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">-</option>
                  <option value="男性">{t.genderMale}</option>
                  <option value="女性">{t.genderFemale}</option>
                </select>
              ) : (
                <p className="text-sm text-gray-800 dark:text-white/90">
                  {formData.gender === '男性' ? t.genderMale : formData.gender === '女性' ? t.genderFemale : formData.gender || '-'}
                </p>
              )}
            </div>
            {/* 配属：組織メンバーシップから取得、フォールバックでdepartmentフィールド */}
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.department}</p>
              {isEditing ? (
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={inputClass}
                />
              ) : orgNames.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {orgNames.map((name, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-800 dark:text-white/90">{formData.department || '-'}</p>
              )}
            </div>
            {renderField(t.position, 'position', formData.position)}
            {renderField(t.birthDate, 'date_of_birth', formData.date_of_birth, 'date')}
            {renderField(t.hireDate, 'hire_date', formData.hire_date, 'date')}
            {renderField(t.employmentType, 'employment_type', formData.employment_type)}
            {renderField(t.salaryPayment, 'salary_type', formData.salary_type)}
            {renderField(t.companyEmail, 'company_email', formData.company_email, 'email')}
          </div>
        </div>
      </div>

      {/* Contact Information Card */}
      <div className={detailStyles.card}>
        <div className={detailStyles.cardHeaderWithBg}>
          <h2 className={detailStyles.cardTitle}>{t.contactInfo}</h2>
        </div>
        <div className={detailStyles.cardContent}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField(t.phone, 'tel', formData.tel, 'tel')}
            {renderField(t.email, 'email', formData.email, 'email')}
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.address}</p>
              {isEditing ? (
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  className={inputClass}
                />
              ) : (
                <p className="text-sm text-gray-800 dark:text-white/90">{formData.address || '-'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Identity Documents Card with Tabs */}
      <div className={detailStyles.card}>
        <div className={detailStyles.cardHeaderWithBg}>
          <h2 className={detailStyles.cardTitle}>{language === 'ja' ? '身分証明書類' : language === 'th' ? 'เอกสารประจำตัว' : 'Identity Documents'}</h2>
        </div>
        <div className={detailStyles.cardContent}>
          <Tabs
            variant="underline"
            activeTab={activeDocTab}
            onTabChange={(key) => setActiveDocTab(key as 'idCard' | 'license' | 'passport' | 'visa')}
            tabs={[
              { key: 'idCard', label: t.nationalIdCard },
              { key: 'license', label: t.licenseInfo },
              { key: 'passport', label: t.documentInfo },
              { key: 'visa', label: t.visaInfo },
            ]}
            className="mb-4"
          />

          {/* Tab Content */}
          <div className="pt-2">
            {/* National ID Tab */}
            <TabPanel value="idCard" activeValue={activeDocTab}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.idNo}</p>
                    <p className="text-sm text-gray-800 dark:text-white/90 font-mono">{employee.id_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.idExpiry}</p>
                    {isEditing ? (
                      <input type="date" name="id_expiry" value={formData.id_expiry} onChange={handleChange} className={inputClass} />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-800 dark:text-white/90">{formatDate(formData.id_expiry)}</p>
                        {isExpiringSoon(formData.id_expiry) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500">
                            {t.expiresWithin6Months}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <FileUploadSection label={t.idCardImage} type="idCard" fileRef={idCardFileRef} files={uploadedFiles.idCard} />
              </div>
            </TabPanel>

            {/* Driver's License Tab */}
            <TabPanel value="license" activeValue={activeDocTab}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {isEditing ? (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.licenseNo}</p>
                      <input type="text" name="license_number" value={formData.license_number} onChange={handleChange} className={inputClass} />
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.licenseNo}</p>
                      <p className="text-sm text-gray-800 dark:text-white/90">{formData.license_number || '-'}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.licenseExpiry}</p>
                    {isEditing ? (
                      <input type="date" name="license_expiry" value={formData.license_expiry} onChange={handleChange} className={inputClass} />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-800 dark:text-white/90">{formatDate(formData.license_expiry)}</p>
                        {isExpiringSoon(formData.license_expiry) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500">
                            {t.expiresWithin6Months}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <FileUploadSection label={t.licenseImage} type="license" fileRef={licenseFileRef} files={uploadedFiles.license} />
              </div>
            </TabPanel>

            {/* Passport Tab */}
            <TabPanel value="passport" activeValue={activeDocTab}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {isEditing ? (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.passportNo}</p>
                      <input type="text" name="passport_number" value={formData.passport_number} onChange={handleChange} className={inputClass} />
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.passportNo}</p>
                      <p className="text-sm text-gray-800 dark:text-white/90">{formData.passport_number || '-'}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.passportExpiry}</p>
                    {isEditing ? (
                      <input type="date" name="passport_expiry" value={formData.passport_expiry} onChange={handleChange} className={inputClass} />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-800 dark:text-white/90">{formatDate(formData.passport_expiry)}</p>
                        {isExpiringSoon(formData.passport_expiry) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500">
                            {t.expiresWithin6Months}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <FileUploadSection label={t.passportImage} type="passport" fileRef={passportFileRef} files={uploadedFiles.passport} />
              </div>
            </TabPanel>

            {/* Visa Tab */}
            <TabPanel value="visa" activeValue={activeDocTab}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.visaNo}</p>
                        <input type="text" name="visa_number" value={formData.visa_number} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.visaType}</p>
                        <input type="text" name="visa_type" value={formData.visa_type} onChange={handleChange} className={inputClass} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.visaNo}</p>
                        <p className="text-sm text-gray-800 dark:text-white/90">{formData.visa_number || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.visaType}</p>
                        <p className="text-sm text-gray-800 dark:text-white/90">{formData.visa_type || '-'}</p>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.visaExpiry}</p>
                    {isEditing ? (
                      <input type="date" name="visa_expiry" value={formData.visa_expiry} onChange={handleChange} className={inputClass} />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-800 dark:text-white/90">{formatDate(formData.visa_expiry)}</p>
                        {isExpiringSoon(formData.visa_expiry) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500">
                            {t.expiresWithin6Months}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <FileUploadSection label={t.visaImage} type="visa" fileRef={visaFileRef} files={uploadedFiles.visa} />
              </div>
            </TabPanel>
          </div>
        </div>
      </div>

      {/* Documents Upload Card */}
      <div className={detailStyles.card}>
        <div className={detailStyles.cardHeaderWithBg}>
          <h2 className={detailStyles.cardTitle}>{t.documents}</h2>
        </div>
        <div className={detailStyles.cardContent}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUploadSection label={t.contract} type="contract" fileRef={contractFileRef} files={uploadedFiles.contract} />
            <FileUploadSection label={t.resume} type="resume" fileRef={resumeFileRef} files={uploadedFiles.resume} />
          </div>
        </div>
      </div>

      {/* Emergency Contact Card */}
      <div className={detailStyles.card}>
        <div className={detailStyles.cardHeaderWithBg}>
          <h2 className={detailStyles.cardTitle}>{t.emergencyContact}</h2>
        </div>
        <div className={detailStyles.cardContent}>
          <div className="p-4 rounded-lg bg-error-50 dark:bg-error-500/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderField(t.emergencyName, 'emergency_contact_name', formData.emergency_contact_name)}
              {renderField(t.emergencyPhone, 'emergency_contact_tel', formData.emergency_contact_tel, 'tel')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
