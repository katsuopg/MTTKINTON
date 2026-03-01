'use client';

import { useState, useMemo } from 'react';
import { tableStyles } from '@/components/ui/TableStyles';
import { ListPageHeader } from '@/components/ui/ListPageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { useNavPermissions } from '@/hooks/useNavPermissions';
import type { Language } from '@/lib/kintone/field-mappings';
import POTableRow from './POTableRow';
import FiscalYearSelect from './FiscalYearSelect';

export interface SupabasePORecord {
  id: string;
  kintone_record_id: string;
  approval_status: string | null;
  work_no: string | null;
  po_no: string | null;
  cs_id: string | null;
  supplier_name: string | null;
  po_date: string | null;
  delivery_date: string | null;
  date_1: string | null;
  date_2: string | null;
  date_3: string | null;
  date_4: string | null;
  date_5: string | null;
  date_6: string | null;
  date_7: string | null;
  subtotal: number | null;
  discount: number | null;
  grand_total: number | null;
  payment_term: string | null;
  po_status: string | null;
  data_status: string | null;
  mc_item: string | null;
  model: string | null;
  subject: string | null;
  qt_no: string | null;
  requester: string | null;
  forward: string | null;
  created_at: string;
  updated_at: string;
}

interface POManagementContentProps {
  poRecords: SupabasePORecord[];
  locale: string;
  language: Language;
  selectedFiscalYear: number;
}

