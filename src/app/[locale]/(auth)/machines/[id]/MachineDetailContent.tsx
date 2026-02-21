'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MachineRecord, WorkNoRecord, QuotationRecord } from '@/types/kintone';
import { type Language, getStatusLabel } from '@/lib/kintone/field-mappings';
import TransitionLink from '@/components/ui/TransitionLink';
import Tabs, { TabPanel } from '@/components/ui/Tabs';
import { detailStyles, getStatusBadgeClass } from '@/components/ui/DetailStyles';
import { DetailPageHeader } from '@/components/ui/DetailPageHeader';
import { tableStyles } from '@/components/ui/TableStyles';
import { FileText, List, ClipboardList } from 'lucide-react';
import { extractCsName } from '@/lib/utils/customer-name';

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

  const tabLabels = {
    details: { ja: '機械詳細', en: 'Machine Details', th: 'รายละเอียด' },
    workno: { ja: '工事番号一覧', en: 'Work Number List', th: 'รายการเลขที่งาน' },
    quotation: { ja: '見積一覧', en: 'Quotation List', th: 'รายการใบเสนอราคา' },
  };

  const tabs = [
    { key: 'details', label: tabLabels.details[language], icon: <FileText size={16} /> },
    ...(workNoRecords.length > 0 ? [{ key: 'workno', label: tabLabels.workno[language], badge: workNoRecords.length, icon: <List size={16} /> }] : []),
    ...(quotationRecords.length > 0 ? [{ key: 'quotation', label: tabLabels.quotation[language], badge: quotationRecords.length, icon: <ClipboardList size={16} /> }] : []),
  ];

  return (
    <div className={detailStyles.pageWrapper}>
      <DetailPageHeader
        backHref={`/${locale}/machines`}
        backLabel={language === 'ja' ? '一覧へ戻る' : language === 'th' ? 'กลับไปที่รายการ' : 'Back to List'}
        title={`${machineRecord.McItem?.value ? `${machineRecord.McItem.value} ` : ''}${machineRecord.Moldel?.value || 'Machine Details'}`}
      />

      {/* メインカード */}
      <div className={detailStyles.card}>
        {/* タブナビゲーション */}
        <div className={detailStyles.cardHeader}>
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="underline"
          />
        </div>

        {/* タブコンテンツ */}
        <TabPanel value="details" activeValue={activeTab} className={detailStyles.cardContent}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左側: 機械詳細情報（2カラム分） */}
            <div className="lg:col-span-2">
              <dl className={detailStyles.dl}>
                {/* 顧客情報セクション */}
                <div className={detailStyles.dlRow}>
                  <dt className={detailStyles.dlLabel}>
                    {language === 'ja' ? '顧客名' : language === 'th' ? 'ชื่อลูกค้า' : 'Customer'}
                  </dt>
                  <dd className={detailStyles.dlValue}>
                    {machineRecord.CsId_db?.value ? (
                      <TransitionLink
                        href={`/${locale}/customers/${machineRecord.CsId_db.value}`}
                        className={detailStyles.link}
                      >
                        {extractCsName(machineRecord.CsId_db.value)}
                      </TransitionLink>
                    ) : '-'}
                  </dd>
                </div>
                <div className={detailStyles.dlRow}>
                  <dt className={detailStyles.dlLabel}>
                    {language === 'ja' ? '会社名' : language === 'th' ? 'ชื่อบริษัท' : 'Company Name'}
                  </dt>
                  <dd className={`${detailStyles.dlValue} text-gray-500 dark:text-gray-400`}>
                    {machineRecord.CsName?.value || '-'}
                  </dd>
                </div>

                {/* 機械情報セクション */}
                <div className={detailStyles.dlRow}>
                  <dt className={detailStyles.dlLabel}>
                    {language === 'ja' ? 'カテゴリ' : language === 'th' ? 'หมวดหมู่' : 'Category'}
                  </dt>
                  <dd className={detailStyles.dlValue}>
                    {machineRecord.MachineCategory?.value || '-'}
                  </dd>
                </div>
                <div className={detailStyles.dlRow}>
                  <dt className={detailStyles.dlLabel}>
                    {language === 'ja' ? 'タイプ' : language === 'th' ? 'ประเภท' : 'Type'}
                  </dt>
                  <dd className={detailStyles.dlValue}>
                    {machineRecord.Drop_down_0?.value || '-'}
                  </dd>
                </div>
                <div className={detailStyles.dlRow}>
                  <dt className={detailStyles.dlLabel}>
                    {language === 'ja' ? 'メーカー' : language === 'th' ? 'ผู้ผลิต' : 'Vendor'}
                  </dt>
                  <dd className={detailStyles.dlValue}>
                    {machineRecord.Vender?.value || '-'}
                  </dd>
                </div>
                <div className={detailStyles.dlRow}>
                  <dt className={detailStyles.dlLabel}>
                    {language === 'ja' ? 'モデル' : language === 'th' ? 'รุ่น' : 'Model'}
                  </dt>
                  <dd className={detailStyles.dlValue}>
                    {machineRecord.Moldel?.value || '-'}
                  </dd>
                </div>
                <div className={detailStyles.dlRow}>
                  <dt className={detailStyles.dlLabel}>
                    {language === 'ja' ? 'シリアル番号' : language === 'th' ? 'หมายเลขซีเรียล' : 'Serial No.'}
                  </dt>
                  <dd className={detailStyles.dlValue}>
                    {machineRecord.SrialNo?.value || '-'}
                  </dd>
                </div>

                {/* 詳細情報セクション */}
                <div className={detailStyles.dlRow}>
                  <dt className={detailStyles.dlLabel}>
                    {language === 'ja' ? '年' : language === 'th' ? 'ปี' : 'Year'}
                  </dt>
                  <dd className={detailStyles.dlValue}>
                    {machineRecord.Year?.value || '-'}
                  </dd>
                </div>
                <div className={detailStyles.dlRow}>
                  <dt className={detailStyles.dlLabel}>
                    {language === 'ja' ? '仕様' : language === 'th' ? 'ข้อมูลจำเพาะ' : 'Specification'}
                  </dt>
                  <dd className={detailStyles.dlValue}>
                    {machineRecord.Specification?.value || '-'}
                  </dd>
                </div>
                <div className={detailStyles.dlRow}>
                  <dt className={detailStyles.dlLabel}>
                    {language === 'ja' ? 'その他' : language === 'th' ? 'อื่นๆ' : 'Others'}
                  </dt>
                  <dd className={detailStyles.dlValue}>
                    {machineRecord.Others?.value || '-'}
                  </dd>
                </div>
                <div className={detailStyles.dlRow}>
                  <dt className={detailStyles.dlLabel}>
                    {language === 'ja' ? 'コメント' : language === 'th' ? 'หมายเหตุ' : 'Comment'}
                  </dt>
                  <dd className={detailStyles.dlValue}>
                    {machineRecord.Comment?.value || '-'}
                  </dd>
                </div>
                <div className={detailStyles.dlRow}>
                  <dt className={detailStyles.dlLabel}>
                    {language === 'ja' ? '作成日' : language === 'th' ? 'วันที่สร้าง' : 'Created Date'}
                  </dt>
                  <dd className={detailStyles.dlValue}>
                    {formatDate(machineRecord.作成日時?.value)}
                  </dd>
                </div>
                <div className={detailStyles.dlRow}>
                  <dt className={detailStyles.dlLabel}>
                    {language === 'ja' ? '更新日' : language === 'th' ? 'วันที่อัปเดต' : 'Updated Date'}
                  </dt>
                  <dd className={detailStyles.dlValue}>
                    {formatDate(machineRecord.更新日時?.value)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* 右側: 保有機械リスト（1カラム分） */}
            {customerMachines.length > 0 && (
              <div className="lg:col-span-1">
                <div className={detailStyles.card}>
                  <div className={`${detailStyles.cardHeader} flex items-center justify-between`}>
                    <h3 className={detailStyles.cardTitle}>
                      {language === 'ja' ? '保有機械一覧' : language === 'th' ? 'รายการเครื่องจักรที่ครอบครอง' : 'Machine List'}
                    </h3>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {customerMachines.length + 1} {language === 'ja' ? '台' : language === 'th' ? 'เครื่อง' : 'units'}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {/* 現在表示中の機械 */}
                    <div className="px-4 py-3 bg-brand-50 dark:bg-brand-900/20">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                              {machineRecord.McItem?.value || '-'}
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white/90">
                              {machineRecord.Moldel?.value || '-'}
                            </span>
                            {machineRecord.MCNo?.value && (
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {machineRecord.MCNo.value}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium bg-brand-100 text-brand-800 rounded-full dark:bg-brand-500/20 dark:text-brand-400">
                          {language === 'ja' ? '表示中' : language === 'th' ? 'กำลังแสดง' : 'Current'}
                        </span>
                      </div>
                    </div>
                    {/* 他の保有機械 */}
                    {customerMachines.map((machine) => (
                      <TransitionLink
                        key={machine.$id.value}
                        href={`/${locale}/machines/${machine.$id.value}`}
                        className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors duration-150 ease-in-out"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                                {machine.McItem?.value || '-'}
                              </span>
                              <span className="text-sm text-gray-900 dark:text-white/90">
                                {machine.Moldel?.value || '-'}
                              </span>
                              {machine.MCNo?.value && (
                                <span className="text-sm text-gray-600 dark:text-gray-400">
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
        </TabPanel>

        <TabPanel value="workno" activeValue={activeTab} className={detailStyles.cardContent}>
          <h3 className={`${detailStyles.cardTitle} mb-4`}>
            {language === 'ja' ? '関連する工事番号' : language === 'th' ? 'เลขที่งานที่เกี่ยวข้อง' : 'Related Work Numbers'}
          </h3>
          {workNoRecords.length === 0 ? (
            <p className={detailStyles.emptyState}>
              {language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}
            </p>
          ) : (
            <div className={tableStyles.tableContainer}>
              <table className={tableStyles.table}>
                <thead className={tableStyles.thead}>
                  <tr>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? '工事番号' : language === 'th' ? 'เลขที่งาน' : 'Work No.'}
                    </th>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                    </th>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? 'カテゴリ' : language === 'th' ? 'หมวดหมู่' : 'Category'}
                    </th>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? '説明' : language === 'th' ? 'คำอธิบาย' : 'Description'}
                    </th>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? '納期' : language === 'th' ? 'กำหนดส่ง' : 'Delivery'}
                    </th>
                  </tr>
                </thead>
                <tbody className={tableStyles.tbody}>
                  {workNoRecords.map((record) => (
                    <tr key={record.$id.value} className={tableStyles.tr}>
                      <td className={tableStyles.td}>
                        <TransitionLink
                          href={`/${locale}/workno/${record.WorkNo?.value}`}
                          className={detailStyles.link}
                        >
                          {record.WorkNo?.value || '-'}
                        </TransitionLink>
                      </td>
                      <td className={tableStyles.td}>
                        <span className={getStatusBadgeClass(record.Status?.value || '')}>
                          {getStatusLabel(record.Status?.value || '', language)}
                        </span>
                      </td>
                      <td className={tableStyles.td}>
                        {record.文字列__1行__1?.value || '-'}
                      </td>
                      <td className={tableStyles.td}>
                        {record.文字列__1行__2?.value || '-'}
                      </td>
                      <td className={tableStyles.td}>
                        {formatDate(record.Salesdate?.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabPanel>

        <TabPanel value="quotation" activeValue={activeTab} className={detailStyles.cardContent}>
          <h3 className={`${detailStyles.cardTitle} mb-4`}>
            {language === 'ja' ? '関連する見積' : language === 'th' ? 'ใบเสนอราคาที่เกี่ยวข้อง' : 'Related Quotations'}
          </h3>
          {quotationRecords.length === 0 ? (
            <p className={detailStyles.emptyState}>
              {language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}
            </p>
          ) : (
            <div className={tableStyles.tableContainer}>
              <table className={tableStyles.table}>
                <thead className={tableStyles.thead}>
                  <tr>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? '見積番号' : language === 'th' ? 'เลขที่ใบเสนอราคา' : 'Quotation No.'}
                    </th>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? '見積日' : language === 'th' ? 'วันที่เสนอราคา' : 'Quote Date'}
                    </th>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? '件名' : language === 'th' ? 'หัวข้อ' : 'Subject'}
                    </th>
                    <th className={`${tableStyles.th} text-right`}>
                      {language === 'ja' ? '金額' : language === 'th' ? 'จำนวนเงิน' : 'Amount'}
                    </th>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                    </th>
                  </tr>
                </thead>
                <tbody className={tableStyles.tbody}>
                  {quotationRecords.map((record) => (
                    <tr key={record.$id.value} className={tableStyles.tr}>
                      <td className={tableStyles.td}>
                        <TransitionLink
                          href={`/${locale}/quotation/${record.qtno2?.value}`}
                          className={detailStyles.link}
                        >
                          {record.qtno2?.value || '-'}
                        </TransitionLink>
                      </td>
                      <td className={tableStyles.td}>
                        {formatDate(record.日付?.value)}
                      </td>
                      <td className={tableStyles.td}>
                        {record.文字列__1行__4?.value || '-'}
                      </td>
                      <td className={`${tableStyles.td} text-right`}>
                        {formatNumber(record.grand_total?.value)}
                      </td>
                      <td className={tableStyles.td}>
                        <span className={getStatusBadgeClass(record.ドロップダウン?.value || '')}>
                          {record.ドロップダウン?.value || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabPanel>
      </div>
    </div>
  );
}
