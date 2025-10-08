import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KintoneClient } from '@/lib/kintone/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import OrderFilters from './OrderFilters';
import FileViewerModal from './FileViewerModal';
import { tableStyles } from '@/components/ui/TableStyles';

// 注文書レコードの型定義
interface OrderRecord {
  $id: { type: "__ID__"; value: string };
  レコード番号: { type: "RECORD_NUMBER"; value: string };
  文字列__1行_: { type: "SINGLE_LINE_TEXT"; value: string }; // PO番号
  文字列__1行__0: { type: "SINGLE_LINE_TEXT"; value: string }; // CS ID
  文字列__1行__2: { type: "SINGLE_LINE_TEXT"; value: string }; // 工事番号
  文字列__1行__4: { type: "SINGLE_LINE_TEXT"; value: string }; // 顧客名
  文字列__1行__7: { type: "SINGLE_LINE_TEXT"; value: string }; // 件名
  McItem: { type: "SINGLE_LINE_TEXT"; value: string }; // M/C ITEM
  文字列__1行__9: { type: "SINGLE_LINE_TEXT"; value: string }; // Model
  日付: { type: "DATE"; value: string }; // 注文日
  日付_0: { type: "DATE"; value: string }; // 見積日
  ルックアップ: { type: "SINGLE_LINE_TEXT"; value: string }; // 見積番号
  数値_3: { type: "NUMBER"; value: string }; // 値引き前金額
  数値_4: { type: "NUMBER"; value: string }; // 値引き額
  AF: { type: "NUMBER"; value: string }; // 値引き後金額
  amount: { type: "CALC"; value: string }; // 合計金額（税込）
  vat: { type: "CALC"; value: string }; // 消費税額
  Drop_down: { type: "DROP_DOWN"; value: string }; // ステータス
  添付ファイル: { type: "FILE"; value: Array<{
    fileKey: string;
    name: string;
    contentType: string;
    size: string;
  }> };
  更新日時: { type: "UPDATED_TIME"; value: string };
}

interface OrderManagementPageProps {
  params: {
    locale: string;
  };
  searchParams: {
    fiscalYear?: string;
    keyword?: string;
  };
}

export default async function OrderManagementPage({ params: { locale }, searchParams }: OrderManagementPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = language === 'ja' ? '注文書管理' : language === 'th' ? 'จัดการใบสั่งซื้อ' : 'Order Management';
  
  // 会計期間の取得（デフォルトは第14期）
  const selectedFiscalYear = searchParams.fiscalYear ? parseInt(searchParams.fiscalYear) : 14;
  const keyword = searchParams.keyword || '';
  
  // kintoneから注文書管理アプリのレコードを取得
  let orderRecords: OrderRecord[] = [];
  
  try {
    const orderClient = new KintoneClient(
      process.env.KINTONE_APP_ORDER_MANAGEMENT!,
      process.env.KINTONE_API_TOKEN_ORDER!
    );
    
    // クエリ条件を構築
    let queryParts = [`文字列__1行__2 like "${selectedFiscalYear}-"`]; // 工事番号でフィルタ
    
    // キーワード検索
    if (keyword) {
      queryParts.push(`(
        文字列__1行_ like "${keyword}" or 
        文字列__1行__4 like "${keyword}" or 
        文字列__1行__2 like "${keyword}" or
        ルックアップ like "${keyword}"
      )`);
    }
    
    const query = queryParts.join(' and ') + ' order by 日付 desc limit 200';
    orderRecords = await orderClient.getRecords<OrderRecord>(query);
    console.log(`Found ${orderRecords.length} order records`);
  } catch (error) {
    console.error('Error fetching order data:', error);
  }
  
  // 日付フォーマット関数
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}/${month}/${day}`;
  };
  
  return (
    <DashboardLayout locale={locale} userEmail={user.email || ''} title={pageTitle}>
      <div className={tableStyles.contentWrapper}>
        {/* 検索バー */}
        <div className={tableStyles.searchWrapper}>
          <div className={tableStyles.searchForm}>
            <p className="text-sm text-gray-600">
              {language === 'ja' 
                ? '注文書の一覧と管理' 
                : language === 'th' 
                ? 'รายการและการจัดการใบสั่งซื้อ' 
                : 'Order list and management'}
            </p>
          </div>
        </div>

        {/* フィルターバー */}
        <div className={tableStyles.filterBar}>
          <div className="flex items-center justify-between">
            <OrderFilters 
              currentYear={selectedFiscalYear} 
              locale={locale} 
              language={language} 
            />
            
            {/* レコード件数表示 */}
            <div className="text-sm text-gray-600">
              {language === 'ja' 
                ? `${orderRecords.length}件の注文書` 
                : language === 'th' 
                ? `${orderRecords.length} ใบสั่งซื้อ` 
                : `${orderRecords.length} orders`}
            </div>
          </div>
        </div>

        <div className={tableStyles.tableContainer}>
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>
                  {language === 'ja' ? 'PO番号' : language === 'th' ? 'เลขที่ PO' : 'PO No.'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? '工事番号' : language === 'th' ? 'หมายเลขงาน' : 'Work No.'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? '顧客名' : language === 'th' ? 'ชื่อลูกค้า' : 'Customer'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? '件名' : language === 'th' ? 'ชื่องาน' : 'Subject'}
                </th>
                <th className={tableStyles.th}>
                  M/C ITEM
                </th>
                <th className={tableStyles.th}>
                  MODEL
                </th>
                <th className={`${tableStyles.th} text-right`}>
                  {language === 'ja' ? '金額' : language === 'th' ? 'จำนวนเงิน' : 'Amount'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? 'PO日' : language === 'th' ? 'วันที่ PO' : 'PO Date'}
                </th>
                <th className={tableStyles.th}>
                  {language === 'ja' ? 'ステータス' : language === 'th' ? 'สถานะ' : 'Status'}
                </th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {orderRecords.map((record) => (
                <tr key={record.$id.value} className={tableStyles.tr}>
                  <td className={`${tableStyles.td} font-medium`}>
                    <a
                      href={`/${locale}/order-management/${record.$id.value}`}
                      className={tableStyles.tdLink}
                    >
                      {record.文字列__1行_?.value || '-'}
                    </a>
                  </td>
                  <td className={tableStyles.td}>
                    <a
                      href={`/${locale}/workno/${record.文字列__1行__2?.value}`}
                      className={tableStyles.tdLink}
                    >
                      {record.文字列__1行__2?.value || '-'}
                    </a>
                  </td>
                  <td className={tableStyles.td}>
                    {record.文字列__1行__4?.value || '-'}
                  </td>
                  <td className={tableStyles.td}>
                    {record.文字列__1行__7?.value || '-'}
                  </td>
                  <td className={tableStyles.td}>
                    {record.McItem?.value || '-'}
                  </td>
                  <td className={tableStyles.td}>
                    {record.文字列__1行__9?.value || '-'}
                  </td>
                  <td className={`${tableStyles.td} text-right font-medium`}>
                    {record.amount?.value ? `${Number(record.amount.value).toLocaleString()}B` : '-'}
                  </td>
                  <td className={tableStyles.td}>
                    {formatDate(record.日付?.value)}
                  </td>
                  <td className={tableStyles.td}>
                    {record.Drop_down?.value || '-'}
                  </td>
                </tr>
              ))}
              {orderRecords.length === 0 && (
                <tr>
                  <td colSpan={9} className={`${tableStyles.td} text-center`}>
                    {language === 'ja' ? 'データがありません' : 'No data available'}
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