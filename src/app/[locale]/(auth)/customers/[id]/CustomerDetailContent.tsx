'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Language } from '@/lib/kintone/field-mappings';
import SalesChart from '@/components/charts/SalesChart';
import { tableStyles } from '@/components/ui/TableStyles';
import { detailStyles } from '@/components/ui/DetailStyles';
import { DetailPageHeader } from '@/components/ui/DetailPageHeader';
import Tabs, { TabPanel } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { Pencil, FileText, ClipboardList, ShoppingCart, Wrench, Users } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { FiscalPeriodSelect } from '@/components/ui/FiscalPeriodSelect';
import type {
  SupabaseCustomer,
  SupabaseWorkOrder,
  SupabaseInvoice,
  SupabaseMachine,
  SupabaseCustomerStaff,
  SupabasePORecord,
  SupabaseQuoteRequest,
} from './page';

interface CustomerDetailContentProps {
  locale: string;
  language: Language;
  customer: SupabaseCustomer;
  workOrders: SupabaseWorkOrder[];
  invoices: SupabaseInvoice[];
  poRecords: SupabasePORecord[];
  machines: SupabaseMachine[];
  customerStaff: SupabaseCustomerStaff[];
  quoteRequests: SupabaseQuoteRequest[];
  allWorkOrders?: SupabaseWorkOrder[];
  allInvoices?: SupabaseInvoice[];
  allQuoteRequests?: SupabaseQuoteRequest[];
}

