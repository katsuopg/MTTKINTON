'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CustomerRecord, WorkNoRecord, QuotationRecord, MachineRecord, CustomerStaffRecord, InvoiceRecord } from '@/types/kintone';
import { OrderRecord } from '@/lib/kintone/order';
import { type Language, getStatusLabel } from '@/lib/kintone/field-mappings';
import TransitionLink from '@/components/ui/TransitionLink';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SalesChart from '@/components/charts/SalesChart';

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
}: CustomerDetailContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('workno');
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);
  const currentPeriod = '14'; // 現在の会計期間
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);
  const [selectedQuotePeriod, setSelectedQuotePeriod] = useState(currentPeriod);
  const [selectedPOPeriod, setSelectedPOPeriod] = useState(currentPeriod);
  const [selectedInvoicePeriod, setSelectedInvoicePeriod] = useState(currentPeriod);
  
  // データの状態管理
  const [workNoData, setWorkNoData] = useState(workNoRecords || []);
  const [quotationData, setQuotationData] = useState(quotationRecords || []);
  const [poData, setPOData] = useState(orderRecords || []);
  const [invoiceData, setInvoiceData] = useState(invoiceRecords || []);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // 前回取得した期間を記録
  const [lastFetchedWorkNoPeriod, setLastFetchedWorkNoPeriod] = useState(currentPeriod);
  const [lastFetchedQuotePeriod, setLastFetchedQuotePeriod] = useState(currentPeriod);
  const [lastFetchedPOPeriod, setLastFetchedPOPeriod] = useState(currentPeriod);
  const [lastFetchedInvoicePeriod, setLastFetchedInvoicePeriod] = useState(currentPeriod);

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

  // 日付フォーマット
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // 数値フォーマット
  const formatNumber = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) {
      return '-';
    }

    const stringValue = typeof value === 'number' ? value.toString() : value;

    // 数値のみを抽出（THBなどの通貨記号を除去）
    const numericValue = stringValue.replace(/[^\d.-]/g, '');
    const number = parseFloat(numericValue);
    if (isNaN(number)) return '-';
    return number.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'B';
  };

  // 会計期間を取得
  const getAllFiscalPeriods = () => {
    // 第8期から第14期まで
    return ['8', '9', '10', '11', '12', '13', '14'];
  };

  // 会計期間変更時の処理
  useEffect(() => {
    const fetchData = async () => {
      // 工事番号タブの処理
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

      // 見積タブの処理
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

      // POタブの処理
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

      // 請求書タブの処理
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

  // ページ遷移ハンドラ
  const handleNavigation = (path: string) => {
    setIsNavigating(true);
    startTransition(() => {
      router.push(path);
    });
  };

  const handleEdit = () => {
    handleNavigation(`/${locale}/customers/${customerRecord.$id.value}/edit`);
  };

  const handleBack = () => {
    handleNavigation(`/${locale}/customers`);
  };

  return (
    <DashboardLayout locale={locale} language={language}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            {customerRecord.文字列__1行_?.value} - {customerRecord.会社名?.value}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              disabled={isPending || isNavigating}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              {(isPending || isNavigating) && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {language === 'ja' ? '編集' : language === 'th' ? 'แก้ไข' : 'Edit'}
            </button>
            <button
              onClick={handleBack}
              disabled={isPending || isNavigating}
              className="px-4 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              {(isPending || isNavigating) && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {language === 'ja' ? '一覧へ戻る' : language === 'th' ? 'กลับไปที่รายการ' : 'Back to List'}
            </button>
          </div>
        </div>

        {/* ローディングオーバーレイ */}
        {isNavigating && (
          <div className="fixed inset-0 bg-slate-600 bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg flex items-center">
              <svg className="animate-spin h-8 w-8 text-indigo-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-slate-700">{language === 'ja' ? '読み込み中...' : language === 'th' ? 'กำลังโหลด...' : 'Loading...'}</span>
            </div>
          </div>
        )}

        {/* 基本情報（連絡先含む） */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-4 sm:px-6 bg-slate-50 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-slate-900">
              {language === 'ja' ? '基本情報' : language === 'th' ? 'ข้อมูลพื้นฐาน' : 'Basic Information'}
            </h3>
            <div className="text-xs text-slate-500 space-x-4">
              <span>
                {language === 'ja' ? '作成日' : language === 'th' ? 'วันที่สร้าง' : 'Created'}: {customerRecord.作成日時?.value ? new Date(customerRecord.作成日時.value).toLocaleDateString() : '-'}
              </span>
              <span>
                {language === 'ja' ? '更新日' : language === 'th' ? 'วันที่อัปเดต' : 'Updated'}: {customerRecord.更新日時?.value ? new Date(customerRecord.更新日時.value).toLocaleDateString() : '-'}
              </span>
            </div>
          </div>
          <div className="border-t border-slate-200 px-4 py-3">
            <div className="space-y-3">
              {/* 一段目：住所 国 郵便番号、ランク */}
              <div className="flex items-center space-x-8">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm text-slate-900">
                    {customerRecord.住所?.value || '-'} {customerRecord.文字列__1行__4?.value || ''} {customerRecord.郵便番号?.value || ''}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  {customerRecord.顧客ランク?.value ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      customerRecord.顧客ランク.value === 'VIP' 
                        ? 'bg-purple-100 text-purple-800'
                        : customerRecord.顧客ランク.value === 'A' 
                        ? 'bg-emerald-100 text-emerald-800'
                        : customerRecord.顧客ランク.value === 'B'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {customerRecord.顧客ランク.value}
                    </span>
                  ) : <span className="text-sm text-slate-900">-</span>}
                </div>
              </div>

              {/* 二段目：電話番号、FAX番号、TAX ID */}
              <div className="flex items-center space-x-8">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {customerRecord.TEL?.value ? (
                    <a href={`tel:${customerRecord.TEL.value}`} className="text-sm text-indigo-600 hover:text-indigo-500">
                      {customerRecord.TEL.value}
                    </a>
                  ) : <span className="text-sm text-slate-900">-</span>}
                </div>

                <div className="flex items-center">
                  <svg className="h-5 w-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  <span className="text-sm text-slate-900">{customerRecord.FAX?.value || '-'}</span>
                </div>

                <div className="flex items-center">
                  <svg className="h-5 w-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                  </svg>
                  <span className="text-sm text-slate-900">{customerRecord.文字列__1行__6?.value || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 売上グラフ */}
        {allInvoiceRecords && allInvoiceRecords.length > 0 && (
          <div className="mt-6 mb-8">
            <SalesChart 
              invoiceRecords={allInvoiceRecords} 
              workNoRecords={allWorkNoRecords}
              quotationRecords={allQuotationRecords}
              language={language} 
            />
          </div>
        )}

        {/* タブナビゲーション */}
        <div className="border-b border-slate-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('workno')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'workno'
                  ? 'text-indigo-600 border-indigo-600 bg-indigo-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <DocumentIcon className={`mr-3 h-5 w-5 inline-block ${activeTab === 'workno' ? 'text-indigo-600' : 'text-slate-400'}`} />
              {language === 'ja' ? '工事番号一覧' : language === 'th' ? 'รายการหมายเลขงาน' : 'Work No. List'}
              <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                activeTab === 'workno' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {workNoData.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('quotation')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'quotation'
                  ? 'text-indigo-600 border-indigo-600 bg-indigo-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <ClipboardIcon className={`mr-3 h-5 w-5 inline-block ${activeTab === 'quotation' ? 'text-indigo-600' : 'text-slate-400'}`} />
              {language === 'ja' ? '見積一覧' : language === 'th' ? 'รายการใบเสนอราคา' : 'Quotation List'}
              <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                activeTab === 'quotation' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {quotationData.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('po')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'po'
                  ? 'text-indigo-600 border-indigo-600 bg-indigo-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <ShoppingCartIcon className={`mr-3 h-5 w-5 inline-block ${activeTab === 'po' ? 'text-indigo-600' : 'text-slate-400'}`} />
              {language === 'ja' ? 'PO一覧' : language === 'th' ? 'รายการใบสั่งซื้อ' : 'PO List'}
              <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                activeTab === 'po' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'
              }`}>
                {poData.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('invoice')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invoice'
                  ? 'text-indigo-600 border-indigo-600 bg-indigo-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <DocumentIcon className={`mr-3 h-5 w-5 inline-block ${activeTab === 'invoice' ? 'text-indigo-600' : 'text-slate-400'}`} />
              {language === 'ja' ? '請求書一覧' : language === 'th' ? 'รายการใบแจ้งหนี้' : 'Invoice List'}
              <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                activeTab === 'invoice' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'
              }`}>
                {invoiceData.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('machine')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'machine'
                  ? 'text-indigo-600 border-indigo-600 bg-indigo-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <CogIcon className={`mr-3 h-5 w-5 inline-block ${activeTab === 'machine' ? 'text-indigo-600' : 'text-slate-400'}`} />
              {language === 'ja' ? '保有機械一覧' : language === 'th' ? 'รายการเครื่องจักร' : 'Machine List'}
              <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                activeTab === 'machine' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-800'
              }`}>
                {machineRecords.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'staff'
                  ? 'text-indigo-600 border-indigo-600 bg-indigo-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <UserIcon className={`mr-3 h-5 w-5 inline-block ${activeTab === 'staff' ? 'text-indigo-600' : 'text-slate-400'}`} />
              {language === 'ja' ? '顧客担当者一覧' : language === 'th' ? 'รายชื่อผู้ติดต่อ' : 'Customer Staff List'}
              <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                activeTab === 'staff' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {customerStaffRecords.length}
              </span>
            </button>
          </nav>
        </div>

        {/* タブコンテンツ */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {activeTab === 'workno' && (
            <div className="px-2 py-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-slate-900">
                  {language === 'ja' ? '関連する工事番号' : language === 'th' ? 'เลขที่งานที่เกี่ยวข้อง' : 'Related Work Numbers'}
                </h3>
                <div className="flex items-center space-x-2">
                  <label htmlFor="workno-period" className="text-sm font-medium text-slate-700">
                    {language === 'ja' ? '会計期間:' : language === 'th' ? 'ปีบัญชี:' : 'Fiscal Year:'}
                  </label>
                  <select
                    id="workno-period"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {getAllFiscalPeriods().map(period => (
                      <option key={period} value={period}>
                        {language === 'ja' ? `第${period}期` : language === 'th' ? `ช่วงเวลาที่ ${period}` : `Period ${period}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {isLoadingData ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-slate-600">{language === 'ja' ? '読み込み中...' : language === 'th' ? 'กำลังโหลด...' : 'Loading...'}</span>
                </div>
              ) : workNoData.length === 0 ? (
                <p className="text-slate-500">{language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="divide-y divide-slate-200 w-auto">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '工事番号' : language === 'th' ? 'เลขที่งาน' : 'Work No.'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? 'プロジェクト名' : language === 'th' ? 'ชื่อโครงการ' : 'Project Name'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '受注日' : language === 'th' ? 'วันที่รับคำสั่งซื้อ' : 'Order Date'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {workNoData.map((record, index) => {
                        if (!record || !record.$id) return null;
                        const workNoValue = record.WorkNo?.value || '';
                        
                        // デバッグログを最初のレコードだけ出力
                        if (index === 0) {
                          console.log('=== 工事番号レコード確認 ===');
                          console.log('record:', record);
                          console.log('WorkNo:', record.WorkNo?.value);
                          console.log('status:', record.Status?.value);
                          console.log('description:', record.文字列__1行__2?.value);
                          console.log('date:', record.日付_6?.value);
                        }
                        
                        return (
                          <tr key={record.$id.value} className="hover:bg-slate-50">
                            <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm">
                              {workNoValue ? (
                                <TransitionLink
                                  href={`/${locale}/workno/${workNoValue}`}
                                  className="text-indigo-600 hover:text-indigo-900 font-medium"
                                >
                                  {workNoValue}
                                </TransitionLink>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                record.Status?.value === 'Active' || record.Status?.value === 'Working' || record.Status?.value === 'working'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : record.Status?.value === 'Finished' || record.Status?.value === 'finished' || record.Status?.value === '完了'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : record.Status?.value === 'Cancelled' || record.Status?.value === 'Cancel' || record.Status?.value === 'cancel'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}>
                                {getStatusLabel(record.Status?.value || '', language)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-sm text-slate-900">
                              {record.文字列__1行__2?.value || '-'}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900">
                              {formatDate(record.日付_6?.value)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                )}
            </div>
          )}

          {activeTab === 'quotation' && (
            <div className="px-2 py-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-slate-900">
                  {language === 'ja' ? '関連する見積' : language === 'th' ? 'ใบเสนอราคาที่เกี่ยวข้อง' : 'Related Quotations'}
                </h3>
                <div className="flex items-center space-x-2">
                  <label htmlFor="quote-period" className="text-sm font-medium text-slate-700">
                    {language === 'ja' ? '会計期間:' : language === 'th' ? 'ปีบัญชี:' : 'Fiscal Year:'}
                  </label>
                  <select
                    id="quote-period"
                    value={selectedQuotePeriod}
                    onChange={(e) => setSelectedQuotePeriod(e.target.value)}
                    className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {getAllFiscalPeriods().map(period => (
                      <option key={period} value={period}>
                        {language === 'ja' ? `第${period}期` : language === 'th' ? `ช่วงเวลาที่ ${period}` : `Period ${period}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {isLoadingData ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-slate-600">{language === 'ja' ? '読み込み中...' : language === 'th' ? 'กำลังโหลด...' : 'Loading...'}</span>
                </div>
              ) : quotationData.length === 0 ? (
                <p className="text-slate-500">{language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="divide-y divide-slate-200 w-auto">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '見積番号' : language === 'th' ? 'เลขที่ใบเสนอราคา' : 'Quotation No.'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '工事番号' : language === 'th' ? 'เลขที่งาน' : 'Work No.'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '発注先' : language === 'th' ? 'ผู้ค้า' : 'Supplier'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '件名' : language === 'th' ? 'ชื่องาน' : 'Subject'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          M/C ITEM
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Model
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '金額' : language === 'th' ? 'จำนวนเงิน' : 'Amount'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '提出日' : language === 'th' ? 'วันที่ส่ง' : 'Submit Date'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {quotationData.map((record, index) => {
                        const status = record.ドロップダウン?.value || '';
                        
                        const isCompleted = status === 'Finished' || status === '完了' || status === 'Completed' || status === 'Accepted';
                        const isCancelled = status === 'Cancel' || status === 'キャンセル' || status === 'Cancelled' || status === 'Rejected';
                        const isWaitingPO = status === 'PO待ち' || status === 'Waiting PO' || status === 'Wating PO' || status === 'PO';
                        const isSent = status === 'Sent' || status === '送付済' || status === 'Submitted';
                        
                        // 最初のレコードだけ金額フィールドを詳細にログ出力
                        if (index === 0) {
                          console.log('=== 見積レコードの金額フィールド確認 ===');
                          console.log('grand_total:', record.grand_total);
                          console.log('Sub_total:', record.Sub_total);
                          console.log('Discount:', record.Discount);
                          
                          // 全フィールドから金額っぽいものを探す
                          Object.keys(record).forEach(key => {
                            const value = (record as any)[key];
                            if (value && typeof value === 'object' && 'value' in value) {
                              const strValue = String(value.value);
                              // 数値っぽい値を持つフィールドを探す
                              if (strValue && /^\d+(\.\d+)?$/.test(strValue) && parseFloat(strValue) > 1000) {
                                console.log(`${key}: ${strValue} (type: ${value.type})`);
                              }
                            }
                          });
                        }
                        
                        return (
                          <tr 
                            key={record.$id.value} 
                            className={`${
                              isCompleted 
                                ? 'bg-emerald-50 hover:bg-emerald-100' 
                                : isCancelled 
                                ? 'bg-slate-100 hover:bg-slate-200 opacity-60' 
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm">
                              <TransitionLink
                                href={`/${locale}/quotations/${record.$id.value}`}
                                className={`font-medium ${isCancelled ? 'text-slate-400 hover:text-slate-600' : 'text-indigo-600 hover:text-indigo-900'}`}
                              >
                                {record.qtno2?.value || '-'}
                              </TransitionLink>
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm">
                              {record.Text_0?.value ? (
                                <TransitionLink
                                  href={`/${locale}/workno/${record.Text_0.value}`}
                                  className={isCancelled ? 'text-slate-400 hover:text-slate-600' : 'text-indigo-600 hover:text-indigo-900'}
                                >
                                  {record.Text_0.value}
                                </TransitionLink>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                isCompleted
                                  ? 'bg-emerald-700 text-white'
                                  : isWaitingPO
                                  ? 'bg-orange-600 text-white'
                                  : isSent
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : isCancelled
                                  ? 'bg-slate-300 text-slate-700'
                                  : 'bg-slate-100 text-slate-800'
                              }`}>
                                {getStatusLabel(status, language)}
                              </span>
                            </td>
                            <td className={`px-2 py-2 text-sm ${isCancelled ? 'text-slate-400' : 'text-slate-900'}`}>
                              <div className="truncate" title={record.ドロップダウン_0?.value || ''}>
                                {record.ドロップダウン_0?.value || '-'}
                              </div>
                            </td>
                            <td className={`px-2 py-2 text-sm ${isCancelled ? 'text-slate-400' : 'text-slate-900'}`}>
                              <div className="truncate" title={record.文字列__1行__4?.value || ''}>
                                {record.文字列__1行__4?.value || '-'}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm">
                              {record.McItem?.value ? (
                                <TransitionLink
                                  href={`/${locale}/machines?mcitem=${encodeURIComponent(record.McItem.value)}`}
                                  className={isCancelled ? 'text-slate-400 hover:text-slate-600' : 'text-indigo-600 hover:text-indigo-900'}
                                >
                                  {record.McItem.value}
                                </TransitionLink>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </td>
                            <td className={`px-2 py-2 text-sm ${isCancelled ? 'text-slate-400' : 'text-slate-900'}`}>
                              <div className="truncate" title={record.文字列__1行__9?.value || ''}>
                                {record.文字列__1行__9?.value || '-'}
                              </div>
                            </td>
                            <td className={`px-2 py-2 whitespace-nowrap text-sm text-right ${isCancelled ? 'text-slate-400' : 'text-slate-900'}`}>
                              {(() => {
                                // grand_totalを試す
                                if (record.grand_total?.value) {
                                  return formatNumber(record.grand_total.value);
                                }
                                // Sub_totalとDiscountから計算
                                if (record.Sub_total?.value) {
                                  const subTotal = parseFloat(record.Sub_total.value.replace(/[^\d.-]/g, ''));
                                  const discount = record.Discount?.value ? parseFloat(record.Discount.value.replace(/[^\d.-]/g, '')) : 0;
                                  if (!isNaN(subTotal)) {
                                    const total = subTotal - discount;
                                    return total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'B';
                                  }
                                }
                                return '-';
                              })()}
                            </td>
                            <td className={`px-2 py-2 whitespace-nowrap text-sm ${isCancelled ? 'text-slate-400' : 'text-slate-900'}`}>
                              {formatDate(record.日付?.value)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                )}
            </div>
          )}

          {activeTab === 'po' && (
            <div className="px-2 py-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-slate-900">
                  {language === 'ja' ? '関連するPO' : language === 'th' ? 'ใบสั่งซื้อที่เกี่ยวข้อง' : 'Related Purchase Orders'}
                </h3>
                <div className="flex items-center space-x-2">
                  <label htmlFor="po-period" className="text-sm font-medium text-slate-700">
                    {language === 'ja' ? '会計期間:' : language === 'th' ? 'ปีบัญชี:' : 'Fiscal Year:'}
                  </label>
                  <select
                    id="po-period"
                    value={selectedPOPeriod}
                    onChange={(e) => setSelectedPOPeriod(e.target.value)}
                    className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {getAllFiscalPeriods().map(period => (
                      <option key={period} value={period}>
                        {language === 'ja' ? `第${period}期` : language === 'th' ? `ช่วงเวลาที่ ${period}` : `Period ${period}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {isLoadingData ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-slate-600">{language === 'ja' ? '読み込み中...' : language === 'th' ? 'กำลังโหลด...' : 'Loading...'}</span>
                </div>
              ) : poData.length === 0 ? (
                <p className="text-slate-500">{language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="divide-y divide-slate-200 w-auto">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          W.No.
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          PO.No.
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          QT NO.
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Before Discount
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Discount
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          After Discount
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          VAT
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          AMOUNT
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {poData.map((record) => (
                        <tr key={record.$id.value} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900">
                            {formatDate(record.日付?.value)}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm">
                            <TransitionLink
                              href={`/${locale}/workno/${record.文字列__1行__2?.value}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              {record.文字列__1行__2?.value || '-'}
                            </TransitionLink>
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm">
                            <TransitionLink
                              href={`/${locale}/order-management/${record.$id.value}`}
                              className="text-indigo-600 hover:text-indigo-900 font-medium"
                            >
                              {record.文字列__1行_?.value || '-'}
                            </TransitionLink>
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm">
                            <TransitionLink
                              href={`/${locale}/quotations/${record.ルックアップ?.value}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              {record.ルックアップ?.value || '-'}
                            </TransitionLink>
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900 text-right">
                            {record.数値_3?.value ? formatNumber(record.数値_3.value) : '-'}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900 text-right">
                            {record.数値_4?.value ? formatNumber(record.数値_4.value) : '-'}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900 text-right">
                            {record.AF?.value ? formatNumber(record.AF.value) : '-'}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900 text-right">
                            {record.vat?.value ? formatNumber(record.vat.value) : '-'}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900 text-right">
                            {record.amount?.value ? formatNumber(record.amount.value) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'machine' && (
            <div className="px-2 py-2">
              <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">
                {language === 'ja' ? '保有機械一覧' : language === 'th' ? 'รายการเครื่องจักรที่ครอบครอง' : 'Machine List'}
              </h3>
              {machineRecords.length === 0 ? (
                <p className="text-slate-500">{language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="divide-y divide-slate-200 w-auto">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '機械名' : language === 'th' ? 'ชื่อเครื่องจักร' : 'Machine Name'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? 'メーカー' : language === 'th' ? 'ผู้ผลิต' : 'Manufacturer'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? 'モデル' : language === 'th' ? 'รุ่น' : 'Model'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? 'M/C No' : language === 'th' ? 'หมายเลขเครื่อง' : 'M/C No'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                          QT
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                          WN
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {machineRecords.map((record) => (
                        <tr key={record.$id.value} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm">
                            <TransitionLink
                              href={`/${locale}/machines/${record.$id.value}`}
                              className="text-indigo-600 hover:text-indigo-900 font-medium"
                            >
                              {record.McItem?.value || '-'}
                            </TransitionLink>
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900">
                            {record.Vender?.value || '-'}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900">
                            {record.Moldel?.value || '-'}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900">
                            {record.MCNo?.value || '-'}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-center">
                            {record.Qt?.value ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {record.Qt.value}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-center">
                            {record.Wn?.value ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                {record.Wn.value}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="px-2 py-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-slate-900">
                  {language === 'ja' ? '請求書一覧' : language === 'th' ? 'รายการใบแจ้งหนี้' : 'Invoice List'}
                </h3>
                <div className="flex items-center space-x-2">
                  <label htmlFor="invoice-period" className="text-sm font-medium text-slate-700">
                    {language === 'ja' ? '会計期間:' : language === 'th' ? 'ปีบัญชี:' : 'Fiscal Year:'}
                  </label>
                  <select
                    id="invoice-period"
                    value={selectedInvoicePeriod}
                    onChange={(e) => setSelectedInvoicePeriod(e.target.value)}
                    className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {getAllFiscalPeriods().map(period => (
                      <option key={period} value={period}>
                        {language === 'ja' ? `第${period}期` : language === 'th' ? `ช่วงเวลาที่ ${period}` : `Period ${period}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {isLoadingData ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-slate-600">{language === 'ja' ? '読み込み中...' : language === 'th' ? 'กำลังโหลด...' : 'Loading...'}</span>
                </div>
              ) : invoiceData.length === 0 ? (
                <p className="text-slate-500">{language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="divide-y divide-slate-200 w-auto">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '工事番号' : language === 'th' ? 'หมายเลขงาน' : 'Work No.'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '請求書番号' : language === 'th' ? 'เลขที่ใบแจ้งหนี้' : 'Invoice No.'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '請求日' : language === 'th' ? 'วันที่แจ้งหนี้' : 'Invoice Date'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '合計' : language === 'th' ? 'ยอดรวม' : 'Total'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '割引' : language === 'th' ? 'ส่วนลด' : 'Discount'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '割引後' : language === 'th' ? 'หลังหักส่วนลด' : 'After Discount'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          VAT
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '総額' : language === 'th' ? 'ยอดรวมทั้งหมด' : 'Total Amount'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {invoiceData.map((record, index) => {
                        // デバッグ用：最初のレコードだけフィールドを出力
                        if (index === 0) {
                          console.log('=== 請求書レコードフィールド確認 ===');
                          console.log('record:', record);
                          console.log('文字列__1行_:', record.文字列__1行_?.value);
                          console.log('文字列__1行__0:', record.文字列__1行__0?.value);
                          console.log('日付:', record.日付?.value);
                        }
                        
                        return (
                        <tr key={record.$id.value} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm">
                            {record.文字列__1行_?.value ? (
                              <TransitionLink
                                href={`/${locale}/workno/${record.文字列__1行_.value}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                {record.文字列__1行_.value}
                              </TransitionLink>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm">
                            <TransitionLink
                              href={`/${locale}/invoices/${record.$id.value}`}
                              className="text-indigo-600 hover:text-indigo-900 font-medium"
                            >
                              {record.文字列__1行__0?.value || '-'}
                            </TransitionLink>
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900">
                            {formatDate(record.日付?.value)}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-right text-slate-900">
                            {formatNumber(record.total?.value) || '-'}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-right text-slate-900">
                            {formatNumber(record.discont?.value) || '0'}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-right text-slate-900">
                            {formatNumber(record.subtotal?.value) || '-'}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-right text-slate-900">
                            {formatNumber(record.vatprice?.value) || '-'}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-right font-medium text-slate-900">
                            {formatNumber(record.計算?.value) || '-'}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="px-2 py-2">
              <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">
                {language === 'ja' ? '顧客担当者一覧' : language === 'th' ? 'รายชื่อผู้ติดต่อของลูกค้า' : 'Customer Staff List'}
              </h3>
              {customerStaffRecords.length === 0 ? (
                <p className="text-slate-500">{language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="divide-y divide-slate-200 w-auto">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '担当者名' : language === 'th' ? 'ชื่อผู้ติดต่อ' : 'Staff Name'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '部署' : language === 'th' ? 'แผนก' : 'Department'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '役職' : language === 'th' ? 'ตำแหน่ง' : 'Position'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? 'メール' : language === 'th' ? 'อีเมล' : 'Email'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '電話' : language === 'th' ? 'โทรศัพท์' : 'Phone'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? 'モバイル' : language === 'th' ? 'มือถือ' : 'Mobile'}
                        </th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {language === 'ja' ? '緊急連絡先' : language === 'th' ? 'ติดต่อฉุกเฉิน' : 'Emergency'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {customerStaffRecords.map((record) => (
                        <tr key={record.$id.value} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm">
                            <TransitionLink
                              href={`/${locale}/customer-staff/${record.$id.value}`}
                              className="text-indigo-600 hover:text-indigo-900 font-medium"
                            >
                              {record.担当者名?.value || '-'}
                            </TransitionLink>
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900">
                            {record.Divison?.value || '-'}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900">
                            {record.Position?.value || '-'}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900">
                            {record.メールアドレス?.value ? (
                              <a href={`mailto:${record.メールアドレス.value}`} className="text-indigo-600 hover:text-indigo-500">
                                {record.メールアドレス.value}
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900">
                            {record.TEL?.value ? (
                              <a href={`tel:${record.TEL.value}`} className="text-indigo-600 hover:text-indigo-500">
                                {record.TEL.value}
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900">
                            {record.文字列__1行__7?.value ? (
                              <a href={`tel:${record.文字列__1行__7.value}`} className="text-indigo-600 hover:text-indigo-500">
                                {record.文字列__1行__7.value}
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 whitespace-nowrap text-sm text-slate-900">
                            -
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
    </DashboardLayout>
  );
}
