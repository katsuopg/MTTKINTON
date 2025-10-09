import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KintoneClient } from '@/lib/kintone/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import type { Language } from '@/lib/kintone/field-mappings';
import { tableStyles } from '@/components/ui/TableStyles';

interface SupplierRecord {
  $id: { value: string };
  レコード番号: { value: string };
  文字列__1行_: { value: string }; // Supplier ID
  会社名: { value: string };
  TEL: { value: string };
  FAX?: { value: string };
  MAIL?: { value: string };
  文字列__複数行_?: { value: string }; // 住所
}

interface SuppliersPageProps {
  params: {
    locale: string;
  };
  searchParams: {
    search?: string;
  };
}

export default async function SuppliersPage({ params: { locale }, searchParams }: SuppliersPageProps) {
  const supabase = await createClient();
  
  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const searchQuery = searchParams.search || '';
  
  // kintoneから仕入業者データを取得
  let suppliers: SupplierRecord[] = [];
  let error = false;
  let useDemo = false;
  
  try {
    const supplierClient = new KintoneClient(
      process.env.KINTONE_APP_SUPPLIER_LIST!,
      process.env.KINTONE_API_TOKEN_SUPPLIER!
    );
    
    suppliers = await supplierClient.getRecords<SupplierRecord>('order by レコード番号 asc limit 100');
    console.log(`Found ${suppliers.length} supplier records`);
    
    // 検索クエリがある場合はフィルタリング
    if (searchQuery) {
      suppliers = suppliers.filter(supplier => {
        const companyName = supplier.文字列__1行_.value.toLowerCase();
        const localName = supplier.会社名.value.toLowerCase();
        const query = searchQuery.toLowerCase();
        return companyName.includes(query) || localName.includes(query);
      });
      
      // 完全一致が1件だけの場合は直接詳細ページへリダイレクト
      if (suppliers.length === 1) {
        const exactMatch = suppliers.find(supplier => 
          supplier.文字列__1行_.value.toLowerCase() === query || 
          supplier.会社名.value.toLowerCase() === query
        );
        if (exactMatch) {
          redirect(`/${locale}/suppliers/${exactMatch.$id.value}`);
        }
      }
    }
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    error = true;
    
    // エラー時はデモデータを表示
    useDemo = true;
    suppliers = [
      {
        $id: { value: '1' },
        レコード番号: { value: '001' },
        文字列__1行_: { value: 'SUP-001' },
        会社名: { value: '株式会社サンプルサプライヤー' },
        TEL: { value: '03-1234-5678' },
        FAX: { value: '03-1234-5679' },
        MAIL: { value: 'sample@supplier.com' },
        文字列__複数行_: { value: '東京都千代田区サンプル1-2-3' }
      },
      {
        $id: { value: '2' },
        レコード番号: { value: '002' },
        文字列__1行_: { value: 'SUP-002' },
        会社名: { value: 'デモ商事株式会社' },
        TEL: { value: '06-9876-5432' },
        MAIL: { value: 'info@demo-shoji.co.jp' },
        文字列__複数行_: { value: '大阪府大阪市北区デモ町4-5-6' }
      }
    ];
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
                language === 'ja' ? `「${searchQuery}」の検索結果: ${suppliers.length}件` : 
                language === 'th' ? `ผลการค้นหา "${searchQuery}": ${suppliers.length} รายการ` : 
                `Search results for "${searchQuery}": ${suppliers.length} items`
              ) : (
                language === 'ja' ? `${suppliers.length}件の仕入業者` : 
                language === 'th' ? `${suppliers.length} ซัพพลายเออร์` : 
                `${suppliers.length} suppliers`
              )}
              {useDemo && (
                <span className="ml-2 text-sm text-gray-500">
                  ({language === 'ja' ? 'デモデータ' : language === 'th' ? 'ข้อมูลตัวอย่าง' : 'Demo Data'})
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
                {language === 'ja' ? 'エラー: KintoneアプリIDまたはAPIトークンが正しくありません。管理者に確認してください。' : 
                 language === 'th' ? 'ข้อผิดพลาด: Kintone App ID หรือ API Token ไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ' : 
                 'Error: Kintone App ID or API Token is incorrect. Please contact the administrator.'}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                App ID: {process.env.KINTONE_APP_SUPPLIER_LIST} (環境変数: KINTONE_APP_SUPPLIER_LIST)
              </p>
              <p className="text-sm text-blue-600 mt-3">
                {language === 'ja' ? '※ 以下はデモデータを表示しています' : 
                 language === 'th' ? '※ แสดงข้อมูลตัวอย่าง' : 
                 '※ Showing demo data'}
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
                  <tr key={supplier.$id.value} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {supplier.会社名.value || supplier.文字列__1行_.value || '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.TEL.value || '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                      {supplier.MAIL?.value || '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                      <div className="max-w-xs truncate">
                        {supplier.文字列__複数行_?.value || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a
                        href={`/${locale}/suppliers/${supplier.$id.value}`}
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
        </div>
      </div>
    </DashboardLayout>
  );
}
