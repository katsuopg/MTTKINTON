import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import type { Language } from '@/lib/kintone/field-mappings';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import { detailStyles } from '@/components/ui/DetailStyles';
import { DetailPageHeader } from '@/components/ui/DetailPageHeader';
import Link from 'next/link';
import { Building2, Phone, Mail, MapPin } from 'lucide-react';

type SupabaseAny = any;

interface Supplier {
  id: string;
  supplier_id: string;
  company_name: string;
  company_name_en: string;
  phone_number: string | null;
  fax_number: string | null;
  email: string | null;
  address: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface SupplierDetailPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  const { locale, id } = await params;
  const supabase = await createClient();

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  // Supabaseから仕入業者詳細を取得
  const { data: supplier, error } = await (supabase.from('suppliers') as SupabaseAny)
    .select('*')
    .eq('id', id)
    .single() as { data: Supplier | null; error: any };

  const pageTitle = language === 'ja' ? '仕入業者詳細' : language === 'th' ? 'รายละเอียดซัพพลายเออร์' : 'Supplier Details';

  const userInfo = await getCurrentUserInfo();

  if (error || !supplier) {
    return (
      <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
        <div className={detailStyles.pageWrapper}>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">
              {language === 'ja' ? '仕入業者データの取得に失敗しました' :
               language === 'th' ? 'ไม่สามารถโหลดข้อมูลซัพพลายเออร์' :
               'Failed to load supplier data'}
            </p>
            <Link
              href={`/${locale}/suppliers`}
              className={`mt-4 inline-block ${detailStyles.link}`}
            >
              {language === 'ja' ? '一覧に戻る' : language === 'th' ? 'กลับไปที่รายการ' : 'Back to List'}
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 表示する会社名（言語に応じて）
  const displayName = language === 'th'
    ? (supplier.company_name || supplier.company_name_en)
    : (supplier.company_name_en || supplier.company_name);

  return (
    <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
      <div className={detailStyles.pageWrapper}>
        <DetailPageHeader
          backHref={`/${locale}/suppliers`}
          title={displayName}
        />

        {/* 基本情報カード */}
        <div className={detailStyles.card}>
          <div className={detailStyles.cardHeaderWithBg}>
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
              <Building2 size={20} />
              {language === 'ja' ? '基本情報' : language === 'th' ? 'ข้อมูลพื้นฐาน' : 'Basic Information'}
            </h2>
          </div>
          <div className={`${detailStyles.cardContent} ${detailStyles.grid2}`}>
            {/* 会社名（英語） */}
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '会社名（英語）' : language === 'th' ? 'ชื่อบริษัท (อังกฤษ)' : 'Company Name (English)'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>
                {supplier.company_name_en || '-'}
              </p>
            </div>

            {/* 会社名（タイ語） */}
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '会社名（タイ語）' : language === 'th' ? 'ชื่อบริษัท (ไทย)' : 'Company Name (Thai)'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>
                {supplier.company_name || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* 連絡先カード */}
        <div className={detailStyles.card}>
          <div className={detailStyles.cardHeaderWithBg}>
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
              <Phone size={20} />
              {language === 'ja' ? '連絡先' : language === 'th' ? 'ข้อมูลติดต่อ' : 'Contact Information'}
            </h2>
          </div>
          <div className={`${detailStyles.cardContent} ${detailStyles.grid2}`}>
            {/* 電話番号 */}
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '電話番号' : language === 'th' ? 'เบอร์โทรศัพท์' : 'Phone'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>
                {supplier.phone_number || '-'}
              </p>
            </div>

            {/* FAX */}
            <div>
              <label className={detailStyles.fieldLabel}>FAX</label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>
                {supplier.fax_number || '-'}
              </p>
            </div>

            {/* メール */}
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? 'メール' : language === 'th' ? 'อีเมล' : 'Email'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>
                {supplier.email ? (
                  <a href={`mailto:${supplier.email}`} className={detailStyles.link}>
                    {supplier.email}
                  </a>
                ) : '-'}
              </p>
            </div>

            {/* 住所 */}
            <div className="md:col-span-2">
              <label className={detailStyles.fieldLabel}>
                <MapPin size={14} className="inline mr-1" />
                {language === 'ja' ? '住所' : language === 'th' ? 'ที่อยู่' : 'Address'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue} whitespace-pre-wrap`}>
                {supplier.address || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* メタ情報 */}
        <div className={detailStyles.card}>
          <div className={`${detailStyles.cardContent} ${detailStyles.grid2}`}>
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '作成日時' : language === 'th' ? 'วันที่สร้าง' : 'Created'}
              </label>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {supplier.created_at ? new Date(supplier.created_at).toLocaleString(locale) : '-'}
              </p>
            </div>
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '更新日時' : language === 'th' ? 'วันที่อัปเดต' : 'Updated'}
              </label>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {supplier.updated_at ? new Date(supplier.updated_at).toLocaleString(locale) : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
