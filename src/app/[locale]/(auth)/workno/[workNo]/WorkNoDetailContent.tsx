'use client';

import React, { useState } from 'react';
import { WorkNoRecord, CustomerRecord, PORecord, QuotationRecord, CostRecord, InvoiceRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getFieldLabel, getStatusLabel, type Language } from '@/lib/kintone/field-mappings';
import { tableStyles } from '@/components/ui/TableStyles';
import { getStatusColor } from '@/lib/kintone/utils';
import Link from 'next/link';

interface WorkNoDetailContentProps {
  record: WorkNoRecord;
  customer: CustomerRecord | null;
  poRecords?: PORecord[];
  quotationRecords?: QuotationRecord[];
  costRecords?: CostRecord[];
  invoiceRecords?: InvoiceRecord[];
  locale: string;
  userEmail: string;
  userInfo?: { email: string; name: string; avatarUrl?: string };
}

// アイコンコンポーネント
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

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zM9 19V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function CogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ExclamationTriangleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
  );
}

export function WorkNoDetailContent({ record, customer, poRecords = [], quotationRecords = [], costRecords = [], invoiceRecords = [], locale, userEmail, userInfo }: WorkNoDetailContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = getFieldLabel('WorkNo', language);
  const [activeTab, setActiveTab] = useState('cost-sheet');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rec = record as any; // Type assertion for kintone dynamic fields

  // PO記録でArrived状態なのに必須フィールドが未入力の警告チェック
  const checkPOWarnings = (po: PORecord) => {
    const statusValue = po.ドロップダウン_1?.value || '';
    const isArrived = statusValue.includes('Arrived') || statusValue === 'Arrived';
    
    if (!isArrived) return { hasWarning: false, missingFields: [] };

    const missingFields = [];
    if (!po.日付_3?.value) missingFields.push('Arrival date'); // 到着日
    if (!po.日付_4?.value) missingFields.push('Invoice date'); // インボイス日
    if (!po.日付_5?.value) missingFields.push('Payment date'); // 支払日
    
    return {
      hasWarning: missingFields.length > 0,
      missingFields
    };
  };

  // PO LISTタブに警告があるかチェック
  const hasPOTabWarning = poRecords.some(po => checkPOWarnings(po).hasWarning);

  // フィールド名を確認するためのデバッグ出力
  console.log('WorkNo Record fields:', Object.keys(rec).filter((key: string) => key.includes('日付')));
  console.log('WorkNo Record lookup fields:', Object.keys(rec).filter((key: string) => key.includes('ルックアップ')));
  console.log('ルックアップ:', rec.ルックアップ?.value);
  console.log('ルックアップ_0:', rec.ルックアップ_0?.value);
  console.log('ルックアップ_1:', rec.ルックアップ_1?.value);

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
      <div className="py-8 px-4 max-w-full w-full">
        {/* タイトルエリア */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-base font-bold">
              <span 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-bold"
                style={{
                  backgroundColor: '#dcfce7',
                  color: '#166534'
                }}
              >
                {getStatusLabel(record.Status?.value, language)}
            </span>
            <span className="text-gray-900">{record.WorkNo?.value}</span>
            <span className="text-gray-600">-</span>
              <span className="text-gray-900">{record.文字列__1行__8?.value}</span>
              <span className="text-gray-600">-</span>
              <span className="text-gray-900">{record.文字列__1行__1?.value}</span>
              <span className="text-gray-600">-</span>
              <span className="text-gray-900">{record.文字列__1行__2?.value}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                href={`/${locale}/workno/${record.WorkNo?.value}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {language === 'ja' ? '編集' : 'Edit'}
              </Link>
            </div>
          </div>
        </div>

        {/* カード表示エリア - 100%幅 */}
        <div className="w-full mb-6">
          {/* 4つのカード - 各25%幅 */}
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* 1. 工事詳細 */}
            <div className="bg-white shadow-lg rounded-lg p-4 border" style={{ flex: '1', minWidth: '0' }}>
              <h3 className="text-base font-semibold text-gray-900 mb-3">工事詳細</h3>
              <table className="w-full text-sm table-fixed">
                <tbody>
                  <tr>
                    <td className="py-1 whitespace-nowrap">開始日</td>
                    <td className="py-1 text-right">{record.日付_6?.value?.replace(/-/g, '/') || 'TBD'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 whitespace-nowrap">売上予定日</td>
                    <td className="py-1 text-right">{record.Salesdate?.value?.replace(/-/g, '/') || 'TBD'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 whitespace-nowrap">終了日</td>
                    <td className="py-1 text-right">{rec.日付_5?.value?.replace(/-/g, '/') || 'TBD'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 whitespace-nowrap">注文書番号</td>
                    <td className="py-1 text-right">
                      {rec.ルックアップ?.value ? (
                        <Link
                          href={`/${locale}/po-management?search=${rec.ルックアップ.value}`}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {rec.ルックアップ.value}
                        </Link>
                      ) : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 whitespace-nowrap">注文書受取日</td>
                    <td className="py-1 text-right">{rec.日付_0?.value?.replace(/-/g, '/') || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 whitespace-nowrap">請求書番号</td>
                    <td className="py-1 text-right">
                      {invoiceRecords.length > 0 && invoiceRecords[0].文字列__1行__0?.value 
                        ? invoiceRecords[0].文字列__1行__0.value
                        : record.文字列__1行__3?.value || record.文字列__1行__4?.value || record.文字列__1行__6?.value || record.文字列__1行__7?.value || '-'
                      }
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 whitespace-nowrap">請求書発行日</td>
                    <td className="py-1 text-right">
                      {invoiceRecords.length > 0 && invoiceRecords[0].日付?.value 
                        ? invoiceRecords[0].日付.value.replace(/-/g, '/')
                        : record.日付_7?.value?.replace(/-/g, '/') || record.日付_8?.value?.replace(/-/g, '/') || record.日付_9?.value?.replace(/-/g, '/') || '-'
                      }
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 whitespace-nowrap">担当営業</td>
                    <td className="py-1 text-right">
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
            <div className="bg-white shadow-lg rounded-lg p-4 border" style={{ flex: '1', minWidth: '0' }}>
              <h3 className="text-base font-semibold text-gray-900 mb-3">見積もり詳細</h3>
              <table className="w-full text-sm">
                <tbody>
                  {quotationRecords.length > 0 ? (
                    quotationRecords.map((quotation) => (
                      <React.Fragment key={quotation.$id.value}>
                        <tr>
                          <td className="py-1 whitespace-nowrap">見積番号</td>
                          <td className="py-1" style={{ textAlign: 'right' }}>
                            <Link 
                              href={`/${locale}/quotation/${quotation.$id.value}`}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {quotation.qtno2?.value || '-'}
                            </Link>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 whitespace-nowrap">小計</td>
                          <td className="py-1" style={{ textAlign: 'right' }}>
                            {quotation.Sub_total?.value 
                              ? `${parseFloat(quotation.Sub_total.value).toLocaleString('en-US', { maximumFractionDigits: 0 })} B`
                              : '0 B'
                            }
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 whitespace-nowrap">値引き</td>
                          <td className="py-1" style={{ textAlign: 'right' }}>
                            {quotation.Discount?.value 
                              ? `${parseFloat(quotation.Discount.value).toLocaleString('en-US', { maximumFractionDigits: 0 })} B`
                              : '0 B'
                            }
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 whitespace-nowrap">合計</td>
                          <td className="py-1 font-medium" style={{ textAlign: 'right' }}>
                            {(() => {
                              const subtotal = quotation.Sub_total?.value ? parseFloat(quotation.Sub_total.value) : 0;
                              const discount = quotation.Discount?.value ? parseFloat(quotation.Discount.value) : 0;
                              const total = subtotal - discount;
                              return `${total.toLocaleString('en-US', { maximumFractionDigits: 0 })} B`;
                            })()}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 whitespace-nowrap">予想コスト</td>
                          <td className="py-1" style={{ textAlign: 'right' }}>
                            {quotation.costtotal?.value 
                              ? `${parseFloat(quotation.costtotal.value).toLocaleString('en-US', { maximumFractionDigits: 0 })} B`
                              : '0 B'
                            }
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 whitespace-nowrap">予想利益</td>
                          <td className="py-1" style={{ textAlign: 'right' }}>
                            {(() => {
                              // 合計 - 予想コスト = 予想利益
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
                          <td className="py-1 whitespace-nowrap">利益率</td>
                          <td className="py-1" style={{ textAlign: 'right' }}>
                            {(() => {
                              // (予想利益 / 合計) * 100 = 利益率
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
                      <tr><td className="py-1 whitespace-nowrap">見積番号</td><td className="py-1" style={{ textAlign: 'right' }}>-</td></tr>
                      <tr><td className="py-1 whitespace-nowrap">小計</td><td className="py-1" style={{ textAlign: 'right' }}>0 B</td></tr>
                      <tr><td className="py-1 whitespace-nowrap">値引き</td><td className="py-1" style={{ textAlign: 'right' }}>0 B</td></tr>
                      <tr><td className="py-1 whitespace-nowrap">合計</td><td className="py-1" style={{ textAlign: 'right' }}>0 B</td></tr>
                      <tr><td className="py-1 whitespace-nowrap">予想コスト</td><td className="py-1" style={{ textAlign: 'right' }}>0 B</td></tr>
                      <tr><td className="py-1 whitespace-nowrap">予想利益</td><td className="py-1" style={{ textAlign: 'right' }}>0 B</td></tr>
                      <tr><td className="py-1 whitespace-nowrap">利益率</td><td className="py-1" style={{ textAlign: 'right' }}>0%</td></tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* 3. 機械情報 */}
            <div className="bg-white shadow-lg rounded-lg p-4 border" style={{ flex: '1', minWidth: '0' }}>
              <h3 className="text-base font-semibold text-gray-900 mb-3">機械情報</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 whitespace-nowrap">Type</td>
                    <td className="py-1 text-right">{record.Type?.value || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 whitespace-nowrap">Vender</td>
                    <td className="py-1 text-right">{record.文字列__1行__5?.value || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 whitespace-nowrap">Model</td>
                    <td className="py-1 text-right">{record.文字列__1行__9?.value || 'TBD'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 whitespace-nowrap">Serial No.</td>
                    <td className="py-1 text-right">{record.文字列__1行__10?.value || 'TBD'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 whitespace-nowrap">M/C No.</td>
                    <td className="py-1 text-right">{record.文字列__1行__11?.value || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 whitespace-nowrap">M/C Item</td>
                    <td className="py-1 text-right">{record.McItem?.value || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. Sales Details */}
            <div className="bg-white shadow-lg rounded-lg p-4 border" style={{ flex: '1', minWidth: '0' }}>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Sales Details</h3>
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
                      // Cost Sheetのデータから実際のコスト合計を計算
                      const actualCostTotal = costRecords.reduce((sum, cost) => {
                        const value = cost.total_0?.value ? parseFloat(cost.total_0.value) : 0;
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
                      // profit % = (Gross Profit / Grand Total) * 100
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
                      // Commition = Operation Profit * ComRate%
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

        {/* タブエリアセクション */}
        <div className="bg-white shadow-sm rounded-lg mb-8">
          {/* タブナビゲーション */}
          <div className="border-b border-gray-200">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500">
              <li className="me-2">
                <button
                  onClick={() => setActiveTab('cost-sheet')}
                  className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                    activeTab === 'cost-sheet'
                      ? 'text-blue-600 border-blue-600 bg-blue-50'
                      : 'border-transparent hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <DocumentIcon 
                    className={`mr-3 h-5 w-5 ${activeTab === 'cost-sheet' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} 
                  />
                  Cost Sheet
                </button>
              </li>
              <li className="me-2">
                <button
                  onClick={() => setActiveTab('po-list')}
                  className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                    activeTab === 'po-list'
                      ? 'text-blue-600 border-blue-600 bg-blue-50'
                      : 'border-transparent hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <ListIcon 
                    className={`mr-3 h-5 w-5 ${activeTab === 'po-list' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} 
                  />
                  PO LIST
                  {hasPOTabWarning && (
                    <ExclamationTriangleIcon className="ml-2 h-4 w-4 text-yellow-500" />
                  )}
                </button>
              </li>
              <li className="me-2">
                <button
                  onClick={() => setActiveTab('inv-list')}
                  className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                    activeTab === 'inv-list'
                      ? 'text-blue-600 border-blue-600 bg-blue-50'
                      : 'border-transparent hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <ClipboardIcon 
                    className={`mr-3 h-5 w-5 ${activeTab === 'inv-list' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} 
                  />
                  INV LIST
                </button>
              </li>
              <li className="me-2">
                <button
                  onClick={() => setActiveTab('man-huar-list')}
                  className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                    activeTab === 'man-huar-list'
                      ? 'text-blue-600 border-blue-600 bg-blue-50'
                      : 'border-transparent hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <UserIcon 
                    className={`mr-3 h-5 w-5 ${activeTab === 'man-huar-list' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} 
                  />
                  Man-Huar List
                </button>
              </li>
              <li className="me-2">
                <button
                  onClick={() => setActiveTab('man-huar-record')}
                  className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                    activeTab === 'man-huar-record'
                      ? 'text-blue-600 border-blue-600 bg-blue-50'
                      : 'border-transparent hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <CogIcon 
                    className={`mr-3 h-5 w-5 ${activeTab === 'man-huar-record' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} 
                  />
                  Man-Huar Record
                </button>
              </li>
              <li className="me-2">
                <button
                  onClick={() => setActiveTab('report')}
                  className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                    activeTab === 'report'
                      ? 'text-blue-600 border-blue-600 bg-blue-50'
                      : 'border-transparent hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <ChartBarIcon 
                    className={`mr-3 h-5 w-5 ${activeTab === 'report' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} 
                  />
                  Report
                </button>
              </li>
              <li className="me-2">
                <button
                  onClick={() => setActiveTab('parson-in-charge')}
                  className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                    activeTab === 'parson-in-charge'
                      ? 'text-blue-600 border-blue-600 bg-blue-50'
                      : 'border-transparent hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <UserIcon 
                    className={`mr-3 h-5 w-5 ${activeTab === 'parson-in-charge' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} 
                  />
                  Parson in charge
                </button>
              </li>
            </ul>
          </div>

          {/* タブコンテンツ */}
          <div className="p-6">

            {activeTab === 'po-list' && (
              <div className="overflow-x-auto">
                <table className="w-full table-auto divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-1 py-2 text-left text-xs font-medium text-gray-500">
                        PO No.
                      </th>
                      <th className="px-1 py-2 text-left text-xs font-medium text-gray-500">
                        Status
                      </th>
                      <th className="px-1 py-2 text-center text-xs font-medium text-gray-500">
                        PO date
                      </th>
                      <th className="px-1 py-2 text-center text-xs font-medium text-gray-500">
                        Delivery date
                      </th>
                      <th className="px-1 py-2 text-center text-xs font-medium text-gray-500">
                        Arrival date
                      </th>
                      <th className="px-1 py-2 text-center text-xs font-medium text-gray-500">
                        INVOICE DATE
                      </th>
                      <th className="px-1 py-2 text-center text-xs font-medium text-gray-500">
                        Payment date
                      </th>
                      <th className="px-1 py-2 text-right text-xs font-medium text-gray-500">
                        Sub Total
                      </th>
                      <th className="px-1 py-2 text-right text-xs font-medium text-gray-500">
                        Discount
                      </th>
                      <th className="px-1 py-2 text-right text-xs font-medium text-gray-500">
                        Grand total
                      </th>
                      <th className="px-1 py-2 text-left text-xs font-medium text-gray-500">
                        Requester
                      </th>
                      <th className="px-1 py-2 text-left text-xs font-medium text-gray-500">
                        Supplier name
                      </th>
                      <th className="px-1 py-2 text-left text-xs font-medium text-gray-500">
                        Payment term
                      </th>
                      <th className="px-1 py-2 text-left text-xs font-medium text-gray-500">
                        Forward
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {poRecords.map((po) => {
                      const deliveryDate = po.日付_0?.value ? new Date(po.日付_0.value) : null;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const statusValue = po.ドロップダウン_1?.value || '';
                      const isArrived = statusValue.includes('Arrived') || statusValue === 'Arrived';
                      const isOrdered = statusValue.includes('Ordered') || statusValue === 'Ordered';
                      const isOverdue = deliveryDate && deliveryDate < today && !isArrived;
                      const warnings = checkPOWarnings(po);
                      
                      // デバッグ用ログ
                      console.log('PO Status original:', po.ドロップダウン_1?.value, 'trimmed:', statusValue, 'isOrdered:', isOrdered, 'isArrived:', isArrived);

                      // 日付を/で区切る関数
                      const formatDate = (dateStr: string | undefined) => {
                        if (!dateStr) return '-';
                        const date = new Date(dateStr);
                        const day = date.getDate().toString().padStart(2, '0');
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const year = date.getFullYear();
                        return `${year}/${month}/${day}`;
                      };

                      return (
                        <tr key={po.$id.value} className={`hover:bg-gray-50 ${
                          isOverdue ? 'bg-red-50' : isArrived ? 'bg-green-50' : isOrdered ? 'bg-blue-50' : ''
                        }`}>
                          <td className="px-1 py-2 text-xs">
                            {po.文字列__1行__1?.value ? (
                              <Link 
                                href={`/${locale}/po-management/${po.$id.value}`}
                                className="hover:opacity-80"
                                style={{ color: '#1a2359' }}
                              >
                                {po.文字列__1行__1.value}
                              </Link>
                            ) : '-'}
                          </td>
                          <td className="px-1 py-2 whitespace-nowrap">
                            {po.ドロップダウン_1?.value && (
                              <span 
                                className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium text-white min-w-20"
                                style={{ 
                                  backgroundColor: isOrdered ? '#3B82F6' : isArrived ? '#10B981' : '#1a2359'
                                }}
                              >
                                {po.ドロップダウン_1.value}
                              </span>
                            )}
                          </td>
                          <td className="px-1 py-2 text-xs text-gray-900 text-center">{formatDate(po.日付?.value)}</td>
                          <td className="px-1 py-2 text-xs text-gray-900 text-center">{formatDate(po.日付_0?.value)}</td>
                          <td className="px-1 py-2 text-xs text-gray-900 text-center">
                            <div className="flex items-center justify-center">
                              {formatDate(po.日付_3?.value)}
                              {warnings.hasWarning && warnings.missingFields.includes('Arrival date') && (
                                <ExclamationTriangleIcon className="ml-1 h-3 w-3 text-yellow-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-1 py-2 text-xs text-gray-900 text-center">
                            <div className="flex items-center justify-center">
                              {formatDate(po.日付_4?.value)}
                              {warnings.hasWarning && warnings.missingFields.includes('Invoice date') && (
                                <ExclamationTriangleIcon className="ml-1 h-3 w-3 text-yellow-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-1 py-2 text-xs text-gray-900 text-center">
                            <div className="flex items-center justify-center">
                              {formatDate(po.日付_5?.value)}
                              {warnings.hasWarning && warnings.missingFields.includes('Payment date') && (
                                <ExclamationTriangleIcon className="ml-1 h-3 w-3 text-yellow-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-1 py-2 text-xs text-gray-900 text-right">
                            {po.subtotal?.value ? parseFloat(po.subtotal.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                          </td>
                          <td className="px-1 py-2 text-xs text-gray-900 text-right">
                            {po.discount?.value ? parseFloat(po.discount.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                          </td>
                          <td className="px-1 py-2 text-xs text-gray-900 text-right">
                            {po.grand_total?.value ? parseFloat(po.grand_total.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                          </td>
                          <td className="px-1 py-2 text-xs text-gray-900">{po.requester?.value || '-'}</td>
                          <td className="px-1 py-2 text-xs text-gray-900">
                            {po.ルックアップ_1?.value ? (
                              <Link 
                                href={`/${locale}/suppliers?search=${encodeURIComponent(po.ルックアップ_1.value)}`}
                                className="hover:opacity-80"
                                style={{ color: '#1a2359' }}
                                title={po.ルックアップ_1.value}
                              >
                                {po.ルックアップ_1.value}
                              </Link>
                            ) : '-'}
                          </td>
                          <td className="px-1 py-2 text-xs text-gray-900">{po.ドロップダウン_0?.value || '-'}</td>
                          <td className="px-1 py-2 text-xs text-gray-900">{po.forward?.value || '-'}</td>
                        </tr>
                      );
                    })}
                    {poRecords.length === 0 && (
                      <tr>
                        <td colSpan={14} className="px-3 py-4 text-sm text-gray-500 text-center">
                          {language === 'ja' ? 'データがありません' : 'No data available'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Cost Sheetタブコンテンツ */}
            {activeTab === 'cost-sheet' && (
              <div>
                {/* テーブル */}
                <div className="overflow-x-auto">
                  {costRecords.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {language === 'ja' ? 'この工事番号に関連するコストデータはありません' : 
                       language === 'th' ? 'ไม่มีข้อมูลต้นทุนสำหรับหมายเลขงานนี้' : 
                       'No cost data found for this work number'}
                    </div>
                  ) : (
                    <table className="w-full table-auto divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-1 py-2 text-left text-xs font-medium text-gray-500">
                            Record No.
                          </th>
                          <th className="px-1 py-2 text-left text-xs font-medium text-gray-500">
                            PO No.
                          </th>
                          <th className="px-1 py-2 text-left text-xs font-medium text-gray-500">
                            Status
                          </th>
                          <th className="px-1 py-2 text-center text-xs font-medium text-gray-500">
                            Arrival Date
                          </th>
                          <th className="px-1 py-2 text-center text-xs font-medium text-gray-500">
                            INV Date
                          </th>
                          <th className="px-1 py-2 text-center text-xs font-medium text-gray-500">
                            Payment Date
                          </th>
                          <th className="px-1 py-2 text-left text-xs font-medium text-gray-500">
                            Description
                          </th>
                          <th className="px-1 py-2 text-left text-xs font-medium text-gray-500">
                            Model
                          </th>
                          <th className="px-1 py-2 text-right text-xs font-medium text-gray-500">
                            QTY
                          </th>
                          <th className="px-1 py-2 text-left text-xs font-medium text-gray-500">
                            UNIT
                          </th>
                          <th className="px-1 py-2 text-right text-xs font-medium text-gray-500">
                            Unit Price
                          </th>
                          <th className="px-1 py-2 text-right text-xs font-medium text-gray-500">
                            Total
                          </th>
                          <th className="px-1 py-2 text-left text-xs font-medium text-gray-500">
                            Supplier Name
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {costRecords.map((cost) => {
                          const statusValue = cost.ドロップダウン_5?.value || '';
                          const isArrived = statusValue.includes('Arrived') || statusValue === 'Arrived';
                          const isWorking = statusValue.includes('Working') || statusValue === 'Working';

                          return (
                            <tr key={cost.$id.value} className={`hover:bg-gray-50 ${
                              isArrived ? 'bg-green-50' : isWorking ? 'bg-blue-50' : ''
                            }`}>
                              <td className="px-1 py-2 text-xs">
                                {cost.数値_0?.value || cost.$id?.value || '-'}
                              </td>
                              <td className="px-1 py-2 text-xs">
                                {cost.文字列__1行__1?.value || '-'}
                              </td>
                              <td className="px-1 py-2 whitespace-nowrap">
                                {cost.ドロップダウン_5?.value && (
                                  <span 
                                    className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium text-white min-w-20"
                                    style={{ 
                                      backgroundColor: isWorking ? '#3B82F6' : isArrived ? '#10B981' : '#1a2359'
                                    }}
                                  >
                                    {cost.ドロップダウン_5.value}
                                  </span>
                                )}
                              </td>
                              <td className="px-1 py-2 text-xs text-gray-900 text-center">
                                {formatDate(cost.日付_2?.value)}
                              </td>
                              <td className="px-1 py-2 text-xs text-gray-900 text-center">
                                {formatDate(cost.日付_3?.value)}
                              </td>
                              <td className="px-1 py-2 text-xs text-gray-900 text-center">
                                {formatDate(cost.日付_4?.value)}
                              </td>
                              <td className="px-1 py-2 text-xs text-gray-900">
                                {cost.文字列__1行__7?.value || '-'}
                              </td>
                              <td className="px-1 py-2 text-xs text-gray-900">
                                {cost.文字列__1行__9?.value || '-'}
                              </td>
                              <td className="px-1 py-2 text-xs text-gray-900 text-right">
                                {formatNumber(cost.数値?.value)}
                              </td>
                              <td className="px-1 py-2 text-xs text-gray-900">
                                {cost.ドロップダウン_3?.value || '-'}
                              </td>
                              <td className="px-1 py-2 text-xs text-gray-900 text-right">
                                {cost.unit_price_0?.value ? parseFloat(cost.unit_price_0.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                              </td>
                              <td className="px-1 py-2 text-xs text-gray-900 text-right">
                                {cost.total_0?.value ? parseFloat(cost.total_0.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                              </td>
                              <td className="px-1 py-2 text-xs text-gray-900">
                                {cost.ルックアップ_1?.value || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* 合計表示 */}
                {costRecords.length > 0 && (
                  <div className="mt-4 text-left">
                    <span className="text-sm font-medium text-gray-700">
                      Total : {(() => {
                        const total = costRecords.reduce((sum, cost) => {
                          const value = cost.total_0?.value ? parseFloat(cost.total_0.value) : 0;
                          return sum + value;
                        }, 0);
                        return total.toLocaleString('en-US', { maximumFractionDigits: 0 });
                      })()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'inv-list' && (
              <div className="overflow-x-auto">
                {/* 請求書データの表示 */}
                {invoiceRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {language === 'ja' ? 'この工事番号に関連する請求書データはありません' : 
                     language === 'th' ? 'ไม่มีข้อมูลใบแจ้งหนี้สำหรับหมายเลขงานนี้' : 
                     'No invoice data found for this work number'}
                  </div>
                ) : (
                  <table className="w-full table-auto divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500">
                          ID
                        </th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500">
                          Work No.
                        </th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500">
                          Invoice No.
                        </th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500">
                          Invoice Date
                        </th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500">
                          Customer Name
                        </th>
                        <th className="px-1 py-2 text-right text-xs font-medium text-gray-500">
                          Tax Excluded
                        </th>
                        <th className="px-1 py-2 text-right text-xs font-medium text-gray-500">
                          Total (inc. VAT)
                        </th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoiceRecords.map((invoice) => {
                        // 日付フォーマット関数
                        const formatDate = (dateStr: string | undefined) => {
                          if (!dateStr) return '-';
                          return dateStr.replace(/-/g, '/');
                        };

                        // 数値フォーマット関数
                        const formatCurrency = (value: string | undefined) => {
                          if (!value) return '0';
                          const num = parseFloat(value);
                          return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
                        };

                        return (
                          <tr key={invoice.$id?.value || 'unknown'} className="hover:bg-gray-50">
                            <td className="px-1 py-2 text-xs">
                              {invoice.$id?.value || '-'}
                            </td>
                            <td className="px-1 py-2 text-xs text-center">
                              {invoice.文字列__1行_?.value || '-'}
                            </td>
                            <td className="px-1 py-2 text-xs text-center">
                              {invoice.文字列__1行__0?.value || '-'}
                            </td>
                            <td className="px-1 py-2 text-xs text-center">
                              {formatDate(invoice.日付?.value)}
                            </td>
                            <td className="px-1 py-2 text-xs">
                              {invoice.CS_name?.value || '-'}
                            </td>
                            <td className="px-1 py-2 text-xs text-right">
                              {formatCurrency(invoice.total?.value)}
                            </td>
                            <td className="px-1 py-2 text-xs text-right">
                              {formatCurrency(invoice.計算?.value)}
                            </td>
                            <td className="px-1 py-2 text-xs text-center">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                {invoice.ラジオボタン?.value ? invoice.ラジオボタン.value.split('/')[0] : '-'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    
                    {/* 合計行 */}
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={5} className="px-1 py-2 text-xs font-semibold text-gray-900 text-right">
                          Total:
                        </td>
                        <td className="px-1 py-2 text-xs font-semibold text-gray-900 text-right">
                          {invoiceRecords.reduce((sum, invoice) => {
                            const value = invoice.total?.value ? parseFloat(invoice.total.value) : 0;
                            return sum + value;
                          }, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-1 py-2 text-xs font-semibold text-gray-900 text-right">
                          {invoiceRecords.reduce((sum, invoice) => {
                            const value = invoice.計算?.value ? parseFloat(invoice.計算.value) : 0;
                            return sum + value;
                          }, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
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
    </DashboardLayout>
  );
}