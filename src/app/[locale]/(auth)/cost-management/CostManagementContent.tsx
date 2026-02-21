'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CostRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { Language } from '@/lib/kintone/field-mappings';
import { getStatusColor } from '@/lib/kintone/utils';
import { tableStyles } from '@/components/ui/TableStyles';
import { ListPageHeader } from '@/components/ui/ListPageHeader';
import { extractCsName } from '@/lib/utils/customer-name';

interface CostManagementContentProps {
  costRecords: CostRecord[];
  locale: string;
  userEmail: string;
  userInfo?: { email: string; name: string; avatarUrl?: string };
}

export function CostManagementContent({ costRecords, locale, userEmail, userInfo }: CostManagementContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const pageTitle = language === 'ja' ? 'コスト管理' : language === 'th' ? 'จัดการต้นทุน' : 'Cost Management';

  // フィルタリング
  const filteredCosts = useMemo(() => {
    if (!searchTerm) return costRecords;
    
    return costRecords.filter(record => {
      const workNo = record.文字列__1行__15?.value?.toLowerCase() || record.Work_No?.value?.toLowerCase() || '';
      const poNo = record.文字列__1行__1?.value?.toLowerCase() || '';
      const supplier = record.ルックアップ_1?.value?.toLowerCase() || '';
      const item = record.文字列__1行__3?.value?.toLowerCase() || '';
      const status = record.ドロップダウン_5?.value?.toLowerCase() || '';
      const query = searchTerm.toLowerCase();
      
      return workNo.includes(query) || 
             poNo.includes(query) || 
             supplier.includes(query) || 
             item.includes(query) || 
             status.includes(query);
    });
  }, [costRecords, searchTerm]);

  // 日付フォーマット関数
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    
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

  // 数値フォーマット関数
  const formatNumber = (value: string | undefined) => {
    if (!value || value === '0' || value === '') return '-';
    const number = parseFloat(value);
    if (isNaN(number)) return '-';
    return number.toLocaleString();
  };

  // ステータスによる行の色分け
  const getRowColorClass = (status: string | undefined) => {
    if (!status) return '';
    
    const normalizedStatus = status.trim();
    if (normalizedStatus.includes('Working')) {
      return 'bg-blue-50';
    } else if (normalizedStatus.includes('Arrived')) {
      return 'bg-green-50';
    }
    return '';
  };

  return (
    <DashboardLayout locale={locale} userEmail={userEmail} title={pageTitle} userInfo={userInfo}>
      <div className={tableStyles.contentWrapper}>
        <ListPageHeader
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={
            language === 'ja' ? '工事番号、PO番号、サプライヤー名で検索...' :
            language === 'th' ? 'ค้นหาตามหมายเลขงาน, PO, ชื่อซัพพลายเออร์...' :
            'Search by Work No., PO No., Supplier name...'
          }
          totalCount={filteredCosts.length}
          countLabel={language === 'ja' ? '件のコストレコード' : language === 'th' ? ' รายการต้นทุน' : ' cost records'}
        />

        {/* テーブル */}
        <div className={tableStyles.tableContainer}>
          <div className="max-w-7xl overflow-x-auto">
          {filteredCosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? (
                language === 'ja' ? '検索結果が見つかりませんでした' : 
                language === 'th' ? 'ไม่พบผลการค้นหา' : 
                'No search results found'
              ) : (
                language === 'ja' ? 'コストレコードがありません' : 
                language === 'th' ? 'ไม่มีรายการต้นทุน' : 
                'No cost records'
              )}
            </div>
          ) : (
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-16">
                    ID
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-28">
                    {language === 'ja' ? '工事番号' : language === 'th' ? 'หมายเลขงาน' : 'Work No.'}
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-24">
                    {language === 'ja' ? 'WNステータス' : language === 'th' ? 'สถานะ WN' : 'WN Status'}
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-24">
                    {language === 'ja' ? '開始日' : language === 'th' ? 'วันเริ่ม' : 'Start Date'}
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-24">
                    {language === 'ja' ? '完了日' : language === 'th' ? 'วันเสร็จ' : 'Finish Date'}
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-28">
                    PO No.
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-24">
                    {language === 'ja' ? 'PO日付' : language === 'th' ? 'วันที่ PO' : 'PO Date'}
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-24">
                    {language === 'ja' ? '顧客名' : language === 'th' ? 'ลูกค้า' : 'Customer'}
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-24">
                    {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-24">
                    {language === 'ja' ? '到着日' : language === 'th' ? 'วันที่มาถึง' : 'Arrival Date'}
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-24">
                    {language === 'ja' ? '請求日' : language === 'th' ? 'วันที่ใบแจ้งหนี้' : 'INV DATE'}
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-24">
                    {language === 'ja' ? '支払日' : language === 'th' ? 'วันที่ชำระ' : 'Payment Date'}
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-24">
                    {language === 'ja' ? '支払条件' : language === 'th' ? 'เงื่อนไขการชำระ' : 'Payment Term'}
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-32">
                    ITEM
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-40">
                    {language === 'ja' ? '説明' : language === 'th' ? 'คำอธิบาย' : 'Description'}
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-40">
                    {language === 'ja' ? 'サプライヤー' : language === 'th' ? 'ซัพพลายเออร์' : 'Supplier'}
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-32">
                    {language === 'ja' ? 'モデル/タイプ' : language === 'th' ? 'รุ่น/ประเภท' : 'Model/Type'}
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-right text-theme-xs dark:text-gray-400 w-24">
                    {language === 'ja' ? '単価' : language === 'th' ? 'ราคาต่อหน่วย' : 'Unit Price'}
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-16">
                    UNIT
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-right text-theme-xs dark:text-gray-400 w-16">
                    QTY
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-right text-theme-xs dark:text-gray-400 w-24">
                    {language === 'ja' ? '合計' : language === 'th' ? 'ยอดรวม' : 'Total'}
                  </th>
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
                {filteredCosts.map((record) => (
                  <tr
                    key={record.$id.value}
                    className={`${tableStyles.trClickable} ${getRowColorClass(record.ドロップダウン_5?.value)}`}
                    onClick={() => {
                      const workNo = record.文字列__1行__15?.value;
                      if (workNo) router.push(`/${locale}/workno/${encodeURIComponent(workNo)}`);
                    }}
                  >
                    <td className={tableStyles.td}>
                      {record.数値_0?.value || record.$id?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {record.文字列__1行__15?.value ? (
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {record.文字列__1行__15.value}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className={tableStyles.td}>
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium min-w-[60px] justify-center ${
                          getStatusColor(record.ドロップダウン?.value || '')
                        }`}
                      >
                        {record.ドロップダウン?.value || '-'}
                      </span>
                    </td>
                    <td className={`${tableStyles.td} text-center`}>
                      {formatDate(record.日付?.value)}
                    </td>
                    <td className={`${tableStyles.td} text-center`}>
                      {formatDate(record.日付_0?.value)}
                    </td>
                    <td className={`${tableStyles.td} font-medium`}>
                      {record.文字列__1行__1?.value || '-'}
                    </td>
                    <td className={`${tableStyles.td} text-center`}>
                      {formatDate(record.日付_1?.value)}
                    </td>
                    <td className={tableStyles.td}>
                      {extractCsName(record.文字列__1行__2?.value) || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium min-w-[70px] justify-center ${
                          getStatusColor(record.ドロップダウン_5?.value || '')
                        }`}
                      >
                        {record.ドロップダウン_5?.value || '-'}
                      </span>
                    </td>
                    <td className={`${tableStyles.td} text-center`}>
                      {formatDate(record.日付_2?.value)}
                    </td>
                    <td className={`${tableStyles.td} text-center`}>
                      {formatDate(record.日付_3?.value)}
                    </td>
                    <td className={`${tableStyles.td} text-center`}>
                      {formatDate(record.日付_4?.value)}
                    </td>
                    <td className={tableStyles.td}>
                      {record.ドロップダウン_0?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {record.文字列__1行__3?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {record.文字列__1行__7?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {record.ルックアップ_1?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {record.文字列__1行__9?.value || '-'}
                    </td>
                    <td className={`${tableStyles.td} text-right font-mono`}>
                      {formatNumber(record.unit_price_0?.value)}
                    </td>
                    <td className={`${tableStyles.td} text-center`}>
                      {record.ドロップダウン_3?.value || '-'}
                    </td>
                    <td className={`${tableStyles.td} text-right font-mono`}>
                      {formatNumber(record.数値?.value)}
                    </td>
                    <td className={`${tableStyles.td} text-right font-mono font-bold`}>
                      {formatNumber(record.total_0?.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}