export default function POManagementContent({
  poRecords,
  locale,
  language,
  selectedFiscalYear,
}: POManagementContentProps) {
  const { canManageApp } = useNavPermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [notArrived, setNotArrived] = useState(false);
  const [alertOnly, setAlertOnly] = useState(false);

  const filteredRecords = useMemo(() => {
    let records = poRecords;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      records = records.filter(r =>
        (r.po_no || '').toLowerCase().includes(q) ||
        (r.supplier_name || '').toLowerCase().includes(q) ||
        (r.work_no || '').toLowerCase().includes(q)
      );
    }

    if (notArrived) {
      records = records.filter(r =>
        !['Arrived', 'Delivered', '納品済み'].includes(r.po_status || '')
      );
    }

    if (alertOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      records = records.filter(r => {
        const deliveryDate = r.delivery_date ? new Date(r.delivery_date) : null;
        const isDelivered = r.po_status === 'Delivered' || r.po_status === '納品済み' || r.po_status === 'Arrived';
        const isOverdue = deliveryDate && deliveryDate < today && !isDelivered;
        const hasNoDeliveryDate = !r.delivery_date && !isDelivered;
        return isOverdue || hasNoDeliveryDate;
      });
    }

    return records;
  }, [poRecords, searchQuery, notArrived, alertOnly]);

  const { paginatedItems, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredRecords);

  return (
    <div className={tableStyles.contentWrapper}>
      {/* 凡例 */}
      <div className="flex items-center gap-6 text-sm mb-3">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-50 border border-red-200 rounded mr-2" />
          <span className="text-gray-600 dark:text-gray-400">
            {language === 'ja' ? '納期超過' : language === 'th' ? 'เกินกำหนด' : 'Overdue'}
          </span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded mr-2" />
          <span className="text-gray-600 dark:text-gray-400">
            {language === 'ja' ? '納品済み' : language === 'th' ? 'ส่งมอบแล้ว' : 'Delivered'}
          </span>
        </div>
      </div>

      <div className={tableStyles.tableContainer}>
        <ListPageHeader
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={
            language === 'ja' ? 'PO番号、サプライヤー、工事番号で検索...' :
            language === 'th' ? 'ค้นหาตาม PO, ซัพพลายเออร์, หมายเลขงาน...' :
            'Search by PO No., Supplier, Work No...'
          }
          totalCount={filteredRecords.length}
          countLabel={language === 'ja' ? '件の発注書' : language === 'th' ? ' ใบสั่งซื้อ' : ' purchase orders'}
          filters={
            <>
              <FiscalYearSelect currentYear={selectedFiscalYear} locale={locale} language={language} />
              <label className="flex items-center cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={notArrived}
                  onChange={(e) => setNotArrived(e.target.checked)}
                  className="h-4 w-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <span className="ml-2 text-theme-sm text-gray-700 dark:text-gray-300">
                  {language === 'ja' ? '未着' : language === 'th' ? 'ยังไม่มาถึง' : 'Not arrived'}
                </span>
              </label>
              <label className="flex items-center cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={alertOnly}
                  onChange={(e) => setAlertOnly(e.target.checked)}
                  className="h-4 w-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <span className="ml-2 text-theme-sm text-gray-700 dark:text-gray-300">
                  {language === 'ja' ? 'アラート' : language === 'th' ? 'แจ้งเตือน' : 'Alert'}
                </span>
              </label>
            </>
          }
          settingsHref={canManageApp('purchase_orders') ? `/${locale}/settings/apps/purchase_orders` : undefined}
        />
        {/* モバイル: カードビュー */}
        <div className={tableStyles.mobileCardList}>
          {filteredRecords.length === 0 ? (
            <div className={tableStyles.emptyRow}>
              {language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}
            </div>
          ) : (
            paginatedItems.map((record) => {
              const deliveryDate = record.delivery_date ? new Date(record.delivery_date) : null;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isDelivered = record.po_status === 'Delivered' || record.po_status === '納品済み' || record.po_status === 'Arrived';
              const isOverdue = !!(deliveryDate && deliveryDate < today && !isDelivered);
              const formatAmount = (val: number | null) => val ? `${val.toLocaleString()}B` : '-';

              return (
                <div
                  key={record.kintone_record_id}
                  className={`${tableStyles.mobileCard} ${isOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : isDelivered ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  onClick={() => window.location.href = `/${locale}/po-management/${record.kintone_record_id}`}
                >
                  <div className={tableStyles.mobileCardHeader}>
                    <span className={`${tableStyles.statusBadge} ${
                      isOverdue ? 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400' :
                      isDelivered ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400' :
                      'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400'
                    }`}>
                      {isOverdue
                        ? (language === 'ja' ? '納期超過' : language === 'th' ? 'เกินกำหนด' : 'Overdue')
                        : isDelivered
                        ? (language === 'ja' ? '納品済み' : language === 'th' ? 'ส่งมอบแล้ว' : 'Delivered')
                        : record.po_status || '-'}
                    </span>
                    <span className={tableStyles.mobileCardMeta}>
                      {record.delivery_date?.replace(/-/g, '/') || '-'}
                    </span>
                  </div>
                  <div className={tableStyles.mobileCardTitle}>
                    {record.po_no || '-'}
                  </div>
                  <div className={tableStyles.mobileCardSubtitle}>
                    {record.supplier_name || '-'}
                  </div>
                  <div className={tableStyles.mobileCardFields}>
                    <span className={tableStyles.mobileCardFieldValue}>{record.work_no || '-'}</span>
                    <span className={tableStyles.mobileCardFieldValue}>{formatAmount(record.grand_total)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* デスクトップ: テーブルビュー */}
        <div className={tableStyles.desktopOnly}>
        <div className="max-w-full overflow-x-auto">
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>
                  {language === 'ja' ? '承認' : language === 'th' ? 'การอนุมัติ' : 'Approval'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? 'PO番号' : language === 'th' ? 'เลขที่ PO' : 'PO No.'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? '工事番号' : language === 'th' ? 'หมายเลขงาน' : 'Work No.'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? 'サプライヤー' : language === 'th' ? 'ซัพพลายเออร์' : 'Supplier'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? '発注日' : language === 'th' ? 'วันที่สั่งซื้อ' : 'PO Date'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? '納期' : language === 'th' ? 'กำหนดส่ง' : 'Delivery Date'}
                </th>
                <th className={`${tableStyles.th} text-right`}>
                  {language === 'ja' ? '金額' : language === 'th' ? 'จำนวนเงิน' : 'Amount'}
                </th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {paginatedItems.map((record) => {
                const deliveryDate = record.delivery_date ? new Date(record.delivery_date) : null;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isDelivered = record.po_status === 'Delivered' || record.po_status === '納品済み' || record.po_status === 'Arrived';
                const isOverdue = !!(deliveryDate && deliveryDate < today && !isDelivered);

                return (
                  <POTableRow
                    key={record.kintone_record_id}
                    record={record}
                    locale={locale}
                    language={language}
                    isDelivered={isDelivered}
                    isOverdue={isOverdue}
                  />
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className={tableStyles.emptyRow}>
                    {language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
  );
}
