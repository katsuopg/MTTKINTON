'use client';

import { ProjectRecord, CustomerRecord } from '@/types/kintone';
import { getStatusColor } from '@/lib/kintone/utils';
import { type Language } from '@/lib/kintone/field-mappings';
import Link from 'next/link';

interface ProjectDetailContentProps {
  record: ProjectRecord;
  customer: CustomerRecord | null;
  locale: string;
}

export default function ProjectDetailContent({ 
  record, 
  customer,
  locale 
}: ProjectDetailContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '未定';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    if (language === 'ja') {
      return dateString; // YYYY-MM-DD
    } else {
      // DD/MM/YYYY for English and Thai
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ヘッダー情報 */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{record.PJ_code.value}</h2>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            getStatusColor(record.Status?.value || '見積中')
          }`}>
            {record.Status?.value || '見積中'}
          </span>
        </div>

        {/* 基本情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左側のカラム */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                {language === 'ja' ? 'プロジェクト名' : language === 'th' ? 'ชื่อโครงการ' : 'Project Name'}
              </h3>
              <p className="mt-1 text-lg text-gray-900">{record.PjName?.value || '-'}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">CS ID</h3>
              <p className="mt-1 text-lg text-gray-900">
                {record.Cs_ID?.value || '-'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                {language === 'ja' ? '顧客名' : language === 'th' ? 'ชื่อลูกค้า' : 'Customer Name'}
              </h3>
              <p className="mt-1 text-lg text-gray-900">{customer?.会社名?.value || record.Customer?.value || '-'}</p>
            </div>

            {record.WorkNo?.value && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  {language === 'ja' ? '工事番号' : language === 'th' ? 'หมายเลขงาน' : 'Work No.'}
                </h3>
                <Link 
                  href={`/${locale}/workno/${encodeURIComponent(record.WorkNo.value)}`}
                  className="mt-1 text-lg text-indigo-600 hover:text-indigo-800"
                >
                  {record.WorkNo.value}
                </Link>
              </div>
            )}
          </div>

          {/* 右側のカラム */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                {language === 'ja' ? '開始日' : language === 'th' ? 'วันเริ่มต้น' : 'Start Date'}
              </h3>
              <p className="mt-1 text-lg text-gray-900">{formatDate(record.Start_date?.value)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                {language === 'ja' ? '納期' : language === 'th' ? 'กำหนดส่ง' : 'Due Date'}
              </h3>
              <p className="mt-1 text-lg text-gray-900">{formatDate(record.Due_date?.value)}</p>
            </div>
          </div>
        </div>

        {/* 説明 */}
        {record.Description?.value && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              {language === 'ja' ? '説明' : language === 'th' ? 'คำอธิบาย' : 'Description'}
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{record.Description.value}</p>
            </div>
          </div>
        )}
      </div>

      {/* 操作ボタン */}
      <div className="flex justify-end space-x-4">
        <Link
          href={`/${locale}/project-management`}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {language === 'ja' ? '戻る' : language === 'th' ? 'กลับ' : 'Back'}
        </Link>
      </div>
    </div>
  );
}