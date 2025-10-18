import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import type { Language } from '@/lib/kintone/field-mappings';
import { tableStyles } from '@/components/ui/TableStyles';
import type { Database } from '@/types/supabase';

type Supplier = Database['public']['Tables']['suppliers']['Row'];

interface SuppliersPageProps {
  params: {
    locale: string;
  };
  searchParams: {
    search?: string;
    page?: string;
  };
}

export default async function SuppliersPage({ params, searchParams }: SuppliersPageProps) {
  const supabase = await createClient();
  
  // paramsとsearchParamsをawait
  const { locale } = await params;
  const { search = '', page = '1' } = await searchParams;
  
  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const searchQuery = search;
  const currentPage = Math.max(1, parseInt(page, 10));
  const itemsPerPage = 50;
  
  // Supabaseから仕入業者データを取得
  let suppliers: Supplier[] = [];
  let error = false;
  let totalItems = 0;
  let totalPages = 1;
  let startIndex = 0;
  let endIndex = itemsPerPage;
  
  try {
    // 検索クエリがある場合
    let query = supabase
      .from('suppliers')
      .select('*', { count: 'exact' })
      .order('supplier_id');
    
    if (searchQuery) {
      // 英語名、タイ語名、サプライヤーIDで検索
      query = query.or(`company_name_en.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%,supplier_id.ilike.%${searchQuery}%`);
    }
    
    // 総件数を取得
    const { count } = await query;
    totalItems = count || 0;
    totalPages = Math.ceil(totalItems / itemsPerPage);
    startIndex = (currentPage - 1) * itemsPerPage;
    endIndex = startIndex + itemsPerPage;
    
    // ページネーション適用
    const { data, error: fetchError } = await query
      .range(startIndex, endIndex - 1);
    
    if (fetchError) throw fetchError;
    
    suppliers = data || [];
    
    // 検索結果が1件の場合は詳細ページへリダイレクト
    if (searchQuery && suppliers.length === 1 && totalItems === 1) {
      redirect(`/${locale}/suppliers/${suppliers[0].id}`);
    }
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    error = true;
    suppliers = [];
  }

  const pageTitle = language === 'ja' ? '仕入業者管理' : language === 'th' ? 'จัดการซัพพลายเออร์' : 'Supplier Management';

  return (
    <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle}>
      <div className={tableStyles.contentWrapper}>
        {/* 検索バー */}
        <div className={tableStyles.searchWrapper}>
          <form method="get" action={`/${locale}/suppliers`} className={tableStyles.searchForm}>
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder={language === 'ja' ? '会社名で検索...' : language === 'th' ? 'ค้นหาตามชื่อบริษัท...' : 'Search by company name...'}
              className={tableStyles.searchInput}
            />
            <button
              type="submit"
              className={tableStyles.searchButton}
            >
              {language === 'ja' ? '検索' : language === 'th' ? 'ค้นหา' : 'Search'}
            </button>
            {searchQuery && (
              <a
                href={`/${locale}/suppliers`}
                className={tableStyles.clearButton}
              >
                {language === 'ja' ? 'クリア' : language === 'th' ? 'ล้าง' : 'Clear'}
              </a>
            )}
          </form>
        </div>

        {/* フィルターバー */}
        <div className={tableStyles.filterBar}>
          <div className="flex items-center justify-between">
            <p className={tableStyles.recordCount}>
              {searchQuery ? (
                language === 'ja' ? `「${searchQuery}」の検索結果: ${totalItems}件` : 
                language === 'th' ? `ผลการค้นหา "${searchQuery}": ${totalItems} รายการ` : 
                `Search results for "${searchQuery}": ${totalItems} items`
              ) : (
                language === 'ja' ? `${totalItems}件の仕入業者` : 
                language === 'th' ? `${totalItems} ซัพพลายเออร์` : 
                `${totalItems} suppliers`
              )}
              {totalPages > 1 && (
                <span className="ml-2 text-sm text-gray-500">
                  ({language === 'ja' ? `${currentPage}/${totalPages}ページ` : 
                    language === 'th' ? `หน้า ${currentPage}/${totalPages}` : 
                    `Page ${currentPage}/${totalPages}`})
                </span>
              )}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <p className="text-red-600 mb-2">
                {language === 'ja' ? '仕入業者データの取得に失敗しました' : 
                 language === 'th' ? 'ไม่สามารถโหลดข้อมูลซัพพลายเออร์' : 
                 'Failed to load supplier data'}
              </p>
              <p className="text-sm text-gray-600">
                {language === 'ja' ? 'データベースへの接続に問題が発生しています。' : 
                 language === 'th' ? 'มีปัญหาในการเชื่อมต่อกับฐานข้อมูล' : 
                 'There is an issue connecting to the database.'}
              </p>
            </div>
          )}
        </div>

        {/* テーブル */}
        <div className={tableStyles.tableContainer}>
          {suppliers.length === 0 ? (
            <div className={tableStyles.emptyRow}>
              <p>
                {language === 'ja' ? 'データがありません' : 
                 language === 'th' ? 'ไม่มีข้อมูล' : 
                 'No data available'}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    {language === 'ja' ? '会社名' : language === 'th' ? 'ชื่อบริษัท' : 'Company Name'}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    TEL
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 hidden md:table-cell">
                    {language === 'ja' ? 'メール' : language === 'th' ? 'อีเมล' : 'Email'}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64 hidden lg:table-cell">
                    {language === 'ja' ? '住所' : language === 'th' ? 'ที่อยู่' : 'Address'}
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {supplier.company_name_en || supplier.company_name || '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.phone_number || '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                      {supplier.email || '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                      <div className="max-w-xs truncate">
                        {supplier.address || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a
                        href={`/${locale}/suppliers/${supplier.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {language === 'ja' ? '詳細' : language === 'th' ? 'รายละเอียด' : 'View'}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
              <div className="flex justify-between flex-1 sm:hidden">
                {currentPage > 1 && (
                  <a
                    href={`/${locale}/suppliers?${searchQuery ? `search=${encodeURIComponent(searchQuery)}&` : ''}page=${currentPage - 1}`}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {language === 'ja' ? '前へ' : language === 'th' ? 'ก่อนหน้า' : 'Previous'}
                  </a>
                )}
                {currentPage < totalPages && (
                  <a
                    href={`/${locale}/suppliers?${searchQuery ? `search=${encodeURIComponent(searchQuery)}&` : ''}page=${currentPage + 1}`}
                    className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {language === 'ja' ? '次へ' : language === 'th' ? 'ถัดไป' : 'Next'}
                  </a>
                )}
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    {language === 'ja' 
                      ? `${totalItems}件中 ${startIndex + 1}～${Math.min(endIndex, totalItems)}件を表示` 
                      : language === 'th' 
                      ? `แสดง ${startIndex + 1} ถึง ${Math.min(endIndex, totalItems)} จาก ${totalItems} รายการ` 
                      : `Showing ${startIndex + 1} to ${Math.min(endIndex, totalItems)} of ${totalItems} results`}
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    {currentPage > 1 && (
                      <a
                        href={`/${locale}/suppliers?${searchQuery ? `search=${encodeURIComponent(searchQuery)}&` : ''}page=${currentPage - 1}`}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </a>
                    )}
                    
                    {/* ページ番号 */}
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      const isCurrentPage = pageNumber === currentPage;
                      
                      // 表示するページ番号を制限（現在のページの前後2ページ + 最初と最後）
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                      ) {
                        return (
                          <a
                            key={pageNumber}
                            href={`/${locale}/suppliers?${searchQuery ? `search=${encodeURIComponent(searchQuery)}&` : ''}page=${pageNumber}`}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              isCurrentPage
                                ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                            }`}
                          >
                            {pageNumber}
                          </a>
                        );
                      } else if (
                        pageNumber === currentPage - 3 ||
                        pageNumber === currentPage + 3
                      ) {
                        return (
                          <span key={pageNumber} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                    
                    {currentPage < totalPages && (
                      <a
                        href={`/${locale}/suppliers?${searchQuery ? `search=${encodeURIComponent(searchQuery)}&` : ''}page=${currentPage + 1}`}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </a>
                    )}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
