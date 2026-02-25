'use client';

import { useState, useMemo } from 'react';
import { tableStyles } from '@/components/ui/TableStyles';
import { ListPageHeader } from '@/components/ui/ListPageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { ClickableRow } from '@/components/ui/ClickableRow';
import { usePagination } from '@/hooks/usePagination';
import type { Language } from '@/lib/kintone/field-mappings';

interface Supplier {
  id: string;
  supplier_id: string;
  company_name: string;
  company_name_en: string;
  phone_number: string | null;
  fax_number: string | null;
  email: string | null;
  address: string | null;
  kintone_record_id: string | null;
}

interface SuppliersTableProps {
  suppliers: Supplier[];
  locale: string;
  language: Language;
  initialSearch?: string;
}

export default function SuppliersTable({ suppliers, locale, language, initialSearch = '' }: SuppliersTableProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery) return suppliers;
    const q = searchQuery.toLowerCase();
    return suppliers.filter(s =>
      (s.company_name || '').toLowerCase().includes(q) ||
      (s.company_name_en || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  }, [suppliers, searchQuery]);

  const { paginatedItems, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredSuppliers);

  return (
    <div className={tableStyles.tableContainer}>
      <ListPageHeader
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={
          language === 'ja' ? '会社名、メールで検索...' :
          language === 'th' ? 'ค้นหาตามชื่อบริษัท, อีเมล...' :
          'Search by company name, email...'
        }
        totalCount={filteredSuppliers.length}
        countLabel={language === 'ja' ? '件の仕入業者' : language === 'th' ? ' ซัพพลายเออร์' : ' suppliers'}
      />
      {/* モバイル: カードビュー */}
      <div className={tableStyles.mobileCardList}>
        {filteredSuppliers.length === 0 ? (
          <div className={tableStyles.emptyRow}>
            {language === 'ja' ? 'データがありません' :
             language === 'th' ? 'ไม่มีข้อมูล' :
             'No data available'}
          </div>
        ) : (
          paginatedItems.map((supplier: Supplier) => (
            <div
              key={supplier.id}
              className={tableStyles.mobileCard}
              onClick={() => window.location.href = `/${locale}/suppliers/${supplier.id}`}
            >
              <div className={tableStyles.mobileCardTitle}>
                {language === 'th'
                  ? (supplier.company_name || supplier.company_name_en || '-')
                  : (supplier.company_name_en || supplier.company_name || '-')}
              </div>
              <div className={tableStyles.mobileCardFields}>
                <span className={tableStyles.mobileCardFieldValue}>
                  TEL: {supplier.phone_number || '-'}
                </span>
                {supplier.email && (
                  <span className={tableStyles.mobileCardFieldValue}>
                    {supplier.email}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* デスクトップ: テーブルビュー */}
      <div className={tableStyles.desktopOnly}>
      <div className="max-w-full overflow-x-auto">
        {filteredSuppliers.length === 0 ? (
          <div className={tableStyles.emptyRow}>
            {language === 'ja' ? 'データがありません' :
             language === 'th' ? 'ไม่มีข้อมูล' :
             'No data available'}
          </div>
        ) : (
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>
                  {language === 'ja' ? '会社名' : language === 'th' ? 'ชื่อบริษัท' : 'Company Name'}
                </th>
                <th className={tableStyles.th}>
                  TEL
                </th>
                <th className={`${tableStyles.th} hidden md:table-cell`}>
                  {language === 'ja' ? 'メール' : language === 'th' ? 'อีเมล' : 'Email'}
                </th>
                <th className={`${tableStyles.th} text-end`}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {paginatedItems.map((supplier: Supplier) => (
                <ClickableRow key={supplier.id} href={`/${locale}/suppliers/${supplier.id}`} className={tableStyles.trClickable}>
                  <td className={`${tableStyles.td} text-gray-800 dark:text-white/90 font-medium`}>
                    {language === 'th'
                      ? (supplier.company_name || supplier.company_name_en || '-')
                      : (supplier.company_name_en || supplier.company_name || '-')}
                  </td>
                  <td className={tableStyles.td}>
                    {supplier.phone_number || '-'}
                  </td>
                  <td className={`${tableStyles.td} hidden md:table-cell`}>
                    {supplier.email || '-'}
                  </td>
                  <td className={`${tableStyles.td} text-end`}>
                    <span className="text-sm text-gray-400">›</span>
                  </td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={goToPage}
        locale={locale}
      />
    </div>
  );
}
