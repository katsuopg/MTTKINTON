'use client';

import React, { useState } from 'react';
import type { SupabaseWorkOrder } from '../page';
import type { SupabaseInvoiceForDetail, SupabaseCustomerForDetail, SupabaseQuoteRequestForDetail } from './page';

interface SupabasePORecord {
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
import { getFieldLabel, getStatusLabel, type Language } from '@/lib/kintone/field-mappings';
import { tableStyles } from '@/components/ui/TableStyles';
import { detailStyles, getStatusBadgeClass } from '@/components/ui/DetailStyles';
import { DetailPageHeader } from '@/components/ui/DetailPageHeader';
import Link from 'next/link';
import { Pencil, FileText, List, ClipboardList, User, BarChart3, Settings, AlertTriangle } from 'lucide-react';
import { extractCsName } from '@/lib/utils/customer-name';
import Tabs from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';

interface WorkNoDetailContentProps {
  record: SupabaseWorkOrder;
  customer: SupabaseCustomerForDetail | null;
  poRecords?: SupabasePORecord[];
  quoteRequests?: SupabaseQuoteRequestForDetail[];
  costRecords?: SupabaseCostRecord[];
  invoiceRecords?: SupabaseInvoiceForDetail[];
  locale: string;
}

export function WorkNoDetailContent({ record, customer, poRecords = [], quoteRequests = [], costRecords = [], invoiceRecords = [], locale }: WorkNoDetailContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = getFieldLabel('WorkNo', language);
  const [activeTab, setActiveTab] = useState('detail');
  const poPagination = usePagination(poRecords);
  const costPagination = usePagination(costRecords);

  // 計算フィールド
  const grandTotal = record.grand_total || 0;
  const costTotal = record.cost_total || 0;
  const profit = grandTotal - costTotal;
  const overheadRate = record.overhead_rate || 5;
  const overhead = grandTotal * (overheadRate / 100);
  const operationProfit = profit - overhead;
  const comRate = record.commission_rate || 3;

  // PO記録でArrived状態なのに必須フィールドが未入力の警告チェック
  const checkPOWarnings = (po: SupabasePORecord) => {
    const statusValue = po.po_status || '';
    const isArrived = statusValue.includes('Arrived') || statusValue === 'Arrived';

    if (!isArrived) return { hasWarning: false, missingFields: [] as string[] };

    const missingFields: string[] = [];
    if (!po.date_3) missingFields.push('Arrival date');
    if (!po.date_4) missingFields.push('Invoice date');
    if (!po.date_5) missingFields.push('Payment date');

    return {
      hasWarning: missingFields.length > 0,
      missingFields
    };
  };

  // PO LISTタブに警告があるかチェック
  const hasPOTabWarning = poRecords.some(po => checkPOWarnings(po).hasWarning);

  // 日付フォーマット関数
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    if (language === 'ja') {
      return dateString; // YYYY-MM-DD
    } else {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  // 数値フォーマット関数
  const formatNumber = (value: number | null | undefined) => {
    if (value == null || value === 0) return '-';
    return value.toLocaleString();
  };

  // 通貨フォーマット
  const formatCurrency = (value: number | null | undefined) => {
    if (value == null || value === 0) return '0 B';
    return `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })} B`;
  };

  return (
      <div className={detailStyles.pageWrapper}>
        <DetailPageHeader
          backHref={`/${locale}/workno`}
          title={[
            record.work_no,
            extractCsName(record.customer_id),
            record.category,
            record.description,
          ].filter(Boolean).join(' - ')}
          statusBadge={
            <span className={getStatusBadgeClass(record.status || '')}>
              {getStatusLabel(record.status, language)}
            </span>
          }
          actions={
            <Link
              href={`/${locale}/workno/${record.work_no}/edit`}
              className={detailStyles.secondaryButton}
            >
              <Pencil size={16} className="mr-1.5" />
              {language === 'ja' ? '編集' : 'Edit'}
            </Link>
          }
        />

        {/* タブエリアセクション */}
        <div className={detailStyles.card}>
          <Tabs
            variant="underline"
            size="lg"
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className="px-5"
            tabs={[
              { key: 'detail', label: 'Detail', icon: <ClipboardList size={16} /> },
              { key: 'cost-sheet', label: 'Cost Sheet', icon: <FileText size={16} /> },
              { key: 'po-list', label: hasPOTabWarning ? 'PO LIST ⚠' : 'PO LIST', icon: <List size={16} /> },
              { key: 'inv-list', label: 'INV LIST', icon: <ClipboardList size={16} /> },
              { key: 'man-huar-list', label: 'Man-Hour List', icon: <User size={16} /> },
              { key: 'man-huar-record', label: 'Man-Hour Record', icon: <Settings size={16} /> },
              { key: 'report', label: 'Report', icon: <BarChart3 size={16} /> },
              { key: 'parson-in-charge', label: 'Person in Charge', icon: <User size={16} /> },
            ]}
          />

          <div>

            {activeTab === 'detail' && (
              <div className="p-5">
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {/* 1. 工事詳細 */}
                  <div className={detailStyles.summaryCard} style={{ flex: '1', minWidth: '220px' }}>
                    <h3 className={detailStyles.summaryCardTitle}>工事詳細</h3>
                    <table className={detailStyles.summaryTable}>
                      <tbody>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>開始日</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{record.start_date?.replace(/-/g, '/') || 'TBD'}</td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>売上予定日</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{record.sales_date?.replace(/-/g, '/') || 'TBD'}</td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>終了日</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{record.finish_date?.replace(/-/g, '/') || 'TBD'}</td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>注文書番号</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>
                            {record.po_list ? (
                              <Link
                                href={`/${locale}/po-management?search=${record.po_list}`}
                                className={detailStyles.link}
                              >
                                {record.po_list}
                              </Link>
                            ) : '-'}
                          </td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>請求書番号</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>
                            {invoiceRecords.length > 0 && invoiceRecords[0].invoice_no
                              ? invoiceRecords[0].invoice_no
                              : record.invoice_no_1 || record.invoice_no_2 || record.invoice_no_3 || record.invoice_no_4 || '-'
                            }
                          </td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>請求書発行日</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>
                            {invoiceRecords.length > 0 && invoiceRecords[0].invoice_date
                              ? invoiceRecords[0].invoice_date.replace(/-/g, '/')
                              : record.invoice_date_1?.replace(/-/g, '/') || record.invoice_date_2?.replace(/-/g, '/') || record.invoice_date_3?.replace(/-/g, '/') || '-'
                            }
                          </td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>担当営業</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>
                            {record.sales_staff || '-'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 2. 見積依頼 */}
                  <div className={detailStyles.summaryCard} style={{ flex: '1', minWidth: '220px' }}>
                    <h3 className={detailStyles.summaryCardTitle}>見積依頼</h3>
                    <table className={detailStyles.summaryTable}>
                      <tbody>
                        {quoteRequests.length > 0 ? (
                          quoteRequests.map((qr) => {
                            const awardedTotal = qr.items?.reduce((sum, item) => {
                              const awarded = item.offers?.find(o => o.is_awarded);
                              return sum + (awarded?.quoted_price || 0);
                            }, 0) || 0;
                            return (
                              <React.Fragment key={qr.id}>
                                <tr>
                                  <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>依頼番号</td>
                                  <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>
                                    <Link
                                      href={`/${locale}/quote-requests/${qr.id}`}
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      {qr.request_no}
                                    </Link>
                                  </td>
                                </tr>
                                <tr>
                                  <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>ステータス</td>
                                  <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>
                                    {qr.status?.name || '-'}
                                  </td>
                                </tr>
                                <tr>
                                  <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>明細数</td>
                                  <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{qr.items?.length || 0}</td>
                                </tr>
                                <tr>
                                  <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>採用合計</td>
                                  <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue} font-medium`}>
                                    {awardedTotal > 0 ? `${awardedTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })} B` : '-'}
                                  </td>
                                </tr>
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <>
                            <tr><td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>依頼番号</td><td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>-</td></tr>
                            <tr><td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>ステータス</td><td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>-</td></tr>
                            <tr><td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>明細数</td><td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>0</td></tr>
                            <tr><td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>採用合計</td><td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>-</td></tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* 3. 機械情報 */}
                  <div className={detailStyles.summaryCard} style={{ flex: '1', minWidth: '220px' }}>
                    <h3 className={detailStyles.summaryCardTitle}>機械情報</h3>
                    <table className={detailStyles.summaryTable}>
                      <tbody>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>Type</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{record.machine_type || '-'}</td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>Vender</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{record.vendor || '-'}</td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>Model</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{record.model || 'TBD'}</td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>Serial No.</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{record.serial_number || 'TBD'}</td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>M/C No.</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{record.machine_number || '-'}</td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>M/C Item</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{record.machine_item || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 4. Sales Details */}
                  <div className={detailStyles.summaryCard} style={{ flex: '1', minWidth: '220px' }}>
                    <h3 className={detailStyles.summaryCardTitle}>Sales Details</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sub total</span>
                        <span className="font-medium">{formatCurrency(record.sub_total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount</span>
                        <span className="font-medium">{formatCurrency(record.discount)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium text-gray-900">Grand total</span>
                        <span className="font-bold">{formatCurrency(grandTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purchase cost</span>
                        <span className="font-medium">{formatCurrency(record.purchase_cost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Labor cost</span>
                        <span className="font-medium">{formatCurrency(record.labor_cost)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium text-gray-900">Cost Total</span>
                        <span className="font-bold">
                          {(() => {
                            const actualCostTotal = costRecords.reduce((sum, cost) => {
                              const value = cost.total_amount ?? 0;
                              return sum + value;
                            }, 0);

                            return actualCostTotal > 0
                              ? `${actualCostTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })} B`
                              : '0 B';
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gross Profit (Actual)</span>
                        <span className="font-medium">{formatCurrency(profit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">profit %</span>
                        <span className="font-medium">
                          {grandTotal > 0 ? `${((profit / grandTotal) * 100).toFixed(1)}%` : '0%'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Over Head Fee ({overheadRate}%)
                        </span>
                        <span className="font-medium">{formatCurrency(overhead)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Operation Profit</span>
                        <span className="font-medium">{formatCurrency(operationProfit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Commition ({comRate}%)
                        </span>
                        <span className="font-medium">
                          {formatCurrency(operationProfit * (comRate / 100))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'po-list' && (() => {
              const paginatedPo = poPagination.paginatedItems;
              const poGrandTotal = poRecords.reduce((sum, po) => sum + (po.grand_total ?? 0), 0);

              const formatPoDate = (dateStr: string | null | undefined) => {
                if (!dateStr) return '-';
                const d = new Date(dateStr);
                return `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`;
              };

              return (
              <div>
                {poRecords.length === 0 ? (
                  <div className={tableStyles.emptyRow}>
                    {language === 'ja' ? 'データがありません' : 'No data available'}
                  </div>
                ) : (
                  <>
                    <div className="max-w-full overflow-x-auto">
                      <table className={tableStyles.table}>
                        <thead className={tableStyles.thead}>
                          <tr>
                            <th className={tableStyles.th}>PO No.</th>
                            <th className={tableStyles.th}>Status</th>
                            <th className={`${tableStyles.th} text-center`}>PO Date</th>
                            <th className={`${tableStyles.th} text-center`}>Delivery</th>
                            <th className={`${tableStyles.th} text-center`}>Arrival</th>
                            <th className={`${tableStyles.th} text-center`}>Invoice Date</th>
                            <th className={`${tableStyles.th} text-center`}>Payment</th>
                            <th className={`${tableStyles.th} text-right`}>Sub Total</th>
                            <th className={`${tableStyles.th} text-right`}>Discount</th>
                            <th className={`${tableStyles.th} text-right`}>Grand Total</th>
                            <th className={tableStyles.th}>Requester</th>
                            <th className={tableStyles.th}>Supplier</th>
                            <th className={tableStyles.th}>Payment Term</th>
                            <th className={tableStyles.th}>Forward</th>
                          </tr>
                        </thead>
                        <tbody className={tableStyles.tbody}>
                          {paginatedPo.map((po) => {
                            const statusValue = po.po_status || '';
                            const isArrived = statusValue.includes('Arrived') || statusValue === 'Arrived';
                            const isOrdered = statusValue.includes('Ordered') || statusValue === 'Ordered';
                            const isCancel = statusValue.includes('Cancel');
                            const warnings = checkPOWarnings(po);

                            return (
                              <tr key={po.kintone_record_id} className={tableStyles.tr}>
                                <td className={tableStyles.td}>
                                  {po.po_no ? (
                                    <Link
                                      href={`/${locale}/po-management/${po.kintone_record_id}`}
                                      className={tableStyles.tdLink}
                                    >
                                      {po.po_no}
                                    </Link>
                                  ) : '-'}
                                </td>
                                <td className={`${tableStyles.td} !px-2`}>
                                  {statusValue && (
                                    <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-theme-xs font-medium text-white ${
                                      isArrived ? 'bg-success-500' : isOrdered ? 'bg-brand-500' : isCancel ? 'bg-gray-400' : 'bg-gray-800 dark:bg-gray-600'
                                    }`}>
                                      {statusValue}
                                    </span>
                                  )}
                                </td>
                                <td className={`${tableStyles.td} text-center`}>{formatPoDate(po.po_date)}</td>
                                <td className={`${tableStyles.td} text-center`}>{formatPoDate(po.delivery_date)}</td>
                                <td className={`${tableStyles.td} text-center`}>
                                  <span className="inline-flex items-center gap-1">
                                    {formatPoDate(po.date_3)}
                                    {warnings.hasWarning && warnings.missingFields.includes('Arrival date') && (
                                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                    )}
                                  </span>
                                </td>
                                <td className={`${tableStyles.td} text-center`}>
                                  <span className="inline-flex items-center gap-1">
                                    {formatPoDate(po.date_4)}
                                    {warnings.hasWarning && warnings.missingFields.includes('Invoice date') && (
                                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                    )}
                                  </span>
                                </td>
                                <td className={`${tableStyles.td} text-center`}>
                                  <span className="inline-flex items-center gap-1">
                                    {formatPoDate(po.date_5)}
                                    {warnings.hasWarning && warnings.missingFields.includes('Payment date') && (
                                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                    )}
                                  </span>
                                </td>
                                <td className={`${tableStyles.td} text-right`}>
                                  {po.subtotal != null ? po.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                </td>
                                <td className={`${tableStyles.td} text-right`}>
                                  {po.discount != null ? po.discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                </td>
                                <td className={`${tableStyles.td} text-right font-medium`}>
                                  {po.grand_total != null ? po.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                </td>
                                <td className={tableStyles.td}>{po.requester || '-'}</td>
                                <td className={tableStyles.td}>
                                  {po.supplier_name ? (
                                    <Link
                                      href={`/${locale}/suppliers?search=${encodeURIComponent(po.supplier_name)}`}
                                      className={tableStyles.tdLink}
                                      title={po.supplier_name}
                                    >
                                      {po.supplier_name}
                                    </Link>
                                  ) : '-'}
                                </td>
                                <td className={tableStyles.td}>{po.payment_term || '-'}</td>
                                <td className={tableStyles.td}>{po.forward || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <Pagination
                      currentPage={poPagination.currentPage}
                      totalPages={poPagination.totalPages}
                      totalItems={poPagination.totalItems}
                      pageSize={poPagination.pageSize}
                      onPageChange={poPagination.goToPage}
                      locale={locale}
                      summaryLeft={
                        <>Total: <span className="font-semibold text-gray-800 dark:text-white/90">{poGrandTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })} B</span></>
                      }
                    />
                  </>
                )}
              </div>
              );
            })()}

            {/* Cost Sheetタブコンテンツ */}
            {activeTab === 'cost-sheet' && (() => {
              const costTotal = costRecords.reduce((sum, cost) => sum + (cost.total_amount ?? 0), 0);
              const paginatedCost = costPagination.paginatedItems;

              return (
              <div>
                {costRecords.length === 0 ? (
                  <div className={tableStyles.emptyRow}>
                    {language === 'ja' ? 'この工事番号に関連するコストデータはありません' :
                     language === 'th' ? 'ไม่มีข้อมูลต้นทุนสำหรับหมายเลขงานนี้' :
                     'No cost data found for this work number'}
                  </div>
                ) : (
                  <>
                    <div className="max-w-full overflow-x-auto">
                      <table className={tableStyles.table}>
                        <thead className={tableStyles.thead}>
                          <tr>
                            <th className={tableStyles.th}>Record No.</th>
                            <th className={tableStyles.th}>PO No.</th>
                            <th className={tableStyles.th}>Status</th>
                            <th className={`${tableStyles.th} text-center`}>Arrival Date</th>
                            <th className={`${tableStyles.th} text-center`}>INV Date</th>
                            <th className={`${tableStyles.th} text-center`}>Payment Date</th>
                            <th className={tableStyles.th}>Description</th>
                            <th className={tableStyles.th}>Model</th>
                            <th className={`${tableStyles.th} text-right`}>QTY</th>
                            <th className={tableStyles.th}>UNIT</th>
                            <th className={`${tableStyles.th} text-right`}>Unit Price</th>
                            <th className={`${tableStyles.th} text-right`}>Total</th>
                            <th className={tableStyles.th}>Supplier Name</th>
                          </tr>
                        </thead>
                        <tbody className={tableStyles.tbody}>
                          {paginatedCost.map((cost) => {
                            const statusValue = cost.cost_status || '';
                            const isArrived = statusValue.includes('Arrived') || statusValue === 'Arrived';
                            const isWorking = statusValue.includes('Working') || statusValue === 'Working';

                            return (
                              <tr key={cost.id} className={tableStyles.tr}>
                                <td className={tableStyles.td}>
                                  {cost.record_no || cost.kintone_record_id || '-'}
                                </td>
                                <td className={tableStyles.td}>
                                  {cost.po_no || '-'}
                                </td>
                                <td className={`${tableStyles.td} !px-2`}>
                                  {statusValue && (
                                    <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-theme-xs font-medium text-white ${
                                      isArrived ? 'bg-success-500' : isWorking ? 'bg-brand-500' : 'bg-gray-800 dark:bg-gray-600'
                                    }`}>
                                      {statusValue}
                                    </span>
                                  )}
                                </td>
                                <td className={`${tableStyles.td} text-center`}>{formatDate(cost.arrival_date)}</td>
                                <td className={`${tableStyles.td} text-center`}>{formatDate(cost.invoice_date)}</td>
                                <td className={`${tableStyles.td} text-center`}>{formatDate(cost.payment_date)}</td>
                                <td className={tableStyles.td}>{cost.description || '-'}</td>
                                <td className={tableStyles.td}>{cost.model_type || '-'}</td>
                                <td className={`${tableStyles.td} text-right`}>{cost.quantity != null ? cost.quantity.toLocaleString() : '-'}</td>
                                <td className={tableStyles.td}>{cost.unit || '-'}</td>
                                <td className={`${tableStyles.td} text-right`}>
                                  {cost.unit_price != null ? cost.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                </td>
                                <td className={`${tableStyles.td} text-right font-medium`}>
                                  {cost.total_amount != null ? cost.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                </td>
                                <td className={tableStyles.td}>{cost.supplier_name || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <Pagination
                      currentPage={costPagination.currentPage}
                      totalPages={costPagination.totalPages}
                      totalItems={costPagination.totalItems}
                      pageSize={costPagination.pageSize}
                      onPageChange={costPagination.goToPage}
                      locale={locale}
                      summaryLeft={
                        <>Total: <span className="font-semibold text-gray-800 dark:text-white/90">{costTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })} B</span></>
                      }
                    />
                  </>
                )}
              </div>
              );
            })()}

            {activeTab === 'inv-list' && (
              <div>
                {invoiceRecords.length === 0 ? (
                  <div className={tableStyles.emptyRow}>
                    {language === 'ja' ? 'この工事番号に関連する請求書データはありません' :
                     language === 'th' ? 'ไม่มีข้อมูลใบแจ้งหนี้สำหรับหมายเลขงานนี้' :
                     'No invoice data found for this work number'}
                  </div>
                ) : (
                  <div className="max-w-full overflow-x-auto">
                    <table className={tableStyles.table}>
                      <thead className={tableStyles.thead}>
                        <tr>
                          <th className={tableStyles.th}>ID</th>
                          <th className={`${tableStyles.th} text-center`}>Work No.</th>
                          <th className={`${tableStyles.th} text-center`}>Invoice No.</th>
                          <th className={`${tableStyles.th} text-center`}>Invoice Date</th>
                          <th className={tableStyles.th}>Customer Name</th>
                          <th className={`${tableStyles.th} text-right`}>Sub Total</th>
                          <th className={`${tableStyles.th} text-right`}>Grand Total</th>
                          <th className={`${tableStyles.th} text-center`}>Status</th>
                        </tr>
                      </thead>
                      <tbody className={tableStyles.tbody}>
                        {invoiceRecords.map((invoice) => (
                          <tr key={invoice.kintone_record_id} className={tableStyles.tr}>
                            <td className={tableStyles.td}>{invoice.kintone_record_id || '-'}</td>
                            <td className={`${tableStyles.td} text-center`}>{invoice.work_no || '-'}</td>
                            <td className={`${tableStyles.td} text-center`}>{invoice.invoice_no || '-'}</td>
                            <td className={`${tableStyles.td} text-center`}>{invoice.invoice_date?.replace(/-/g, '/') || '-'}</td>
                            <td className={tableStyles.td}>{invoice.customer_name || '-'}</td>
                            <td className={`${tableStyles.td} text-right`}>
                              {invoice.sub_total != null ? invoice.sub_total.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
                            </td>
                            <td className={`${tableStyles.td} text-right`}>
                              {invoice.grand_total != null ? invoice.grand_total.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
                            </td>
                            <td className={`${tableStyles.td} text-center`}>
                              <span className={`${tableStyles.statusBadge} bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500`}>
                                {invoice.status || '-'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t border-gray-100 dark:border-white/[0.05]">
                        <tr>
                          <td colSpan={5} className={`${tableStyles.td} text-right font-semibold text-gray-900 dark:text-white`}>Total:</td>
                          <td className={`${tableStyles.td} text-right font-semibold text-gray-900 dark:text-white`}>
                            {invoiceRecords.reduce((sum, inv) => sum + (inv.sub_total ?? 0), 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </td>
                          <td className={`${tableStyles.td} text-right font-semibold text-gray-900 dark:text-white`}>
                            {invoiceRecords.reduce((sum, inv) => sum + (inv.grand_total ?? 0), 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}


            {activeTab === 'man-huar-list' && (
              <div className="text-center text-gray-500 py-8">
                Man-Huar List content will be implemented here
              </div>
            )}

            {activeTab === 'man-huar-record' && (
              <div className="text-center text-gray-500 py-8">
                Man-Huar Record content will be implemented here
              </div>
            )}

            {activeTab === 'report' && (
              <div className="text-center text-gray-500 py-8">
                Report content will be implemented here
              </div>
            )}

            {activeTab === 'parson-in-charge' && (
              <div className="text-center text-gray-500 py-8">
                Parson in charge content will be implemented here
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
