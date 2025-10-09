import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { KintoneClient } from '@/lib/kintone/client';
import { PORecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import POTableRow from './POTableRow';
import FiscalYearSelect from './FiscalYearSelect';
import POFilters from './POFilters';
import { tableStyles } from '@/components/ui/TableStyles';

interface POManagementPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    fiscalYear?: string;
    keyword?: string;
    notArrived?: string;
    alertOnly?: string;
  }>;
}

export default async function POManagementPage({ params, searchParams }: POManagementPageProps) {
  const { locale } = await params;
  const searchParamsResolved = await searchParams;
  const supabase = await createClient();

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = language === 'ja' ? '発注管理' : language === 'th' ? 'การจัดการใบสั่งซื้อ' : 'PO Management';
  
  // 会計期間の取得（デフォルトは第14期）
  const selectedFiscalYear = searchParamsResolved.fiscalYear ? parseInt(searchParamsResolved.fiscalYear) : 14;
  const keyword = searchParamsResolved.keyword || '';
  const notArrived = searchParamsResolved.notArrived === 'true';
  const alertOnly = searchParamsResolved.alertOnly === 'true';
  
  // kintoneからPO Managementアプリのレコードを取得
  let poRecords: PORecord[] = [];
  
  try {
    const poClient = new KintoneClient(
      '22', // PO ManagementアプリID
      process.env.KINTONE_API_TOKEN_PO!
    );
    
    // クエリ条件を構築
    let queryParts = [`ルックアップ like "${selectedFiscalYear}-"`];
    
    // キーワード検索（PO番号、サプライヤー名、工事番号で検索）
    if (keyword) {
      queryParts.push(`(
        文字列__1行__1 like "${keyword}" or 
        ルックアップ_1 like "${keyword}" or 
        ルックアップ like "${keyword}"
      )`);
    }
    
    // Not Arrivedフィルター（Arrivedステータスがないもの）
    // クライアント側でフィルタリングするため、ここでは何もしない
    // (KintoneのドロップダウンフィールドのクエリでOR条件や空文字判定がうまくいかない)
    
    const query = queryParts.join(' and ') + ' order by 日付 desc limit 100';
    poRecords = await poClient.getRecords<PORecord>(query);
    console.log(`Query: ${query}`);
    console.log(`Found ${poRecords.length} PO records`);
    
    // Not Arrivedフィルター（クライアント側でフィルタリング）
    if (notArrived) {
      poRecords = poRecords.filter(record => {
        const status = record.ドロップダウン_1?.value;
        return !status || (status !== 'Arrived' && status !== 'Delivered' && status !== '納品済み');
      });
    }
    
    // アラートフィルター（クライアント側でフィルタリング）
    if (alertOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      poRecords = poRecords.filter(record => {
        // 納期超過チェック
        const deliveryDate = record.日付_0?.value ? new Date(record.日付_0.value) : null;
        const isDelivered = record.ドロップダウン_1?.value === 'Delivered' || 
                          record.ドロップダウン_1?.value === '納品済み' ||
                          record.ドロップダウン_1?.value === 'Arrived';
        const isOverdue = deliveryDate && deliveryDate < today && !isDelivered;
        
        // 納期未設定チェック
        const hasNoDeliveryDate = !record.日付_0?.value && !isDelivered;
        
        return isOverdue || hasNoDeliveryDate;
      });
    }
  } catch (error) {
    console.error('Error fetching PO data:', error);
  }
  
  return (
    <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle}>
      <div className={tableStyles.contentWrapper}>
        {/* 検索バー */}
        <div className={tableStyles.searchWrapper}>
          <div className={tableStyles.searchForm}>
            <p className="text-sm text-gray-600">
              {language === 'ja' 
                ? '発注書の一覧と管理' 
                : language === 'th' 
                ? 'รายการและการจัดการใบสั่งซื้อ' 
                : 'Purchase order list and management'}
            </p>
          </div>
        </div>

        {/* フィルターバー */}
        <div className={tableStyles.filterBar}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* 会計期間セレクター */}
              <FiscalYearSelect currentYear={selectedFiscalYear} locale={locale} language={language} />
              
              {/* フィルター */}
              <POFilters locale={locale} language={language} />
              
              {/* レコード件数表示 */}
              <div className="text-sm text-gray-600">
                {language === 'ja' 
                  ? `${poRecords.length}件の発注書` 
                  : language === 'th' 
                  ? `${poRecords.length} ใบสั่งซื้อ` 
                  : `${poRecords.length} purchase orders`}
              </div>
            </div>
            
            {/* 凡例 */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-50 border border-red-200 rounded mr-2"></div>
                <span className="text-gray-600">
                  {language === 'ja' ? '納期超過' : language === 'th' ? 'เกินกำหนด' : 'Overdue'}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded mr-2"></div>
                <span className="text-gray-600">
                  {language === 'ja' ? '納品済み' : language === 'th' ? 'ส่งมอบแล้ว' : 'Delivered'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={tableStyles.tableContainer}>
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>
                  {language === 'ja' ? '承認' : language === 'th' ? 'การอนุมัติ' : 'Approval'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? 'PO番号' : language === 'th' ? 'เลขที่ PO' : 'PO No.'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? '工事番号' : language === 'th' ? 'หมายเลขงาน' : 'Work No.'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? 'サプライヤー' : language === 'th' ? 'ซัพพลายเออร์' : 'Supplier'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? '発注日' : language === 'th' ? 'วันที่สั่งซื้อ' : 'PO Date'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? '納期' : language === 'th' ? 'กำหนดส่ง' : 'Delivery Date'}
                </th>
                <th className={`${tableStyles.th} text-right`}>
                  {language === 'ja' ? '金額' : language === 'th' ? 'จำนวนเงิน' : 'Amount'}
                </th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {poRecords.map((record) => {
                // 納期チェック
                const deliveryDate = record.日付_0?.value ? new Date(record.日付_0.value) : null;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                // 納品済みチェック（ステータスやドロップダウン_1から判断）
                const isDelivered = record.ドロップダウン_1?.value === 'Delivered' || 
                                  record.ドロップダウン_1?.value === '納品済み' ||
                                  record.ドロップダウン_1?.value === 'Arrived';
                
                // 納期超過チェック（納品済みでない場合のみ）
                const isOverdue = deliveryDate && deliveryDate < today && !isDelivered;
                
                return (
                  <POTableRow
                    key={record.$id.value}
                    record={record}
                    locale={locale}
                    language={language}
                    isDelivered={isDelivered}
                    isOverdue={isOverdue}
                  />
                );
              })}
              {poRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className={`${tableStyles.td} text-center`}>
                    {language === 'ja' 
                      ? 'データがありません' 
                      : language === 'th' 
                      ? 'ไม่มีข้อมูล' 
                      : 'No data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
