'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { type Language } from '@/lib/kintone/field-mappings';
import Link from 'next/link';
import { tableStyles } from '@/components/ui/TableStyles';
import {
  UserIcon,
  DocumentIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  ArrowLeftIcon,
  XMarkIcon,
  CheckIcon,
  CameraIcon,
  BriefcaseIcon,
  BellAlertIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassPlusIcon
} from '@heroicons/react/24/outline';
import type { Database } from '@/types/supabase';
import { createClient } from '@/lib/supabase/client';

type Employee = Database['public']['Tables']['employees']['Row'];

interface Organization {
  id: string;
  code?: string;
  name: string;
  name_en?: string;
  name_th?: string;
}

interface OrganizationMember {
  organization_id: string;
  organizations: Organization;
}

interface EmployeeDetailContentProps {
  employee: Employee;
  locale: string;
}

// 書類画像の型定義
interface DocumentImages {
  idCard: string | null;
  passport: string | null;
  visa: string | null;
  workPermit: string | null;
}

// 選択肢の定義
const GENDER_OPTIONS = [
  { value: '', label: { ja: '未設定', th: 'ไม่ระบุ', en: 'Not set' } },
  { value: '男性', label: { ja: '男性', th: 'ชาย', en: 'Male' } },
  { value: '女性', label: { ja: '女性', th: 'หญิง', en: 'Female' } },
];

const NATIONALITY_OPTIONS = [
  { value: '', label: { ja: '未設定', th: 'ไม่ระบุ', en: 'Not set' } },
  { value: 'タイ', label: { ja: 'タイ', th: 'ไทย', en: 'Thai' } },
  { value: '日本', label: { ja: '日本', th: 'ญี่ปุ่น', en: 'Japanese' } },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: '', label: { ja: '未設定', th: 'ไม่ระบุ', en: 'Not set' } },
  { value: '正社員', label: { ja: '正社員', th: 'พนักงานประจำ', en: 'Full-time' } },
  { value: '契約社員', label: { ja: '契約社員', th: 'พนักงานสัญญาจ้าง', en: 'Contract' } },
  { value: 'パート', label: { ja: 'パート', th: 'พาร์ทไทม์', en: 'Part-time' } },
  { value: '試用期間', label: { ja: '試用期間', th: 'ทดลองงาน', en: 'Probation' } },
];

const SALARY_TYPE_OPTIONS = [
  { value: '', label: { ja: '未設定', th: 'ไม่ระบุ', en: 'Not set' } },
  { value: '月給', label: { ja: '月給', th: 'รายเดือน', en: 'Monthly Salary' } },
  { value: '日給', label: { ja: '日給', th: 'รายวัน', en: 'Daily Wage' } },
];

const STATUS_OPTIONS = [
  { value: '在籍', label: { ja: '在籍', th: 'ทำงานอยู่', en: 'Active' } },
  { value: '退職', label: { ja: '退職', th: 'ลาออก', en: 'Inactive' } },
  { value: '休職', label: { ja: '休職', th: 'ลาพัก', en: 'On Leave' } },
];

// 有効期限アラートの計算
// 敬称を性別から取得
const getHonorific = (gender: string | null | undefined): string => {
  if (gender === '男性') return 'MR.';
  if (gender === '女性') return 'MS.';
  return '';
};

// 有効期限アラートの計算
const getExpiryAlert = (expiryDate: string | null | undefined, language: Language): { level: 'danger' | 'warning' | 'info' | null; message: string } => {
  if (!expiryDate) return { level: null, message: '' };

  const expiry = new Date(expiryDate);
  const now = new Date();
  const oneMonth = 30 * 24 * 60 * 60 * 1000;
  const twoMonths = 60 * 24 * 60 * 60 * 1000;
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs < 0) {
    return {
      level: 'danger',
      message: language === 'ja' ? '期限切れ' : language === 'th' ? 'หมดอายุแล้ว' : 'Expired'
    };
  }
  if (diffMs < oneMonth) {
    return {
      level: 'danger',
      message: language === 'ja' ? '1ヶ月以内' : language === 'th' ? 'ภายใน 1 เดือน' : 'Within 1 month'
    };
  }
  if (diffMs < twoMonths) {
    return {
      level: 'warning',
      message: language === 'ja' ? '2ヶ月以内' : language === 'th' ? 'ภายใน 2 เดือน' : 'Within 2 months'
    };
  }
  return { level: null, message: '' };
};

