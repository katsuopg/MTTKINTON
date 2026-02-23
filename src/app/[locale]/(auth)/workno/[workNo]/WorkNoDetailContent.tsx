'use client';

import React, { useState } from 'react';
import { WorkNoRecord, CustomerRecord, QuotationRecord, InvoiceRecord } from '@/types/kintone';

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
  record: WorkNoRecord;
  customer: CustomerRecord | null;
  poRecords?: SupabasePORecord[];
  quotationRecords?: QuotationRecord[];
  costRecords?: SupabaseCostRecord[];
  invoiceRecords?: InvoiceRecord[];
  locale: string;
}

export function WorkNoDetailContent({ record, customer, poRecords = [], quotationRecords = [], costRecords = [], invoiceRecords = [], locale }: WorkNoDetailContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = getFieldLabel('WorkNo', language);
  const [activeTab, setActiveTab] = useState('detail');
  const poPagination = usePagination(poRecords);
  const costPagination = usePagination(costRecords);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rec = record as any; // Type assertion for kintone dynamic fields

  // PO記録でArrived状態なのに必須フィールドが未入力の警告チェック
  const checkPOWarnings = (po: SupabasePORecord) => {
    const statusValue = po.po_status || '';
    const isArrived = statusValue.includes('Arrived') || statusValue === 'Arrived';

    if (!isArrived) return { hasWarning: false, missingFields: [] };

    const missingFields = [];
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
      <div className={detailStyles.pageWrapper}>
        <DetailPageHeader
          backHref={`/${locale}/workno`}
          title={[
            record.WorkNo?.value,
            extractCsName(record.文字列__1行__8?.value),
            record.文字列__1行__1?.value,
            record.文字列__1行__2?.value,
          ].filter(Boolean).join(' - ')}
          statusBadge={
            <span className={getStatusBadgeClass(record.Status?.value || '')}>
              {getStatusLabel(record.Status?.value, language)}
            </span>
          }
          actions={
            <Link
              href={`/${locale}/workno/${record.WorkNo?.value}/edit`}
              className={detailStyles.secondaryButton}
            >
              <Pencil size={16} className="mr-1.5" />
              {language === 'ja' ? '編集' : 'Edit'}
            </Link>
          }
        />

        {/* タブエリアセクション */}
        <div className={detailStyles.card}>
          {/* タブナビゲーション - TailAdmin underline style */}
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

          {/* タブコンテンツ */}
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
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{record.日付_6?.value?.replace(/-/g, '/') || 'TBD'}</td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>売上予定日</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{record.Salesdate?.value?.replace(/-/g, '/') || 'TBD'}</td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>終了日</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{rec.日付_5?.value?.replace(/-/g, '/') || 'TBD'}</td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>注文書番号</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>
                            {rec.ルックアップ?.value ? (
                              <Link
                                href={`/${locale}/po-management?search=${rec.ルックアップ.value}`}
                                className={detailStyles.link}
                              >
                                {rec.ルックアップ.value}
                              </Link>
                            ) : '-'}
                          </td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>注文書受取日</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{rec.日付_0?.value?.replace(/-/g, '/') || '-'}</td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>請求書番号</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>
                            {invoiceRecords.length > 0 && invoiceRecords[0].文字列__1行__0?.value
                              ? invoiceRecords[0].文字列__1行__0.value
                              : record.文字列__1行__3?.value || record.文字列__1行__4?.value || record.文字列__1行__6?.value || record.文字列__1行__7?.value || '-'
                            }
                          </td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>請求書発行日</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>
                            {invoiceRecords.length > 0 && invoiceRecords[0].日付?.value
                              ? invoiceRecords[0].日付.value.replace(/-/g, '/')
                              : record.日付_7?.value?.replace(/-/g, '/') || record.日付_8?.value?.replace(/-/g, '/') || record.日付_9?.value?.replace(/-/g, '/') || '-'
                            }
                          </td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>担当営業</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>
                            {record.Salesstaff?.value && record.Salesstaff.value.length > 0
                              ? record.Salesstaff.value.map(staff => staff.name).join(', ')
                              : '-'
                            }
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 2. 見積もり詳細 */}
                  <div className={detailStyles.summaryCard} style={{ flex: '1', minWidth: '220px' }}>
                    <h3 className={detailStyles.summaryCardTitle}>見積もり詳細</h3>
                    <table className={detailStyles.summaryTable}>
                      <tbody>
                        {quotationRecords.length > 0 ? (
                          quotationRecords.map((quotation) => (
                            <React.Fragment key={quotation.$id.value}>
                              <tr>
                                <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>見積番号</td>
                                <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>
                                  <Link
                                    href={`/${locale}/quotation/${quotation.$id.value}`}
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    {quotation.qtno2?.value || '-'}
                                  </Link>
                                </td>
                              </tr>
                              <tr>
                                <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>小計</td>
                                <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>
                                  {quotation.Sub_total?.value
                                    ? `${parseFloat(quotation.Sub_total.value).toLocaleString('en-US', { maximumFractionDigits: 0 })} B`
                                    : '0 B'
                                  }
                                </td>
                              </tr>
                              <tr>
                                <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>値引き</td>
                                <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>
                                  {quotation.Discount?.value
                                    ? `${parseFloat(quotation.Discount.value).toLocaleString('en-US', { maximumFractionDigits: 0 })} B`
                                    : '0 B'
                                  }
                                </td>
                              </tr>
                              <tr>
                                <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>合計</td>
                                <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue} font-medium`}>
                                  {(() => {
                                    const subtotal = quotation.Sub_total?.value ? parseFloat(quotation.Sub_total.value) : 0;
                                    const discount = quotation.Discount?.value ? parseFloat(quotation.Discount.value) : 0;
                                    const total = subtotal - discount;
                                    return `${total.toLocaleString('en-US', { maximumFractionDigits: 0 })} B`;
                                  })()}
                                </td>
                              </tr>
                              <tr>
                                <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>予想コスト</td>
                                <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>
                                  {quotation.costtotal?.value
                                    ? `${parseFloat(quotation.costtotal.value).toLocaleString('en-US', { maximumFractionDigits: 0 })} B`
                                    : '0 B'
                                  }
                                </td>
                              </tr>
                              <tr>
                                <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>予想利益</td>
                                <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>
                                  {(() => {
                                    const subtotal = quotation.Sub_total?.value ? parseFloat(quotation.Sub_total.value) : 0;
                                    const discount = quotation.Discount?.value ? parseFloat(quotation.Discount.value) : 0;
                                    const total = subtotal - discount;
                                    const forecast = quotation.costtotal?.value ? parseFloat(quotation.costtotal.value) : 0;
                                    const expectedProfit = total - forecast;
                                    return `${expectedProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })} B`;
                                  })()}
                                </td>
                              </tr>
                              <tr>
                                <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>利益率</td>
                                <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>
                                  {(() => {
                                    const subtotal = quotation.Sub_total?.value ? parseFloat(quotation.Sub_total.value) : 0;
                                    const discount = quotation.Discount?.value ? parseFloat(quotation.Discount.value) : 0;
                                    const total = subtotal - discount;
                                    const forecast = quotation.costtotal?.value ? parseFloat(quotation.costtotal.value) : 0;
                                    const expectedProfit = total - forecast;

                                    if (total > 0) {
                                      const percentage = (expectedProfit / total) * 100;
                                      return `${percentage.toFixed(1)}%`;
                                    }
                                    return '0%';
                                  })()}
                                </td>
                              </tr>
                            </React.Fragment>
                          ))
                        ) : (
                          <>
                            <tr><td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>見積番号</td><td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>-</td></tr>
                            <tr><td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>小計</td><td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>0 B</td></tr>
                            <tr><td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>値引き</td><td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>0 B</td></tr>
                            <tr><td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>合計</td><td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>0 B</td></tr>
                            <tr><td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>予想コスト</td><td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>0 B</td></tr>
                            <tr><td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>予想利益</td><td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>0 B</td></tr>
                            <tr><td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>利益率</td><td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>0%</td></tr>
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
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{record.Type?.value || '-'}</td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>Vender</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{record.文字列__1行__5?.value || '-'}</td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>Model</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{record.文字列__1行__9?.value || 'TBD'}</td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>Serial No.</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{record.文字列__1行__10?.value || 'TBD'}</td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>M/C No.</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{record.文字列__1行__11?.value || '-'}</td>
                        </tr>
                        <tr>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>M/C Item</td>
                          <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{record.McItem?.value || '-'}</td>
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
                        <span className="font-medium">
                          {quotationRecords.length > 0 && quotationRecords[0].Sub_total?.value
                            ? `${parseFloat(quotationRecords[0].Sub_total.value).toLocaleString('en-US', { maximumFractionDigits: 0 })} B`
                            : '0 B'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount</span>
                        <span className="font-medium">
                          {quotationRecords.length > 0 && quotationRecords[0].Discount?.value
                            ? `${parseFloat(quotationRecords[0].Discount.value).toLocaleString('en-US', { maximumFractionDigits: 0 })} B`
                            : '0 B'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium text-gray-900">Grand total</span>
                        <span className="font-bold">
                          {(() => {
                            if (quotationRecords.length > 0) {
                              const subtotal = quotationRecords[0].Sub_total?.value ? parseFloat(quotationRecords[0].Sub_total.value) : 0;
                              const discount = quotationRecords[0].Discount?.value ? parseFloat(quotationRecords[0].Discount.value) : 0;
                              const total = subtotal - discount;
                              return `${total.toLocaleString('en-US', { maximumFractionDigits: 0 })} B`;
                            }
                            return '0 B';
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purchase cost</span>
                        <span className="font-medium">
                          {record.cost?.value
                            ? `${parseFloat(record.cost.value).toLocaleString('en-US', { maximumFractionDigits: 0 })} B`
                            : '0 B'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Labor cost</span>
                        <span className="font-medium">
                          {record.Labor_cost?.value
                            ? `${parseFloat(record.Labor_cost.value).toLocaleString('en-US', { maximumFractionDigits: 0 })} B`
                            : '0 B'
                          }
                        </span>
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
                        <span className="font-medium">
                          {record.profit?.value
                            ? `${parseFloat(record.profit.value).toLocaleString('en-US', { maximumFractionDigits: 0 })} B`
                            : '0 B'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">profit %</span>
                        <span className="font-medium">
                          {(() => {
                            const grossProfit = record.profit?.value ? parseFloat(record.profit.value) : 0;
                            const grandTotal = quotationRecords.length > 0 && quotationRecords[0].Sub_total?.value ? parseFloat(quotationRecords[0].Sub_total.value) : 0;
                            if (grandTotal > 0) {
                              const percentage = (grossProfit / grandTotal) * 100;
                              return `${percentage.toFixed(1)}%`;
                            }
                            return '0%';
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Over Head Fee ({record.OverRate?.value ? `${record.OverRate.value}%` : '5%'})
                        </span>
                        <span className="font-medium">
                          {record.OverHead?.value
                            ? `${parseFloat(record.OverHead.value).toLocaleString('en-US', { maximumFractionDigits: 0 })} B`
                            : '0 B'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Operation Profit</span>
                        <span className="font-medium">
                          {record.OperationProfit?.value
                            ? `${parseFloat(record.OperationProfit.value).toLocaleString('en-US', { maximumFractionDigits: 0 })} B`
                            : '0 B'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Commition ({record.ComRate?.value ? `${record.ComRate.value}%` : '3%'})
                        </span>
                        <span className="font-medium">
                          {(() => {
                            const operationProfit = record.OperationProfit?.value ? parseFloat(record.OperationProfit.value) : 0;
                            const comRate = record.ComRate?.value ? parseFloat(record.ComRate.value) : 3;
                            const commition = operationProfit * (comRate / 100);
                            return `${commition.toLocaleString('en-US', { maximumFractionDigits: 0 })} B`;
                          })()}
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
                                <td className={`${tableStyles.td} text-center`}>
                                  {formatDate(cost.arrival_date)}
                                </td>
                                <td className={`${tableStyles.td} text-center`}>
                                  {formatDate(cost.invoice_date)}
                                </td>
                                <td className={`${tableStyles.td} text-center`}>
                                  {formatDate(cost.payment_date)}
                                </td>
                                <td className={tableStyles.td}>
                                  {cost.description || '-'}
                                </td>
                                <td className={tableStyles.td}>
                                  {cost.model_type || '-'}
                                </td>
                                <td className={`${tableStyles.td} text-right`}>
                                  {cost.quantity != null ? cost.quantity.toLocaleString() : '-'}
                                </td>
                                <td className={tableStyles.td}>
                                  {cost.unit || '-'}
                                </td>
                                <td className={`${tableStyles.td} text-right`}>
                                  {cost.unit_price != null ? cost.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                </td>
                                <td className={`${tableStyles.td} text-right font-medium`}>
                                  {cost.total_amount != null ? cost.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                </td>
                                <td className={tableStyles.td}>
                                  {cost.supplier_name || '-'}
                                </td>
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
                          <th className={`${tableStyles.th} text-right`}>Tax Excluded</th>
                          <th className={`${tableStyles.th} text-right`}>Total (inc. VAT)</th>
                          <th className={`${tableStyles.th} text-center`}>Status</th>
                        </tr>
                      </thead>
                      <tbody className={tableStyles.tbody}>
                        {invoiceRecords.map((invoice) => {
                          const fmtDate = (dateStr: string | undefined) => {
                            if (!dateStr) return '-';
                            return dateStr.replace(/-/g, '/');
                          };
                          const fmtCurrency = (value: string | undefined) => {
                            if (!value) return '0';
                            const num = parseFloat(value);
                            return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
                          };

                          return (
                            <tr key={invoice.$id?.value || 'unknown'} className={tableStyles.tr}>
                              <td className={tableStyles.td}>{invoice.$id?.value || '-'}</td>
                              <td className={`${tableStyles.td} text-center`}>{invoice.文字列__1行_?.value || '-'}</td>
                              <td className={`${tableStyles.td} text-center`}>{invoice.文字列__1行__0?.value || '-'}</td>
                              <td className={`${tableStyles.td} text-center`}>{fmtDate(invoice.日付?.value)}</td>
                              <td className={tableStyles.td}>{invoice.CS_name?.value || '-'}</td>
                              <td className={`${tableStyles.td} text-right`}>{fmtCurrency(invoice.total?.value)}</td>
                              <td className={`${tableStyles.td} text-right`}>{fmtCurrency(invoice.計算?.value)}</td>
                              <td className={`${tableStyles.td} text-center`}>
                                <span className={`${tableStyles.statusBadge} bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500`}>
                                  {invoice.ラジオボタン?.value ? invoice.ラジオボタン.value.split('/')[0] : '-'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="border-t border-gray-100 dark:border-white/[0.05]">
                        <tr>
                          <td colSpan={5} className={`${tableStyles.td} text-right font-semibold text-gray-900 dark:text-white`}>Total:</td>
                          <td className={`${tableStyles.td} text-right font-semibold text-gray-900 dark:text-white`}>
                            {invoiceRecords.reduce((sum, invoice) => sum + (invoice.total?.value ? parseFloat(invoice.total.value) : 0), 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </td>
                          <td className={`${tableStyles.td} text-right font-semibold text-gray-900 dark:text-white`}>
                            {invoiceRecords.reduce((sum, invoice) => sum + (invoice.計算?.value ? parseFloat(invoice.計算.value) : 0), 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
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