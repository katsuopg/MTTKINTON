import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { KintoneClient } from '@/lib/kintone/client';
import { PORecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { type Language } from '@/lib/kintone/field-mappings';

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
  
  // kintoneから特定のPOレコードを取得
  let poRecord: PORecord | null = null;
  
  try {
    const poClient = new KintoneClient(
      '22', // PO Managementアプリ ID
      process.env.KINTONE_API_TOKEN_PO!
    );
    poRecord = await poClient.getRecord<PORecord>(id);
  } catch (error) {
    console.error('Error fetching PO record:', error);
  }

  if (!poRecord) {
    return (
      <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle}>
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-slate-500">
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
  const deliveryDate = poRecord.日付_0?.value ? new Date(poRecord.日付_0.value) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = deliveryDate && deliveryDate < today;
  
  // 納品済みチェック
  const isDelivered = poRecord.ドロップダウン_1?.value === 'Delivered' || 
                    poRecord.ドロップダウン_1?.value === '納品済み' ||
                    poRecord.ドロップダウン_1?.value === 'Arrived';

  return (
    <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle}>
      <div className="p-4 h-full overflow-hidden">
        {/* ヘッダー部分 */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-slate-900">
              {poRecord.文字列__1行__1?.value || '-'}
            </h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              poRecord.ステータス.value === 'Approval' || poRecord.ステータス.value === 'Approved'
                ? 'bg-emerald-100 text-emerald-800'
                : poRecord.ステータス.value === 'Checking Boss' || poRecord.ステータス.value === 'UnProcess' 
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-slate-100 text-slate-800'
            }`}>
              {poRecord.ステータス.value}
            </span>
            {isDelivered && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {poRecord.ドロップダウン_1?.value}
              </span>
            )}
            <span className="text-sm text-slate-600">
              {language === 'ja' ? '発注日' : language === 'th' ? 'วันที่สั่งซื้อ' : 'PO Date'}: {poRecord.日付?.value || '-'}
            </span>
            <span className={`text-sm ${isOverdue && !isDelivered ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
              {language === 'ja' ? '納期' : language === 'th' ? 'กำหนดส่ง' : 'Due Date'}: {poRecord.日付_0?.value || '-'}
              {isOverdue && !isDelivered && ' ⚠️'}
            </span>
          </div>
          <Link 
            href={`/${locale}/po-management`}
            className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
          >
            {language === 'ja' ? '一覧に戻る' : language === 'th' ? 'กลับไปยังรายการ' : 'Back to List'}
          </Link>
        </div>

        {/* 基本情報と明細を一つのカードに統合 */}
        <div className="bg-white shadow rounded-lg">
          {/* 基本情報 */}
          <div className="p-4 border-b">
            <h3 className="text-sm font-medium text-slate-900 mb-3">
              {language === 'ja' ? '基本情報' : language === 'th' ? 'ข้อมูลพื้นฐาน' : 'Basic Information'}
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-slate-500">{language === 'ja' ? '工事番号' : 'Work No.'}</label>
                <div className="text-sm mt-1">
                  {poRecord.ルックアップ?.value ? (
                    <Link 
                      href={`/${locale}/workno`}
                      className="text-indigo-600 hover:text-indigo-900 underline"
                    >
                      {poRecord.ルックアップ.value}
                    </Link>
                  ) : '-'}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500">CS ID</label>
                <div className="text-sm mt-1 text-slate-900">{poRecord.文字列__1行__2?.value || '-'}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500">{language === 'ja' ? 'サプライヤー' : 'Supplier'}</label>
                <div className="text-sm mt-1 text-slate-900">{poRecord.ルックアップ_1?.value || '-'}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500">{language === 'ja' ? '支払条件' : 'Payment Terms'}</label>
                <div className="text-sm mt-1 text-slate-900">{poRecord.ドロップダウン_0?.value || '-'}</div>
              </div>
            </div>
          </div>

          {/* 追加情報 */}
          <div className="p-4 border-b">
            <h3 className="text-sm font-medium text-slate-900 mb-3">
              {language === 'ja' ? '追加情報' : language === 'th' ? 'ข้อมูลเพิ่มเติม' : 'Additional Information'}
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-slate-500">{language === 'ja' ? '到着日' : 'Arrival date'}</label>
                <div className="text-sm mt-1 text-slate-900">{poRecord.日付_1?.value || '-'}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500">{language === 'ja' ? '支払日' : 'Payment date'}</label>
                <div className="text-sm mt-1 text-slate-900">{poRecord.日付_2?.value || '-'}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500">{language === 'ja' ? 'データ' : 'Data'}</label>
                <div className="text-sm mt-1 text-slate-900">{poRecord.ドロップダウン_4?.value || '-'}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500">{language === 'ja' ? '請求書日' : 'Invoice Date'}</label>
                <div className="text-sm mt-1 text-slate-900">{poRecord.日付_5?.value || '-'}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500">{language === 'ja' ? '開始日' : 'Start in date'}</label>
                <div className="text-sm mt-1 text-slate-900">{poRecord.日付_6?.value || '-'}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500">{language === 'ja' ? '終了日' : 'Finish in date'}</label>
                <div className="text-sm mt-1 text-slate-900">{poRecord.日付_7?.value || '-'}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500">QT No.</label>
                <div className="text-sm mt-1 text-slate-900">{poRecord.文字列__1行__3?.value || '-'}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500">QT file</label>
                <div className="text-sm mt-1">
                  {poRecord.添付ファイル?.value && poRecord.添付ファイル.value.length > 0 ? (
                    <a 
                      href={poRecord.添付ファイル.value[0].fileKey} 
                      className="text-indigo-600 hover:text-indigo-900 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {poRecord.添付ファイル.value[0].name}
                    </a>
                  ) : '-'}
                </div>
              </div>
            </div>
          </div>

          {/* 明細項目 */}
          <div className="px-4 py-3 border-b">
            <h3 className="text-sm font-medium text-slate-900">
              {language === 'ja' ? '明細項目' : language === 'th' ? 'รายการสินค้า' : 'Line Items'}
            </h3>
          </div>
          
          {poRecord.Table?.value && poRecord.Table.value.length > 0 && (
            <div>
              <table className="min-w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">NO</th>
                    <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{language === 'ja' ? '説明' : 'Description'}</th>
                    <th className="whitespace-nowrap px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{language === 'ja' ? '数量' : 'QTY'}</th>
                    <th className="whitespace-nowrap px-4 py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">{language === 'ja' ? '単位' : 'Unit'}</th>
                    <th className="whitespace-nowrap px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{language === 'ja' ? '単価' : 'Unit Price'}</th>
                    <th className="whitespace-nowrap px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{language === 'ja' ? '金額' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {poRecord.Table.value.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50 border-b border-slate-200">
                      <td className="whitespace-nowrap px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                        {item.value.文字列__1行_?.value || index + 1}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">
                        {item.value.文字列__1行__0?.value || '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 whitespace-nowrap text-sm text-slate-900 text-right">
                        {item.value.QTY?.value || '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 whitespace-nowrap text-sm text-slate-900 text-center">
                        {item.value.ドロップダウン?.value || '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 whitespace-nowrap text-sm text-slate-900 text-right">
                        {item.value.unit_price?.value ? `${parseFloat(item.value.unit_price.value).toLocaleString()}` : '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 text-right">
                        {item.value.total?.value ? `${parseFloat(item.value.total.value).toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {poRecord.Table?.value && poRecord.Table.value.length === 0 && (
            <div className="p-8 text-center">
              <div className="text-sm text-slate-500">
                {language === 'ja' ? '明細なし' : 'No items'}
              </div>
            </div>
          )}
          
          {/* 金額フッター */}
          <div className="bg-slate-50 border-t px-4 py-3">
            <div className="flex justify-end">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 mr-8">
                    {language === 'ja' ? '小計' : 'Subtotal'}
                  </span>
                  <span className="text-sm text-slate-900 font-medium text-right">
                    {poRecord.subtotal?.value ? `${parseFloat(poRecord.subtotal.value).toLocaleString()} THB` : '0 THB'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 mr-8">
                    {language === 'ja' ? '割引' : 'Discount'}
                  </span>
                  <span className="text-sm text-slate-900 font-medium text-right">
                    {poRecord.discount?.value ? `${parseFloat(poRecord.discount.value).toLocaleString()} THB` : '0 THB'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm font-medium text-slate-900 mr-8">
                    {language === 'ja' ? '合計' : 'Total'}
                  </span>
                  <span className="text-sm font-bold text-slate-900 text-right">
                    {poRecord.grand_total?.value ? `${parseFloat(poRecord.grand_total.value).toLocaleString()} THB` : '0 THB'}
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