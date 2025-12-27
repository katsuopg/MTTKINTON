'use client';

import { useState, useMemo } from 'react';
import { CostRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { Language } from '@/lib/kintone/field-mappings';
import { getStatusColor } from '@/lib/kintone/utils';
import { tableStyles } from '@/components/ui/TableStyles';

interface CostManagementContentProps {
  costRecords: CostRecord[];
  locale: string;
  userEmail: string;
}

export function CostManagementContent({ costRecords, locale, userEmail }: CostManagementContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const [searchTerm, setSearchTerm] = useState('');
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
      return 'bg-indigo-50';
    } else if (normalizedStatus.includes('Arrived')) {
      return 'bg-emerald-50';
    }
    return '';
  };

  return (
    <DashboardLayout locale={locale} userEmail={userEmail} title={pageTitle}>
      <div className={tableStyles.contentWrapper}>
        {/* 検索バー */}
        <div className={tableStyles.searchWrapper}>
          <div className={tableStyles.searchForm}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                language === 'ja' ? '工事番号、PO番号、サプライヤー名で検索...' : 
                language === 'th' ? 'ค้นหาตามหมายเลขงาน, PO, ชื่อซัพพลายเออร์...' : 
                'Search by Work No., PO No., Supplier name...'
              }
              className={tableStyles.searchInput}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className={tableStyles.clearButton}
              >
                {language === 'ja' ? 'クリア' : language === 'th' ? 'ล้าง' : 'Clear'}
              </button>
            )}
          </div>
        </div>

        {/* レコード数表示 */}
        <div className={tableStyles.filterBar}>
          <p className={tableStyles.recordCount}>
            {language === 'ja' ? `${filteredCosts.length} 件のコストレコード` : 
             language === 'th' ? `${filteredCosts.length} รายการต้นทุน` : 
             `${filteredCosts.length} cost records`}
          </p>
        </div>

        {/* テーブル */}
        <div className={tableStyles.tableContainer}>
          <div className="max-w-7xl overflow-x-auto">
          {filteredCosts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
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
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {language === 'ja' ? '工事番号' : language === 'th' ? 'หมายเลขงาน' : 'Work No.'}
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {language === 'ja' ? 'WNステータス' : language === 'th' ? 'สถานะ WN' : 'WN Status'}
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {language === 'ja' ? '開始日' : language === 'th' ? 'วันเริ่ม' : 'Start Date'}
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {language === 'ja' ? '完了日' : language === 'th' ? 'วันเสร็จ' : 'Finish Date'}
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    PO No.
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {language === 'ja' ? 'PO日付' : language === 'th' ? 'วันที่ PO' : 'PO Date'}
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    CS ID
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {language === 'ja' ? '到着日' : language === 'th' ? 'วันที่มาถึง' : 'Arrival Date'}
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {language === 'ja' ? '請求日' : language === 'th' ? 'วันที่ใบแจ้งหนี้' : 'INV Date'}
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {language === 'ja' ? '支払日' : language === 'th' ? 'วันที่ชำระ' : 'Payment Date'}
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {language === 'ja' ? '支払条件' : language === 'th' ? 'เงื่อนไขการชำระ' : 'Payment Term'}
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    ITEM
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {language === 'ja' ? '説明' : language === 'th' ? 'คำอธิบาย' : 'Description'}
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {language === 'ja' ? 'サプライヤー' : language === 'th' ? 'ซัพพลายเออร์' : 'Supplier'}
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {language === 'ja' ? 'モデル/タイプ' : language === 'th' ? 'รุ่น/ประเภท' : 'Model/Type'}
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {language === 'ja' ? '単価' : language === 'th' ? 'ราคาต่อหน่วย' : 'Unit Price'}
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    UNIT
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    QTY
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {language === 'ja' ? '合計' : language === 'th' ? 'ยอดรวม' : 'Total'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredCosts.map((record) => (
                  <tr key={record.$id.value} className={`hover:bg-slate-50 ${getRowColorClass(record.ドロップダウン_5?.value)}`}>
                    <td className="whitespace-nowrap px-3 py-3 text-sm">
                      {record.数値_0?.value || record.$id?.value || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm">
                      {record.文字列__1行__15?.value ? (
                        <Link
                          href={`/${locale}/workno/${encodeURIComponent(record.文字列__1行__15.value)}`}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          {record.文字列__1行__15.value}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium min-w-[60px] justify-center ${
                          getStatusColor(record.ドロップダウン?.value || '')
                        }`}
                      >
                        {record.ドロップダウン?.value || '-'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-center">
                      {formatDate(record.日付?.value)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-center">
                      {formatDate(record.日付_0?.value)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm font-medium">
                      {record.文字列__1行__1?.value || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-center">
                      {formatDate(record.日付_1?.value)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm">
                      {record.文字列__1行__2?.value || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium min-w-[70px] justify-center ${
                          getStatusColor(record.ドロップダウン_5?.value || '')
                        }`}
                      >
                        {record.ドロップダウン_5?.value || '-'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-center">
                      {formatDate(record.日付_2?.value)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-center">
                      {formatDate(record.日付_3?.value)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-center">
                      {formatDate(record.日付_4?.value)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm">
                      {record.ドロップダウン_0?.value || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm">
                      {record.文字列__1行__3?.value || '-'}
                    </td>
                    <td className="px-3 py-3 text-sm max-w-[200px] truncate" title={record.文字列__1行__7?.value || ''}>
                      {record.文字列__1行__7?.value || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm">
                      {record.ルックアップ_1?.value || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm">
                      {record.文字列__1行__9?.value || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-right font-mono">
                      {formatNumber(record.unit_price_0?.value)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-center">
                      {record.ドロップダウン_3?.value || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-right font-mono">
                      {formatNumber(record.数値?.value)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-right font-mono font-bold">
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