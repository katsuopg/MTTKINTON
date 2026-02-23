'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Language } from '@/lib/kintone/field-mappings';
import { getStatusColor } from '@/lib/kintone/utils';
import { tableStyles } from '@/components/ui/TableStyles';
import { ListPageHeader } from '@/components/ui/ListPageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { extractCsName } from '@/lib/utils/customer-name';

interface SupabaseCostRecord {
  id: string;
  kintone_record_id: string;
  record_no: string | null;
  work_no: string;
  wn_status: string | null;
  start_date: string | null;
  finish_date: string | null;
  po_no: string | null;
  po_date: string | null;
  customer_id: string | null;
  cost_status: string | null;
  arrival_date: string | null;
  invoice_date: string | null;
  payment_date: string | null;
  payment_term: string | null;
  item_code: string | null;
  description: string | null;
  supplier_name: string | null;
  model_type: string | null;
  unit_price: number | null;
  unit: string | null;
  quantity: number | null;
  total_amount: number | null;
  registered_by: string | null;
  created_at: string;
  updated_at: string;
}

interface CostManagementContentProps {
  costRecords: SupabaseCostRecord[];
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
      const workNo = (record.work_no || '').toLowerCase();
      const poNo = (record.po_no || '').toLowerCase();
      const supplier = (record.supplier_name || '').toLowerCase();
      const item = (record.item_code || '').toLowerCase();
      const status = (record.cost_status || '').toLowerCase();
      const query = searchTerm.toLowerCase();

      return workNo.includes(query) ||
             poNo.includes(query) ||
             supplier.includes(query) ||
             item.includes(query) ||
             status.includes(query);
    });
  }, [costRecords, searchTerm]);

  // 日付フォーマット関数
  const formatDate = (dateString: string | null | undefined) => {
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
  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined || value === 0) return '-';
    return value.toLocaleString();
  };

  // ステータスによる行の色分け
  const getRowColorClass = (status: string | null | undefined) => {
    if (!status) return '';

    const normalizedStatus = status.trim();
    if (normalizedStatus.includes('Working')) {
      return 'bg-blue-50';
    } else if (normalizedStatus.includes('Arrived')) {
      return 'bg-green-50';
    }
    return '';
  };

  const { paginatedItems, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredCosts);

  return (
    <DashboardLayout locale={locale} userEmail={userEmail} title={pageTitle} userInfo={userInfo}>
      <div className={tableStyles.contentWrapper}>
        {/* テーブル */}
        <div className={tableStyles.tableContainer}>
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
          <div className="overflow-x-auto">
          {filteredCosts.length === 0 ? (
            <div className={tableStyles.emptyRow}>
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
                  <th className={tableStyles.th}>ID</th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '工事番号' : language === 'th' ? 'หมายเลขงาน' : 'Work No.'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? 'WNステータス' : language === 'th' ? 'สถานะ WN' : 'WN Status'}
                  </th>
                  <th className={`${tableStyles.th} text-center`}>
                    {language === 'ja' ? '開始日' : language === 'th' ? 'วันเริ่ม' : 'Start Date'}
                  </th>
                  <th className={`${tableStyles.th} text-center`}>
                    {language === 'ja' ? '完了日' : language === 'th' ? 'วันเสร็จ' : 'Finish Date'}
                  </th>
                  <th className={tableStyles.th}>PO No.</th>
                  <th className={`${tableStyles.th} text-center`}>
                    {language === 'ja' ? 'PO日付' : language === 'th' ? 'วันที่ PO' : 'PO Date'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '顧客名' : language === 'th' ? 'ลูกค้า' : 'Customer'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                  </th>
                  <th className={`${tableStyles.th} text-center`}>
                    {language === 'ja' ? '到着日' : language === 'th' ? 'วันที่มาถึง' : 'Arrival Date'}
                  </th>
                  <th className={`${tableStyles.th} text-center`}>
                    {language === 'ja' ? '請求日' : language === 'th' ? 'วันที่ใบแจ้งหนี้' : 'INV DATE'}
                  </th>
                  <th className={`${tableStyles.th} text-center`}>
                    {language === 'ja' ? '支払日' : language === 'th' ? 'วันที่ชำระ' : 'Payment Date'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '支払条件' : language === 'th' ? 'เงื่อนไขการชำระ' : 'Payment Term'}
                  </th>
                  <th className={tableStyles.th}>ITEM</th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '説明' : language === 'th' ? 'คำอธิบาย' : 'Description'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? 'サプライヤー' : language === 'th' ? 'ซัพพลายเออร์' : 'Supplier'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? 'モデル/タイプ' : language === 'th' ? 'รุ่น/ประเภท' : 'Model/Type'}
                  </th>
                  <th className={`${tableStyles.th} text-right`}>
                    {language === 'ja' ? '単価' : language === 'th' ? 'ราคาต่อหน่วย' : 'Unit Price'}
                  </th>
                  <th className={`${tableStyles.th} text-center`}>UNIT</th>
                  <th className={`${tableStyles.th} text-right`}>QTY</th>
                  <th className={`${tableStyles.th} text-right`}>
                    {language === 'ja' ? '合計' : language === 'th' ? 'ยอดรวม' : 'Total'}
                  </th>
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
                {paginatedItems.map((record) => (
                  <tr
                    key={record.id}
                    className={`${tableStyles.trClickable} ${getRowColorClass(record.cost_status)}`}
                    onClick={() => {
                      if (record.work_no) router.push(`/${locale}/workno/${encodeURIComponent(record.work_no)}`);
                    }}
                  >
                    <td className={tableStyles.td}>
                      {record.record_no || record.kintone_record_id || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {record.work_no ? (
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {record.work_no}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className={tableStyles.td}>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium min-w-[60px] justify-center ${
                          getStatusColor(record.wn_status || '')
                        }`}
                      >
                        {record.wn_status || '-'}
                      </span>
                    </td>
                    <td className={`${tableStyles.td} text-center`}>
                      {formatDate(record.start_date)}
                    </td>
                    <td className={`${tableStyles.td} text-center`}>
                      {formatDate(record.finish_date)}
                    </td>
                    <td className={`${tableStyles.td} font-medium`}>
                      {record.po_no || '-'}
                    </td>
                    <td className={`${tableStyles.td} text-center`}>
                      {formatDate(record.po_date)}
                    </td>
                    <td className={tableStyles.td}>
                      {extractCsName(record.customer_id) || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium min-w-[70px] justify-center ${
                          getStatusColor(record.cost_status || '')
                        }`}
                      >
                        {record.cost_status || '-'}
                      </span>
                    </td>
                    <td className={`${tableStyles.td} text-center`}>
                      {formatDate(record.arrival_date)}
                    </td>
                    <td className={`${tableStyles.td} text-center`}>
                      {formatDate(record.invoice_date)}
                    </td>
                    <td className={`${tableStyles.td} text-center`}>
                      {formatDate(record.payment_date)}
                    </td>
                    <td className={tableStyles.td}>
                      {record.payment_term || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {record.item_code || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {record.description || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {record.supplier_name || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {record.model_type || '-'}
                    </td>
                    <td className={`${tableStyles.td} text-right font-mono`}>
                      {formatNumber(record.unit_price)}
                    </td>
                    <td className={`${tableStyles.td} text-center`}>
                      {record.unit || '-'}
                    </td>
                    <td className={`${tableStyles.td} text-right font-mono`}>
                      {formatNumber(record.quantity)}
                    </td>
                    <td className={`${tableStyles.td} text-right font-mono font-bold`}>
                      {formatNumber(record.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={goToPage}
            locale={locale}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
