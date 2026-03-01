'use client';

import { useState, useMemo } from 'react';
import { getFieldLabel, getStatusLabel, type Language } from '@/lib/kintone/field-mappings';
import { getStatusColor } from '@/lib/kintone/utils';
import { tableStyles } from '@/components/ui/TableStyles';
import { extractCsName } from '@/lib/utils/customer-name';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import MonthlySalesChart from '@/components/charts/MonthlySalesChart';
import { FileText, ClipboardList, AlertTriangle, Filter, Package, ShoppingCart } from 'lucide-react';
import type { SupabaseDashboardWorkOrder, SupabaseDashboardInvoice } from './page';

interface DashboardContentProps {
  locale: string;
  workNoCount: number;
  projectCount: number;
  recentWorkNos: SupabaseDashboardWorkOrder[];
  fiscalYearWorkNos: SupabaseDashboardWorkOrder[];
  fiscalYearInvoices: SupabaseDashboardInvoice[];
}

// ステータスフィルターのタブ
const STATUS_TABS = [
  { key: 'all', labelJa: '全て', labelEn: 'All', labelTh: 'ทั้งหมด' },
  { key: 'Working', labelJa: '作業中', labelEn: 'Working', labelTh: 'กำลังทำงาน' },
  { key: 'Wating PO', labelJa: 'PO待ち', labelEn: 'Waiting PO', labelTh: 'รอ PO' },
  { key: 'Pending', labelJa: '保留', labelEn: 'Pending', labelTh: 'รอดำเนินการ' },
  { key: 'Stock', labelJa: '在庫', labelEn: 'Stock', labelTh: 'สต็อก' },
];

