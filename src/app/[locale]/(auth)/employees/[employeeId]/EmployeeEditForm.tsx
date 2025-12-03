'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { tableStyles } from '@/components/ui/TableStyles';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Organization {
  id: string;
  code: string;
  name: string;
  name_en?: string;
  name_th?: string;
}

interface EmployeeEditFormProps {
  locale: string;
  employeeId: string;
  initialData: {
    name: string;
    employeeNumber: string;
    idNumber: string;
    email: string;
    tel: string;
    department: string;
    status: string;
    dateOfBirth: string;
    hireDate: string;
    resignDate: string;
    passportNumber: string;
    passportExpiry: string;
  };
}

export default function EmployeeEditForm({
  locale,
  employeeId,
  initialData,
}: EmployeeEditFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);

  const label = (ja: string, th: string, en: string) =>
    locale === 'ja' ? ja : locale === 'th' ? th : en;

  // 組織一覧と現在の所属を取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 組織一覧を取得
        const orgRes = await fetch('/api/organizations');
        const orgData = await orgRes.json();
        if (orgData.organizations) {
          setOrganizations(
            orgData.organizations.filter((org: Organization & { is_active?: boolean }) => org.is_active !== false)
          );
        }

        // 現在の所属組織を取得
        const memberRes = await fetch(`/api/organization-members?employee_id=${employeeId}`);
        const memberData = await memberRes.json();
        if (memberData.members) {
          setSelectedOrgIds(memberData.members.map((m: { organization_id: string }) => m.organization_id));
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
      }
    };
    fetchData();
  }, [employeeId]);

  const handleChange = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // 組織選択のトグル
  const handleOrgToggle = (orgId: string) => {
    setSelectedOrgIds((prev) =>
      prev.includes(orgId)
        ? prev.filter((id) => id !== orgId)
        : [...prev, orgId]
    );
  };

  // 組織名を取得（ロケール対応）
  const getOrgName = (org: Organization) => {
    if (locale === 'en' && org.name_en) return org.name_en;
    if (locale === 'th' && org.name_th) return org.name_th;
    return org.name;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 従業員情報を保存
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ||
            label(
              '保存に失敗しました',
              'บันทึกไม่สำเร็จ',
              'Failed to save'
            )
        );
      }

      // 所属組織を保存
      const memberRes = await fetch('/api/organization-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          organization_ids: selectedOrgIds,
        }),
      });

      if (!memberRes.ok) {
        console.error('Failed to save organization memberships');
      }

      // 保存後、詳細ページへ戻る
      router.push(`/${locale}/employees/${employeeId}`);
      router.refresh();
    } catch (error) {
      console.error('Error saving employee:', error);
      alert(
        label(
          '保存中にエラーが発生しました',
          'เกิดข้อผิดพลาดระหว่างการบันทึก',
          'Error while saving'
        )
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/employees/${employeeId}`}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">
          {label('従業員情報の編集', 'แก้ไขข้อมูลพนักงาน', 'Edit Employee')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <div className={tableStyles.card}>
          <div className={tableStyles.cardHeader}>
            <h2 className={tableStyles.cardTitle}>
              {label('基本情報', 'ข้อมูลพื้นฐาน', 'Basic Information')}
            </h2>
          </div>
          <div className={tableStyles.cardBody}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={tableStyles.formLabel}>
                  {label('氏名', 'ชื่อ', 'Name')}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={tableStyles.formInput}
                />
              </div>

              <div>
                <label className={tableStyles.formLabel}>
                  {label('社員番号', 'รหัสพนักงาน', 'Employee No')}
                </label>
                <input
                  type="text"
                  value={form.employeeNumber}
                  onChange={(e) => handleChange('employeeNumber', e.target.value)}
                  className={`${tableStyles.formInput} font-mono`}
                />
              </div>

              <div>
                <label className={tableStyles.formLabel}>
                  {label('ID番号', 'เลขบัตรประชาชน', 'ID No')}
                </label>
                <input
                  type="text"
                  value={form.idNumber}
                  onChange={(e) => handleChange('idNumber', e.target.value)}
                  className={`${tableStyles.formInput} font-mono`}
                />
              </div>

              <div>
                <label className={tableStyles.formLabel}>
                  {label('在籍状況', 'สถานะ', 'Status')}
                </label>
                <select
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className={tableStyles.formInput}
                >
                  <option value="在籍">
                    {label('在籍', 'ทำงานอยู่', 'Active')}
                  </option>
                  <option value="退職">
                    {label('退職', 'ลาออก', 'Inactive')}
                  </option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={tableStyles.formLabel}>
                  {label('所属部署', 'แผนกที่สังกัด', 'Departments')}
                  <span className="ml-2 text-xs text-slate-400 font-normal">
                    {label('（複数選択可）', '(เลือกได้หลายรายการ)', '(Multiple selection)')}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2 p-3 border border-slate-200 rounded-lg bg-slate-50 min-h-[56px]">
                  {organizations.length === 0 ? (
                    <span className="text-slate-400 text-sm">
                      {label(
                        '組織管理で部署を登録してください',
                        'กรุณาลงทะเบียนแผนกในการจัดการองค์กร',
                        'Please register departments in Organization Management'
                      )}
                    </span>
                  ) : (
                    organizations.map((org) => (
                      <label
                        key={org.id}
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all ${
                          selectedOrgIds.includes(org.id)
                            ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedOrgIds.includes(org.id)}
                          onChange={() => handleOrgToggle(org.id)}
                          className="sr-only"
                        />
                        {getOrgName(org)}
                      </label>
                    ))
                  )}
                </div>
                {selectedOrgIds.length > 0 && (
                  <p className={tableStyles.formHint}>
                    {label(
                      `${selectedOrgIds.length}件選択中`,
                      `เลือกแล้ว ${selectedOrgIds.length} รายการ`,
                      `${selectedOrgIds.length} selected`
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 連絡先 */}
        <div className={tableStyles.card}>
          <div className={tableStyles.cardHeader}>
            <h2 className={tableStyles.cardTitle}>
              {label('連絡先', 'ข้อมูลการติดต่อ', 'Contact Information')}
            </h2>
          </div>
          <div className={tableStyles.cardBody}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={tableStyles.formLabel}>
                  {label('メールアドレス', 'อีเมล', 'Email')}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={tableStyles.formInput}
                />
              </div>

              <div>
                <label className={tableStyles.formLabel}>TEL</label>
                <input
                  type="tel"
                  value={form.tel}
                  onChange={(e) => handleChange('tel', e.target.value)}
                  className={tableStyles.formInput}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 雇用情報 */}
        <div className={tableStyles.card}>
          <div className={tableStyles.cardHeader}>
            <h2 className={tableStyles.cardTitle}>
              {label('雇用情報', 'ข้อมูลการจ้างงาน', 'Employment Information')}
            </h2>
          </div>
          <div className={tableStyles.cardBody}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className={tableStyles.formLabel}>
                  {label('生年月日', 'วันเกิด', 'Date of Birth')}
                </label>
                <input
                  type="date"
                  value={form.dateOfBirth || ''}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  className={tableStyles.formInput}
                />
              </div>
              <div>
                <label className={tableStyles.formLabel}>
                  {label('入社日', 'วันเข้าทำงาน', 'Hire Date')}
                </label>
                <input
                  type="date"
                  value={form.hireDate || ''}
                  onChange={(e) => handleChange('hireDate', e.target.value)}
                  className={tableStyles.formInput}
                />
              </div>
              <div>
                <label className={tableStyles.formLabel}>
                  {label('退社日', 'วันลาออก', 'Resign Date')}
                </label>
                <input
                  type="date"
                  value={form.resignDate || ''}
                  onChange={(e) => handleChange('resignDate', e.target.value)}
                  className={tableStyles.formInput}
                />
              </div>
            </div>
          </div>
        </div>

        {/* パスポート・証明書情報 */}
        <div className={tableStyles.card}>
          <div className={tableStyles.cardHeader}>
            <h2 className={tableStyles.cardTitle}>
              {label('パスポート・証明書情報', 'ข้อมูลหนังสือเดินทาง', 'Passport Information')}
            </h2>
          </div>
          <div className={tableStyles.cardBody}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={tableStyles.formLabel}>
                  {label('パスポート番号', 'เลขหนังสือเดินทาง', 'Passport No')}
                </label>
                <input
                  type="text"
                  value={form.passportNumber}
                  onChange={(e) => handleChange('passportNumber', e.target.value)}
                  className={`${tableStyles.formInput} font-mono`}
                />
              </div>
              <div>
                <label className={tableStyles.formLabel}>
                  {label('パスポート有効期限', 'วันหมดอายุหนังสือเดินทาง', 'Passport Expiry')}
                </label>
                <input
                  type="date"
                  value={form.passportExpiry || ''}
                  onChange={(e) => handleChange('passportExpiry', e.target.value)}
                  className={tableStyles.formInput}
                />
              </div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className={tableStyles.buttonSecondary}
          >
            {label('キャンセル', 'ยกเลิก', 'Cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`${tableStyles.buttonPrimary} ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {saving
              ? label('保存中...', 'กำลังบันทึก...', 'Saving...')
              : label('保存', 'บันทึก', 'Save')}
          </button>
        </div>
      </form>
    </div>
  );
}
