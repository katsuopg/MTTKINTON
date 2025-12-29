'use client';

import { useState, useMemo } from 'react';
import { WorkNoRecord } from '@/types/kintone';
import { getFieldLabel, getStatusLabel, type Language } from '@/lib/kintone/field-mappings';
import { getStatusColor } from '@/lib/kintone/utils';
import { tableStyles } from '@/components/ui/TableStyles';

interface DashboardContentProps {
  locale: string;
  workNoCount: number;
  projectCount: number;
  recentWorkNos: WorkNoRecord[];
}

// ステータスフィルターのタブ
const STATUS_TABS = [
  { key: 'all', labelJa: '全て', labelEn: 'All', labelTh: 'ทั้งหมด' },
  { key: 'Working', labelJa: '作業中', labelEn: 'Working', labelTh: 'กำลังทำงาน' },
  { key: 'Wating PO', labelJa: 'PO待ち', labelEn: 'Waiting PO', labelTh: 'รอ PO' },
  { key: 'Pending', labelJa: '保留', labelEn: 'Pending', labelTh: 'รอดำเนินการ' },
  { key: 'Stock', labelJa: '在庫', labelEn: 'Stock', labelTh: 'สต็อก' },
];

export default function DashboardContent({ locale, workNoCount, projectCount, recentWorkNos }: DashboardContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const itemsPerPage = 10;

  const formatDate = (dateString: string | undefined) => {
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

  const formatNumber = (value: string | undefined) => {
    if (!value) return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString() + 'B';
  };

  // フィルタリングされたデータ
  const filteredWorkNos = useMemo(() => {
    if (activeTab === 'all') return recentWorkNos;
    return recentWorkNos.filter(record => record.Status?.value === activeTab);
  }, [recentWorkNos, activeTab]);

  // ページネーション
  const paginatedWorkNos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredWorkNos.slice(startIndex, endIndex);
  }, [filteredWorkNos, currentPage]);

  const totalPages = Math.ceil(filteredWorkNos.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
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
      {/* Dashboard Metrics - TailAdmin Style */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6 mb-6">
        {/* Work No. Card */}
        <a
          href={`/${locale}/projects`}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800 shrink-0">
              <svg className="w-6 h-6 text-gray-800 dark:text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-title-sm dark:text-white/90">
                {workNoCount}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                  {language === 'ja' ? '実行中' : language === 'th' ? 'กำลังดำเนินการ' : 'WIP'} {getFieldLabel('WorkNo', language)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  Active
                </span>
              </div>
            </div>
          </div>
        </a>

        {/* Project Card */}
        <a
          href={`/${locale}/projects`}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800 shrink-0">
              <svg className="w-6 h-6 text-gray-800 dark:text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-title-sm dark:text-white/90">
                {projectCount}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                  {language === 'ja' ? 'プロジェクト' : language === 'th' ? 'โปรเจกต์' : 'Projects'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  +20%
                </span>
              </div>
            </div>
          </div>
        </a>

        {/* Alert Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800 shrink-0">
              <svg className="w-6 h-6 text-gray-800 dark:text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-title-sm dark:text-white/90">
                0
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                  {language === 'ja' ? 'アラート' : language === 'th' ? 'การแจ้งเตือน' : 'Alerts'}
                </span>
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
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
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
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '合計金額' : language === 'th' ? 'ราคา' : 'Price'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                  </th>
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
                {paginatedWorkNos.map((record) => (
                  <tr key={record.$id.value} className={tableStyles.tr}>
                    <td className={tableStyles.td}>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/${locale}/projects/${record.WorkNo?.value}`}
                          className="font-medium text-gray-800 text-theme-sm hover:text-brand-500 dark:text-white/90 dark:hover:text-brand-400"
                        >
                          #{record.WorkNo?.value}
                        </a>
                        {record.Salesdate?.value &&
                         new Date(record.Salesdate.value) < new Date() &&
                         record.Status?.value !== 'Finished' &&
                         record.Status?.value !== 'Cancel' && (
                          <span className="text-yellow-500" title={language === 'ja' ? '売上予定日が過ぎています' : 'Overdue'}>⚠️</span>
                        )}
                      </div>
                    </td>
                    <td className={tableStyles.td}>
                      {record.文字列__1行__1?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {record.文字列__1行__8?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      <span className={
                        record.Salesdate?.value &&
                        new Date(record.Salesdate.value) < new Date() &&
                        record.Status?.value !== 'Finished' &&
                        record.Status?.value !== 'Cancel'
                          ? 'text-error-500 font-medium'
                          : ''
                      }>
                        {formatDate(record.Salesdate?.value)}
                      </span>
                    </td>
                    <td className={`${tableStyles.td} max-w-[200px] truncate`}>
                      {record.文字列__1行__2?.value || '-'}
                    </td>
                    <td className={`${tableStyles.td} font-medium`}>
                      {formatNumber(record.grand_total?.value)}
                    </td>
                    <td className={tableStyles.td}>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(record.Status?.value || '')}`}>
                        {getStatusLabel(record.Status?.value || '', language)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination - TailAdmin Style */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-white/[0.05]">
            <p className="text-gray-500 text-theme-sm dark:text-gray-400">
              Showing <span className="font-medium text-gray-700 dark:text-gray-300">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">{Math.min(currentPage * itemsPerPage, filteredWorkNos.length)}</span> of{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">{filteredWorkNos.length}</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
                let pageNumber: number;
                if (totalPages <= 5) {
                  pageNumber = idx + 1;
                } else if (currentPage <= 3) {
                  pageNumber = idx + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + idx;
                } else {
                  pageNumber = currentPage - 2 + idx;
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg font-medium text-theme-sm transition-colors ${
                      currentPage === pageNumber
                        ? 'bg-brand-500 text-white'
                        : 'border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
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
                <svg className="w-6 h-6 text-gray-800 dark:text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
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
                <svg className="w-6 h-6 text-gray-800 dark:text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
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
