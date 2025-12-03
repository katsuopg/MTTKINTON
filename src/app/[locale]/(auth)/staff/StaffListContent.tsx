'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CustomerStaffRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Language } from '@/lib/kintone/field-mappings';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { tableStyles } from '@/components/ui/TableStyles';

interface StaffListContentProps {
  staffList: CustomerStaffRecord[];
  locale: string;
  userEmail: string;
}

export default function StaffListContent({ staffList, locale, userEmail }: StaffListContentProps) {
  const router = useRouter();
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');

  const handleRowClick = useCallback((staffId: string) => {
    router.push(`/${locale}/staff/${staffId}`);
  }, [router, locale]);

  const handleRowKeyDown = useCallback((e: React.KeyboardEvent, staffId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRowClick(staffId);
    }
  }, [handleRowClick]);

  // 部署の一覧を取得
  const divisions = useMemo(() => {
    const divisionSet = new Set<string>();
    staffList.forEach(staff => {
      if (staff.Divison?.value) {
        divisionSet.add(staff.Divison.value);
      }
    });
    return Array.from(divisionSet).sort();
  }, [staffList]);

  // 検索とフィルタリング
  const filteredStaff = useMemo(() => {
    const results = staffList.filter(staff => {
      // 検索クエリでフィルタリング
      if (searchQuery && searchQuery.trim() !== '') {
        const searchLower = searchQuery.toLowerCase().trim();
        
        // 各フィールドの値を安全に取得して小文字に変換し、余分な空白を正規化
        const name = staff.担当者名?.value?.toLowerCase().replace(/\s+/g, ' ').trim() || '';
        const company = staff.ルックアップ?.value?.toLowerCase().replace(/\s+/g, ' ').trim() || '';
        const position = staff.Position?.value?.toLowerCase().replace(/\s+/g, ' ').trim() || '';
        const email = staff.メールアドレス?.value?.toLowerCase().replace(/\s+/g, ' ').trim() || '';
        const division = staff.Divison?.value?.toLowerCase().replace(/\s+/g, ' ').trim() || '';
        
        // 検索クエリも余分な空白を正規化
        const normalizedSearchQuery = searchLower.replace(/\s+/g, ' ').trim();
        
        // いずれかのフィールドに検索文字列が含まれているかチェック
        const matches = name.includes(normalizedSearchQuery) || 
                       company.includes(normalizedSearchQuery) || 
                       position.includes(normalizedSearchQuery) || 
                       email.includes(normalizedSearchQuery) ||
                       division.includes(normalizedSearchQuery);
        
        if (!matches) {
          return false;
        }
      }

      // 部署でフィルタリング
      if (selectedDivision && staff.Divison?.value !== selectedDivision) {
        return false;
      }

      return true;
    });
    
    return results;
  }, [staffList, searchQuery, selectedDivision]);

  const pageTitle = language === 'ja' ? '顧客担当者管理' : language === 'th' ? 'จัดการผู้ติดต่อ' : 'Staff Management';

  return (
    <DashboardLayout locale={locale} userEmail={userEmail} title={pageTitle}>
      <div className={tableStyles.contentWrapper}>
        {/* 検索バー */}
        <div className={tableStyles.searchWrapper}>
          <div className={tableStyles.searchForm}>
            {/* 検索ボックス */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'ja' ? '名前、会社名、メールアドレスで検索...' : 
                  language === 'th' ? 'ค้นหาด้วยชื่อ, บริษัท, อีเมล...' :
                  'Search by name, company, email...'
                }
                className={`${tableStyles.searchInput} pl-10`}
              />
            </div>

            {/* 部署フィルター */}
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
          </div>
        </div>

        {/* フィルターバー */}
        <div className={tableStyles.filterBar}>
          <p className={tableStyles.recordCount}>
            {language === 'ja' ? `${filteredStaff.length}件の担当者` : 
             language === 'th' ? `${filteredStaff.length} ผู้ติดต่อ` : 
             `${filteredStaff.length} staff members`}
          </p>
        </div>

        {/* 担当者リスト */}
        <div className={tableStyles.tableContainer}>
          <div className="max-w-4xl">
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
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
                {filteredStaff.map((staff) => (
                  <tr
                    key={staff.$id.value}
                    className={tableStyles.trClickable}
                    onClick={() => handleRowClick(staff.$id.value)}
                    onKeyDown={(e) => handleRowKeyDown(e, staff.$id.value)}
                    role="link"
                    tabIndex={0}
                  >
                    <td className={`${tableStyles.td} font-medium text-indigo-600`}>
                      {staff.担当者名?.value}
                    </td>
                    <td className={tableStyles.td}>
                      {staff.ルックアップ?.value}
                    </td>
                    <td className={`${tableStyles.td} hidden md:table-cell`}>
                      {staff.Divison?.value || '-'}
                    </td>
                    <td className={`${tableStyles.td} hidden lg:table-cell`}>
                      {staff.Position?.value || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {staff.メールアドレス?.value ? (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `mailto:${staff.メールアドレス.value}`;
                          }}
                          className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                        >
                          {staff.メールアドレス.value}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredStaff.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {language === 'ja' ? '該当する担当者が見つかりません' : 
                   language === 'th' ? 'ไม่พบผู้ติดต่อที่ตรงกัน' : 
                   'No staff members found'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}