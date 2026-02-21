'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CustomerRecord, WorkNoRecord, QuotationRecord, MachineRecord, CustomerStaffRecord, InvoiceRecord } from '@/types/kintone';
import { OrderRecord } from '@/lib/kintone/order';
import { type Language, getFieldLabel, getStatusLabel } from '@/lib/kintone/field-mappings';
import TransitionLink from '@/components/ui/TransitionLink';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SalesChart from '@/components/charts/SalesChart';
import { tableStyles } from '@/components/ui/TableStyles';
import { detailStyles } from '@/components/ui/DetailStyles';
import { DetailPageHeader } from '@/components/ui/DetailPageHeader';
import { Pencil } from 'lucide-react';
import { getStatusColor } from '@/lib/kintone/utils';

interface CustomerDetailContentProps {
  locale: string;
  language: Language;
  customerRecord: CustomerRecord;
  workNoRecords: WorkNoRecord[];
  quotationRecords: QuotationRecord[];
  orderRecords: OrderRecord[];
  machineRecords: MachineRecord[];
  customerStaffRecords: CustomerStaffRecord[];
  invoiceRecords: InvoiceRecord[];
  allInvoiceRecords?: InvoiceRecord[];
  allWorkNoRecords?: WorkNoRecord[];
  allQuotationRecords?: QuotationRecord[];
  userInfo?: { email: string; name: string; avatarUrl?: string };
}

