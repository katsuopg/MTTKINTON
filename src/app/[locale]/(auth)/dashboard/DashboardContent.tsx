'use client';

import { useState, useMemo } from 'react';
import { WorkNoRecord } from '@/types/kintone';
import { getFieldLabel, getStatusLabel, type Language } from '@/lib/kintone/field-mappings';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

interface DashboardContentProps {
  locale: string;
  workNoCount: number;
  projectCount: number;
  recentWorkNos: WorkNoRecord[];
}

export default function DashboardContent({ locale, workNoCount, projectCount, recentWorkNos }: DashboardContentProps) {
  // Convert locale to Language type
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  
  // ページネーションの設定
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // 日付フォーマット関数
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '未定';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    if (language === 'ja') {
      // 日本語: YYYY-MM-DD
      return dateString;
    } else {
      // 英語・タイ語: DD/MM/YYYY
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  // 数値フォーマット関数
  const formatNumber = (value: string | undefined) => {
    if (!value) return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString() + 'B';
  };
  
  // ページネーション計算
  const paginatedWorkNos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return recentWorkNos.slice(startIndex, endIndex);
  }, [recentWorkNos, currentPage]);
  
  const totalPages = Math.ceil(recentWorkNos.length / itemsPerPage);
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  return (
    <div className="p-4">
      {/* Dashboard Cards */}
      <div className="mb-8">
        <div className="grid grid-cols-3 gap-4 md:gap-6" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem'}}>
          {/* Work No.管理カード（メイン） */}
          <a 
            href={`/${locale}/projects`} 
            className="group relative bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200"
          >
            <div className="p-4">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3">
                  <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 group-hover:text-green-600 transition-colors mb-1">
                    {workNoCount}
                  </p>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    {language === 'ja' ? '実行中' : language === 'th' ? 'กำลังดำเนินการ' : 'WIP'} {getFieldLabel('WorkNo', language)}
                  </p>
                </div>
              </div>
            </div>
          </a>

          {/* プロジェクト管理カード */}
          <a 
            href={`/${locale}/projects`} 
            className="group relative bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200"
          >
            <div className="p-4">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3">
                  <div className="h-12 w-12 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-1">
                    {projectCount}
                  </p>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    プロジェクト
                  </p>
                </div>
              </div>
            </div>
          </a>

          {/* アラートカード */}
          <div className="relative bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-4">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3">
                  <div className="h-12 w-12 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    0
                  </p>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    アラート
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Work Numbers Table */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            {language === 'ja' ? '実行中の' : language === 'th' ? 'งานที่กำลังดำเนินการ' : 'Work in Progress'} {getFieldLabel('WorkNo', language)}
          </h2>
        </div>
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          {recentWorkNos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">データがありません</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200" style={{minWidth: '1200px'}}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ja' ? '工事番号' : language === 'th' ? 'หมายเลขงาน' : 'Work No.'}
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CS ID
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grand Total
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross Profit
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ja' ? '売上予定日' : language === 'th' ? 'วันที่ขายที่คาดการณ์' : 'Sales Date'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedWorkNos.map((record) => (
                  <tr key={record.$id.value} className="transition-colors duration-150" style={{
                    backgroundColor: record.Status?.value === 'Finished' ? '#f0fdf4' : 'transparent'
                  }}>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <a
                          href={`/${locale}/projects/${record.WorkNo?.value}`}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                          style={{transform: 'scaleX(0.9)', transformOrigin: 'left', display: 'inline-block'}}
                        >
                          {record.WorkNo?.value}
                        </a>
                        {/* 売上予定日が過ぎているかチェック */}
                        {record.Salesdate?.value && 
                         new Date(record.Salesdate.value) < new Date() &&
                         record.Status?.value !== 'Finished' &&
                         record.Status?.value !== 'Cancel' && (
                          <div className="relative ml-1 group inline-flex">
                            <span className="text-yellow-500 cursor-help">⚠️</span>
                            <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded-md px-3 py-2 whitespace-nowrap left-full ml-1 top-1/2 transform -translate-y-1/2">
                              {language === 'ja' 
                                ? '売上予定日が過ぎています。担当営業に再確認をしてください。'
                                : language === 'th'
                                ? 'วันที่ขายที่คาดการณ์ผ่านไปแล้ว กรุณาตรวจสอบกับฝ่ายขายอีกครั้ง'
                                : 'Sales date has passed. Please reconfirm with sales staff.'}
                              <div className="absolute w-2 h-2 bg-gray-800 transform rotate-45 -left-1 top-1/2 -translate-y-1/2"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: 
                            record.Status?.value === 'Working' ? '#dbeafe' :
                            record.Status?.value === 'Finished' ? '#10b981' :
                            record.Status?.value === 'Wating PO' ? '#fef08a' :
                            record.Status?.value === 'Stock' ? '#f3e8ff' :
                            record.Status?.value === 'Pending' ? '#fed7aa' :
                            record.Status?.value === 'Cancel' ? '#fee2e2' :
                            record.Status?.value === 'Expenses' ? '#e0e7ff' :
                            '#f3f4f6',
                          color:
                            record.Status?.value === 'Working' ? '#1e40af' :
                            record.Status?.value === 'Finished' ? '#ffffff' :
                            record.Status?.value === 'Wating PO' ? '#a16207' :
                            record.Status?.value === 'Stock' ? '#7c3aed' :
                            record.Status?.value === 'Pending' ? '#ea580c' :
                            record.Status?.value === 'Cancel' ? '#dc2626' :
                            record.Status?.value === 'Expenses' ? '#4338ca' :
                            '#6b7280'
                        }}
                      >
                        {getStatusLabel(record.Status?.value || '', language)}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                      {record.ルックアップ?.value && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white justify-center">
                          PO
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                      {record.文字列__1行__8?.value ? (
                        <a
                          href={`/${locale}/customers/${record.文字列__1行__8.value}`}
                          className="text-indigo-600 hover:text-indigo-900"
                          style={{transform: 'scaleX(0.9)', transformOrigin: 'left', display: 'inline-block'}}
                        >
                          {record.文字列__1行__8.value}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                      {record.文字列__1行__1?.value || '-'}
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-900">
                      {record.文字列__1行__2?.value || '-'}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                      {record.文字列__1行__9?.value || '-'}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatNumber(record.grand_total?.value)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatNumber(record.profit?.value)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm">
                      <span className={
                        record.Salesdate?.value && 
                        new Date(record.Salesdate.value) < new Date() &&
                        record.Status?.value !== 'Finished' &&
                        record.Status?.value !== 'Cancel' 
                          ? 'text-red-600 font-medium' 
                          : 'text-gray-900'
                      }>
                        {formatDate(record.Salesdate?.value)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  前へ
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    {language === 'ja' ? `${recentWorkNos.length}件中` : language === 'th' ? `${recentWorkNos.length} รายการ` : `${recentWorkNos.length} items`}
                    {' '}
                    <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                    {' - '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, recentWorkNos.length)}
                    </span>
                    {language === 'ja' ? '件を表示' : language === 'th' ? ' แสดง' : ' showing'}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    
                    {/* ページ番号 */}
                    {[...Array(totalPages)].map((_, idx) => {
                      const pageNumber = idx + 1;
                      const isCurrentPage = pageNumber === currentPage;
                      
                      // 表示するページ番号を制限（現在のページの前後2ページ + 最初と最後）
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              isCurrentPage
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      }
                      
                      // 省略記号を表示
                      if (pageNumber === currentPage - 3 || pageNumber === currentPage + 3) {
                        return (
                          <span key={pageNumber} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        );
                      }
                      
                      return null;
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          クイックアクセス
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <a
            href={`/${locale}/parts-list`}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">パーツリスト管理</h3>
            <p className="mt-2 text-sm text-gray-500">
              プロジェクト別のパーツリストを管理
            </p>
          </a>
          <a
            href={`/${locale}/purchase-request`}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">購買依頼管理</h3>
            <p className="mt-2 text-sm text-gray-500">
              設計・エンジニアからの購買依頼を処理
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}