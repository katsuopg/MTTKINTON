'use client';

import { useState, useMemo } from 'react';
import { QuotationRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Language } from '@/lib/kintone/field-mappings';
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { tableStyles } from '@/components/ui/TableStyles';

interface QuotationListContentProps {
  quotations: QuotationRecord[];
  locale: string;
  userEmail: string;
}

export default function QuotationListContent({ quotations, locale, userEmail }: QuotationListContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSalesStaff, setSelectedSalesStaff] = useState('');
  
  // 日付フォーマット関数
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    if (language === 'ja') {
      // 日本語: YYYY-MM-DD
      return dateString;
    } else {
      // 英語・タイ語: DD/MM/YYYY
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  // ステータスの選択肢を取得（重複を排除）
  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();
    quotations.forEach(qt => {
      if (qt.ドロップダウン?.value) {
        statuses.add(qt.ドロップダウン.value);
      }
    });
    return Array.from(statuses).sort();
  }, [quotations]);

  // 営業担当者の選択肢を取得（重複を排除）
  const salesStaffOptions = useMemo(() => {
    const staff = new Set<string>();
    quotations.forEach(qt => {
      if (qt.sales_staff?.value) {
        if (typeof qt.sales_staff.value === 'string') {
          staff.add(qt.sales_staff.value);
        } else if (Array.isArray(qt.sales_staff.value) && qt.sales_staff.value[0]?.name) {
          staff.add(qt.sales_staff.value[0].name);
        }
      }
    });
    return Array.from(staff).sort();
  }, [quotations]);

  // フィルタリングされた見積もりリスト
  const filteredQuotations = useMemo(() => {
    return quotations.filter(quotation => {
      // 検索クエリでフィルタリング
      if (searchQuery && searchQuery.trim() !== '') {
        const searchLower = searchQuery.toLowerCase();
        const qtNo = quotation.qtno2?.value?.toLowerCase() || '';
        const csId = quotation.文字列__1行__10?.value?.toLowerCase() || '';
        const title = quotation.文字列__1行__4?.value?.toLowerCase() || '';
        const projectName = quotation.ドロップダウン_0?.value?.toLowerCase() || '';
        
        if (!qtNo.includes(searchLower) && 
            !csId.includes(searchLower) &&
            !title.includes(searchLower) &&
            !projectName.includes(searchLower)) {
          return false;
        }
      }

      // ステータスでフィルタリング
      if (selectedStatus && quotation.ドロップダウン?.value !== selectedStatus) {
        return false;
      }

      // 営業担当者でフィルタリング
      if (selectedSalesStaff) {
        const staffValue = typeof quotation.sales_staff?.value === 'string'
          ? quotation.sales_staff.value
          : quotation.sales_staff?.value?.[0]?.name;
        if (staffValue !== selectedSalesStaff) {
          return false;
        }
      }

      return true;
    });
  }, [quotations, searchQuery, selectedStatus, selectedSalesStaff]);

  const pageTitle = language === 'ja' ? '見積もり管理' : language === 'th' ? 'จัดการใบเสนอราคา' : 'Quotation Management';

  // ステータスの表示ラベルを取得
  const getStatusLabel = (status: string) => {
    // ステータスに応じた色を返す
    const statusColors: { [key: string]: string } = {
      '見積中': 'bg-yellow-100 text-yellow-800',
      '提出済': 'bg-blue-100 text-blue-800',
      '受注': 'bg-green-100 text-green-800',
      '失注': 'bg-red-100 text-red-800',
      'キャンセル': 'bg-gray-100 text-gray-800'
    };
    
    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
        {status}
      </span>
    );
  };

  // 確率の表示
  const getProbabilityLabel = (probability: string) => {
    const probColors: { [key: string]: string } = {
      '90%': 'text-green-600',
      '75%': 'text-green-500',
      '50%': 'text-yellow-600',
      '25%': 'text-orange-600',
      '10%': 'text-red-600',
      '0%': 'text-gray-600'
    };
    
    const colorClass = probColors[probability] || 'text-gray-600';
    
    return <span className={`font-medium ${colorClass}`}>{probability}</span>;
  };

  return (
    <DashboardLayout locale={locale} userEmail={userEmail} title={pageTitle}>
      <div className={tableStyles.contentWrapper}>
        {/* 検索バー */}
        <div className={tableStyles.searchWrapper}>
          <div className={tableStyles.searchForm}>
            {/* 検索ボックス */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'ja' ? '見積もり番号、CS ID、タイトルで検索...' : 
                  language === 'th' ? 'ค้นหาด้วยเลขที่ใบเสนอราคา, CS ID, หัวข้อ...' :
                  'Search by quotation no, CS ID, title...'
                }
                className={`${tableStyles.searchInput} pl-10`}
              />
            </div>

            {/* ステータスフィルター */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">
                {language === 'ja' ? '全ステータス' : language === 'th' ? 'ทุกสถานะ' : 'All Status'}
              </option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            {/* 営業担当者フィルター */}
            <select
              value={selectedSalesStaff}
              onChange={(e) => setSelectedSalesStaff(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">
                {language === 'ja' ? '全営業担当' : language === 'th' ? 'ทุกผู้ขาย' : 'All Sales Staff'}
              </option>
              {salesStaffOptions.map((staff) => (
                <option key={staff} value={staff}>
                  {staff}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* フィルターバー */}
        <div className={tableStyles.filterBar}>
          <p className={tableStyles.recordCount}>
            {language === 'ja' ? `${filteredQuotations.length}件の見積もり` : 
             language === 'th' ? `${filteredQuotations.length} ใบเสนอราคา` : 
             `${filteredQuotations.length} quotations`}
          </p>
        </div>

        {/* 見積もりリスト */}
        <div className={tableStyles.tableContainer}>
          {filteredQuotations.length === 0 ? (
            <div className={tableStyles.emptyRow}>
              <p>
                {language === 'ja' ? '該当する見積もりが見つかりません' : 
                 language === 'th' ? 'ไม่พบใบเสนอราคาที่ตรงกัน' : 
                 'No quotations found'}
              </p>
            </div>
          ) : (
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '見積日' : language === 'th' ? 'วันที่เสนอราคา' : 'Date'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '見積番号' : language === 'th' ? 'เลขที่ใบเสนอราคา' : 'Quotation No.'}
                  </th>
                  <th className={tableStyles.th}>
                    CS ID
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? 'タイトル' : language === 'th' ? 'หัวข้อ' : 'Title'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '確率' : language === 'th' ? 'โอกาส' : 'Probability'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '営業担当' : language === 'th' ? 'ผู้ขาย' : 'Sales'}
                  </th>
                  <th className={`${tableStyles.th} relative`}>
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
                {filteredQuotations.map((quotation) => (
                  <tr key={quotation.$id.value} className={tableStyles.tr}>
                    <td className={tableStyles.td}>
                      {formatDate(quotation.日付?.value)}
                    </td>
                    <td className={tableStyles.td}>
                      {quotation.qtno2?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {quotation.文字列__1行__10?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      <div>
                        {quotation.文字列__1行__4?.value || '-'}
                      </div>
                      {quotation.ドロップダウン_0?.value && (
                        <div className="text-sm text-gray-500">
                          {quotation.ドロップダウン_0.value}
                        </div>
                      )}
                    </td>
                    <td className={tableStyles.td}>
                      {quotation.ドロップダウン?.value ? getStatusLabel(quotation.ドロップダウン.value) : '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {quotation.Drop_down?.value ? getProbabilityLabel(quotation.Drop_down.value) : '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {typeof quotation.sales_staff?.value === 'string' 
                        ? quotation.sales_staff.value 
                        : quotation.sales_staff?.value?.[0]?.name || '-'}
                    </td>
                    <td className={`${tableStyles.td} text-right`}>
                      <Link
                        href={`/${locale}/quotation/${quotation.$id.value}`}
                        className={tableStyles.tdLink}
                      >
                        {language === 'ja' ? '詳細' : language === 'th' ? 'รายละเอียด' : 'View'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}