'use client';

import { EmployeeRecord } from '@/types/kintone';
import { type Language } from '@/lib/kintone/field-mappings';
import Link from 'next/link';
import { 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  CalendarIcon, 
  IdentificationIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  UserGroupIcon,
  DocumentIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface EmployeeDetailContentProps {
  record: EmployeeRecord;
  locale: string;
}

export default function EmployeeDetailContent({ 
  record,
  locale 
}: EmployeeDetailContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  // 日付フォーマット関数
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      language === 'ja' ? 'ja-JP' : language === 'th' ? 'th-TH' : 'en-US',
      { year: 'numeric', month: '2-digit', day: '2-digit' }
    );
  };

  // Get employee number (check multiple possible fields)
  const employeeNumber = record.従業員番号?.value || record.社員証番号?.value || record.社員番号?.value || '-';
  const idNumber = record.IdNo?.value || record.ID_No?.value || '-';
  const department = record.配属?.value || record.部署?.value || '-';

  return (
    <div>
      {/* メインカード */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-blue-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{record.氏名?.value || '-'}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="flex items-center">
                  <IdentificationIcon className="h-4 w-4 mr-1" />
                  ID No: {idNumber}
                </span>
                <span className="flex items-center">
                  {language === 'ja' ? '社員番号' : language === 'th' ? 'รหัสพนักงาน' : 'Employee No'}: {employeeNumber}
                </span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              record.在籍状況?.value === '在籍' || record.在籍状況?.value === 'Active' 
                ? 'bg-green-100 text-green-800'
                : record.在籍状況?.value === '退職' || record.在籍状況?.value === 'Inactive'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {record.在籍状況?.value || 'Active'}
            </span>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {/* 基本情報 */}
          <section className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-gray-500" />
              {language === 'ja' ? '基本情報' : language === 'th' ? 'ข้อมูลพื้นฐาน' : 'Basic Information'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {language === 'ja' ? '配属' : language === 'th' ? 'แผนก' : 'Department'}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{department}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {language === 'ja' ? '役職' : language === 'th' ? 'ตำแหน่ง' : 'Position'}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{record.役職?.value || '-'}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {language === 'ja' ? '生年月日' : language === 'th' ? 'วันเกิด' : 'Date of Birth'}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(record.生年月日?.value)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {language === 'ja' ? '入社日' : language === 'th' ? 'วันเข้าทำงาน' : 'Hire Date'}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(record.入社日?.value)}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {language === 'ja' ? '雇用形態' : language === 'th' ? 'ประเภทการจ้าง' : 'Employment Type'}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{record.雇用形態?.value || '-'}</dd>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">TEL</dt>
                  <dd className="mt-1 text-sm">
                    {record.TEL?.value ? (
                      <a href={`tel:${record.TEL.value}`} className="text-blue-600 hover:text-blue-800">
                        {record.TEL.value}
                      </a>
                    ) : '-'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {language === 'ja' ? 'メールアドレス' : language === 'th' ? 'อีเมล' : 'Email'}
                  </dt>
                  <dd className="mt-1 text-sm">
                    {record.メールアドレス?.value ? (
                      <a href={`mailto:${record.メールアドレス.value}`} className="text-blue-600 hover:text-blue-800">
                        {record.メールアドレス.value}
                      </a>
                    ) : '-'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {language === 'ja' ? '住所' : language === 'th' ? 'ที่อยู่' : 'Address'}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{record.住所?.value || '-'}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {language === 'ja' ? '給与支払形態' : language === 'th' ? 'รูปแบบการจ่ายเงินเดือน' : 'Salary Payment'}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{record.給与支払形態?.value || '-'}</dd>
                </div>
              </div>
            </div>
          </section>

          {/* パスポート・証明書情報 */}
          <section className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center">
              <DocumentIcon className="h-5 w-5 mr-2 text-gray-500" />
              {language === 'ja' ? 'パスポート・証明書情報' : language === 'th' ? 'ข้อมูลหนังสือเดินทาง/เอกสาร' : 'Passport & Certificate Information'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {language === 'ja' ? 'パスポート番号' : language === 'th' ? 'หมายเลขหนังสือเดินทาง' : 'Passport Number'}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">
                    {record.PassportNo?.value || record.パスポート番号?.value || '-'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {language === 'ja' ? 'パスポート有効期限' : language === 'th' ? 'วันหมดอายุหนังสือเดินทาง' : 'Passport Expiry'}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    {formatDate(record.パスポート有効期限?.value)}
                    {record.パスポート有効期限?.value && 
                     new Date(record.パスポート有効期限.value) < new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) && (
                      <span className="ml-2 inline-flex items-center text-amber-600">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        <span className="text-xs">
                          {language === 'ja' ? '6ヶ月以内に期限切れ' : 'Expires within 6 months'}
                        </span>
                      </span>
                    )}
                  </dd>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {language === 'ja' ? 'ID番号' : language === 'th' ? 'เลขบัตรประชาชน' : 'ID Number'}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{idNumber}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {language === 'ja' ? 'ID有効期限' : language === 'th' ? 'วันหมดอายุบัตรประชาชน' : 'ID Expiry'}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(record.ID有効期限?.value)}</dd>
                </div>
              </div>
            </div>
          </section>

          {/* 緊急連絡先 */}
          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2 text-gray-500" />
              {language === 'ja' ? '緊急連絡先' : language === 'th' ? 'ผู้ติดต่อฉุกเฉิน' : 'Emergency Contact'}
            </h2>
            
            <div className="bg-red-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {language === 'ja' ? '氏名' : language === 'th' ? 'ชื่อ' : 'Name'}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{record.緊急時連絡先氏名?.value || '-'}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">TEL</dt>
                  <dd className="mt-1 text-sm">
                    {record.緊急時連絡先TEL?.value ? (
                      <a href={`tel:${record.緊急時連絡先TEL.value}`} className="text-blue-600 hover:text-blue-800">
                        {record.緊急時連絡先TEL.value}
                      </a>
                    ) : '-'}
                  </dd>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* フッター */}
        <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
          <Link
            href={`/${locale}/employees`}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← {language === 'ja' ? '一覧に戻る' : language === 'th' ? 'กลับไปยังรายการ' : 'Back to List'}
          </Link>
          
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              {language === 'ja' ? '編集' : language === 'th' ? 'แก้ไข' : 'Edit'}
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
              {language === 'ja' ? '削除' : language === 'th' ? 'ลบ' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}