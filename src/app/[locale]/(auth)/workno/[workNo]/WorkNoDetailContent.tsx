'use client';

import React, { useState, useTransition } from 'react';
import { WorkNoRecord, CustomerRecord, PORecord, QuotationRecord, CostRecord, InvoiceRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getFieldLabel, getStatusLabel, type Language } from '@/lib/kintone/field-mappings';
import { tableStyles } from '@/components/ui/TableStyles';
import { getStatusColor } from '@/lib/kintone/utils';
import Link from 'next/link';
import TransitionLink from '@/components/ui/TransitionLink';

interface WorkNoDetailContentProps {
  record: WorkNoRecord;
  customer: CustomerRecord | null;
  poRecords?: PORecord[];
  quotationRecords?: QuotationRecord[];
  costRecords?: CostRecord[];
  invoiceRecords?: InvoiceRecord[];
  locale: string;
  userEmail: string;
}

// タブアイコンコンポーネント
function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

function ShoppingCartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
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

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

// 新しいアイコンコンポーネント
function DocumentTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function LightningBoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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

function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zM9 19V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

export function WorkNoDetailContent({ record, customer, poRecords = [], quotationRecords = [], costRecords = [], invoiceRecords = [], locale, userEmail }: WorkNoDetailContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = getFieldLabel('WorkNo', language);
  const [activeTab, setActiveTab] = useState('cost-sheet');
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);

  const salesScheduledRaw = record.Salesdate?.value || '';
  const formattedSalesScheduled = salesScheduledRaw ? salesScheduledRaw.replace(/-/g, '/') : 'TBD';
  const isSalesScheduledOverdue = (() => {
    if (!salesScheduledRaw) return false;
    const salesDate = new Date(salesScheduledRaw);
    if (Number.isNaN(salesDate.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return salesDate < today;
  })();

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
      <div className="py-4 px-4">
        {/* ヘッダーエリア */}
        <div className="bg-white shadow-sm rounded-lg px-6 py-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-slate-900">
              {customer?.name?.value || 'Unknown Customer'}
            </h1>
            <div className="flex items-center space-x-3">
              <Link
                href={`/${locale}/workno/${record.WorkNo?.value}/edit`}
                className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {language === 'ja' ? '編集' : 'Edit'}
              </Link>
              <Link
                href={`/${locale}/workno`}
                className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {language === 'ja' ? '戻る' : 'Back'}
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Work No</p>
              <p className="font-medium">{record.WorkNo?.value || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500">Project</p>
              <p className="font-medium">{record.文字列__1行__1?.value || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500">Status</p>
              <p>
                <span 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: getStatusColor(record.Status?.value).bg,
                    color: getStatusColor(record.Status?.value).text
                  }}
                >
                  {getStatusLabel(record.Status?.value, language)}
                </span>
              </p>
            </div>
            <div>
              <p className="text-slate-500">Type</p>
              <p className="font-medium">{record.Type?.value || '-'}</p>
            </div>
          </div>
        </div>

        {/* 情報カードセクション */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* 1. 工事情報 */}
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">工事情報</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">開始日</dt>
                <dd className="text-sm font-medium">{record.日付_6?.value?.replace(/-/g, '/') || 'TBD'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">売上予定日</dt>
                <dd className="text-sm font-medium">
                  <span className={isSalesScheduledOverdue ? 'text-red-600' : ''}>
                    {formattedSalesScheduled}
                    {isSalesScheduledOverdue && ' ⚠️'}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">終了日</dt>
                <dd className="text-sm font-medium">{record.日付_5?.value?.replace(/-/g, '/') || 'TBD'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">注文書番号</dt>
                <dd className="text-sm font-medium">
                  {record.ルックアップ?.value ? (
                    <Link 
                      href={`/${locale}/po-management?search=${record.ルックアップ.value}`}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      {record.ルックアップ.value}
                    </Link>
                  ) : '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">担当営業</dt>
                <dd className="text-sm font-medium">
                  {record.Salesstaff?.value && record.Salesstaff.value.length > 0 
                    ? record.Salesstaff.value.map(staff => staff.name).join(', ')
                    : '-'
                  }
                </dd>
              </div>
            </dl>
          </div>

          {/* 2. 見積情報 */}
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">見積情報</h3>
            <dl className="space-y-2">
              {quotationRecords.length > 0 ? (
                <>
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-500">見積番号</dt>
                    <dd className="text-sm font-medium">
                      <Link 
                        href={`/${locale}/quotation/${quotationRecords[0].$id.value}`}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        {quotationRecords[0].qtno2?.value || '-'}
                      </Link>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-500">見積金額</dt>
                    <dd className="text-sm font-medium">
                      {(() => {
                        const subtotal = quotationRecords[0].Sub_total?.value ? parseFloat(quotationRecords[0].Sub_total.value) : 0;
                        const discount = quotationRecords[0].Discount?.value ? parseFloat(quotationRecords[0].Discount.value) : 0;
                        const total = subtotal - discount;
                        return `${total.toLocaleString('en-US', { maximumFractionDigits: 0 })} B`;
                      })()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-500">予想コスト</dt>
                    <dd className="text-sm font-medium">
                      {quotationRecords[0].costtotal?.value 
                        ? `${parseFloat(quotationRecords[0].costtotal.value).toLocaleString('en-US', { maximumFractionDigits: 0 })} B`
                        : '0 B'
                      }
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-500">予想利益率</dt>
                    <dd className="text-sm font-medium">
                      {(() => {
                        const subtotal = quotationRecords[0].Sub_total?.value ? parseFloat(quotationRecords[0].Sub_total.value) : 0;
                        const discount = quotationRecords[0].Discount?.value ? parseFloat(quotationRecords[0].Discount.value) : 0;
                        const total = subtotal - discount;
                        const forecast = quotationRecords[0].costtotal?.value ? parseFloat(quotationRecords[0].costtotal.value) : 0;
                        const expectedProfit = total - forecast;
                        
                        if (total > 0) {
                          const percentage = (expectedProfit / total) * 100;
                          return `${percentage.toFixed(1)}%`;
                        }
                        return '0%';
                      })()}
                    </dd>
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-500 text-center py-4">見積情報なし</div>
              )}
            </dl>
          </div>

          {/* 3. 機械情報 */}
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">機械情報</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Vender</dt>
                <dd className="text-sm font-medium">{record.文字列__1行__5?.value || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Model</dt>
                <dd className="text-sm font-medium">{record.文字列__1行__9?.value || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Serial No.</dt>
                <dd className="text-sm font-medium">{record.文字列__1行__10?.value || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">M/C No.</dt>
                <dd className="text-sm font-medium">{record.文字列__1行__11?.value || '-'}</dd>
              </div>
            </dl>
          </div>

          {/* 4. 実績 */}
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">実績</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">売上高</dt>
                <dd className="text-sm font-medium">
                  {(() => {
                    if (quotationRecords.length > 0) {
                      const subtotal = quotationRecords[0].Sub_total?.value ? parseFloat(quotationRecords[0].Sub_total.value) : 0;
                      const discount = quotationRecords[0].Discount?.value ? parseFloat(quotationRecords[0].Discount.value) : 0;
                      const total = subtotal - discount;
                      return `${total.toLocaleString('en-US', { maximumFractionDigits: 0 })} B`;
                    }
                    return '0 B';
                  })()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">実コスト</dt>
                <dd className="text-sm font-medium">
                  {(() => {
                    const actualCostTotal = costRecords.reduce((sum, cost) => {
                      const value = cost.total_0?.value ? parseFloat(cost.total_0.value) : 0;
                      return sum + value;
                    }, 0);
                    
                    return actualCostTotal > 0 
                      ? `${actualCostTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })} B`
                      : '0 B';
                  })()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">粗利益</dt>
                <dd className="text-sm font-medium">
                  {record.profit?.value 
                    ? `${parseFloat(record.profit.value).toLocaleString('en-US', { maximumFractionDigits: 0 })} B`
                    : '0 B'
                  }
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">利益率</dt>
                <dd className="text-sm font-medium">
                  {(() => {
                    const grossProfit = record.profit?.value ? parseFloat(record.profit.value) : 0;
                    const grandTotal = quotationRecords.length > 0 && quotationRecords[0].Sub_total?.value ? parseFloat(quotationRecords[0].Sub_total.value) : 0;
                    if (grandTotal > 0) {
                      const percentage = (grossProfit / grandTotal) * 100;
                      return `${percentage.toFixed(1)}%`;
                    }
                    return '0%';
                  })()}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* タブセクション */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* タブナビゲーション */}
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('cost-sheet')}
                className={`${
                  activeTab === 'cost-sheet'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <DocumentIcon className={`mr-2 h-5 w-5 ${activeTab === 'cost-sheet' ? 'text-indigo-600' : 'text-slate-400'}`} />
                Cost Sheet
              </button>
              <button
                onClick={() => setActiveTab('po-list')}
                className={`${
                  activeTab === 'po-list'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <ListIcon className={`mr-2 h-5 w-5 ${activeTab === 'po-list' ? 'text-indigo-600' : 'text-slate-400'}`} />
                PO LIST
                {hasPOTabWarning && (
                  <ExclamationTriangleIcon className="ml-2 h-4 w-4 text-yellow-500" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('inv-list')}
                className={`${
                  activeTab === 'inv-list'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <ClipboardIcon className={`mr-2 h-5 w-5 ${activeTab === 'inv-list' ? 'text-indigo-600' : 'text-slate-400'}`} />
                INV LIST
              </button>
              <button
                onClick={() => setActiveTab('mechanical-drawing')}
                className={`${
                  activeTab === 'mechanical-drawing'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <DocumentTextIcon className={`mr-2 h-5 w-5 ${activeTab === 'mechanical-drawing' ? 'text-indigo-600' : 'text-slate-400'}`} />
                機械図面
              </button>
              <button
                onClick={() => setActiveTab('electrical-drawing')}
                className={`${
                  activeTab === 'electrical-drawing'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <LightningBoltIcon className={`mr-2 h-5 w-5 ${activeTab === 'electrical-drawing' ? 'text-indigo-600' : 'text-slate-400'}`} />
                電気図面
              </button>
              <button
                onClick={() => setActiveTab('man-huar-list')}
                className={`${
                  activeTab === 'man-huar-list'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <UserIcon className={`mr-2 h-5 w-5 ${activeTab === 'man-huar-list' ? 'text-indigo-600' : 'text-slate-400'}`} />
                Man-Huar List
              </button>
              <button
                onClick={() => setActiveTab('man-huar-record')}
                className={`${
                  activeTab === 'man-huar-record'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <CogIcon className={`mr-2 h-5 w-5 ${activeTab === 'man-huar-record' ? 'text-indigo-600' : 'text-slate-400'}`} />
                Man-Huar Record
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`${
                  activeTab === 'report'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <ChartBarIcon className={`mr-2 h-5 w-5 ${activeTab === 'report' ? 'text-indigo-600' : 'text-slate-400'}`} />
                Report
              </button>
              <button
                onClick={() => setActiveTab('parson-in-charge')}
                className={`${
                  activeTab === 'parson-in-charge'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <UserIcon className={`mr-2 h-5 w-5 ${activeTab === 'parson-in-charge' ? 'text-indigo-600' : 'text-slate-400'}`} />
                Person in charge
              </button>
            </nav>
          </div>

          {/* タブコンテンツ */}
          <div className="p-6">

            {activeTab === 'po-list' && (
              <div className="overflow-x-auto">
                <table className="w-full table-auto divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="whitespace-nowrap px-1 py-2 text-left text-xs font-medium text-slate-500">
                        PO No.
                      </th>
                      <th className="whitespace-nowrap px-1 py-2 text-left text-xs font-medium text-slate-500">
                        Status
                      </th>
                      <th className="whitespace-nowrap px-1 py-2 text-center text-xs font-medium text-slate-500">
                        PO date
                      </th>
                      <th className="whitespace-nowrap px-1 py-2 text-center text-xs font-medium text-slate-500">
                        Delivery date
                      </th>
                      <th className="whitespace-nowrap px-1 py-2 text-center text-xs font-medium text-slate-500">
                        Arrival date
                      </th>
                      <th className="whitespace-nowrap px-1 py-2 text-center text-xs font-medium text-slate-500">
                        INVOICE DATE
                      </th>
                      <th className="whitespace-nowrap px-1 py-2 text-center text-xs font-medium text-slate-500">
                        Payment date
                      </th>
                      <th className="whitespace-nowrap px-1 py-2 text-right text-xs font-medium text-slate-500">
                        Sub Total
                      </th>
                      <th className="whitespace-nowrap px-1 py-2 text-right text-xs font-medium text-slate-500">
                        Discount
                      </th>
                      <th className="whitespace-nowrap px-1 py-2 text-right text-xs font-medium text-slate-500">
                        Grand total
                      </th>
                      <th className="whitespace-nowrap px-1 py-2 text-left text-xs font-medium text-slate-500">
                        Requester
                      </th>
                      <th className="whitespace-nowrap px-1 py-2 text-left text-xs font-medium text-slate-500">
                        Supplier name
                      </th>
                      <th className="whitespace-nowrap px-1 py-2 text-left text-xs font-medium text-slate-500">
                        Payment term
                      </th>
                      <th className="whitespace-nowrap px-1 py-2 text-left text-xs font-medium text-slate-500">
                        Forward
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {poRecords.map((po) => {
                      const deliveryDate = po.日付_0?.value ? new Date(po.日付_0.value) : null;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const statusValue = po.ドロップダウン_1?.value || '';
                      const isArrived = statusValue.includes('Arrived') || statusValue === 'Arrived';
                      const isOrdered = statusValue.includes('Ordered') || statusValue === 'Ordered';
                      const isOverdue = deliveryDate && deliveryDate < today && !isArrived;
                      const warnings = checkPOWarnings(po);
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
                        <tr key={po.$id.value} className={`hover:bg-slate-50 h-12 ${
                          isOverdue ? 'bg-red-50' : isArrived ? 'bg-emerald-50' : isOrdered ? 'bg-indigo-50' : ''
                        }`}>
                          <td className="whitespace-nowrap px-1 py-2 text-xs">
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
                          <td className="whitespace-nowrap px-1 py-2 whitespace-nowrap">
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
                          <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900 text-center">{formatDate(po.日付?.value)}</td>
                          <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900 text-center">
                            <div className="flex items-center justify-center">
                              {formatDate(po.日付_0?.value)}
                              {!po.日付_0?.value && (
                                <span className="ml-1 text-yellow-500 text-xs" aria-label="Delivery date missing">⚠️</span>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900 text-center">
                            <div className="flex items-center justify-center">
                              {formatDate(po.日付_3?.value)}
                              {warnings.hasWarning && warnings.missingFields.includes('Arrival date') && (
                                <ExclamationTriangleIcon className="ml-1 h-3 w-3 text-yellow-500" />
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900 text-center">
                            <div className="flex items-center justify-center">
                              {formatDate(po.日付_4?.value)}
                              {warnings.hasWarning && warnings.missingFields.includes('Invoice date') && (
                                <ExclamationTriangleIcon className="ml-1 h-3 w-3 text-yellow-500" />
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900 text-center">
                            <div className="flex items-center justify-center">
                              {formatDate(po.日付_5?.value)}
                              {warnings.hasWarning && warnings.missingFields.includes('Payment date') && (
                                <ExclamationTriangleIcon className="ml-1 h-3 w-3 text-yellow-500" />
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900 text-right">
                            {po.subtotal?.value ? parseFloat(po.subtotal.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                          </td>
                          <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900 text-right">
                            {po.discount?.value ? parseFloat(po.discount.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                          </td>
                          <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900 text-right">
                            {po.grand_total?.value ? parseFloat(po.grand_total.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                          </td>
                          <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900">{po.requester?.value || '-'}</td>
                          <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900">
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
                          <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900">{po.ドロップダウン_0?.value || '-'}</td>
                          <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900">{po.forward?.value || '-'}</td>
                        </tr>
                      );
                    })}
                    {poRecords.length === 0 && (
                      <tr>
                        <td colSpan={14} className="px-3 py-4 text-sm text-slate-500 text-center">
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
                    <div className="text-center py-8 text-slate-500">
                      {language === 'ja' ? 'この工事番号に関連するコストデータはありません' : 
                       language === 'th' ? 'ไม่มีข้อมูลต้นทุนสำหรับหมายเลขงานนี้' : 
                       'No cost data found for this work number'}
                    </div>
                  ) : (
                    <table className="w-full table-auto divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="whitespace-nowrap px-1 py-2 text-left text-xs font-medium text-slate-500">
                            Record No.
                          </th>
                          <th className="whitespace-nowrap px-1 py-2 text-left text-xs font-medium text-slate-500">
                            PO No.
                          </th>
                          <th className="whitespace-nowrap px-1 py-2 text-left text-xs font-medium text-slate-500">
                            Status
                          </th>
                          <th className="whitespace-nowrap px-1 py-2 text-center text-xs font-medium text-slate-500">
                            Arrival Date
                          </th>
                          <th className="whitespace-nowrap px-1 py-2 text-center text-xs font-medium text-slate-500">
                            INV Date
                          </th>
                          <th className="whitespace-nowrap px-1 py-2 text-center text-xs font-medium text-slate-500">
                            Payment Date
                          </th>
                          <th className="whitespace-nowrap px-1 py-2 text-left text-xs font-medium text-slate-500">
                            Description
                          </th>
                          <th className="whitespace-nowrap px-1 py-2 text-left text-xs font-medium text-slate-500">
                            Model
                          </th>
                          <th className="whitespace-nowrap px-1 py-2 text-right text-xs font-medium text-slate-500">
                            QTY
                          </th>
                          <th className="whitespace-nowrap px-1 py-2 text-left text-xs font-medium text-slate-500">
                            UNIT
                          </th>
                          <th className="whitespace-nowrap px-1 py-2 text-right text-xs font-medium text-slate-500">
                            Unit Price
                          </th>
                          <th className="whitespace-nowrap px-1 py-2 text-right text-xs font-medium text-slate-500">
                            Total
                          </th>
                          <th className="whitespace-nowrap px-1 py-2 text-left text-xs font-medium text-slate-500">
                            Supplier Name
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {costRecords.map((cost) => {
                          const statusValue = cost.ドロップダウン_5?.value || '';
                          const isArrived = statusValue.includes('Arrived') || statusValue === 'Arrived';
                          const isWorking = statusValue.includes('Working') || statusValue === 'Working';

                          return (
                            <tr key={cost.$id.value} className={`hover:bg-slate-50 h-12 ${
                              isArrived ? 'bg-emerald-50' : isWorking ? 'bg-indigo-50' : ''
                            }`}>
                              <td className="whitespace-nowrap px-1 py-2 text-xs">
                                {cost.数値_0?.value || cost.$id?.value || '-'}
                              </td>
                              <td className="whitespace-nowrap px-1 py-2 text-xs">
                                {cost.文字列__1行__1?.value || '-'}
                              </td>
                              <td className="whitespace-nowrap px-1 py-2 whitespace-nowrap">
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
                              <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900 text-center">
                                {formatDate(cost.日付_2?.value)}
                              </td>
                              <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900 text-center">
                                {formatDate(cost.日付_3?.value)}
                              </td>
                              <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900 text-center">
                                {formatDate(cost.日付_4?.value)}
                              </td>
                              <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900">
                                {cost.文字列__1行__7?.value || '-'}
                              </td>
                              <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900">
                                {cost.文字列__1行__9?.value || '-'}
                              </td>
                              <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900 text-right">
                                {formatNumber(cost.数値?.value)}
                              </td>
                              <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900">
                                {cost.ドロップダウン_3?.value || '-'}
                              </td>
                              <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900 text-right">
                                {cost.unit_price_0?.value ? parseFloat(cost.unit_price_0.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                              </td>
                              <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900 text-right">
                                {cost.total_0?.value ? parseFloat(cost.total_0.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                              </td>
                              <td className="whitespace-nowrap px-1 py-2 text-xs text-slate-900">
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
                    <span className="text-sm font-medium text-slate-700">
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
                  <div className="text-center py-8 text-slate-500">
                    {language === 'ja' ? 'この工事番号に関連する請求書データはありません' : 
                     language === 'th' ? 'ไม่มีข้อมูลใบแจ้งหนี้สำหรับหมายเลขงานนี้' : 
                     'No invoice data found for this work number'}
                  </div>
                ) : (
                  <table className="w-full table-auto divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="whitespace-nowrap px-1 py-2 text-left text-xs font-medium text-slate-500">
                          ID
                        </th>
                        <th className="whitespace-nowrap px-1 py-2 text-center text-xs font-medium text-slate-500">
                          Work No.
                        </th>
                        <th className="whitespace-nowrap px-1 py-2 text-center text-xs font-medium text-slate-500">
                          Invoice No.
                        </th>
                        <th className="whitespace-nowrap px-1 py-2 text-center text-xs font-medium text-slate-500">
                          Invoice Date
                        </th>
                        <th className="whitespace-nowrap px-1 py-2 text-left text-xs font-medium text-slate-500">
                          Customer Name
                        </th>
                        <th className="whitespace-nowrap px-1 py-2 text-right text-xs font-medium text-slate-500">
                          Tax Excluded
                        </th>
                        <th className="whitespace-nowrap px-1 py-2 text-right text-xs font-medium text-slate-500">
                          Total (inc. VAT)
                        </th>
                        <th className="whitespace-nowrap px-1 py-2 text-center text-xs font-medium text-slate-500">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
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
                          <tr key={invoice.$id?.value || 'unknown'} className="hover:bg-slate-50 h-12">
                            <td className="whitespace-nowrap px-1 py-2 text-xs">
                              {invoice.$id?.value || '-'}
                            </td>
                            <td className="whitespace-nowrap px-1 py-2 text-xs text-center">
                              {invoice.文字列__1行_?.value || '-'}
                            </td>
                            <td className="whitespace-nowrap px-1 py-2 text-xs text-center">
                              {invoice.文字列__1行__0?.value || '-'}
                            </td>
                            <td className="whitespace-nowrap px-1 py-2 text-xs text-center">
                              {formatDate(invoice.日付?.value)}
                            </td>
                            <td className="whitespace-nowrap px-1 py-2 text-xs">
                              {invoice.CS_name?.value || '-'}
                            </td>
                            <td className="whitespace-nowrap px-1 py-2 text-xs text-right">
                              {formatCurrency(invoice.total?.value)}
                            </td>
                            <td className="whitespace-nowrap px-1 py-2 text-xs text-right">
                              {formatCurrency(invoice.計算?.value)}
                            </td>
                            <td className="whitespace-nowrap px-1 py-2 text-xs text-center">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                                {invoice.ラジオボタン?.value ? invoice.ラジオボタン.value.split('/')[0] : '-'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    
                    {/* 合計行 */}
                    <tfoot className="bg-slate-50">
                      <tr>
                        <td colSpan={5} className="px-1 py-2 text-xs font-semibold text-slate-900 text-right">
                          Total:
                        </td>
                        <td className="whitespace-nowrap px-1 py-2 text-xs font-semibold text-slate-900 text-right">
                          {invoiceRecords.reduce((sum, invoice) => {
                            const value = invoice.total?.value ? parseFloat(invoice.total.value) : 0;
                            return sum + value;
                          }, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="whitespace-nowrap px-1 py-2 text-xs font-semibold text-slate-900 text-right">
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


            {activeTab === 'mechanical-drawing' && (
              <div className="overflow-x-auto">
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">機械図面部品表</h3>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm">
                    部品追加
                  </button>
                </div>
                <table className="w-full table-auto divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        No.
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        部品名
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        型番
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                        数量
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        単位
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        単価
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        金額
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        メーカー
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        備考
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                        機械図面の部品表データがありません
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'electrical-drawing' && (
              <div className="overflow-x-auto">
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">電気図面部品表</h3>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm">
                    部品追加
                  </button>
                </div>
                <table className="w-full table-auto divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        No.
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        部品名
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        型番
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                        数量
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        単位
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        単価
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        金額
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        メーカー
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        備考
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                        電気図面の部品表データがありません
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'man-huar-list' && (
              <div className="text-center text-slate-500 py-8">
                Man-Huar List content will be implemented here
              </div>
            )}

            {activeTab === 'man-huar-record' && (
              <div className="text-center text-slate-500 py-8">
                Man-Huar Record content will be implemented here
              </div>
            )}

            {activeTab === 'report' && (
              <div className="text-center text-slate-500 py-8">
                Report content will be implemented here
              </div>
            )}

            {activeTab === 'parson-in-charge' && (
              <div className="text-center text-slate-500 py-8">
                Person in charge content will be implemented here
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