// 画像モーダルコンポーネント
const ImageModal = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  language
}: {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  language: Language;
}) => {
  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.${blob.type.split('/')[1] || 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
          <h3 className="font-medium text-slate-900">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              {language === 'ja' ? 'ダウンロード' : language === 'th' ? 'ดาวน์โหลด' : 'Download'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-4 flex items-center justify-center bg-slate-100">
          <img
            src={imageUrl}
            alt={title}
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};

// 証明書カードコンポーネント
const DocumentCard = ({
  title,
  icon,
  number,
  numberLabel,
  expiry,
  expiryLabel,
  imageUrl,
  alert,
  isEditing,
  onNumberChange,
  onExpiryChange,
  onImageSelect,
  inputRef,
  language,
  onImageClick
}: {
  title: string;
  icon: React.ReactNode;
  number: string;
  numberLabel: string;
  expiry: string;
  expiryLabel: string;
  imageUrl: string | null;
  alert: { level: 'danger' | 'warning' | 'info' | null; message: string };
  isEditing: boolean;
  onNumberChange: (value: string) => void;
  onExpiryChange: (value: string) => void;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  language: Language;
  onImageClick: () => void;
}) => {
  const alertColors = {
    danger: 'border-red-300 bg-red-50',
    warning: 'border-amber-300 bg-amber-50',
    info: 'border-blue-300 bg-blue-50',
  };

  const alertBadgeColors = {
    danger: 'bg-red-100 text-red-700 border-red-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  return (
    <div className={`rounded-xl border-2 ${alert.level ? alertColors[alert.level] : 'border-slate-200 bg-white'} overflow-hidden transition-all hover:shadow-md`}>
      <div className="px-4 py-3 border-b border-slate-200/50 flex items-center justify-between bg-white/80">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
        {alert.level && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${alertBadgeColors[alert.level]}`}>
            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
            {alert.message}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex gap-4">
          {/* 画像エリア */}
          <div className="flex-shrink-0">
            {imageUrl ? (
              <div className="relative group cursor-pointer" onClick={onImageClick}>
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-28 h-20 object-cover rounded-lg border border-slate-200 transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-all flex items-center justify-center">
                  <MagnifyingGlassPlusIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                    className="absolute -bottom-2 -right-2 p-1.5 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 shadow-lg"
                  >
                    <CameraIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : isEditing ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-28 h-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all"
              >
                <PhotoIcon className="w-6 h-6 mb-1" />
                <span className="text-xs">追加</span>
              </button>
            ) : (
              <div className="w-28 h-20 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400">
                <PhotoIcon className="w-8 h-8" />
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={onImageSelect}
              className="hidden"
            />
          </div>

          {/* 情報エリア */}
          <div className="flex-1 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{numberLabel}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={number}
                  onChange={(e) => onNumberChange(e.target.value)}
                  className={tableStyles.input}
                />
              ) : (
                <p className="text-sm font-mono text-slate-900">{number || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{expiryLabel}</label>
              {isEditing ? (
                <input
                  type="date"
                  value={expiry}
                  onChange={(e) => onExpiryChange(e.target.value)}
                  className={tableStyles.input}
                />
              ) : (
                <p className="text-sm text-slate-900">{expiry ? new Date(expiry).toLocaleDateString(language === 'ja' ? 'ja-JP' : language === 'th' ? 'th-TH' : 'en-US') : '-'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function EmployeeDetailContent({
  employee,
  locale
}: EmployeeDetailContentProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRefs = {
    idCard: useRef<HTMLInputElement>(null),
    passport: useRef<HTMLInputElement>(null),
    visa: useRef<HTMLInputElement>(null),
    workPermit: useRef<HTMLInputElement>(null),
  };
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const employeeId = employee.id;

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Organization[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(employee.profile_image_url);
  const [documentImages, setDocumentImages] = useState<DocumentImages>({
    idCard: employee.id_image_url,
    passport: employee.passport_image_url,
    visa: employee.visa_image_url,
    workPermit: employee.work_permit_image_url,
  });

  // 画像モーダル状態
  const [modalImage, setModalImage] = useState<{ url: string; title: string } | null>(null);

  // 編集フォームの状態
  const [form, setForm] = useState({
    name: employee.name || '',
    nameTh: employee.name_th || '',
    firstName: employee.first_name || '',
    lastName: employee.last_name || '',
    firstNameTh: employee.first_name_th || '',
    lastNameTh: employee.last_name_th || '',
    nickname: employee.nickname || '',
    employeeNumber: employee.employee_number || '',
    idNumber: employee.id_number || '',
    email: employee.email || '',
    tel: employee.tel || '',
    mobile: employee.mobile || '',
    address: employee.address || '',
    status: employee.status || '在籍',
    gender: employee.gender || '',
    nationality: employee.nationality || '',
    dateOfBirth: employee.date_of_birth || '',
    hireDate: employee.hire_date || '',
    resignDate: employee.resign_date || '',
    employmentType: employee.employment_type || '',
    salaryType: employee.salary_type || '',
    position: employee.position || '',
    department: employee.department || '',
    // パスポート
    passportNumber: employee.passport_number || '',
    passportExpiry: employee.passport_expiry || '',
    // ID
    idExpiry: employee.id_expiry || '',
    // VISA情報
    visaNumber: employee.visa_number || '',
    visaExpiry: employee.visa_expiry || '',
    visaType: employee.visa_type || '',
    // ワークパミット情報
    workPermitNumber: employee.work_permit_number || '',
    workPermitExpiry: employee.work_permit_expiry || '',
    // 運転免許
    licenseNumber: employee.license_number || '',
    licenseExpiry: employee.license_expiry || '',
    // 緊急連絡先
    emergencyName: employee.emergency_contact_name || '',
    emergencyTel: employee.emergency_contact_tel || '',
    emergencyAddress: employee.emergency_contact_address || '',
    // 銀行
    bankAccount: employee.bank_account || '',
  });

  // 組織一覧を取得
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await fetch('/api/organizations');
        const data = await res.json();
        if (data.organizations) {
          setAllOrganizations(
            data.organizations.filter((org: Organization & { is_active?: boolean }) => org.is_active !== false)
          );
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
      }
    };
    fetchOrgs();
  }, []);

  // 所属部署を取得
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch(`/api/organization-members?employee_id=${employeeId}`);
        const data = await res.json();
        if (data.members) {
          const depts = data.members
            .filter((m: OrganizationMember) => m.organizations)
            .map((m: OrganizationMember) => m.organizations);
          setDepartments(depts);
          setSelectedOrgIds(data.members.map((m: OrganizationMember) => m.organization_id));
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };
    fetchDepartments();
  }, [employeeId]);

  // 組織名を取得（ロケール対応）
  const getOrgName = (org: Organization) => {
    if (language === 'en' && org.name_en) return org.name_en;
    if (language === 'th' && org.name_th) return org.name_th;
    return org.name;
  };

  // 日付フォーマット関数
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      language === 'ja' ? 'ja-JP' : language === 'th' ? 'th-TH' : 'en-US',
      { year: 'numeric', month: '2-digit', day: '2-digit' }
    );
  };

  // 年齢計算関数
  const calculateAge = (dateOfBirth: string | null | undefined): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const isActive = employee.status === '在籍' || employee.status === 'Active';

  // ラベル関数
  const label = (ja: string, th: string, en: string) =>
    language === 'ja' ? ja : language === 'th' ? th : en;

  // 選択肢のラベル取得
  const getOptionLabel = (options: typeof GENDER_OPTIONS, value: string | null | undefined) => {
    if (!value) return '-';
    const option = options.find(o => o.value === value);
    if (!option) return value || '-';
    return option.label[language];
  };

  // フォーム変更ハンドラ
  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // 組織選択のトグル
  const handleOrgToggle = (orgId: string) => {
    setSelectedOrgIds((prev) =>
      prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId]
    );
  };

  // プロフィール画像選択
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${employeeId}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('employee-images')
        .getPublicUrl(fileName);

      setProfileImage(publicUrl);
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  // 書類画像選択
  const handleDocImageSelect = (docType: keyof DocumentImages) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setDocumentImages(prev => ({
        ...prev,
        [docType]: reader.result as string
      }));
    };
    reader.readAsDataURL(file);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${employeeId}/${docType}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('employee-images')
        .getPublicUrl(fileName);

      setDocumentImages(prev => ({
        ...prev,
        [docType]: publicUrl
      }));
    } catch (error) {
      console.error('Failed to upload document image:', error);
    }
  };

  // 編集キャンセル
  const handleCancel = () => {
    setForm({
      name: employee.name || '',
      nameTh: employee.name_th || '',
      firstName: employee.first_name || '',
      lastName: employee.last_name || '',
      firstNameTh: employee.first_name_th || '',
      lastNameTh: employee.last_name_th || '',
      nickname: employee.nickname || '',
      employeeNumber: employee.employee_number || '',
      idNumber: employee.id_number || '',
      email: employee.email || '',
      tel: employee.tel || '',
      mobile: employee.mobile || '',
      address: employee.address || '',
      status: employee.status || '在籍',
      gender: employee.gender || '',
      nationality: employee.nationality || '',
      dateOfBirth: employee.date_of_birth || '',
      hireDate: employee.hire_date || '',
      resignDate: employee.resign_date || '',
      employmentType: employee.employment_type || '',
      salaryType: employee.salary_type || '',
      position: employee.position || '',
      department: employee.department || '',
      passportNumber: employee.passport_number || '',
      passportExpiry: employee.passport_expiry || '',
      idExpiry: employee.id_expiry || '',
      visaNumber: employee.visa_number || '',
      visaExpiry: employee.visa_expiry || '',
      visaType: employee.visa_type || '',
      workPermitNumber: employee.work_permit_number || '',
      workPermitExpiry: employee.work_permit_expiry || '',
      licenseNumber: employee.license_number || '',
      licenseExpiry: employee.license_expiry || '',
      emergencyName: employee.emergency_contact_name || '',
      emergencyTel: employee.emergency_contact_tel || '',
      emergencyAddress: employee.emergency_contact_address || '',
      bankAccount: employee.bank_account || '',
    });
    setProfileImage(employee.profile_image_url);
    setDocumentImages({
      idCard: employee.id_image_url,
      passport: employee.passport_image_url,
      visa: employee.visa_image_url,
      workPermit: employee.work_permit_image_url,
    });
    setIsEditing(false);
  };

  // 保存処理
  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          name: form.name,
          name_th: form.nameTh || null,
          first_name: form.firstName || null,
          last_name: form.lastName || null,
          first_name_th: form.firstNameTh || null,
          last_name_th: form.lastNameTh || null,
          nickname: form.nickname || null,
          employee_number: form.employeeNumber || null,
          id_number: form.idNumber || null,
          email: form.email || null,
          tel: form.tel || null,
          mobile: form.mobile || null,
          address: form.address || null,
          status: form.status,
          gender: form.gender || null,
          nationality: form.nationality || null,
          date_of_birth: form.dateOfBirth || null,
          hire_date: form.hireDate || null,
          resign_date: form.resignDate || null,
          employment_type: form.employmentType || null,
          salary_type: form.salaryType || null,
          position: form.position || null,
          department: form.department || null,
          passport_number: form.passportNumber || null,
          passport_expiry: form.passportExpiry || null,
          id_expiry: form.idExpiry || null,
          visa_number: form.visaNumber || null,
          visa_expiry: form.visaExpiry || null,
          visa_type: form.visaType || null,
          work_permit_number: form.workPermitNumber || null,
          work_permit_expiry: form.workPermitExpiry || null,
          license_number: form.licenseNumber || null,
          license_expiry: form.licenseExpiry || null,
          emergency_contact_name: form.emergencyName || null,
          emergency_contact_tel: form.emergencyTel || null,
          emergency_contact_address: form.emergencyAddress || null,
          bank_account: form.bankAccount || null,
          profile_image_url: profileImage,
          id_image_url: documentImages.idCard,
          passport_image_url: documentImages.passport,
          visa_image_url: documentImages.visa,
          work_permit_image_url: documentImages.workPermit,
        })
        .eq('id', employeeId);

      if (error) throw error;

      // 組織メンバーシップの更新
      await fetch(`/api/organization-members?employee_id=${employeeId}`, {
        method: 'DELETE',
      });

      for (const orgId of selectedOrgIds) {
        await fetch('/api/organization-members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: orgId,
            employee_id: employeeId,
          }),
        });
      }

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Failed to save:', error);
      alert(language === 'ja' ? '保存に失敗しました' : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // 有効期限アラートを計算
  const idAlert = getExpiryAlert(form.idExpiry, language);
  const passportAlert = getExpiryAlert(form.passportExpiry, language);
  const visaAlert = getExpiryAlert(form.visaExpiry, language);
  const workPermitAlert = getExpiryAlert(form.workPermitExpiry, language);

  // アラートの集約
  const allAlerts = [
    { type: 'ID', alert: idAlert },
    { type: label('パスポート', 'พาสปอร์ต', 'Passport'), alert: passportAlert },
    { type: 'VISA', alert: visaAlert },
    { type: label('ワークパミット', 'ใบอนุญาตทำงาน', 'Work Permit'), alert: workPermitAlert },
  ].filter(a => a.alert.level);

  return (
    <div className="space-y-6">
      {/* 画像モーダル */}
      {modalImage && (
        <ImageModal
          isOpen={!!modalImage}
          onClose={() => setModalImage(null)}
          imageUrl={modalImage.url}
          title={modalImage.title}
          language={language}
        />
      )}

      {/* アラートサマリー */}
      {allAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BellAlertIcon className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-semibold text-red-800">
              {label('有効期限アラート', 'การแจ้งเตือนหมดอายุ', 'Expiry Alerts')}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {allAlerts.map((a, idx) => (
              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                {a.type}: {a.alert.message}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/employees`}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex items-center gap-4">
            {/* プロフィール画像 */}
            <div className="relative">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={form.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-slate-400" />
                </div>
              )}
              {isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 transition-colors"
                  >
                    <CameraIcon className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {/* 敬称 + 言語に応じた名前表示（firstName/lastName使用時のみ敬称追加） */}
                {language === 'th'
                  ? (form.firstNameTh && form.lastNameTh
                      ? `${getHonorific(form.gender)}${form.firstNameTh} ${form.lastNameTh}`
                      : form.nameTh || form.name || '-')
                  : (form.firstName && form.lastName
                      ? `${getHonorific(form.gender)}${form.firstName} ${form.lastName}`
                      : form.name || '-')
                }
                {form.nickname && (
                  <span className="ml-2 text-lg font-normal text-slate-500">({form.nickname})</span>
                )}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`${tableStyles.statusBadge} ${isActive ? tableStyles.statusActive : tableStyles.statusInactive}`}>
                  {getOptionLabel(STATUS_OPTIONS, form.status)}
                </span>
                {form.employeeNumber && (
                  <span className="text-sm text-slate-500 font-mono">{form.employeeNumber}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <XMarkIcon className="w-4 h-4" />
                {label('キャンセル', 'ยกเลิก', 'Cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <CheckIcon className="w-4 h-4" />
                {saving ? label('保存中...', 'กำลังบันทึก...', 'Saving...') : label('保存', 'บันทึก', 'Save')}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <PencilSquareIcon className="w-4 h-4" />
              {label('編集', 'แก้ไข', 'Edit')}
            </button>
          )}
        </div>
      </div>

      {/* コンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左カラム: 基本情報 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本情報カード */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">
                {label('基本情報', 'ข้อมูลพื้นฐาน', 'Basic Information')}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* 1行目: 性別、国籍、ニックネーム */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label('性別', 'เพศ', 'Gender')}</label>
                  {isEditing ? (
                    <select
                      value={form.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      className={tableStyles.input}
                    >
                      {GENDER_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label[language]}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-slate-900">{getOptionLabel(GENDER_OPTIONS, form.gender)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label('国籍', 'สัญชาติ', 'Nationality')}</label>
                  {isEditing ? (
                    <select
                      value={form.nationality}
                      onChange={(e) => handleChange('nationality', e.target.value)}
                      className={tableStyles.input}
                    >
                      {NATIONALITY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label[language]}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-slate-900">{getOptionLabel(NATIONALITY_OPTIONS, form.nationality)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label('ニックネーム', 'ชื่อเล่น', 'Nickname')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.nickname}
                      onChange={(e) => handleChange('nickname', e.target.value)}
                      className={tableStyles.input}
                    />
                  ) : (
                    <p className="text-sm text-slate-900">{form.nickname || '-'}</p>
                  )}
                </div>
              </div>

              {/* 2行目: 氏名（英語）- 姓・名 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label('姓（英語）', 'นามสกุล (อังกฤษ)', 'Last Name')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.lastName || form.name}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className={tableStyles.input}
                    />
                  ) : (
                    <p className="text-sm text-slate-900">{form.lastName || form.name || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label('名（英語）', 'ชื่อ (อังกฤษ)', 'First Name')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className={tableStyles.input}
                    />
                  ) : (
                    <p className="text-sm text-slate-900">{form.firstName || '-'}</p>
                  )}
                </div>
              </div>

              {/* 3行目: 氏名（タイ語）- 姓・名 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label('姓（タイ語）', 'นามสกุล (ไทย)', 'Last Name (Thai)')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.lastNameTh || form.nameTh}
                      onChange={(e) => handleChange('lastNameTh', e.target.value)}
                      className={tableStyles.input}
                    />
                  ) : (
                    <p className="text-sm text-slate-900">{form.lastNameTh || form.nameTh || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label('名（タイ語）', 'ชื่อ (ไทย)', 'First Name (Thai)')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.firstNameTh}
                      onChange={(e) => handleChange('firstNameTh', e.target.value)}
                      className={tableStyles.input}
                    />
                  ) : (
                    <p className="text-sm text-slate-900">{form.firstNameTh || '-'}</p>
                  )}
                </div>
              </div>

              {/* 4行目: 生年月日、年齢 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label('生年月日', 'วันเกิด', 'Date of Birth')}</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                      className={tableStyles.input}
                    />
                  ) : (
                    <p className="text-sm text-slate-900">{formatDate(form.dateOfBirth)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label('年齢', 'อายุ', 'Age')}</label>
                  <p className="text-sm text-slate-900">
                    {calculateAge(form.dateOfBirth) !== null
                      ? `${calculateAge(form.dateOfBirth)} ${label('歳', 'ปี', 'years old')}`
                      : '-'}
                  </p>
                </div>
              </div>

              {/* 5行目: メールアドレス、携帯番号（社内用） */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label('メールアドレス（社内）', 'อีเมล (บริษัท)', 'Email (Company)')}</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={tableStyles.input}
                    />
                  ) : (
                    <p className="text-sm text-slate-900">{form.email || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label('携帯番号（社内）', 'เบอร์มือถือ (บริษัท)', 'Mobile (Company)')}</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={form.mobile}
                      onChange={(e) => handleChange('mobile', e.target.value)}
                      className={tableStyles.input}
                    />
                  ) : (
                    <p className="text-sm text-slate-900">{form.mobile || '-'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 雇用情報カード */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
              <BriefcaseIcon className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">
                {label('雇用情報', 'ข้อมูลการจ้างงาน', 'Employment Information')}
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 部署（複数選択可能） */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">{label('部署', 'แผนก', 'Department')}</label>
                {isEditing ? (
                  <div className="border border-slate-300 rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                    {allOrganizations.map(org => (
                      <label key={org.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={selectedOrgIds.includes(org.id)}
                          onChange={() => handleOrgToggle(org.id)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-700">{getOrgName(org)}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {departments.length > 0 ? (
                      departments.map((dept) => (
                        <span key={dept.id} className={tableStyles.tag}>
                          {getOrgName(dept)}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-900">-</p>
                    )}
                  </div>
                )}
              </div>
              {/* 役職 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{label('役職', 'ตำแหน่ง', 'Position')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                    className={tableStyles.input}
                  />
                ) : (
                  <p className="text-sm text-slate-900">{form.position || '-'}</p>
                )}
              </div>
              {/* 雇用形態 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{label('雇用形態', 'ประเภทการจ้างงาน', 'Employment Type')}</label>
                {isEditing ? (
                  <select
                    value={form.employmentType}
                    onChange={(e) => handleChange('employmentType', e.target.value)}
                    className={tableStyles.input}
                  >
                    {EMPLOYMENT_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label[language]}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-slate-900">{getOptionLabel(EMPLOYMENT_TYPE_OPTIONS, form.employmentType)}</p>
                )}
              </div>
              {/* 在籍状況 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{label('在籍状況', 'สถานะ', 'Status')}</label>
                {isEditing ? (
                  <select
                    value={form.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className={tableStyles.input}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label[language]}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-slate-900">{getOptionLabel(STATUS_OPTIONS, form.status)}</p>
                )}
              </div>
              {/* 入社日 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{label('入社日', 'วันเริ่มงาน', 'Hire Date')}</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={form.hireDate}
                    onChange={(e) => handleChange('hireDate', e.target.value)}
                    className={tableStyles.input}
                  />
                ) : (
                  <p className="text-sm text-slate-900">{formatDate(form.hireDate)}</p>
                )}
              </div>
              {/* 退社日 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{label('退社日', 'วันที่ลาออก', 'Resign Date')}</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={form.resignDate}
                    onChange={(e) => handleChange('resignDate', e.target.value)}
                    className={tableStyles.input}
                  />
                ) : (
                  <p className="text-sm text-slate-900">{formatDate(form.resignDate)}</p>
                )}
              </div>
              {/* 給与体系 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{label('給与体系', 'ประเภทเงินเดือน', 'Salary Type')}</label>
                {isEditing ? (
                  <select
                    value={form.salaryType}
                    onChange={(e) => handleChange('salaryType', e.target.value)}
                    className={tableStyles.input}
                  >
                    {SALARY_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label[language]}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-slate-900">{getOptionLabel(SALARY_TYPE_OPTIONS, form.salaryType)}</p>
                )}
              </div>
              {/* 銀行口座 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{label('銀行口座', 'บัญชีธนาคาร', 'Bank Account')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.bankAccount}
                    onChange={(e) => handleChange('bankAccount', e.target.value)}
                    className={tableStyles.input}
                  />
                ) : (
                  <p className="text-sm text-slate-900">{form.bankAccount || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* 証明書・書類カード */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
              <DocumentIcon className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">
                {label('証明書・書類', 'เอกสารรับรอง', 'Documents')}
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ID Card */}
              <DocumentCard
                title={label('ID（身分証明書）', 'บัตรประจำตัว', 'ID Card')}
                icon={<ShieldCheckIcon className="w-5 h-5 text-indigo-500" />}
                number={form.idNumber}
                numberLabel={label('ID番号', 'หมายเลขบัตร', 'ID Number')}
                expiry={form.idExpiry}
                expiryLabel={label('有効期限', 'วันหมดอายุ', 'Expiry')}
                imageUrl={documentImages.idCard}
                alert={idAlert}
                isEditing={isEditing}
                onNumberChange={(v) => handleChange('idNumber', v)}
                onExpiryChange={(v) => handleChange('idExpiry', v)}
                onImageSelect={handleDocImageSelect('idCard')}
                inputRef={docInputRefs.idCard}
                language={language}
                onImageClick={() => documentImages.idCard && setModalImage({ url: documentImages.idCard, title: label('ID（身分証明書）', 'บัตรประจำตัว', 'ID Card') })}
              />

              {/* Passport */}
              <DocumentCard
                title={label('パスポート', 'พาสปอร์ต', 'Passport')}
                icon={<DocumentIcon className="w-5 h-5 text-emerald-500" />}
                number={form.passportNumber}
                numberLabel={label('パスポート番号', 'หมายเลขพาสปอร์ต', 'Passport No.')}
                expiry={form.passportExpiry}
                expiryLabel={label('有効期限', 'วันหมดอายุ', 'Expiry')}
                imageUrl={documentImages.passport}
                alert={passportAlert}
                isEditing={isEditing}
                onNumberChange={(v) => handleChange('passportNumber', v)}
                onExpiryChange={(v) => handleChange('passportExpiry', v)}
                onImageSelect={handleDocImageSelect('passport')}
                inputRef={docInputRefs.passport}
                language={language}
                onImageClick={() => documentImages.passport && setModalImage({ url: documentImages.passport, title: label('パスポート', 'พาสปอร์ต', 'Passport') })}
              />

              {/* VISA */}
              <DocumentCard
                title="VISA"
                icon={<DocumentIcon className="w-5 h-5 text-amber-500" />}
                number={form.visaNumber}
                numberLabel={label('VISA番号', 'หมายเลขวีซ่า', 'VISA No.')}
                expiry={form.visaExpiry}
                expiryLabel={label('有効期限', 'วันหมดอายุ', 'Expiry')}
                imageUrl={documentImages.visa}
                alert={visaAlert}
                isEditing={isEditing}
                onNumberChange={(v) => handleChange('visaNumber', v)}
                onExpiryChange={(v) => handleChange('visaExpiry', v)}
                onImageSelect={handleDocImageSelect('visa')}
                inputRef={docInputRefs.visa}
                language={language}
                onImageClick={() => documentImages.visa && setModalImage({ url: documentImages.visa, title: 'VISA' })}
              />

              {/* Work Permit */}
              <DocumentCard
                title={label('ワークパミット', 'ใบอนุญาตทำงาน', 'Work Permit')}
                icon={<BriefcaseIcon className="w-5 h-5 text-purple-500" />}
                number={form.workPermitNumber}
                numberLabel={label('WP番号', 'หมายเลขใบอนุญาต', 'WP No.')}
                expiry={form.workPermitExpiry}
                expiryLabel={label('有効期限', 'วันหมดอายุ', 'Expiry')}
                imageUrl={documentImages.workPermit}
                alert={workPermitAlert}
                isEditing={isEditing}
                onNumberChange={(v) => handleChange('workPermitNumber', v)}
                onExpiryChange={(v) => handleChange('workPermitExpiry', v)}
                onImageSelect={handleDocImageSelect('workPermit')}
                inputRef={docInputRefs.workPermit}
                language={language}
                onImageClick={() => documentImages.workPermit && setModalImage({ url: documentImages.workPermit, title: label('ワークパミット', 'ใบอนุญาตทำงาน', 'Work Permit') })}
              />
            </div>
          </div>
        </div>

        {/* 右カラム: 緊急連絡先・組織 */}
        <div className="space-y-6">
          {/* 連絡先・住所カード */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">
                {label('連絡先・住所', 'ที่อยู่และการติดต่อ', 'Contact & Address')}
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* 個人情報セクション */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
                  {label('個人連絡先', 'ข้อมูลส่วนตัว', 'Personal Contact')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{label('住所', 'ที่อยู่', 'Address')}</label>
                    {isEditing ? (
                      <textarea
                        value={form.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        rows={2}
                        className={tableStyles.input}
                      />
                    ) : (
                      <p className="text-sm text-slate-900">{form.address || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{label('携帯電話（個人）', 'โทรศัพท์มือถือ (ส่วนตัว)', 'Mobile (Personal)')}</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={form.mobile}
                        onChange={(e) => handleChange('mobile', e.target.value)}
                        className={tableStyles.input}
                      />
                    ) : (
                      <p className="text-sm text-slate-900">{form.mobile || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 緊急連絡先セクション */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
                  {label('緊急連絡先', 'ผู้ติดต่อฉุกเฉิน', 'Emergency Contact')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{label('氏名', 'ชื่อ', 'Name')}</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={form.emergencyName}
                        onChange={(e) => handleChange('emergencyName', e.target.value)}
                        className={tableStyles.input}
                      />
                    ) : (
                      <p className="text-sm text-slate-900">{form.emergencyName || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{label('電話番号', 'เบอร์โทรศัพท์', 'Phone')}</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={form.emergencyTel}
                        onChange={(e) => handleChange('emergencyTel', e.target.value)}
                        className={tableStyles.input}
                      />
                    ) : (
                      <p className="text-sm text-slate-900">{form.emergencyTel || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{label('住所', 'ที่อยู่', 'Address')}</label>
                    {isEditing ? (
                      <textarea
                        value={form.emergencyAddress}
                        onChange={(e) => handleChange('emergencyAddress', e.target.value)}
                        rows={2}
                        className={tableStyles.input}
                      />
                    ) : (
                      <p className="text-sm text-slate-900">{form.emergencyAddress || '-'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 所属組織カード */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {label('所属組織', 'องค์กรที่สังกัด', 'Organizations')}
              </h2>
            </div>
            <div className="p-6">
              {isEditing ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {allOrganizations.map((org) => (
                    <label key={org.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedOrgIds.includes(org.id)}
                        onChange={() => handleOrgToggle(org.id)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-700">{getOrgName(org)}</span>
                    </label>
                  ))}
                </div>
              ) : departments.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {departments.map((dept) => (
                    <span key={dept.id} className={tableStyles.tag}>
                      {getOrgName(dept)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">{label('所属組織なし', 'ไม่มีองค์กรที่สังกัด', 'No organizations')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
