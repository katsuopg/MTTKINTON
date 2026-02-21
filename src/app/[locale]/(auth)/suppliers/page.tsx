import { createClient } from '../../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import type { Language } from '@/lib/kintone/field-mappings';
import { tableStyles } from '@/components/ui/TableStyles';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { ClickableRow } from '@/components/ui/ClickableRow';

interface Supplier {
  id: string;
  supplier_id: string;
  company_name: string; // タイ語会社名
  company_name_en: string; // 英語会社名
  phone_number: string | null;
  fax_number: string | null;
  email: string | null;
  address: string | null;
  kintone_record_id: string | null;
}

interface SuppliersPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    search?: string;
  }>;
}

export default async function SuppliersPage({ params, searchParams }: SuppliersPageProps) {
  const { locale } = await params;
  const searchParamsResolved = await searchParams;
  const supabase = await createClient();

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const searchQuery = searchParamsResolved.search || '';

  // Supabaseから仕入業者データを取得
  let query = supabase
    .from('suppliers')
    .select('*')
    .order('company_name_en', { ascending: true });

  // 検索クエリがある場合
  if (searchQuery) {
    query = query.or(`company_name_en.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%`);
  }

  const { data: suppliers, error } = await query;

  if (error) {
    console.error('Error fetching suppliers:', error);
  }

  const pageTitle = language === 'ja' ? '仕入業者管理' : language === 'th' ? 'จัดการซัพพลายเออร์' : 'Supplier Management';

  const userInfo = await getCurrentUserInfo();

  return (
    <DashboardLayout
      locale={locale}
      userEmail={user.email}
      title={pageTitle}
      userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
    >
      <div className={tableStyles.contentWrapper}>
        {/* 検索バー（ListPageHeader統一レイアウト） */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <form method="get" action={`/${locale}/suppliers`} className="relative flex-1 min-w-[200px] max-w-md flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder={language === 'ja' ? '会社名で検索...' : language === 'th' ? 'ค้นหาตามชื่อบริษัท...' : 'Search by company name...'}
                className="w-full pl-10 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:placeholder-gray-500"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
            >
              {language === 'ja' ? '検索' : language === 'th' ? 'ค้นหา' : 'Search'}
            </button>
            {searchQuery && (
              <a
                href={`/${locale}/suppliers`}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                {language === 'ja' ? 'クリア' : language === 'th' ? 'ล้าง' : 'Clear'}
              </a>
            )}
          </form>
          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {suppliers?.length || 0}{language === 'ja' ? '件の仕入業者' : language === 'th' ? ' ซัพพลายเออร์' : ' suppliers'}
          </span>
        </div>

        {/* テーブル */}
        <div className={tableStyles.tableContainer}>
          <div className="max-w-full overflow-x-auto">
            {!suppliers || suppliers.length === 0 ? (
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
                  {suppliers.map((supplier: Supplier) => (
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
      </div>
    </DashboardLayout>
  );
}
