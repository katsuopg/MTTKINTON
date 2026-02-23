import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import { DetailPageHeader } from '@/components/ui/DetailPageHeader';
import { detailStyles, getStatusBadgeClass } from '@/components/ui/DetailStyles';
import { tableStyles } from '@/components/ui/TableStyles';

interface SupabasePOLineItem {
  id: string;
  po_record_id: string;
  kintone_row_id: string | null;
  item_no: string | null;
  description: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  amount: number | null;
  line_status: string | null;
  line_payment: string | null;
  line_date_1: string | null;
  line_date_2: string | null;
  notes: string | null;
  sort_order: number | null;
}

interface PODetailPageProps {
  params: {
    locale: string;
    id: string;
  };
}

export default async function PODetailPage({ params: { locale, id } }: PODetailPageProps) {
  const supabase = await createClient();

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = language === 'ja' ? '発注詳細' : language === 'th' ? 'รายละเอียดใบสั่งซื้อ' : 'PO Details';

  // SupabaseからPOレコードを取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: poData, error: poError } = await supabase
    .from('po_records')
    .select('*')
    .eq('kintone_record_id', id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const poRecord = poData as any;

  if (poError) {
    console.error('Error fetching PO record:', poError);
  }

  // 明細行を取得
  let lineItems: SupabasePOLineItem[] = [];
  if (poRecord) {
    const { data: lines, error: lineError } = await supabase
      .from('po_line_items')
      .select('*')
      .eq('po_record_id', poRecord.id)
      .order('sort_order', { ascending: true });

    if (lineError) {
      console.error('Error fetching line items:', lineError);
    } else {
      lineItems = (lines || []) as SupabasePOLineItem[];
    }
  }

  const userInfo = await getCurrentUserInfo();

  if (!poRecord) {
    return (
      <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500">
              {language === 'ja' ? 'データが見つかりません' :
               language === 'th' ? 'ไม่พบข้อมูล' :
               'Data not found'}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 納期チェック
  const deliveryDate = poRecord.delivery_date ? new Date(poRecord.delivery_date) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = deliveryDate && deliveryDate < today;

  // 納品済みチェック
  const isDelivered = poRecord.po_status === 'Delivered' ||
                    poRecord.po_status === '納品済み' ||
                    poRecord.po_status === 'Arrived';

  // タイトル構築
  const titleParts = [
    poRecord.po_no,
    poRecord.work_no,
    poRecord.supplier_name,
    poRecord.subject,
  ].filter(Boolean);
  const headerTitle = titleParts.join(' - ') || '-';

  // 承認ステータスバッジ
  const getApprovalBadgeClass = (status: string) => {
    if (status === 'Approval' || status === 'Approved') return getStatusBadgeClass('Working');
    if (status === 'Checking Boss' || status === 'UnProcess') return getStatusBadgeClass('Processing');
    if (status === 'Cancelled' || status === 'キャンセル') return getStatusBadgeClass('Cancelled');
    return getStatusBadgeClass('');
  };

  return (
    <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle} userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}>
      <div className={detailStyles.pageWrapper}>
        <DetailPageHeader
          backHref={`/${locale}/po-management`}
          title={headerTitle}
          statusBadge={
            <span className={getApprovalBadgeClass(poRecord.approval_status || '')}>
              {poRecord.approval_status || '-'}
            </span>
          }
        />

        {/* カード: 基本情報 + 追加情報 + 明細 + 金額 */}
        <div className={detailStyles.card}>
          {/* 基本情報 */}
          <div className={detailStyles.cardHeader}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
              {language === 'ja' ? '基本情報' : language === 'th' ? 'ข้อมูลพื้นฐาน' : 'Basic Information'}
            </h3>
          </div>
          <div className={detailStyles.cardContent}>
            <div className={detailStyles.grid4}>
              <div>
                <div className={detailStyles.fieldLabel}>{language === 'ja' ? '工事番号' : 'Work No.'}</div>
                <div className={`${detailStyles.fieldValue} mt-1`}>
                  {poRecord.work_no ? (
                    <Link href={`/${locale}/workno/${poRecord.work_no}`} className="text-brand-500 hover:text-brand-600 underline">
                      {poRecord.work_no}
                    </Link>
                  ) : '-'}
                </div>
              </div>
              <div>
                <div className={detailStyles.fieldLabel}>CS ID</div>
                <div className={`${detailStyles.fieldValue} mt-1`}>{poRecord.cs_id || '-'}</div>
              </div>
              <div>
                <div className={detailStyles.fieldLabel}>{language === 'ja' ? 'サプライヤー' : 'Supplier'}</div>
                <div className={`${detailStyles.fieldValue} mt-1`}>{poRecord.supplier_name || '-'}</div>
              </div>
              <div>
                <div className={detailStyles.fieldLabel}>{language === 'ja' ? '支払条件' : 'Payment Terms'}</div>
                <div className={`${detailStyles.fieldValue} mt-1`}>{poRecord.payment_term || '-'}</div>
              </div>
              <div>
                <div className={detailStyles.fieldLabel}>{language === 'ja' ? '発注日' : 'PO Date'}</div>
                <div className={`${detailStyles.fieldValue} mt-1`}>{poRecord.po_date || '-'}</div>
              </div>
              <div>
                <div className={detailStyles.fieldLabel}>{language === 'ja' ? '納期' : 'Delivery Date'}</div>
                <div className={`${detailStyles.fieldValue} mt-1 ${isOverdue && !isDelivered ? 'text-error-600 font-medium' : ''}`}>
                  {poRecord.delivery_date || '-'}
                  {isOverdue && !isDelivered && ' ⚠️'}
                </div>
              </div>
              <div>
                <div className={detailStyles.fieldLabel}>{language === 'ja' ? 'POステータス' : 'PO Status'}</div>
                <div className={`${detailStyles.fieldValue} mt-1`}>
                  {poRecord.po_status ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-theme-xs font-medium ${
                      isDelivered ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400'
                    }`}>
                      {poRecord.po_status}
                    </span>
                  ) : '-'}
                </div>
              </div>
              <div>
                <div className={detailStyles.fieldLabel}>QT No.</div>
                <div className={`${detailStyles.fieldValue} mt-1`}>{poRecord.qt_no || '-'}</div>
              </div>
            </div>
          </div>

          {/* 追加情報 */}
          <div className={detailStyles.cardHeaderWithBg}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
              {language === 'ja' ? '追加情報' : language === 'th' ? 'ข้อมูลเพิ่มเติม' : 'Additional Information'}
            </h3>
          </div>
          <div className={detailStyles.cardContent}>
            <div className={detailStyles.grid4}>
              <div>
                <div className={detailStyles.fieldLabel}>{language === 'ja' ? '到着日' : 'Arrival date'}</div>
                <div className={`${detailStyles.fieldValue} mt-1`}>{poRecord.date_1 || '-'}</div>
              </div>
              <div>
                <div className={detailStyles.fieldLabel}>{language === 'ja' ? '支払日' : 'Payment date'}</div>
                <div className={`${detailStyles.fieldValue} mt-1`}>{poRecord.date_2 || '-'}</div>
              </div>
              <div>
                <div className={detailStyles.fieldLabel}>{language === 'ja' ? 'データ' : 'Data'}</div>
                <div className={`${detailStyles.fieldValue} mt-1`}>{poRecord.data_status || '-'}</div>
              </div>
              <div>
                <div className={detailStyles.fieldLabel}>{language === 'ja' ? '請求書日' : 'Invoice Date'}</div>
                <div className={`${detailStyles.fieldValue} mt-1`}>{poRecord.date_5 || '-'}</div>
              </div>
              <div>
                <div className={detailStyles.fieldLabel}>{language === 'ja' ? '開始日' : 'Start in date'}</div>
                <div className={`${detailStyles.fieldValue} mt-1`}>{poRecord.date_6 || '-'}</div>
              </div>
              <div>
                <div className={detailStyles.fieldLabel}>{language === 'ja' ? '終了日' : 'Finish in date'}</div>
                <div className={`${detailStyles.fieldValue} mt-1`}>{poRecord.date_7 || '-'}</div>
              </div>
              <div>
                <div className={detailStyles.fieldLabel}>{language === 'ja' ? '担当者' : 'Requester'}</div>
                <div className={`${detailStyles.fieldValue} mt-1`}>{poRecord.requester || '-'}</div>
              </div>
              <div>
                <div className={detailStyles.fieldLabel}>{language === 'ja' ? '転送先' : 'Forward'}</div>
                <div className={`${detailStyles.fieldValue} mt-1`}>{poRecord.forward || '-'}</div>
              </div>
            </div>
          </div>

          {/* 明細項目 */}
          <div className={detailStyles.cardHeaderWithBg}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
              {language === 'ja' ? '明細項目' : language === 'th' ? 'รายการสินค้า' : 'Line Items'}
            </h3>
          </div>

          {lineItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className={tableStyles.table}>
                <thead className={tableStyles.thead}>
                  <tr>
                    <th className={tableStyles.th}>NO</th>
                    <th className={tableStyles.th}>{language === 'ja' ? '説明' : 'Description'}</th>
                    <th className={`${tableStyles.th} text-right`}>{language === 'ja' ? '数量' : 'QTY'}</th>
                    <th className={`${tableStyles.th} text-center`}>{language === 'ja' ? '単位' : 'Unit'}</th>
                    <th className={`${tableStyles.th} text-right`}>{language === 'ja' ? '単価' : 'Unit Price'}</th>
                    <th className={`${tableStyles.th} text-right`}>{language === 'ja' ? '金額' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody className={tableStyles.tbody}>
                  {lineItems.map((item, index) => (
                    <tr key={item.id} className={tableStyles.tr}>
                      <td className={tableStyles.td}>
                        {item.item_no || index + 1}
                      </td>
                      <td className={tableStyles.td}>
                        {item.description || '-'}
                      </td>
                      <td className={`${tableStyles.td} text-right`}>
                        {item.quantity != null ? item.quantity : '-'}
                      </td>
                      <td className={`${tableStyles.td} text-center`}>
                        {item.unit || '-'}
                      </td>
                      <td className={`${tableStyles.td} text-right`}>
                        {item.unit_price != null ? item.unit_price.toLocaleString() : '-'}
                      </td>
                      <td className={`${tableStyles.td} text-right font-medium`}>
                        {item.amount != null ? item.amount.toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'ja' ? '明細なし' : 'No items'}
              </div>
            </div>
          )}

          {/* 金額フッター */}
          <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4">
            <div className="flex justify-end">
              <div className="space-y-2 w-64">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'ja' ? '小計' : 'Subtotal'}
                  </span>
                  <span className="text-sm text-gray-800 dark:text-white/90 font-medium">
                    {poRecord.subtotal != null ? `${poRecord.subtotal.toLocaleString()} THB` : '0 THB'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'ja' ? '割引' : 'Discount'}
                  </span>
                  <span className="text-sm text-gray-800 dark:text-white/90 font-medium">
                    {poRecord.discount != null ? `${poRecord.discount.toLocaleString()} THB` : '0 THB'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {language === 'ja' ? '合計' : 'Total'}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {poRecord.grand_total != null ? `${poRecord.grand_total.toLocaleString()} THB` : '0 THB'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
