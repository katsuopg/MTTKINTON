'use client';

import { useState, useMemo } from 'react';
import { Language } from '@/lib/kintone/field-mappings';
import Link from 'next/link';
import { tableStyles } from '@/components/ui/TableStyles';
import { ListPageHeader } from '@/components/ui/ListPageHeader';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/Pagination';
import type { SupabaseCustomerStaff } from './page';

interface StaffListContentProps {
  staffList: SupabaseCustomerStaff[];
  locale: string;
}

export default function StaffListContent({ staffList, locale }: StaffListContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');

  // 部署の一覧を取得
  const divisions = useMemo(() => {
    const divisionSet = new Set<string>();
    staffList.forEach(staff => {
      if (staff.division) {
        divisionSet.add(staff.division);
      }
    });
    return Array.from(divisionSet).sort();
  }, [staffList]);

  // 検索とフィルタリング
  const filteredStaff = useMemo(() => {
    return staffList.filter(staff => {
      if (searchQuery && searchQuery.trim() !== '') {
        const searchLower = searchQuery.toLowerCase().trim();
        const normalizedSearchQuery = searchLower.replace(/\s+/g, ' ').trim();

        const name = (staff.staff_name || '').toLowerCase().replace(/\s+/g, ' ').trim();
        const company = (staff.company_name || '').toLowerCase().replace(/\s+/g, ' ').trim();
        const position = (staff.position || '').toLowerCase().replace(/\s+/g, ' ').trim();
        const email = (staff.email || '').toLowerCase().replace(/\s+/g, ' ').trim();
        const division = (staff.division || '').toLowerCase().replace(/\s+/g, ' ').trim();

        const matches = name.includes(normalizedSearchQuery) ||
                       company.includes(normalizedSearchQuery) ||
                       position.includes(normalizedSearchQuery) ||
                       email.includes(normalizedSearchQuery) ||
                       division.includes(normalizedSearchQuery);

        if (!matches) return false;
      }

      if (selectedDivision && staff.division !== selectedDivision) {
        return false;
      }

      return true;
    });
  }, [staffList, searchQuery, selectedDivision]);

  const { paginatedItems: paginatedStaff, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredStaff);

  return (
    <div className={tableStyles.contentWrapper}>
      <div className={tableStyles.tableContainer}>
        <ListPageHeader
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={
            language === 'ja' ? '名前、会社名、メールアドレスで検索...' :
            language === 'th' ? 'ค้นหาด้วยชื่อ, บริษัท, อีเมล...' :
            'Search by name, company, email...'
          }
          totalCount={filteredStaff.length}
          countLabel={
            language === 'ja' ? '件の担当者' :
            language === 'th' ? ' ผู้ติดต่อ' :
            ' staff members'
          }
          filters={
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="h-9 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
            >
              <option value="">
                {language === 'ja' ? '全部署' : language === 'th' ? 'ทุกแผนก' : 'All Divisions'}
              </option>
              {divisions.map((division) => (
                <option key={division} value={division}>
                  {division}
                </option>
              ))}
            </select>
          }
        />

        {/* モバイル: カードビュー */}
        <div className={tableStyles.mobileCardList}>
          {paginatedStaff.length === 0 ? (
            <div className={tableStyles.emptyRow}>
              {language === 'ja' ? '該当する担当者が見つかりません' :
               language === 'th' ? 'ไม่พบผู้ติดต่อที่ตรงกัน' :
               'No staff members found'}
            </div>
          ) : (
            paginatedStaff.map((staff) => (
              <div
                key={staff.id}
                className={tableStyles.mobileCard}
              >
                <div className={tableStyles.mobileCardTitle}>
                  {staff.staff_name}
                </div>
                <div className={tableStyles.mobileCardSubtitle}>
                  {staff.company_name || '-'}
                </div>
                <div className={tableStyles.mobileCardFields}>
                  {staff.division && (
                    <span className={tableStyles.mobileCardFieldValue}>{staff.division}</span>
                  )}
                  {staff.email && (
                    <a href={`mailto:${staff.email}`} className="text-brand-500 text-xs">
                      {staff.email}
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* デスクトップ: テーブルビュー */}
        <div className={tableStyles.desktopOnly}>
          <div className="max-w-full overflow-x-auto">
            {paginatedStaff.length === 0 ? (
              <div className={tableStyles.emptyRow}>
                {language === 'ja' ? '該当する担当者が見つかりません' :
                 language === 'th' ? 'ไม่พบผู้ติดต่อที่ตรงกัน' :
                 'No staff members found'}
              </div>
            ) : (
              <table className={tableStyles.table}>
                <thead className={tableStyles.thead}>
                  <tr>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? '担当者名' : language === 'th' ? 'ชื่อผู้ติดต่อ' : 'Name'}
                    </th>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? '会社名' : language === 'th' ? 'บริษัท' : 'Company'}
                    </th>
                    <th className={`${tableStyles.th} hidden md:table-cell`}>
                      {language === 'ja' ? '部署' : language === 'th' ? 'แผนก' : 'Division'}
                    </th>
                    <th className={`${tableStyles.th} hidden lg:table-cell`}>
                      {language === 'ja' ? '役職' : language === 'th' ? 'ตำแหน่ง' : 'Position'}
                    </th>
                    <th className={tableStyles.th}>
                      {language === 'ja' ? 'メール' : language === 'th' ? 'อีเมล' : 'Email'}
                    </th>
                    <th className={`${tableStyles.th} text-end`}>
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className={tableStyles.tbody}>
                  {paginatedStaff.map((staff) => (
                    <tr key={staff.id} className={tableStyles.tr}>
                      <td className={`${tableStyles.td} text-gray-800 dark:text-white/90 font-medium`}>
                        {staff.staff_name}
                      </td>
                      <td className={tableStyles.td}>
                        {staff.company_name || '-'}
                      </td>
                      <td className={`${tableStyles.td} hidden md:table-cell`}>
                        {staff.division || '-'}
                      </td>
                      <td className={`${tableStyles.td} hidden lg:table-cell`}>
                        {staff.position || '-'}
                      </td>
                      <td className={tableStyles.td}>
                        {staff.email ? (
                          <a
                            href={`mailto:${staff.email}`}
                            className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                          >
                            {staff.email}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className={`${tableStyles.td} text-end`}>
                        <Link
                          href={`/${locale}/staff/${staff.kintone_record_id}`}
                          className={tableStyles.tdLink}
                        >
                          {language === 'ja' ? '詳細' : language === 'th' ? 'รายละเอียด' : 'View'}
                        </Link>
                      </td>
                    </tr>
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
    </div>
  );
}
