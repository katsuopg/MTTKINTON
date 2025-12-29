'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmployeeRecord } from '@/types/kintone';
import { type Language } from '@/lib/kintone/field-mappings';
import Link from 'next/link';

interface EmployeeEditContentProps {
  record: EmployeeRecord;
  locale: string;
}

export default function EmployeeEditContent({
  record,
  locale
}: EmployeeEditContentProps) {
  const router = useRouter();
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  // Form state
  const [formData, setFormData] = useState({
    氏名: record.氏名?.value || '',
    配属: record.配属?.value || '',
    役職: record.役職?.value || '',
    生年月日: record.生年月日?.value || '',
    入社日: record.入社日?.value || '',
    雇用形態: record.雇用形態?.value || '',
    給与支払形態: record.給与支払形態?.value || '',
    TEL: record.TEL?.value || '',
    メールアドレス: record.メールアドレス?.value || '',
    住所: record.住所?.value || '',
    PassportNo: record.PassportNo?.value || record.パスポート番号?.value || '',
    パスポート有効期限: record.パスポート有効期限?.value || '',
    ID有効期限: record.ID有効期限?.value || '',
    緊急時連絡先氏名: record.緊急時連絡先氏名?.value || '',
    緊急時連絡先TEL: record.緊急時連絡先TEL?.value || '',
    在籍状況: record.在籍状況?.value || '在籍',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const labels = {
    ja: {
      title: '従業員編集',
      basicInfo: '基本情報',
      contactInfo: '連絡先情報',
      documentInfo: 'パスポート・証明書情報',
      emergencyContact: '緊急連絡先',
      name: '氏名',
      department: '配属',
      position: '役職',
      birthDate: '生年月日',
      hireDate: '入社日',
      employmentType: '雇用形態',
      salaryPayment: '給与支払形態',
      status: '在籍状況',
      phone: '電話番号',
      email: 'メールアドレス',
      address: '住所',
      passportNo: 'パスポート番号',
      passportExpiry: 'パスポート有効期限',
      idExpiry: 'ID有効期限',
      emergencyName: '緊急連絡先氏名',
      emergencyPhone: '緊急連絡先電話番号',
      save: '保存',
      cancel: 'キャンセル',
      saving: '保存中...',
      saveSuccess: '保存しました',
      saveError: '保存に失敗しました',
      active: '在籍',
      resigned: '退職',
    },
    en: {
      title: 'Edit Employee',
      basicInfo: 'Basic Information',
      contactInfo: 'Contact Information',
      documentInfo: 'Passport & Certificate Information',
      emergencyContact: 'Emergency Contact',
      name: 'Name',
      department: 'Department',
      position: 'Position',
      birthDate: 'Date of Birth',
      hireDate: 'Hire Date',
      employmentType: 'Employment Type',
      salaryPayment: 'Salary Payment',
      status: 'Status',
      phone: 'Phone',
      email: 'Email',
      address: 'Address',
      passportNo: 'Passport No.',
      passportExpiry: 'Passport Expiry',
      idExpiry: 'ID Expiry',
      emergencyName: 'Emergency Contact Name',
      emergencyPhone: 'Emergency Contact Phone',
      save: 'Save',
      cancel: 'Cancel',
      saving: 'Saving...',
      saveSuccess: 'Saved successfully',
      saveError: 'Failed to save',
      active: 'Active',
      resigned: 'Resigned',
    },
    th: {
      title: 'แก้ไขพนักงาน',
      basicInfo: 'ข้อมูลพื้นฐาน',
      contactInfo: 'ข้อมูลติดต่อ',
      documentInfo: 'ข้อมูลหนังสือเดินทาง',
      emergencyContact: 'ผู้ติดต่อฉุกเฉิน',
      name: 'ชื่อ',
      department: 'แผนก',
      position: 'ตำแหน่ง',
      birthDate: 'วันเกิด',
      hireDate: 'วันเข้าทำงาน',
      employmentType: 'ประเภทการจ้าง',
      salaryPayment: 'รูปแบบการจ่ายเงินเดือน',
      status: 'สถานะ',
      phone: 'โทรศัพท์',
      email: 'อีเมล',
      address: 'ที่อยู่',
      passportNo: 'หมายเลขหนังสือเดินทาง',
      passportExpiry: 'วันหมดอายุหนังสือเดินทาง',
      idExpiry: 'วันหมดอายุบัตรประชาชน',
      emergencyName: 'ชื่อผู้ติดต่อฉุกเฉิน',
      emergencyPhone: 'โทรศัพท์ผู้ติดต่อฉุกเฉิน',
      save: 'บันทึก',
      cancel: 'ยกเลิก',
      saving: 'กำลังบันทึก...',
      saveSuccess: 'บันทึกเรียบร้อย',
      saveError: 'บันทึกไม่สำเร็จ',
      active: 'ทำงานอยู่',
      resigned: 'ลาออก',
    },
  };

  const t = labels[language];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/employees/${record.$id.value}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: t.saveSuccess });
        setTimeout(() => {
          router.push(`/${locale}/employees/${record.$id.value}`);
          router.refresh();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: t.saveError });
      }
    } catch {
      setMessage({ type: 'error', text: t.saveError });
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 text-theme-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300";

  return (
    <div className="p-4 md:p-6 space-y-6">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {t.title}: {record.氏名?.value}
          </h1>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-theme-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50"
            >
              {isSaving ? t.saving : t.save}
            </button>
            <Link
              href={`/${locale}/employees/${record.$id.value}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-theme-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              {t.cancel}
            </Link>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-theme-sm ${
            message.type === 'success'
              ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500'
              : 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500'
          }`}>
            {message.text}
          </div>
        )}

        {/* Basic Information Card */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] mb-6">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {t.basicInfo}
            </h2>
          </div>
          <div className="p-5 lg:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-theme-xs text-gray-500 dark:text-gray-400 mb-2">{t.name}</label>
                <input
                  type="text"
                  name="氏名"
                  value={formData.氏名}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-theme-xs text-gray-500 dark:text-gray-400 mb-2">{t.department}</label>
                <input
                  type="text"
                  name="配属"
                  value={formData.配属}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-theme-xs text-gray-500 dark:text-gray-400 mb-2">{t.position}</label>
                <input
                  type="text"
                  name="役職"
                  value={formData.役職}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-theme-xs text-gray-500 dark:text-gray-400 mb-2">{t.birthDate}</label>
                <input
                  type="date"
                  name="生年月日"
                  value={formData.生年月日}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-theme-xs text-gray-500 dark:text-gray-400 mb-2">{t.hireDate}</label>
                <input
                  type="date"
                  name="入社日"
                  value={formData.入社日}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-theme-xs text-gray-500 dark:text-gray-400 mb-2">{t.status}</label>
                <select
                  name="在籍状況"
                  value={formData.在籍状況}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="在籍">{t.active}</option>
                  <option value="退職">{t.resigned}</option>
                </select>
              </div>
              <div>
                <label className="block text-theme-xs text-gray-500 dark:text-gray-400 mb-2">{t.employmentType}</label>
                <input
                  type="text"
                  name="雇用形態"
                  value={formData.雇用形態}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-theme-xs text-gray-500 dark:text-gray-400 mb-2">{t.salaryPayment}</label>
                <input
                  type="text"
                  name="給与支払形態"
                  value={formData.給与支払形態}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] mb-6">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {t.contactInfo}
            </h2>
          </div>
          <div className="p-5 lg:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-theme-xs text-gray-500 dark:text-gray-400 mb-2">{t.phone}</label>
                <input
                  type="tel"
                  name="TEL"
                  value={formData.TEL}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-theme-xs text-gray-500 dark:text-gray-400 mb-2">{t.email}</label>
                <input
                  type="email"
                  name="メールアドレス"
                  value={formData.メールアドレス}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-theme-xs text-gray-500 dark:text-gray-400 mb-2">{t.address}</label>
                <textarea
                  name="住所"
                  value={formData.住所}
                  onChange={handleChange}
                  rows={2}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Document Information Card */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] mb-6">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {t.documentInfo}
            </h2>
          </div>
          <div className="p-5 lg:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-theme-xs text-gray-500 dark:text-gray-400 mb-2">{t.passportNo}</label>
                <input
                  type="text"
                  name="PassportNo"
                  value={formData.PassportNo}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-theme-xs text-gray-500 dark:text-gray-400 mb-2">{t.passportExpiry}</label>
                <input
                  type="date"
                  name="パスポート有効期限"
                  value={formData.パスポート有効期限}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-theme-xs text-gray-500 dark:text-gray-400 mb-2">{t.idExpiry}</label>
                <input
                  type="date"
                  name="ID有効期限"
                  value={formData.ID有効期限}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact Card */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {t.emergencyContact}
            </h2>
          </div>
          <div className="p-5 lg:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-theme-xs text-gray-500 dark:text-gray-400 mb-2">{t.emergencyName}</label>
                <input
                  type="text"
                  name="緊急時連絡先氏名"
                  value={formData.緊急時連絡先氏名}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-theme-xs text-gray-500 dark:text-gray-400 mb-2">{t.emergencyPhone}</label>
                <input
                  type="tel"
                  name="緊急時連絡先TEL"
                  value={formData.緊急時連絡先TEL}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