export default function DashboardContent({ locale, workNoCount, projectCount, recentWorkNos, fiscalYearWorkNos, fiscalYearInvoices }: DashboardContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  const [activeTab, setActiveTab] = useState('all');

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '未定';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    if (language === 'ja') {
      return dateString;
    } else {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  const formatNumber = (value: number | null | undefined) => {
    if (value == null) return '-';
    return value.toLocaleString();
  };

  // フィルタリングされたデータ
  const filteredWorkNos = useMemo(() => {
    if (activeTab === 'all') return recentWorkNos;
    return recentWorkNos.filter(record => record.status === activeTab);
  }, [recentWorkNos, activeTab]);

  const { paginatedItems: paginatedWorkNos, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredWorkNos);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const getTabLabel = (tab: typeof STATUS_TABS[0]) => {
    switch (language) {
      case 'ja': return tab.labelJa;
      case 'th': return tab.labelTh;
      default: return tab.labelEn;
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Chart (80%) + KPI Cards (20%) */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4 md:gap-6">
        {/* Monthly Sales Chart */}
        <div className="lg:w-3/4 min-w-0">
          <MonthlySalesChart workNos={fiscalYearWorkNos} invoices={fiscalYearInvoices} language={language} locale={locale} />
        </div>

        {/* KPI Cards - 縦積み */}
        <div className="lg:w-1/4 flex flex-col gap-4 md:gap-6">
          {/* Work No. Card */}
          <a
            href={`/${locale}/projects`}
            className="flex-1 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl dark:bg-gray-800 shrink-0">
                <FileText className="w-5 h-5 text-gray-800 dark:text-white/90" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {workNoCount}
                </h4>
                <p className="text-gray-500 text-theme-xs dark:text-gray-400 mt-0.5">
                  {language === 'ja' ? '実行中' : language === 'th' ? 'กำลังดำเนินการ' : 'WIP'} {getFieldLabel('WorkNo', language)}
                </p>
              </div>
            </div>
          </a>

          {/* Project Card */}
          <a
            href={`/${locale}/projects`}
            className="flex-1 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl dark:bg-gray-800 shrink-0">
                <ClipboardList className="w-5 h-5 text-gray-800 dark:text-white/90" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {projectCount}
                </h4>
                <p className="text-gray-500 text-theme-xs dark:text-gray-400 mt-0.5">
                  {language === 'ja' ? 'プロジェクト' : language === 'th' ? 'โปรเจกต์' : 'Projects'}
                </p>
              </div>
            </div>
          </a>

          {/* Alert Card */}
          <div className="flex-1 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl dark:bg-gray-800 shrink-0">
                <AlertTriangle className="w-5 h-5 text-gray-800 dark:text-white/90" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-title-sm dark:text-white/90">
                  0
                </h4>
                <p className="text-gray-500 text-theme-xs dark:text-gray-400 mt-0.5">
                  {language === 'ja' ? 'アラート' : language === 'th' ? 'การแจ้งเตือน' : 'Alerts'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Work Numbers Table - TailAdmin Style */}
      <div className={tableStyles.tableContainer}>
        {/* Header with Tabs and Filter */}
        <div className="px-5 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-white/[0.05]">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {language === 'ja' ? '作業一覧' : language === 'th' ? 'รายการงาน' : 'Delivery Activities'}
            </h3>
            <p className="text-gray-500 text-theme-sm dark:text-gray-400">
              {language === 'ja' ? '最近の作業状況を確認' : language === 'th' ? 'ติดตามกิจกรรมการจัดส่งล่าสุดของคุณ' : 'Track your recent shipping activities'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Tabs - TailAdmin ChartTab Style */}
            <div className="hidden sm:flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`px-3 py-2 font-medium rounded-md text-theme-sm transition-colors hover:text-gray-900 dark:hover:text-white ${
                    activeTab === tab.key
                      ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {getTabLabel(tab)}
                </button>
              ))}
            </div>

            {/* Filter Button */}
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 text-theme-sm shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
              <Filter className="w-5 h-5" />
              Filter
            </button>
          </div>
        </div>

        {/* Mobile Tab Select - TailAdmin Style */}
        <div className="sm:hidden px-5 py-3 border-b border-gray-100 dark:border-white/[0.05]">
          <select
            value={activeTab}
            onChange={(e) => handleTabChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-theme-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {STATUS_TABS.map((tab) => (
              <option key={tab.key} value={tab.key}>
                {getTabLabel(tab)}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        {filteredWorkNos.length === 0 ? (
          <div className="px-5 py-10 text-center text-theme-sm text-gray-500 dark:text-gray-400">
            {language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '工事番号' : language === 'th' ? 'หมายเลขงาน' : 'Order ID'}
                  </th>
                  <th className={tableStyles.th}>Category</th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '顧客' : language === 'th' ? 'บริษัท' : 'Company'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '売上予定日' : language === 'th' ? 'วันที่มาถึง' : 'Arrival'}
                  </th>
                  <th className={tableStyles.th}>Description</th>
                  <th className={`${tableStyles.th} text-right`}>
                    {language === 'ja' ? '合計金額（THB）' : language === 'th' ? 'ราคา (THB)' : 'Price (THB)'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                  </th>
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
                {paginatedWorkNos.map((record) => (
                  <tr key={record.kintone_record_id} className={tableStyles.trClickable}>
                    <td className={tableStyles.td}>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/${locale}/workno/${record.work_no}`}
                          className="font-medium text-gray-800 text-theme-sm hover:text-brand-500 dark:text-white/90 dark:hover:text-brand-400"
                        >
                          {record.work_no}
                        </a>
                        {record.sales_date &&
                         new Date(record.sales_date) < new Date() &&
                         record.status !== 'Finished' &&
                         record.status !== 'Cancel' && (
                          <span className="text-yellow-500" title={language === 'ja' ? '売上予定日が過ぎています' : 'Overdue'}>⚠️</span>
                        )}
                      </div>
                    </td>
                    <td className={tableStyles.td}>
                      {record.category || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {extractCsName(record.customer_id) || record.customer_name || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      <span className={
                        record.sales_date &&
                        new Date(record.sales_date) < new Date() &&
                        record.status !== 'Finished' &&
                        record.status !== 'Cancel'
                          ? 'text-error-500 font-medium'
                          : ''
                      }>
                        {formatDate(record.sales_date)}
                      </span>
                    </td>
                    <td className={`${tableStyles.td} max-w-[200px] truncate`}>
                      {record.description || '-'}
                    </td>
                    <td className={`${tableStyles.td} font-medium text-right`}>
                      {formatNumber(record.grand_total)}
                    </td>
                    <td className={tableStyles.td}>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(record.status || '')}`}>
                        {getStatusLabel(record.status || '', language)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={goToPage}
          locale={locale}
        />
      </div>

      {/* Quick Access - TailAdmin Style */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          {language === 'ja' ? 'クイックアクセス' : language === 'th' ? 'การเข้าถึงด่วน' : 'Quick Access'}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
          <a
            href={`/${locale}/parts-list`}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800 shrink-0">
                <Package className="w-6 h-6 text-gray-800 dark:text-white/90" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-theme-sm dark:text-white/90 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
                  {language === 'ja' ? 'パーツリスト管理' : language === 'th' ? 'การจัดการรายการชิ้นส่วน' : 'Parts List Management'}
                </h3>
                <p className="mt-1 text-gray-500 text-theme-xs dark:text-gray-400">
                  {language === 'ja' ? 'プロジェクト別のパーツリストを管理' : language === 'th' ? 'จัดการรายการชิ้นส่วนตามโปรเจกต์' : 'Manage parts lists by project'}
                </p>
              </div>
            </div>
          </a>
          <a
            href={`/${locale}/purchase-request`}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800 shrink-0">
                <ShoppingCart className="w-6 h-6 text-gray-800 dark:text-white/90" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-theme-sm dark:text-white/90 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
                  {language === 'ja' ? '購買依頼管理' : language === 'th' ? 'การจัดการคำขอซื้อ' : 'Purchase Request Management'}
                </h3>
                <p className="mt-1 text-gray-500 text-theme-xs dark:text-gray-400">
                  {language === 'ja' ? '設計・エンジニアからの購買依頼を処理' : language === 'th' ? 'ดำเนินการตามคำขอซื้อจากวิศวกร' : 'Process purchase requests from engineers'}
                </p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