export function CustomerDetailContent({
  locale,
  language,
  customer,
  workOrders = [],
  invoices = [],
  poRecords = [],
  machines = [],
  customerStaff = [],
  quoteRequests = [],
  allWorkOrders = [],
  allInvoices = [],
  allQuoteRequests = [],
}: CustomerDetailContentProps) {
  const [activeTab, setActiveTab] = useState('workno');
  const currentPeriod = '14';
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);
  const [selectedQuotePeriod, setSelectedQuotePeriod] = useState(currentPeriod);
  const [selectedPOPeriod, setSelectedPOPeriod] = useState(currentPeriod);
  const [selectedInvoicePeriod, setSelectedInvoicePeriod] = useState(currentPeriod);

  const [workNoData, setWorkNoData] = useState(workOrders);
  const [quoteRequestData, setQuoteRequestData] = useState(quoteRequests);
  const [poData, setPOData] = useState(poRecords);
  const [invoiceData, setInvoiceData] = useState(invoices);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [lastFetchedWorkNoPeriod, setLastFetchedWorkNoPeriod] = useState(currentPeriod);
  const [lastFetchedQuotePeriod, setLastFetchedQuotePeriod] = useState(currentPeriod);
  const [lastFetchedPOPeriod, setLastFetchedPOPeriod] = useState(currentPeriod);
  const [lastFetchedInvoicePeriod, setLastFetchedInvoicePeriod] = useState(currentPeriod);

  const workNoPagination = usePagination(workNoData);
  const quoteRequestPagination = usePagination(quoteRequestData);
  const poPagination = usePagination(poData);
  const invoicePagination = usePagination(invoiceData);
  const machinePagination = usePagination(machines);
  const staffPagination = usePagination(customerStaff);

  const iconClass = 'w-4 h-4';

  const tabs = [
    { key: 'workno', label: language === 'ja' ? '工事番号一覧' : 'Work No.', badge: workNoData.length, icon: <FileText className={iconClass} /> },
    { key: 'quotation', label: language === 'ja' ? '見積依頼一覧' : 'Quote Requests', badge: quoteRequestData.length, icon: <ClipboardList className={iconClass} /> },
    { key: 'po', label: language === 'ja' ? 'PO一覧' : 'PO List', badge: poData.length, icon: <ShoppingCart className={iconClass} /> },
    { key: 'invoice', label: language === 'ja' ? '請求書一覧' : 'Invoices', badge: invoiceData.length, icon: <FileText className={iconClass} /> },
    { key: 'machine', label: language === 'ja' ? '保有機械一覧' : 'Machines', badge: machines.length, icon: <Wrench className={iconClass} /> },
    { key: 'staff', label: language === 'ja' ? '顧客担当者一覧' : 'Contacts', badge: customerStaff.length, icon: <Users className={iconClass} /> },
  ];

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '-';
    return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'B';
  };

  useEffect(() => {
    const fetchData = async () => {
      const customerId = customer.customer_id;

      if (activeTab === 'workno' && selectedPeriod !== lastFetchedWorkNoPeriod) {
        setIsLoadingData(true);
        try {
          const response = await fetch(`/api/customer/${customerId}/data?period=${selectedPeriod}&type=workno`);
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
          const response = await fetch(`/api/customer/${customerId}/data?period=${selectedQuotePeriod}&type=quotation`);
          if (response.ok) {
            const data = await response.json();
            setQuoteRequestData(data);
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
          const response = await fetch(`/api/customer/${customerId}/data?period=${selectedPOPeriod}&type=po`);
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
          const response = await fetch(`/api/customer/${customerId}/data?period=${selectedInvoicePeriod}&type=invoice`);
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
  }, [activeTab, selectedPeriod, selectedQuotePeriod, selectedPOPeriod, selectedInvoicePeriod, customer.customer_id, lastFetchedWorkNoPeriod, lastFetchedQuotePeriod, lastFetchedPOPeriod, lastFetchedInvoicePeriod]);

  const getWorkOrderStatusColor = (status: string) => {
    switch (status) {
      case '完了': case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400';
      case '進行中': case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400';
      case '見積中': case 'Quoting': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-500/15 dark:text-gray-400';
    }
  };

  const getQuoteStatusLabel = (status: { code: string; name: string } | null) => {
    if (!status) return '-';
    if (language === 'ja') return status.name;
    return status.code;
  };

  const getQuoteStatusColor = (code: string) => {
    switch (code) {
      case 'quoted': return 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400';
      case 'quoting': case 'requested': return 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400';
      case 'order_requested': case 'po_issued': return 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-400';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-500/15 dark:text-gray-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-500/15 dark:text-gray-400';
    }
  };

  const TabHeader = ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <div className="flex justify-between items-center mb-4">
      <h4 className="text-base font-medium text-gray-800 dark:text-white/90">{title}</h4>
      {children}
    </div>
  );

  return (
    <div className={detailStyles.pageWrapper}>
      {/* Header */}
      <DetailPageHeader
        backHref={`/${locale}/customers`}
        title={[
          customer.company_name,
          customer.customer_id,
          customer.country,
        ].filter(Boolean).join(' - ')}
        statusBadge={customer.customer_rank ? (
          <span className={`${detailStyles.badge} ${
            customer.customer_rank === 'VIP'
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-400'
              : customer.customer_rank === 'A'
              ? detailStyles.badgeSuccess
              : customer.customer_rank === 'B'
              ? detailStyles.badgeInfo
              : detailStyles.badgeDefault
          }`}>
            Rank: {customer.customer_rank}
          </span>
        ) : undefined}
        actions={
          <Link
            href={`/${locale}/customers/${customer.customer_id}/edit`}
            className={detailStyles.secondaryButton}
          >
            <Pencil size={16} className="mr-1.5" />
            {language === 'ja' ? '編集' : 'Edit'}
          </Link>
        }
      />

      {/* Customer Information Card */}
      <div className={detailStyles.card}>
        <div className={detailStyles.cardHeaderWithBg}>
          <h3 className={detailStyles.cardTitle}>
            {language === 'ja' ? '顧客情報' : language === 'th' ? 'ข้อมูลลูกค้า' : 'Customer Information'}
          </h3>
        </div>
        <div className={`${detailStyles.cardContent} ${detailStyles.grid3}`}>
          <div>
            <label className={detailStyles.fieldLabel}>{language === 'ja' ? '住所' : 'Address'}</label>
            <p className={`mt-1 ${detailStyles.fieldValue}`}>{customer.address || '-'}</p>
          </div>
          <div>
            <label className={detailStyles.fieldLabel}>{language === 'ja' ? '郵便番号' : 'Postal Code'}</label>
            <p className={`mt-1 ${detailStyles.fieldValue}`}>{customer.postal_code || '-'}</p>
          </div>
          <div>
            <label className={detailStyles.fieldLabel}>TAX ID</label>
            <p className={`mt-1 ${detailStyles.fieldValue}`}>{customer.tax_id || '-'}</p>
          </div>
          <div>
            <label className={detailStyles.fieldLabel}>{language === 'ja' ? '電話番号' : 'Phone'}</label>
            {customer.phone_number ? (
              <a href={`tel:${customer.phone_number}`} className={`mt-1 block ${detailStyles.link}`}>
                {customer.phone_number}
              </a>
            ) : (
              <p className={`mt-1 ${detailStyles.fieldValue}`}>-</p>
            )}
          </div>
          <div>
            <label className={detailStyles.fieldLabel}>FAX</label>
            <p className={`mt-1 ${detailStyles.fieldValue}`}>{customer.fax_number || '-'}</p>
          </div>
          <div>
            <label className={detailStyles.fieldLabel}>{language === 'ja' ? '国' : 'Country'}</label>
            <p className={`mt-1 ${detailStyles.fieldValue}`}>{customer.country || '-'}</p>
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      {allInvoices && allInvoices.length > 0 && (
        <div className={detailStyles.card}>
          <div className={detailStyles.cardHeader}>
            <h3 className={detailStyles.cardTitle}>
              {language === 'ja' ? '売上推移' : language === 'th' ? 'แนวโน้มยอดขาย' : 'Sales Trend'}
            </h3>
          </div>
          <div className={detailStyles.cardContent}>
            <SalesChart
              invoices={allInvoices}
              workOrders={allWorkOrders}
              quoteRequests={allQuoteRequests}
              language={language}
            />
          </div>
        </div>
      )}

      {/* Tabs Section */}
      <div className={detailStyles.card}>
        <div className="overflow-x-auto">
          <Tabs
            variant="underline"
            size="lg"
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className="px-2"
            tabs={tabs}
          />
        </div>

        <div className="p-5">
          {/* Work No Tab */}
          <TabPanel value="workno" activeValue={activeTab}>
            <TabHeader title={language === 'ja' ? '関連する工事番号' : 'Related Work Numbers'}>
              <FiscalPeriodSelect value={selectedPeriod} onChange={setSelectedPeriod} locale={locale} />
            </TabHeader>
            {isLoadingData && activeTab === 'workno' ? <LoadingSpinner /> : workNoData.length === 0 ? <EmptyState locale={locale} /> : (
              <>
                <div className="overflow-x-auto">
                  <table className={tableStyles.table}>
                    <thead className={tableStyles.thead}>
                      <tr>
                        <th className={tableStyles.th}>{language === 'ja' ? '工事番号' : 'Work No.'}</th>
                        <th className={tableStyles.th}>{language === 'ja' ? 'ステータス' : 'Status'}</th>
                        <th className={tableStyles.th}>{language === 'ja' ? '説明' : 'Description'}</th>
                        <th className={tableStyles.th}>{language === 'ja' ? '開始日' : 'Start Date'}</th>
                      </tr>
                    </thead>
                    <tbody className={tableStyles.tbody}>
                      {workNoPagination.paginatedItems.map((record) => (
                        <tr key={record.id} className={tableStyles.tr}>
                          <td className={tableStyles.td}>
                            <Link href={`/${locale}/workno/${record.work_no}`} className={tableStyles.tdLink}>
                              {record.work_no}
                            </Link>
                          </td>
                          <td className={tableStyles.td}>
                            <span className={`${tableStyles.statusBadge} ${getWorkOrderStatusColor(record.status)}`}>
                              {record.status || '-'}
                            </span>
                          </td>
                          <td className={tableStyles.td}>{record.description || '-'}</td>
                          <td className={tableStyles.td}>{formatDate(record.start_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={workNoPagination.currentPage}
                  totalPages={workNoPagination.totalPages}
                  totalItems={workNoPagination.totalItems}
                  pageSize={workNoPagination.pageSize}
                  onPageChange={workNoPagination.goToPage}
                  locale={locale}
                />
              </>
            )}
          </TabPanel>

          {/* Quote Request Tab */}
          <TabPanel value="quotation" activeValue={activeTab}>
            <TabHeader title={language === 'ja' ? '関連する見積依頼' : 'Related Quote Requests'}>
              <FiscalPeriodSelect value={selectedQuotePeriod} onChange={setSelectedQuotePeriod} locale={locale} />
            </TabHeader>
            {isLoadingData && activeTab === 'quotation' ? <LoadingSpinner /> : quoteRequestData.length === 0 ? <EmptyState locale={locale} /> : (
              <>
                <div className="overflow-x-auto">
                  <table className={tableStyles.table}>
                    <thead className={tableStyles.thead}>
                      <tr>
                        <th className={tableStyles.th}>{language === 'ja' ? '依頼番号' : 'Request No.'}</th>
                        <th className={tableStyles.th}>{language === 'ja' ? '工事番号' : 'Work No.'}</th>
                        <th className={tableStyles.th}>{language === 'ja' ? 'ステータス' : 'Status'}</th>
                        <th className={tableStyles.th}>{language === 'ja' ? '依頼者' : 'Requester'}</th>
                        <th className={tableStyles.th}>{language === 'ja' ? '作成日' : 'Created'}</th>
                      </tr>
                    </thead>
                    <tbody className={tableStyles.tbody}>
                      {quoteRequestPagination.paginatedItems.map((record) => {
                        const statusCode = record.status?.code || '';
                        return (
                          <tr key={record.id} className={tableStyles.tr}>
                            <td className={tableStyles.td}>
                              <Link href={`/${locale}/quote-requests/${record.id}`} className={tableStyles.tdLink}>
                                {record.request_no}
                              </Link>
                            </td>
                            <td className={tableStyles.td}>
                              {record.work_no ? (
                                <Link href={`/${locale}/workno/${record.work_no}`} className={tableStyles.tdLink}>
                                  {record.work_no}
                                </Link>
                              ) : '-'}
                            </td>
                            <td className={tableStyles.td}>
                              <span className={`${tableStyles.statusBadge} ${getQuoteStatusColor(statusCode)}`}>
                                {getQuoteStatusLabel(record.status)}
                              </span>
                            </td>
                            <td className={tableStyles.td}>{record.requester_name || '-'}</td>
                            <td className={tableStyles.td}>{formatDate(record.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={quoteRequestPagination.currentPage}
                  totalPages={quoteRequestPagination.totalPages}
                  totalItems={quoteRequestPagination.totalItems}
                  pageSize={quoteRequestPagination.pageSize}
                  onPageChange={quoteRequestPagination.goToPage}
                  locale={locale}
                />
              </>
            )}
          </TabPanel>

          {/* PO Tab */}
          <TabPanel value="po" activeValue={activeTab}>
            <TabHeader title={language === 'ja' ? '関連するPO' : 'Related POs'}>
              <FiscalPeriodSelect value={selectedPOPeriod} onChange={setSelectedPOPeriod} locale={locale} />
            </TabHeader>
            {isLoadingData && activeTab === 'po' ? <LoadingSpinner /> : poData.length === 0 ? <EmptyState locale={locale} /> : (
              <>
                <div className="overflow-x-auto">
                  <table className={tableStyles.table}>
                    <thead className={tableStyles.thead}>
                      <tr>
                        <th className={tableStyles.th}>{language === 'ja' ? '日付' : 'Date'}</th>
                        <th className={tableStyles.th}>{language === 'ja' ? '工事番号' : 'Work No.'}</th>
                        <th className={tableStyles.th}>PO No.</th>
                        <th className={`${tableStyles.th} text-right`}>{language === 'ja' ? '金額' : 'Amount'}</th>
                      </tr>
                    </thead>
                    <tbody className={tableStyles.tbody}>
                      {poPagination.paginatedItems.map((record) => (
                        <tr key={record.id} className={tableStyles.tr}>
                          <td className={tableStyles.td}>{formatDate(record.po_date)}</td>
                          <td className={tableStyles.td}>
                            {record.work_no ? (
                              <Link href={`/${locale}/workno/${record.work_no}`} className={tableStyles.tdLink}>
                                {record.work_no}
                              </Link>
                            ) : '-'}
                          </td>
                          <td className={tableStyles.td}>{record.po_no || '-'}</td>
                          <td className={`${tableStyles.td} text-right font-medium`}>{formatCurrency(record.grand_total ? Number(record.grand_total) : null)}</td>
                        </tr>
                      ))}
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
                />
              </>
            )}
          </TabPanel>

          {/* Invoice Tab */}
          <TabPanel value="invoice" activeValue={activeTab}>
            <TabHeader title={language === 'ja' ? '請求書一覧' : 'Invoice List'}>
              <FiscalPeriodSelect value={selectedInvoicePeriod} onChange={setSelectedInvoicePeriod} locale={locale} />
            </TabHeader>
            {isLoadingData && activeTab === 'invoice' ? <LoadingSpinner /> : invoiceData.length === 0 ? <EmptyState locale={locale} /> : (
              <>
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
                      {invoicePagination.paginatedItems.map((record) => (
                        <tr key={record.id} className={tableStyles.tr}>
                          <td className={tableStyles.td}>
                            {record.work_no ? (
                              <Link href={`/${locale}/workno/${record.work_no}`} className={tableStyles.tdLink}>
                                {record.work_no}
                              </Link>
                            ) : '-'}
                          </td>
                          <td className={tableStyles.td}>{record.invoice_no || '-'}</td>
                          <td className={tableStyles.td}>{formatDate(record.invoice_date)}</td>
                          <td className={`${tableStyles.td} text-right font-medium`}>{formatCurrency(record.grand_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={invoicePagination.currentPage}
                  totalPages={invoicePagination.totalPages}
                  totalItems={invoicePagination.totalItems}
                  pageSize={invoicePagination.pageSize}
                  onPageChange={invoicePagination.goToPage}
                  locale={locale}
                />
              </>
            )}
          </TabPanel>

          {/* Machine Tab */}
          <TabPanel value="machine" activeValue={activeTab}>
            <TabHeader title={language === 'ja' ? '保有機械一覧' : 'Machine List'} />
            {machines.length === 0 ? <EmptyState locale={locale} /> : (
              <>
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
                      {machinePagination.paginatedItems.map((record) => (
                        <tr key={record.id} className={tableStyles.tr}>
                          <td className={tableStyles.td}>
                            <Link href={`/${locale}/machines/${record.id}`} className={tableStyles.tdLink}>
                              {record.machine_item || '-'}
                            </Link>
                          </td>
                          <td className={tableStyles.td}>{record.vendor || '-'}</td>
                          <td className={tableStyles.td}>{record.model || '-'}</td>
                          <td className={tableStyles.td}>{record.machine_number || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={machinePagination.currentPage}
                  totalPages={machinePagination.totalPages}
                  totalItems={machinePagination.totalItems}
                  pageSize={machinePagination.pageSize}
                  onPageChange={machinePagination.goToPage}
                  locale={locale}
                />
              </>
            )}
          </TabPanel>

          {/* Staff Tab */}
          <TabPanel value="staff" activeValue={activeTab}>
            <TabHeader title={language === 'ja' ? '顧客担当者一覧' : 'Customer Contacts'} />
            {customerStaff.length === 0 ? <EmptyState locale={locale} /> : (
              <>
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
                      {staffPagination.paginatedItems.map((record) => (
                        <tr key={record.id} className={tableStyles.tr}>
                          <td className={`${tableStyles.td} font-medium text-gray-800 dark:text-white/90`}>
                            {record.staff_name || '-'}
                          </td>
                          <td className={tableStyles.td}>{record.division || '-'}</td>
                          <td className={tableStyles.td}>{record.position || '-'}</td>
                          <td className={tableStyles.td}>
                            {record.email ? (
                              <a href={`mailto:${record.email}`} className={tableStyles.tdLink}>
                                {record.email}
                              </a>
                            ) : '-'}
                          </td>
                          <td className={tableStyles.td}>
                            {record.telephone ? (
                              <a href={`tel:${record.telephone}`} className={tableStyles.tdLink}>
                                {record.telephone}
                              </a>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={staffPagination.currentPage}
                  totalPages={staffPagination.totalPages}
                  totalItems={staffPagination.totalItems}
                  pageSize={staffPagination.pageSize}
                  onPageChange={staffPagination.goToPage}
                  locale={locale}
                />
              </>
            )}
          </TabPanel>
        </div>
      </div>
    </div>
  );
}
