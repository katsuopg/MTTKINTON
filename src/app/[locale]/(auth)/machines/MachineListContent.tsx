'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MachineRecord } from '@/types/kintone';
import { type Language } from '@/lib/kintone/field-mappings';
import { ListPageHeader } from '@/components/ui/ListPageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { tableStyles } from '@/components/ui/TableStyles';
import TransitionLink from '@/components/ui/TransitionLink';
import { extractCsName } from '@/lib/utils/customer-name';

interface MachineListContentProps {
  locale: string;
  language: Language;
  initialRecords: MachineRecord[];
  initialSearch: string;
  initialCategory: string;
  initialVendor: string;
  qtCounts: Record<string, number>;
  wnCounts: Record<string, number>;
}

export default function MachineListContent({
  locale,
  language,
  initialRecords,
  initialSearch,
  initialCategory,
  initialVendor,
  qtCounts,
  wnCounts,
}: MachineListContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  
  const [records, setRecords] = useState<MachineRecord[]>(initialRecords);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedVendor, setSelectedVendor] = useState(initialVendor);
  const [filteredRecords, setFilteredRecords] = useState<MachineRecord[]>([]);

  // URL更新のデバウンス処理
  const updateURL = useCallback((search: string, category: string, vendor: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category && category !== 'all') params.set('category', category);
    if (vendor && vendor !== 'all') params.set('vendor', vendor);
    
    const query = params.toString();
    const newURL = `/${locale}/machines${query ? `?${query}` : ''}`;
    router.replace(newURL, { scroll: false });
  }, [locale, router]);

  // 検索処理
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    updateURL(value, selectedCategory, selectedVendor);
  }, [selectedCategory, selectedVendor, updateURL]);

  // カテゴリ変更処理
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    updateURL(searchQuery, category, selectedVendor);
  }, [searchQuery, selectedVendor, updateURL]);

  // ベンダー変更処理
  const handleVendorChange = useCallback((vendor: string) => {
    setSelectedVendor(vendor);
    updateURL(searchQuery, selectedCategory, vendor);
  }, [searchQuery, selectedCategory, updateURL]);

  // カテゴリ一覧を取得
  const categories = Array.from(new Set(records.map(r => r.MachineCategory?.value).filter(Boolean)));
  const vendors = Array.from(new Set(records.map(r => r.Vender?.value).filter(Boolean)));

  // クライアントサイドフィルタリング
  useEffect(() => {
    let filtered = records;
    
    if (searchQuery) {
      filtered = filtered.filter(record => {
        const csName = record.CsName?.value?.toLowerCase() || '';
        const csId = record.CsId_db?.value?.toLowerCase() || '';
        const model = record.Moldel?.value?.toLowerCase() || '';
        const serial = record.SrialNo?.value?.toLowerCase() || '';
        const mcItem = record.McItem?.value?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return csName.includes(query) || csId.includes(query) || 
               model.includes(query) || serial.includes(query) || mcItem.includes(query);
      });
    }

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(record => record.MachineCategory?.value === selectedCategory);
    }

    if (selectedVendor && selectedVendor !== 'all') {
      filtered = filtered.filter(record => record.Vender?.value === selectedVendor);
    }

    setFilteredRecords(filtered);
  }, [records, searchQuery, selectedCategory, selectedVendor]);

  const { paginatedItems, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredRecords);

  // 日付フォーマット関数
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    
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

  const searchPlaceholder = language === 'ja' 
    ? '顧客名、CS ID、モデル、シリアル番号で検索' 
    : language === 'th' 
    ? 'ค้นหาด้วยชื่อลูกค้า, CS ID, รุ่น, หมายเลขซีเรียล' 
    : 'Search by customer, CS ID, model, serial no.';

  const countLabel = language === 'ja'
    ? '台の機械'
    : language === 'th'
    ? ' เครื่อง'
    : ' machines';

  return (
    <div className={tableStyles.contentWrapper}>
      {/* テーブル表示 */}
      <div className={tableStyles.tableContainer}>
        <ListPageHeader
          searchValue={searchQuery}
          onSearchChange={handleSearchChange}
          searchPlaceholder={searchPlaceholder}
          totalCount={filteredRecords.length}
          countLabel={countLabel}
          filters={
            <>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="h-9 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
              >
                <option value="all">
                  {language === 'ja' ? '全カテゴリ' : language === 'th' ? 'ทุกหมวดหมู่' : 'All Categories'}
                </option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={selectedVendor}
                onChange={(e) => handleVendorChange(e.target.value)}
                className="h-9 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
              >
                <option value="all">
                  {language === 'ja' ? '全メーカー' : language === 'th' ? 'ทุกผู้ผลิต' : 'All Vendors'}
                </option>
                {vendors.map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>
            </>
          }
        />
        <div className="max-w-full overflow-x-auto">
          {filteredRecords.length === 0 ? (
            <div className={tableStyles.emptyRow}>
              {language === 'ja' ? 'データがありません' : language === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}
            </div>
          ) : (
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? '顧客' : language === 'th' ? 'ลูกค้า' : 'Customer'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? 'カテゴリ' : language === 'th' ? 'หมวดหมู่' : 'Category'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? 'タイプ' : language === 'th' ? 'ประเภท' : 'Type'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? 'メーカー' : language === 'th' ? 'ผู้ผลิต' : 'Vendor'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? 'モデル' : language === 'th' ? 'รุ่น' : 'Model'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? 'シリアル番号' : language === 'th' ? 'หมายเลขซีเรียล' : 'Serial No.'}
                  </th>
                  <th className={tableStyles.th}>
                    {language === 'ja' ? 'アイテム' : language === 'th' ? 'รายการ' : 'Item'}
                  </th>
                  <th className={`${tableStyles.th} text-center`}>
                    QT
                  </th>
                  <th className={`${tableStyles.th} text-center`}>
                    WN
                  </th>
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
                {paginatedItems.map((record) => (
                  <tr key={record.$id.value}
                      className={`${tableStyles.tr} cursor-pointer ${navigatingId === record.$id.value ? 'opacity-50' : ''}`}
                      onClick={() => {
                        setNavigatingId(record.$id.value);
                        startTransition(() => {
                          router.push(`/${locale}/machines/${record.$id.value}`);
                        });
                      }}>
                    <td className={tableStyles.td}>
                      <div>
                        <div className="font-medium text-gray-800 dark:text-white/90">{extractCsName(record.CsId_db?.value) || '-'}</div>
                        <div className="text-theme-xs text-gray-500 dark:text-gray-400">{record.CsName?.value || '-'}</div>
                      </div>
                    </td>
                    <td className={tableStyles.td}>
                      {record.MachineCategory?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {record.Drop_down_0?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {record.Vender?.value || '-'}
                    </td>
                    <td className={tableStyles.td}
                        onClick={(e) => e.stopPropagation()}>
                      <TransitionLink
                        href={`/${locale}/machines/${record.$id.value}`}
                        className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium"
                      >
                        {record.Moldel?.value || '-'}
                      </TransitionLink>
                    </td>
                    <td className={tableStyles.td}>
                      {record.SrialNo?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {record.McItem?.value || '-'}
                    </td>
                    <td className={`${tableStyles.td} text-center`}>
                      {qtCounts[record.$id.value] > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-theme-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                          {qtCounts[record.$id.value]}
                        </span>
                      )}
                    </td>
                    <td className={`${tableStyles.td} text-center`}>
                      {wnCounts[record.$id.value] > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-theme-xs font-medium bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500">
                          {wnCounts[record.$id.value]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={goToPage}
            locale={locale}
          />
        </div>
      </div>

      {/* ローディングオーバーレイ */}
      {(isPending || navigatingId) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 dark:bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-brand-500"></div>
            <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              {language === 'ja' ? '読み込み中...' : language === 'th' ? 'กำลังโหลด...' : 'Loading...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}