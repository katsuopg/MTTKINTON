import { WorkNoDetailContent } from './WorkNoDetailContent';
import { fetchWorkNo, fetchCustomer } from '@/lib/kintone/api';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KintoneClient } from '@/lib/kintone/client';
import { PORecord, QuotationRecord, CostRecord, InvoiceRecord } from '@/types/kintone';
import { getCostRecordsByWorkNo } from '@/lib/kintone/cost';
import { getInvoiceRecordsByWorkNo } from '@/lib/kintone/invoice';
import { getCurrentUserInfo } from '@/lib/auth/user-info';

interface WorkNoDetailPageProps {
  params: {
    locale: string;
    workNo: string;
  };
}

export default async function WorkNoDetailPage({ params }: WorkNoDetailPageProps) {
  const { locale, workNo } = await params;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  // 工事番号の詳細を取得
  const record = await fetchWorkNo(workNo);

  if (!record) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">工事番号が見つかりません</h1>
          <p className="text-gray-600">工事番号: {workNo}</p>
          <a
            href={`/${locale}/dashboard`}
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
          >
            ダッシュボードに戻る
          </a>
        </div>
      </div>
    );
  }

  // CS IDから顧客情報を取得（URLデコードして検索）
  let customer = null;
  if (record.文字列__1行__8?.value) {
    // URLエンコードされたCS IDをデコード
    const decodedCsId = decodeURIComponent(record.文字列__1行__8.value);
    customer = await fetchCustomer(decodedCsId);
  }

  // 工事番号に関連するPOを取得
  let poRecords: PORecord[] = [];
  try {
    const poClient = new KintoneClient(
      '22', // PO ManagementアプリID
      process.env.KINTONE_API_TOKEN_PO!
    );
    
    // 工事番号でPOをフィルタリング
    const query = `ルックアップ = "${workNo}" order by 日付 desc`;
    poRecords = await poClient.getRecords<PORecord>(query);
    console.log(`Found ${poRecords.length} PO records for work no ${workNo}`);
  } catch (error) {
    console.error('Error fetching PO data:', error);
  }

  // 工事番号に関連する見積もりを取得
  let quotationRecords: QuotationRecord[] = [];
  
  try {
    const quotationClient = new KintoneClient(
      '8', // Quotationアプリ ID (ログで確認された正しいID)
      process.env.KINTONE_API_TOKEN_QUOTATION!
    );
    
    // 工事番号の見積もり番号フィールド（ルックアップ_0）で見積もりを検索
    if (record.ルックアップ_0?.value) {
      console.log(`Searching quotation for QT No: ${record.ルックアップ_0.value}`);
      const quotationQuery = `qtno2 = "${record.ルックアップ_0.value}" order by 日付 desc`;
      quotationRecords = await quotationClient.getRecords<QuotationRecord>(quotationQuery);
      console.log(`Found ${quotationRecords.length} Quotation records for QT No ${record.ルックアップ_0.value}`);
    }
  } catch (error) {
    console.error('Error fetching Quotation data:', error);
  }

  // 工事番号に関連するコストデータを取得
  let costRecords: CostRecord[] = [];
  try {
    const costResponse = await getCostRecordsByWorkNo(workNo);
    costRecords = costResponse.records;
    console.log(`Found ${costRecords.length} Cost records for work no ${workNo}`);
  } catch (error) {
    console.error('Error fetching Cost data:', error);
  }

  // 工事番号に関連する請求書データを取得
  let invoiceRecords: InvoiceRecord[] = [];
  try {
    invoiceRecords = await getInvoiceRecordsByWorkNo(workNo);
    console.log(`Found ${invoiceRecords.length} Invoice records for work no ${workNo}`);
  } catch (error) {
    console.error('Error fetching Invoice data:', error);
  }

  const userInfo = await getCurrentUserInfo();

  return <WorkNoDetailContent
    record={record}
    customer={customer}
    poRecords={poRecords}
    quotationRecords={quotationRecords}
    costRecords={costRecords}
    invoiceRecords={invoiceRecords}
    locale={locale}
    userEmail={user.email || ''}
    userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
  />;
}