'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CustomerRecord, WorkNoRecord, QuotationRecord, MachineRecord, CustomerStaffRecord, InvoiceRecord } from '@/types/kintone';
import { OrderRecord } from '@/lib/kintone/order';
import { type Language, getStatusLabel } from '@/lib/kintone/field-mappings';
import SalesChart from '@/components/charts/SalesChart';
import { tableStyles } from '@/components/ui/TableStyles';
import { detailStyles } from '@/components/ui/DetailStyles';
import { DetailPageHeader } from '@/components/ui/DetailPageHeader';
import Tabs, { TabPanel } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { Pencil, FileText, ClipboardList, ShoppingCart, Wrench, Users } from 'lucide-react';
import { getStatusColor } from '@/lib/kintone/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { FiscalPeriodSelect } from '@/components/ui/FiscalPeriodSelect';

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
  const [activeTab, setActiveTab] = useState('workno');
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

  // Pagination for each tab
  const workNoPagination = usePagination(workNoData);
  const quotationPagination = usePagination(quotationData);
  const poPagination = usePagination(poData);
  const invoicePagination = usePagination(invoiceData);
  const machinePagination = usePagination(machineRecords);
  const staffPagination = usePagination(customerStaffRecords);

  const iconClass = 'w-4 h-4';

  const tabs = [
    { key: 'workno', label: language === 'ja' ? '工事番号一覧' : 'Work No.', badge: workNoData.length, icon: <FileText className={iconClass} /> },
    { key: 'quotation', label: language === 'ja' ? '見積一覧' : 'Quotations', badge: quotationData.length, icon: <ClipboardList className={iconClass} /> },
    { key: 'po', label: language === 'ja' ? 'PO一覧' : 'PO List', badge: poData.length, icon: <ShoppingCart className={iconClass} /> },
    { key: 'invoice', label: language === 'ja' ? '請求書一覧' : 'Invoices', badge: invoiceData.length, icon: <FileText className={iconClass} /> },
    { key: 'machine', label: language === 'ja' ? '保有機械一覧' : 'Machines', badge: machineRecords.length, icon: <Wrench className={iconClass} /> },
    { key: 'staff', label: language === 'ja' ? '顧客担当者一覧' : 'Contacts', badge: customerStaffRecords.length, icon: <Users className={iconClass} /> },
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

  const TabHeader = ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <div className="flex justify-between items-center mb-4">
      <h4 className="text-base font-medium text-gray-800 dark:text-white/90">{title}</h4>
      {children}
    </div>
  );

  return (
    <div className={detailStyles.pageWrapper}>
      {/* Header: 1行構成 [←] [Rank badge] [タイトル] ... [編集] */}
      <DetailPageHeader
        backHref={`/${locale}/customers`}
        title={[
          customerRecord.会社名?.value,
          customerRecord.文字列__1行_?.value,
          customerRecord.文字列__1行__4?.value,
        ].filter(Boolean).join(' - ')}
        statusBadge={customerRecord.顧客ランク?.value ? (
          <span className={`${detailStyles.badge} ${
            customerRecord.顧客ランク.value === 'VIP'
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-400'
              : customerRecord.顧客ランク.value === 'A'
              ? detailStyles.badgeSuccess
              : customerRecord.顧客ランク.value === 'B'
              ? detailStyles.badgeInfo
              : detailStyles.badgeDefault
          }`}>
            Rank: {customerRecord.顧客ランク.value}
          </span>
        ) : undefined}
        actions={
          <Link
            href={`/${locale}/customers/${customerRecord.$id.value}/edit`}
            className={detailStyles.secondaryButton}
          >
            <Pencil size={16} className="mr-1.5" />
            {language === 'ja' ? '編集' : 'Edit'}
          </Link>
        }
      />

      {/* Customer Information Card - 1枚に集約、3カラム */}
      <div className={detailStyles.card}>
        <div className={detailStyles.cardHeaderWithBg}>
          <h3 className={detailStyles.cardTitle}>
            {language === 'ja' ? '顧客情報' : language === 'th' ? 'ข้อมูลลูกค้า' : 'Customer Information'}
          </h3>
        </div>
        <div className={`${detailStyles.cardContent} ${detailStyles.grid3}`}>
          <div>
            <label className={detailStyles.fieldLabel}>{language === 'ja' ? '住所' : 'Address'}</label>
            <p className={`mt-1 ${detailStyles.fieldValue}`}>{customerRecord.住所?.value || '-'}</p>
          </div>
          <div>
            <label className={detailStyles.fieldLabel}>{language === 'ja' ? '郵便番号' : 'Postal Code'}</label>
            <p className={`mt-1 ${detailStyles.fieldValue}`}>{customerRecord.郵便番号?.value || '-'}</p>
          </div>
          <div>
            <label className={detailStyles.fieldLabel}>TAX ID</label>
            <p className={`mt-1 ${detailStyles.fieldValue}`}>{customerRecord.文字列__1行__6?.value || '-'}</p>
          </div>
          <div>
            <label className={detailStyles.fieldLabel}>{language === 'ja' ? '電話番号' : 'Phone'}</label>
            {customerRecord.TEL?.value ? (
              <a href={`tel:${customerRecord.TEL.value}`} className={`mt-1 block ${detailStyles.link}`}>
                {customerRecord.TEL.value}
              </a>
            ) : (
              <p className={`mt-1 ${detailStyles.fieldValue}`}>-</p>
            )}
          </div>
          <div>
            <label className={detailStyles.fieldLabel}>FAX</label>
            <p className={`mt-1 ${detailStyles.fieldValue}`}>{customerRecord.FAX?.value || '-'}</p>
          </div>
          <div>
            <label className={detailStyles.fieldLabel}>{language === 'ja' ? '国' : 'Country'}</label>
            <p className={`mt-1 ${detailStyles.fieldValue}`}>{customerRecord.文字列__1行__4?.value || '-'}</p>
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      {allInvoiceRecords && allInvoiceRecords.length > 0 && (
        <div className={detailStyles.card}>
          <div className={detailStyles.cardHeader}>
            <h3 className={detailStyles.cardTitle}>
              {language === 'ja' ? '売上推移' : language === 'th' ? 'แนวโน้มยอดขาย' : 'Sales Trend'}
            </h3>
          </div>
          <div className={detailStyles.cardContent}>
            <SalesChart
              invoiceRecords={allInvoiceRecords}
              workNoRecords={allWorkNoRecords}
              quotationRecords={allQuotationRecords}
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
                        <th className={tableStyles.th}>{language === 'ja' ? 'プロジェクト名' : 'Project'}</th>
                        <th className={tableStyles.th}>{language === 'ja' ? '受注日' : 'Order Date'}</th>
                      </tr>
                    </thead>
                    <tbody className={tableStyles.tbody}>
                      {workNoPagination.paginatedItems.map((record) => {
                        if (!record?.$id) return null;
                        return (
                          <tr key={record.$id.value} className={tableStyles.tr}>
                            <td className={tableStyles.td}>
                              <Link href={`/${locale}/workno/${record.WorkNo?.value}`} className={tableStyles.tdLink}>
                                {record.WorkNo?.value || '-'}
                              </Link>
                            </td>
                            <td className={tableStyles.td}>
                              <span className={`${tableStyles.statusBadge} ${getStatusColor(record.Status?.value || '')}`}>
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

          {/* Quotation Tab */}
          <TabPanel value="quotation" activeValue={activeTab}>
            <TabHeader title={language === 'ja' ? '関連する見積' : 'Related Quotations'}>
              <FiscalPeriodSelect value={selectedQuotePeriod} onChange={setSelectedQuotePeriod} locale={locale} />
            </TabHeader>
            {isLoadingData && activeTab === 'quotation' ? <LoadingSpinner /> : quotationData.length === 0 ? <EmptyState locale={locale} /> : (
              <>
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
                      {quotationPagination.paginatedItems.map((record) => {
                        const status = record.ドロップダウン?.value || '';
                        return (
                          <tr key={record.$id.value} className={tableStyles.tr}>
                            <td className={tableStyles.td}>
                              <Link href={`/${locale}/quotations/${record.$id.value}`} className={tableStyles.tdLink}>
                                {record.qtno2?.value || '-'}
                              </Link>
                            </td>
                            <td className={tableStyles.td}>
                              {record.Text_0?.value ? (
                                <Link href={`/${locale}/workno/${record.Text_0.value}`} className={tableStyles.tdLink}>
                                  {record.Text_0.value}
                                </Link>
                              ) : '-'}
                            </td>
                            <td className={tableStyles.td}>
                              <span className={`${tableStyles.statusBadge} ${getStatusColor(status)}`}>
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
                <Pagination
                  currentPage={quotationPagination.currentPage}
                  totalPages={quotationPagination.totalPages}
                  totalItems={quotationPagination.totalItems}
                  pageSize={quotationPagination.pageSize}
                  onPageChange={quotationPagination.goToPage}
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
                        <th className={tableStyles.th}>Date</th>
                        <th className={tableStyles.th}>Work No.</th>
                        <th className={tableStyles.th}>PO No.</th>
                        <th className={`${tableStyles.th} text-right`}>Amount</th>
                      </tr>
                    </thead>
                    <tbody className={tableStyles.tbody}>
                      {poPagination.paginatedItems.map((record) => (
                        <tr key={record.$id.value} className={tableStyles.tr}>
                          <td className={tableStyles.td}>{formatDate(record.日付?.value)}</td>
                          <td className={tableStyles.td}>
                            <Link href={`/${locale}/workno/${record.文字列__1行__2?.value}`} className={tableStyles.tdLink}>
                              {record.文字列__1行__2?.value || '-'}
                            </Link>
                          </td>
                          <td className={tableStyles.td}>
                            <Link href={`/${locale}/order-management/${record.$id.value}`} className={tableStyles.tdLink}>
                              {record.文字列__1行_?.value || '-'}
                            </Link>
                          </td>
                          <td className={`${tableStyles.td} text-right font-medium`}>{record.amount?.value ? formatNumber(record.amount.value) : '-'}</td>
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
                        <tr key={record.$id.value} className={tableStyles.tr}>
                          <td className={tableStyles.td}>
                            {record.文字列__1行_?.value ? (
                              <Link href={`/${locale}/workno/${record.文字列__1行_.value}`} className={tableStyles.tdLink}>
                                {record.文字列__1行_.value}
                              </Link>
                            ) : '-'}
                          </td>
                          <td className={tableStyles.td}>
                            <Link href={`/${locale}/invoices/${record.$id.value}`} className={tableStyles.tdLink}>
                              {record.文字列__1行__0?.value || '-'}
                            </Link>
                          </td>
                          <td className={tableStyles.td}>{formatDate(record.日付?.value)}</td>
                          <td className={`${tableStyles.td} text-right font-medium`}>{formatNumber(record.計算?.value)}</td>
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
            {machineRecords.length === 0 ? <EmptyState locale={locale} /> : (
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
                        <tr key={record.$id.value} className={tableStyles.tr}>
                          <td className={tableStyles.td}>
                            <Link href={`/${locale}/machines/${record.$id.value}`} className={tableStyles.tdLink}>
                              {record.McItem?.value || '-'}
                            </Link>
                          </td>
                          <td className={tableStyles.td}>{record.Vender?.value || '-'}</td>
                          <td className={tableStyles.td}>{record.Moldel?.value || '-'}</td>
                          <td className={tableStyles.td}>{record.MCNo?.value || '-'}</td>
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
            {customerStaffRecords.length === 0 ? <EmptyState locale={locale} /> : (
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
                        <tr key={record.$id.value} className={tableStyles.tr}>
                          <td className={`${tableStyles.td} font-medium text-gray-800 dark:text-white/90`}>
                            {record.Name?.value || record.担当者名?.value || '-'}
                          </td>
                          <td className={tableStyles.td}>{record.Department?.value || record.Divison?.value || '-'}</td>
                          <td className={tableStyles.td}>{record.Position?.value || '-'}</td>
                          <td className={tableStyles.td}>
                            {(record.Email?.value || record.メールアドレス?.value) ? (
                              <a href={`mailto:${record.Email?.value || record.メールアドレス?.value}`} className={tableStyles.tdLink}>
                                {record.Email?.value || record.メールアドレス?.value}
                              </a>
                            ) : '-'}
                          </td>
                          <td className={tableStyles.td}>
                            {(record.Telephone?.value || record.TEL?.value) ? (
                              <a href={`tel:${record.Telephone?.value || record.TEL?.value}`} className={tableStyles.tdLink}>
                                {record.Telephone?.value || record.TEL?.value}
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
