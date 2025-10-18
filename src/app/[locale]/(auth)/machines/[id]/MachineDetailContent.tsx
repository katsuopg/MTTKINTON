'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MachineRecord, WorkNoRecord, QuotationRecord } from '@/types/kintone';
import { type Language, getFieldLabel, getStatusLabel } from '@/lib/kintone/field-mappings';
import Link from 'next/link';
import TransitionLink from '@/components/ui/TransitionLink';

interface MachineDetailContentProps {
  locale: string;
  language: Language;
  machineRecord: MachineRecord;
  workNoRecords: WorkNoRecord[];
  quotationRecords: QuotationRecord[];
  customerMachines: MachineRecord[];
}

export default function MachineDetailContent({
  locale,
  language,
  machineRecord,
  workNoRecords,
  quotationRecords,
  customerMachines,
}: MachineDetailContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('details');
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);

  // タブアイコンコンポーネント
  function DocumentIcon({ className }: { className?: string }) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }

  function ListIcon({ className }: { className?: string }) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    );
  }

  function ClipboardIcon({ className }: { className?: string }) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    );
  }

  // 日付フォーマット
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    if (language === 'ja') {
      return dateString;
    } else {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  // 数値フォーマット
  const formatNumber = (value: string | null | undefined) => {
    if (!value) return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  return (
    <div className="py-4 px-4">
      {/* ヘッダー */}
      <div className="mb-6 mt-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            {machineRecord.McItem?.value ? `${machineRecord.McItem.value} ` : ''}{machineRecord.Moldel?.value || 'Machine Details'}
          </h1>
          <button
            onClick={() => {
              setIsNavigating(true);
              startTransition(() => {
                router.push(`/${locale}/machines`);
              });
            }}
            disabled={isPending || isNavigating}
            className="px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(isPending || isNavigating) ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {language === 'ja' ? '読み込み中...' : language === 'th' ? 'กำลังโหลด...' : 'Loading...'}
              </span>
            ) : (
              language === 'ja' ? '一覧へ戻る' : language === 'th' ? 'กลับไปที่รายการ' : 'Back to List'
            )}
          </button>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('details')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'text-blue-600 border-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <DocumentIcon className={`mr-3 h-5 w-5 inline-block ${activeTab === 'details' ? 'text-blue-600' : 'text-gray-400'}`} />
            {language === 'ja' ? '機械詳細' : language === 'th' ? 'รายละเอียด' : 'Machine Details'}
          </button>
          
          {workNoRecords.length > 0 && (
            <button
              onClick={() => setActiveTab('workno')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'workno'
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ListIcon className={`mr-3 h-5 w-5 inline-block ${activeTab === 'workno' ? 'text-blue-600' : 'text-gray-400'}`} />
              {language === 'ja' ? '工事番号一覧' : language === 'th' ? 'รายการเลขที่งาน' : 'Work Number List'}
              <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                activeTab === 'workno' ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
              }`}>
                {workNoRecords.length}
              </span>
            </button>
          )}
          
          {quotationRecords.length > 0 && (
            <button
              onClick={() => setActiveTab('quotation')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'quotation'
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ClipboardIcon className={`mr-3 h-5 w-5 inline-block ${activeTab === 'quotation' ? 'text-blue-600' : 'text-gray-400'}`} />
              {language === 'ja' ? '見積一覧' : language === 'th' ? 'รายการใบเสนอราคา' : 'Quotation List'}
              <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                activeTab === 'quotation' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {quotationRecords.length}
              </span>
            </button>
          )}
        </nav>
      </div>

      {/* タブコンテンツ */}
      <div>
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左側: 機械詳細情報（2カラム分） */}
            <div className="lg:col-span-2 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="border-t border-gray-100">
                <dl className="divide-y divide-gray-100">
                {/* 顧客情報セクション */}
                <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {language === 'ja' ? 'CS ID' : 'CS ID'}
                  </dt>
                  <dd className="mt-0 text-sm leading-5 text-gray-700 sm:col-span-2 sm:mt-0">
                    {machineRecord.CsId_db?.value ? (
                      <TransitionLink
                        href={`/${locale}/customers/${machineRecord.CsId_db.value}`}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        {machineRecord.CsId_db.value}
                      </TransitionLink>
                    ) : '-'}
                  </dd>
                </div>
                <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {language === 'ja' ? '顧客名' : language === 'th' ? 'ชื่อลูกค้า' : 'Customer Name'}
                  </dt>
                  <dd className="mt-0 text-sm leading-5 text-gray-700 sm:col-span-2 sm:mt-0">
                    {machineRecord.CsName?.value || '-'}
                  </dd>
                </div>
                
                {/* 機械情報セクション */}
                <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {language === 'ja' ? 'カテゴリ' : language === 'th' ? 'หมวดหมู่' : 'Category'}
                  </dt>
                  <dd className="mt-0 text-sm leading-5 text-gray-700 sm:col-span-2 sm:mt-0">
                    {machineRecord.MachineCategory?.value || '-'}
                  </dd>
                </div>
                <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {language === 'ja' ? 'タイプ' : language === 'th' ? 'ประเภท' : 'Type'}
                  </dt>
                  <dd className="mt-0 text-sm leading-5 text-gray-700 sm:col-span-2 sm:mt-0">
                    {machineRecord.Drop_down_0?.value || '-'}
                  </dd>
                </div>
                <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {language === 'ja' ? 'メーカー' : language === 'th' ? 'ผู้ผลิต' : 'Vendor'}
                  </dt>
                  <dd className="mt-0 text-sm leading-5 text-gray-700 sm:col-span-2 sm:mt-0">
                    {machineRecord.Vender?.value || '-'}
                  </dd>
                </div>
                <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {language === 'ja' ? 'モデル' : language === 'th' ? 'รุ่น' : 'Model'}
                  </dt>
                  <dd className="mt-0 text-sm leading-5 text-gray-700 sm:col-span-2 sm:mt-0">
                    {machineRecord.Moldel?.value || '-'}
                  </dd>
                </div>
                <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {language === 'ja' ? 'シリアル番号' : language === 'th' ? 'หมายเลขซีเรียล' : 'Serial No.'}
                  </dt>
                  <dd className="mt-0 text-sm leading-5 text-gray-700 sm:col-span-2 sm:mt-0">
                    {machineRecord.SrialNo?.value || '-'}
                  </dd>
                </div>

                {/* 詳細情報セクション */}
                <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {language === 'ja' ? '年' : language === 'th' ? 'ปี' : 'Year'}
                  </dt>
                  <dd className="mt-0 text-sm leading-5 text-gray-700 sm:col-span-2 sm:mt-0">
                    {machineRecord.Year?.value || '-'}
                  </dd>
                </div>
                <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {language === 'ja' ? '仕様' : language === 'th' ? 'ข้อมูลจำเพาะ' : 'Specification'}
                  </dt>
                  <dd className="mt-0 text-sm leading-5 text-gray-700 sm:col-span-2 sm:mt-0">
                    {machineRecord.Specification?.value || '-'}
                  </dd>
                </div>

                <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {language === 'ja' ? 'その他' : language === 'th' ? 'อื่นๆ' : 'Others'}
                  </dt>
                  <dd className="mt-0 text-sm leading-5 text-gray-700 sm:col-span-2 sm:mt-0">
                    {machineRecord.Others?.value || '-'}
                  </dd>
                </div>
                <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {language === 'ja' ? 'コメント' : language === 'th' ? 'หมายเหตุ' : 'Comment'}
                  </dt>
                  <dd className="mt-0 text-sm leading-5 text-gray-700 sm:col-span-2 sm:mt-0">
                    {machineRecord.Comment?.value || '-'}
                  </dd>
                </div>
                <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {language === 'ja' ? '作成日' : language === 'th' ? 'วันที่สร้าง' : 'Created Date'}
                  </dt>
                  <dd className="mt-0 text-sm leading-5 text-gray-700 sm:col-span-2 sm:mt-0">
                    {formatDate(machineRecord.作成日時?.value)}
                  </dd>
                </div>
                <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {language === 'ja' ? '更新日' : language === 'th' ? 'วันที่อัปเดต' : 'Updated Date'}
                  </dt>
                  <dd className="mt-0 text-sm leading-5 text-gray-700 sm:col-span-2 sm:mt-0">
                    {formatDate(machineRecord.更新日時?.value)}
                  </dd>
                </div>
                </dl>
              </div>
            </div>
            
            {/* 右側: 保有機械リスト（1カラム分） */}
            {customerMachines.length > 0 && (
              <div className="lg:col-span-1">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-3 sm:px-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        {language === 'ja' ? '保有機械一覧' : language === 'th' ? 'รายการเครื่องจักรที่ครอบครอง' : 'Machine List'}
                      </h3>
                      <span className="text-sm font-medium text-gray-500">
                        {customerMachines.length + 1} {language === 'ja' ? '台' : language === 'th' ? 'เครื่อง' : 'units'}
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {/* 現在表示中の機械 */}
                    <div className="px-4 py-3 bg-blue-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-blue-600">
                              {machineRecord.McItem?.value || '-'}
                            </span>
                            <span className="text-sm text-gray-900">
                              {machineRecord.Moldel?.value || '-'}
                            </span>
                            {machineRecord.MCNo?.value && (
                              <span className="text-sm text-gray-600">
                                {machineRecord.MCNo.value}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {language === 'ja' ? '表示中' : language === 'th' ? 'กำลังแสดง' : 'Current'}
                        </span>
                      </div>
                    </div>
                    {/* 他の保有機械 */}
                    {customerMachines.map((machine) => (
                      <TransitionLink
                        key={machine.$id.value}
                        href={`/${locale}/machines/${machine.$id.value}`}
                        className="block px-4 py-3 hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm font-medium text-indigo-600">
                                {machine.McItem?.value || '-'}
                              </span>
                              <span className="text-sm text-gray-900">
                                {machine.Moldel?.value || '-'}
                              </span>
                              {machine.MCNo?.value && (
                                <span className="text-sm text-gray-600">
                                  {machine.MCNo.value}
                                </span>
                              )}
                            </div>
                          </div>
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </TransitionLink>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'workno' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg px-4 py-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {language === 'ja' ? '関連する工事番号' : language === 'th' ? 'เลขที่งานที่เกี่ยวข้อง' : 'Related Work Numbers'}
            </h3>
            {workNoRecords.length === 0 ? (
              <p className="text-gray-500">
                {language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'ja' ? '工事番号' : language === 'th' ? 'เลขที่งาน' : 'Work No.'}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'ja' ? 'カテゴリ' : language === 'th' ? 'หมวดหมู่' : 'Category'}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'ja' ? '説明' : language === 'th' ? 'คำอธิบาย' : 'Description'}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'ja' ? '納期' : language === 'th' ? 'กำหนดส่ง' : 'Delivery'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {workNoRecords.map((record) => (
                      <tr key={record.$id.value} className="hover:bg-gray-50">
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                          <TransitionLink
                            href={`/${locale}/workno/${record.WorkNo?.value}`}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            {record.WorkNo?.value || '-'}
                          </TransitionLink>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.Status?.value === 'Working' 
                              ? 'bg-blue-100 text-blue-800'
                              : record.Status?.value === 'Finished'
                              ? 'bg-green-100 text-green-800'
                              : record.Status?.value === 'Waiting PO'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {getStatusLabel(record.Status?.value || '', language)}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                          {record.文字列__1行__1?.value || '-'}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-900">
                          {record.文字列__1行__2?.value || '-'}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(record.Salesdate?.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'quotation' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg px-4 py-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {language === 'ja' ? '関連する見積' : language === 'th' ? 'ใบเสนอราคาที่เกี่ยวข้อง' : 'Related Quotations'}
            </h3>
            {quotationRecords.length === 0 ? (
              <p className="text-gray-500">
                {language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'ja' ? '見積番号' : language === 'th' ? 'เลขที่ใบเสนอราคา' : 'Quotation No.'}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'ja' ? '見積日' : language === 'th' ? 'วันที่เสนอราคา' : 'Quote Date'}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'ja' ? '件名' : language === 'th' ? 'หัวข้อ' : 'Subject'}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'ja' ? '金額' : language === 'th' ? 'จำนวนเงิน' : 'Amount'}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quotationRecords.map((record) => (
                      <tr key={record.$id.value} className="hover:bg-gray-50">
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                          <TransitionLink
                            href={`/${locale}/quotation/${record.qtno2?.value}`}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            {record.qtno2?.value || '-'}
                          </TransitionLink>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(record.日付?.value)}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-900">
                          {record.文字列__1行__4?.value || '-'}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatNumber(record.grand_total?.value)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {record.ドロップダウン?.value || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}