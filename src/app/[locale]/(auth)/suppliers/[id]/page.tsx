import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KintoneClient } from '@/lib/kintone/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import type { Language } from '@/lib/kintone/field-mappings';
import { getCurrentUserInfo } from '@/lib/auth/user-info';

interface SupplierRecord {
  $id: { value: string };
  レコード番号: { value: string };
  文字列__1行_: { value: string }; // Supplier ID
  会社名: { value: string };
  TEL: { value: string };
  FAX?: { value: string };
  MAIL?: { value: string };
  文字列__複数行_?: { value: string }; // 住所
  TEL_0?: { value: string }; // 追加TEL
  リンク?: { value: string }; // ウェブサイト
  文字列__複数行__0?: { value: string }; // メモ
  更新日時?: { value: string };
  作成日時?: { value: string };
}

interface SupplierDetailPageProps {
  params: {
    locale: string;
    id: string;
  };
}

export default async function SupplierDetailPage({ params: { locale, id } }: SupplierDetailPageProps) {
  const supabase = await createClient();
  
  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  
  // kintoneから仕入業者詳細を取得
  let supplier: SupplierRecord | null = null;
  let error = false;
  
  try {
    const supplierClient = new KintoneClient(
      process.env.KINTONE_APP_SUPPLIER_LIST!,
      process.env.KINTONE_API_TOKEN_SUPPLIER!
    );
    
    supplier = await supplierClient.getRecord<SupplierRecord>(id);
  } catch (err) {
    console.error('Error fetching supplier detail:', err);
    error = true;
  }

  const pageTitle = language === 'ja' ? '仕入業者詳細' : language === 'th' ? 'รายละเอียดซัพพลายเออร์' : 'Supplier Details';

  const userInfo = await getCurrentUserInfo();

  if (error || !supplier) {
    return (
      <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">
              {language === 'ja' ? '仕入業者データの取得に失敗しました' : 
               language === 'th' ? 'ไม่สามารถโหลดข้อมูลซัพพลายเออร์' : 
               'Failed to load supplier data'}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
      <div className="p-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* ヘッダー */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {supplier.文字列__1行_.value || supplier.会社名.value}
                </h3>
              </div>
              <div>
                <a
                  href={`/${locale}/suppliers`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {language === 'ja' ? '一覧に戻る' : language === 'th' ? 'กลับไปที่รายการ' : 'Back to List'}
                </a>
              </div>
            </div>
          </div>

          {/* 詳細情報 */}
          <div className="px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              {/* 会社名（タイ語） */}
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  {language === 'ja' ? '会社名（現地語）' : language === 'th' ? 'ชื่อบริษัท' : 'Company Name (Local)'}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {supplier.会社名.value || '-'}
                </dd>
              </div>

              {/* 電話番号 */}
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  {language === 'ja' ? '電話番号' : language === 'th' ? 'เบอร์โทรศัพท์' : 'Phone'}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {supplier.TEL.value || '-'}
                  {supplier.TEL_0?.value && (
                    <span className="ml-2">/ {supplier.TEL_0.value}</span>
                  )}
                </dd>
              </div>

              {/* FAX */}
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  {language === 'ja' ? 'FAX' : 'FAX'}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {supplier.FAX?.value || '-'}
                </dd>
              </div>

              {/* メール */}
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  {language === 'ja' ? 'メール' : language === 'th' ? 'อีเมล' : 'Email'}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {supplier.MAIL?.value ? (
                    <a href={`mailto:${supplier.MAIL.value}`} className="text-indigo-600 hover:text-indigo-900">
                      {supplier.MAIL.value}
                    </a>
                  ) : '-'}
                </dd>
              </div>

              {/* ウェブサイト */}
              {supplier.リンク?.value && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {language === 'ja' ? 'ウェブサイト' : language === 'th' ? 'เว็บไซต์' : 'Website'}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a href={supplier.リンク.value} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                      {supplier.リンク.value}
                    </a>
                  </dd>
                </div>
              )}

              {/* 住所 */}
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">
                  {language === 'ja' ? '住所' : language === 'th' ? 'ที่อยู่' : 'Address'}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {supplier.文字列__複数行_?.value || '-'}
                </dd>
              </div>

              {/* メモ */}
              {supplier.文字列__複数行__0?.value && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">
                    {language === 'ja' ? 'メモ' : language === 'th' ? 'หมายเหตุ' : 'Notes'}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {supplier.文字列__複数行__0.value}
                  </dd>
                </div>
              )}

              {/* 作成日時 */}
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  {language === 'ja' ? '作成日時' : language === 'th' ? 'วันที่สร้าง' : 'Created Date'}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {supplier.作成日時?.value ? new Date(supplier.作成日時.value).toLocaleString(locale) : '-'}
                </dd>
              </div>

              {/* 更新日時 */}
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  {language === 'ja' ? '更新日時' : language === 'th' ? 'วันที่อัปเดต' : 'Updated Date'}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {supplier.更新日時?.value ? new Date(supplier.更新日時.value).toLocaleString(locale) : '-'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}