export function CustomerDetailContent({
  locale,
  language,
  customerRecord,
  workNoRecords = [],
  quotationRecords = [],
  orderRecords = [],
  machineRecords = [],
  customerStaffRecords = [],
  invoiceRecords = [],
  allInvoiceRecords = [],
  allWorkNoRecords = [],
  allQuotationRecords = [],
  userInfo,
}: CustomerDetailContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('workno');
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);
  const currentPeriod = '14';
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);
  const [selectedQuotePeriod, setSelectedQuotePeriod] = useState(currentPeriod);
  const [selectedPOPeriod, setSelectedPOPeriod] = useState(currentPeriod);
  const [selectedInvoicePeriod, setSelectedInvoicePeriod] = useState(currentPeriod);

  const [workNoData, setWorkNoData] = useState(workNoRecords || []);
  const [quotationData, setQuotationData] = useState(quotationRecords || []);
  const [poData, setPOData] = useState(orderRecords || []);
  const [invoiceData, setInvoiceData] = useState(invoiceRecords || []);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [lastFetchedWorkNoPeriod, setLastFetchedWorkNoPeriod] = useState(currentPeriod);
  const [lastFetchedQuotePeriod, setLastFetchedQuotePeriod] = useState(currentPeriod);
  const [lastFetchedPOPeriod, setLastFetchedPOPeriod] = useState(currentPeriod);
  const [lastFetchedInvoicePeriod, setLastFetchedInvoicePeriod] = useState(currentPeriod);

  // Tab definitions with icons
  const tabs = [
    { key: 'workno', label: language === 'ja' ? '工事番号一覧' : 'Work No.', count: workNoData.length, icon: 'document' },
    { key: 'quotation', label: language === 'ja' ? '見積一覧' : 'Quotations', count: quotationData.length, icon: 'clipboard' },
    { key: 'po', label: language === 'ja' ? 'PO一覧' : 'PO List', count: poData.length, icon: 'cart' },
    { key: 'invoice', label: language === 'ja' ? '請求書一覧' : 'Invoices', count: invoiceData.length, icon: 'document' },
    { key: 'machine', label: language === 'ja' ? '保有機械一覧' : 'Machines', count: machineRecords.length, icon: 'cog' },
    { key: 'staff', label: language === 'ja' ? '顧客担当者一覧' : 'Contacts', count: customerStaffRecords.length, icon: 'user' },
  ];

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const formatNumber = (value: string | undefined) => {
    if (!value) return '-';
    const numericValue = value.replace(/[^\d.-]/g, '');
    const number = parseFloat(numericValue);
    if (isNaN(number)) return '-';
    return number.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'B';
  };

  const getAllFiscalPeriods = () => ['8', '9', '10', '11', '12', '13', '14'];

  useEffect(() => {
    const fetchData = async () => {
      if (activeTab === 'workno' && selectedPeriod !== lastFetchedWorkNoPeriod) {
        setIsLoadingData(true);
        try {
          const response = await fetch(`/api/customer/${customerRecord.文字列__1行_.value}/data?period=${selectedPeriod}&type=workno`);
          if (response.ok) {
            const data = await response.json();
            setWorkNoData(data);
            setLastFetchedWorkNoPeriod(selectedPeriod);
          }
        } catch (error) {
          console.error('Error fetching workno data:', error);
        } finally {
          setIsLoadingData(false);
        }
      }

      if (activeTab === 'quotation' && selectedQuotePeriod !== lastFetchedQuotePeriod) {
        setIsLoadingData(true);
        try {
          const response = await fetch(`/api/customer/${customerRecord.文字列__1行_.value}/data?period=${selectedQuotePeriod}&type=quotation`);
          if (response.ok) {
            const data = await response.json();
            setQuotationData(data);
            setLastFetchedQuotePeriod(selectedQuotePeriod);
          }
        } catch (error) {
          console.error('Error fetching quotation data:', error);
        } finally {
          setIsLoadingData(false);
        }
      }

      if (activeTab === 'po' && selectedPOPeriod !== lastFetchedPOPeriod) {
        setIsLoadingData(true);
        try {
          const response = await fetch(`/api/customer/${customerRecord.文字列__1行_.value}/data?period=${selectedPOPeriod}&type=po`);
          if (response.ok) {
            const data = await response.json();
            setPOData(data);
            setLastFetchedPOPeriod(selectedPOPeriod);
          }
        } catch (error) {
          console.error('Error fetching PO data:', error);
        } finally {
          setIsLoadingData(false);
        }
      }

      if (activeTab === 'invoice' && selectedInvoicePeriod !== lastFetchedInvoicePeriod) {
        setIsLoadingData(true);
        try {
          const response = await fetch(`/api/customer/${customerRecord.文字列__1行_.value}/data?period=${selectedInvoicePeriod}&type=invoice`);
          if (response.ok) {
            const data = await response.json();
            setInvoiceData(data);
            setLastFetchedInvoicePeriod(selectedInvoicePeriod);
          }
        } catch (error) {
          console.error('Error fetching invoice data:', error);
        } finally {
          setIsLoadingData(false);
        }
      }
    };

    fetchData();
  }, [activeTab, selectedPeriod, selectedQuotePeriod, selectedPOPeriod, selectedInvoicePeriod, customerRecord.文字列__1行_.value, lastFetchedWorkNoPeriod, lastFetchedQuotePeriod, lastFetchedPOPeriod, lastFetchedInvoicePeriod]);

  const handleNavigation = (path: string) => {
    setIsNavigating(true);
    startTransition(() => {
      router.push(path);
    });
  };

  const handleEdit = () => handleNavigation(`/${locale}/customers/${customerRecord.$id.value}/edit`);
  const handleBack = () => handleNavigation(`/${locale}/customers`);

  const getPeriodSelectComponent = (
    id: string,
    value: string,
    onChange: (value: string) => void
  ) => (
    <div className="flex items-center gap-2">
      <span className="text-theme-sm text-gray-500 dark:text-gray-400">
        {language === 'ja' ? '会計期間:' : 'Period:'}
      </span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 text-theme-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        {getAllFiscalPeriods().map(period => (
          <option key={period} value={period}>
            {language === 'ja' ? `第${period}期` : `Period ${period}`}
          </option>
        ))}
      </select>
    </div>
  );

  // Tab Icon Component
  const TabIcon = ({ type, className }: { type: string; className?: string }) => {
    switch (type) {
      case 'document':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'clipboard':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'cart':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'cog':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'user':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout locale={locale} userInfo={userInfo}>
      <div className="p-4 md:p-6 space-y-6">
        {/* Loading Overlay */}
        {isNavigating && (
          <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex items-center gap-3">
              <div className="animate-spin h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">{language === 'ja' ? '読み込み中...' : 'Loading...'}</span>
            </div>
          </div>
        )}

        <DetailPageHeader
          backHref={`/${locale}/customers`}
          backLabel={language === 'ja' ? '一覧へ戻る' : 'Back'}
          title={customerRecord.会社名?.value || '-'}
          subtitle={[customerRecord.文字列__1行_?.value, customerRecord.文字列__1行__4?.value].filter(Boolean).join(' | ')}
          statusBadge={customerRecord.顧客ランク?.value ? (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              customerRecord.顧客ランク.value === 'VIP'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-400'
                : customerRecord.顧客ランク.value === 'A'
                ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500'
                : customerRecord.顧客ランク.value === 'B'
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              Rank: {customerRecord.顧客ランク.value}
            </span>
          ) : undefined}
          actions={
            <button
              onClick={handleEdit}
              disabled={isPending || isNavigating}
              className={detailStyles.secondaryButton}
            >
              <Pencil size={16} className="mr-1.5" />
              {language === 'ja' ? '編集' : 'Edit'}
            </button>
          }
        />

        {/* Basic Information Card - TailAdmin Style */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {language === 'ja' ? '基本情報' : 'Basic Information'}
            </h3>
          </div>
          <div className="p-5 lg:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Address */}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {language === 'ja' ? '住所' : 'Address'}
                </p>
                <p className="text-sm text-gray-800 dark:text-white/90">
                  {customerRecord.住所?.value || '-'}
                </p>
              </div>
              {/* Country */}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {language === 'ja' ? '国' : 'Country'}
                </p>
                <p className="text-sm text-gray-800 dark:text-white/90">
                  {customerRecord.文字列__1行__4?.value || '-'}
                </p>
              </div>
              {/* Postal Code */}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {language === 'ja' ? '郵便番号' : 'Postal Code'}
                </p>
                <p className="text-sm text-gray-800 dark:text-white/90">
                  {customerRecord.郵便番号?.value || '-'}
                </p>
              </div>
              {/* TAX ID */}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">TAX ID</p>
                <p className="text-sm text-gray-800 dark:text-white/90">
                  {customerRecord.文字列__1行__6?.value || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {language === 'ja' ? '連絡先情報' : 'Contact Information'}
            </h3>
          </div>
          <div className="p-5 lg:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phone */}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {language === 'ja' ? '電話番号' : 'Phone'}
                </p>
                {customerRecord.TEL?.value ? (
                  <a href={`tel:${customerRecord.TEL.value}`} className="text-theme-sm font-medium text-brand-500 hover:text-brand-600">
                    {customerRecord.TEL.value}
                  </a>
                ) : (
                  <p className="text-sm text-gray-800 dark:text-white/90">-</p>
                )}
              </div>
              {/* FAX */}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">FAX</p>
                <p className="text-sm text-gray-800 dark:text-white/90">
                  {customerRecord.FAX?.value || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Chart */}
        {allInvoiceRecords && allInvoiceRecords.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {language === 'ja' ? '売上推移' : 'Sales Trend'}
              </h3>
            </div>
            <div className="p-5">
              <SalesChart
                invoiceRecords={allInvoiceRecords}
                workNoRecords={allWorkNoRecords}
                quotationRecords={allQuotationRecords}
                language={language}
              />
            </div>
          </div>
        )}

        {/* Tabs Section - TailAdmin Style */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {/* Tab Navigation */}
          <div className="border-b border-gray-100 dark:border-gray-800">
            <nav className="flex overflow-x-auto px-2" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-theme-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <TabIcon type={tab.icon} className="w-5 h-5" />
                  {tab.label}
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    activeTab === tab.key
                      ? 'bg-brand-500 text-white'
                      : 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-5">
            {/* Work No Tab */}
            {activeTab === 'workno' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-base font-medium text-gray-800 dark:text-white/90">
                    {language === 'ja' ? '関連する工事番号' : 'Related Work Numbers'}
                  </h4>
                  {getPeriodSelectComponent('workno-period', selectedPeriod, setSelectedPeriod)}
                </div>
                {isLoadingData ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : workNoData.length === 0 ? (
                  <p className="text-center py-10 text-gray-500 dark:text-gray-400">{language === 'ja' ? 'データがありません' : 'No data'}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className={tableStyles.table}>
                      <thead className={tableStyles.thead}>
                        <tr>
                          <th className={tableStyles.th}>{language === 'ja' ? '工事番号' : 'Work No.'}</th>
                          <th className={tableStyles.th}>{language === 'ja' ? 'ステータス' : 'Status'}</th>
                          <th className={tableStyles.th}>{language === 'ja' ? 'プロジェクト名' : 'Project'}</th>
                          <th className={tableStyles.th}>{language === 'ja' ? '受注日' : 'Order Date'}</th>
                        </tr>
                      </thead>
                      <tbody className={tableStyles.tbody}>
                        {workNoData.map((record) => {
                          if (!record?.$id) return null;
                          return (
                            <tr key={record.$id.value} className={tableStyles.tr}>
                              <td className={tableStyles.td}>
                                <TransitionLink
                                  href={`/${locale}/workno/${record.WorkNo?.value}`}
                                  className="font-medium text-brand-500 hover:text-brand-600"
                                >
                                  {record.WorkNo?.value || '-'}
                                </TransitionLink>
                              </td>
                              <td className={tableStyles.td}>
                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(record.Status?.value || '')}`}>
                                  {getStatusLabel(record.Status?.value || '', language)}
                                </span>
                              </td>
                              <td className={tableStyles.td}>{record.文字列__1行__2?.value || '-'}</td>
                              <td className={tableStyles.td}>{formatDate(record.日付_6?.value)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Quotation Tab */}
            {activeTab === 'quotation' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-base font-medium text-gray-800 dark:text-white/90">
                    {language === 'ja' ? '関連する見積' : 'Related Quotations'}
                  </h4>
                  {getPeriodSelectComponent('quote-period', selectedQuotePeriod, setSelectedQuotePeriod)}
                </div>
                {isLoadingData ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : quotationData.length === 0 ? (
                  <p className="text-center py-10 text-gray-500 dark:text-gray-400">{language === 'ja' ? 'データがありません' : 'No data'}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className={tableStyles.table}>
                      <thead className={tableStyles.thead}>
                        <tr>
                          <th className={tableStyles.th}>{language === 'ja' ? '見積番号' : 'Quote No.'}</th>
                          <th className={tableStyles.th}>{language === 'ja' ? '工事番号' : 'Work No.'}</th>
                          <th className={tableStyles.th}>{language === 'ja' ? 'ステータス' : 'Status'}</th>
                          <th className={tableStyles.th}>{language === 'ja' ? '件名' : 'Subject'}</th>
                          <th className={`${tableStyles.th} text-right`}>{language === 'ja' ? '金額' : 'Amount'}</th>
                          <th className={tableStyles.th}>{language === 'ja' ? '提出日' : 'Date'}</th>
                        </tr>
                      </thead>
                      <tbody className={tableStyles.tbody}>
                        {quotationData.map((record) => {
                          const status = record.ドロップダウン?.value || '';
                          return (
                            <tr key={record.$id.value} className={tableStyles.tr}>
                              <td className={tableStyles.td}>
                                <TransitionLink
                                  href={`/${locale}/quotations/${record.$id.value}`}
                                  className="font-medium text-brand-500 hover:text-brand-600"
                                >
                                  {record.qtno2?.value || '-'}
                                </TransitionLink>
                              </td>
                              <td className={tableStyles.td}>
                                {record.Text_0?.value ? (
                                  <TransitionLink href={`/${locale}/workno/${record.Text_0.value}`} className="text-brand-500 hover:text-brand-600">
                                    {record.Text_0.value}
                                  </TransitionLink>
                                ) : '-'}
                              </td>
                              <td className={tableStyles.td}>
                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(status)}`}>
                                  {getStatusLabel(status, language)}
                                </span>
                              </td>
                              <td className={tableStyles.td}>{record.文字列__1行__4?.value || '-'}</td>
                              <td className={`${tableStyles.td} text-right font-medium`}>
                                {record.grand_total?.value ? formatNumber(record.grand_total.value) : '-'}
                              </td>
                              <td className={tableStyles.td}>{formatDate(record.日付?.value)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* PO Tab */}
            {activeTab === 'po' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-base font-medium text-gray-800 dark:text-white/90">
                    {language === 'ja' ? '関連するPO' : 'Related POs'}
                  </h4>
                  {getPeriodSelectComponent('po-period', selectedPOPeriod, setSelectedPOPeriod)}
                </div>
                {isLoadingData ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : poData.length === 0 ? (
                  <p className="text-center py-10 text-gray-500 dark:text-gray-400">{language === 'ja' ? 'データがありません' : 'No data'}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className={tableStyles.table}>
                      <thead className={tableStyles.thead}>
                        <tr>
                          <th className={tableStyles.th}>Date</th>
                          <th className={tableStyles.th}>Work No.</th>
                          <th className={tableStyles.th}>PO No.</th>
                          <th className={`${tableStyles.th} text-right`}>Amount</th>
                        </tr>
                      </thead>
                      <tbody className={tableStyles.tbody}>
                        {poData.map((record) => (
                          <tr key={record.$id.value} className={tableStyles.tr}>
                            <td className={tableStyles.td}>{formatDate(record.日付?.value)}</td>
                            <td className={tableStyles.td}>
                              <TransitionLink href={`/${locale}/workno/${record.文字列__1行__2?.value}`} className="text-brand-500 hover:text-brand-600">
                                {record.文字列__1行__2?.value || '-'}
                              </TransitionLink>
                            </td>
                            <td className={tableStyles.td}>
                              <TransitionLink href={`/${locale}/order-management/${record.$id.value}`} className="font-medium text-brand-500 hover:text-brand-600">
                                {record.文字列__1行_?.value || '-'}
                              </TransitionLink>
                            </td>
                            <td className={`${tableStyles.td} text-right font-medium`}>{record.amount?.value ? formatNumber(record.amount.value) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Invoice Tab */}
            {activeTab === 'invoice' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-base font-medium text-gray-800 dark:text-white/90">
                    {language === 'ja' ? '請求書一覧' : 'Invoice List'}
                  </h4>
                  {getPeriodSelectComponent('invoice-period', selectedInvoicePeriod, setSelectedInvoicePeriod)}
                </div>
                {isLoadingData ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : invoiceData.length === 0 ? (
                  <p className="text-center py-10 text-gray-500 dark:text-gray-400">{language === 'ja' ? 'データがありません' : 'No data'}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className={tableStyles.table}>
                      <thead className={tableStyles.thead}>
                        <tr>
                          <th className={tableStyles.th}>{language === 'ja' ? '工事番号' : 'Work No.'}</th>
                          <th className={tableStyles.th}>{language === 'ja' ? '請求書番号' : 'Invoice No.'}</th>
                          <th className={tableStyles.th}>{language === 'ja' ? '請求日' : 'Date'}</th>
                          <th className={`${tableStyles.th} text-right`}>{language === 'ja' ? '総額' : 'Total'}</th>
                        </tr>
                      </thead>
                      <tbody className={tableStyles.tbody}>
                        {invoiceData.map((record) => (
                          <tr key={record.$id.value} className={tableStyles.tr}>
                            <td className={tableStyles.td}>
                              {record.文字列__1行_?.value ? (
                                <TransitionLink href={`/${locale}/workno/${record.文字列__1行_.value}`} className="text-brand-500 hover:text-brand-600">
                                  {record.文字列__1行_.value}
                                </TransitionLink>
                              ) : '-'}
                            </td>
                            <td className={tableStyles.td}>
                              <TransitionLink href={`/${locale}/invoices/${record.$id.value}`} className="font-medium text-brand-500 hover:text-brand-600">
                                {record.文字列__1行__0?.value || '-'}
                              </TransitionLink>
                            </td>
                            <td className={tableStyles.td}>{formatDate(record.日付?.value)}</td>
                            <td className={`${tableStyles.td} text-right font-medium`}>{formatNumber(record.計算?.value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Machine Tab */}
            {activeTab === 'machine' && (
              <div>
                <h4 className="text-base font-medium text-gray-800 dark:text-white/90 mb-4">
                  {language === 'ja' ? '保有機械一覧' : 'Machine List'}
                </h4>
                {machineRecords.length === 0 ? (
                  <p className="text-center py-10 text-gray-500 dark:text-gray-400">{language === 'ja' ? 'データがありません' : 'No data'}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className={tableStyles.table}>
                      <thead className={tableStyles.thead}>
                        <tr>
                          <th className={tableStyles.th}>{language === 'ja' ? '機械名' : 'Machine'}</th>
                          <th className={tableStyles.th}>{language === 'ja' ? 'メーカー' : 'Maker'}</th>
                          <th className={tableStyles.th}>{language === 'ja' ? 'モデル' : 'Model'}</th>
                          <th className={tableStyles.th}>M/C No</th>
                        </tr>
                      </thead>
                      <tbody className={tableStyles.tbody}>
                        {machineRecords.map((record) => (
                          <tr key={record.$id.value} className={tableStyles.tr}>
                            <td className={tableStyles.td}>
                              <TransitionLink href={`/${locale}/machines/${record.$id.value}`} className="font-medium text-brand-500 hover:text-brand-600">
                                {record.McItem?.value || '-'}
                              </TransitionLink>
                            </td>
                            <td className={tableStyles.td}>{record.Vender?.value || '-'}</td>
                            <td className={tableStyles.td}>{record.Moldel?.value || '-'}</td>
                            <td className={tableStyles.td}>{record.MCNo?.value || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Staff Tab */}
            {activeTab === 'staff' && (
              <div>
                <h4 className="text-base font-medium text-gray-800 dark:text-white/90 mb-4">
                  {language === 'ja' ? '顧客担当者一覧' : 'Customer Contacts'}
                </h4>
                {customerStaffRecords.length === 0 ? (
                  <p className="text-center py-10 text-gray-500 dark:text-gray-400">{language === 'ja' ? 'データがありません' : 'No data'}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className={tableStyles.table}>
                      <thead className={tableStyles.thead}>
                        <tr>
                          <th className={tableStyles.th}>{language === 'ja' ? '担当者名' : 'Name'}</th>
                          <th className={tableStyles.th}>{language === 'ja' ? '部署' : 'Dept'}</th>
                          <th className={tableStyles.th}>{language === 'ja' ? '役職' : 'Position'}</th>
                          <th className={tableStyles.th}>{language === 'ja' ? 'メール' : 'Email'}</th>
                          <th className={tableStyles.th}>{language === 'ja' ? '電話' : 'Phone'}</th>
                        </tr>
                      </thead>
                      <tbody className={tableStyles.tbody}>
                        {customerStaffRecords.map((record) => (
                          <tr key={record.$id.value} className={tableStyles.tr}>
                            <td className={tableStyles.td}>
                              <span className="font-medium text-gray-800 dark:text-white/90">
                                {record.Name?.value || record.担当者名?.value || '-'}
                              </span>
                            </td>
                            <td className={tableStyles.td}>{record.Department?.value || record.Divison?.value || '-'}</td>
                            <td className={tableStyles.td}>{record.Position?.value || '-'}</td>
                            <td className={tableStyles.td}>
                              {(record.Email?.value || record.メールアドレス?.value) ? (
                                <a href={`mailto:${record.Email?.value || record.メールアドレス?.value}`} className="text-brand-500 hover:text-brand-600">
                                  {record.Email?.value || record.メールアドレス?.value}
                                </a>
                              ) : '-'}
                            </td>
                            <td className={tableStyles.td}>
                              {(record.Telephone?.value || record.TEL?.value) ? (
                                <a href={`tel:${record.Telephone?.value || record.TEL?.value}`} className="text-brand-500 hover:text-brand-600">
                                  {record.Telephone?.value || record.TEL?.value}
                                </a>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
