import { Metadata } from 'next';
import { getCustomerById } from '@/lib/kintone/customer';
import { getFieldLabel } from '@/lib/kintone/field-mappings';
import { CustomerDetailContent } from './CustomerDetailContent';
import { getWorkNoRecordsByCustomer } from '@/lib/kintone/workno';
import { getQuotationRecordsByCustomer } from '@/lib/kintone/quotation';
import { getOrderRecordsByCustomer } from '@/lib/kintone/order';
import { getMachineRecordsByCustomer } from '@/lib/kintone/machine';
import { getCustomerStaffByCustomer } from '@/lib/kintone/customer-staff';
import { getInvoiceRecordsByCustomer } from '@/lib/kintone/invoice';
import type { Language } from '@/lib/kintone/field-mappings';

export const metadata: Metadata = {
  title: 'Customer Detail - MTT KINTON',
  description: 'Customer detail page',
};

interface CustomerDetailPageProps {
  params: Promise<{ 
    locale: string;
    id: string;
  }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { locale, id } = await params;
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  try {
    // 顧客情報を取得
    const customerRecord = await getCustomerById(id);
    
    // 関連データを取得（初期表示は第14期のみ）
    const currentPeriod = '14';
    const [workNoRecords, quotationRecords, orderRecords, machineRecords, customerStaffRecords, invoiceRecords, allInvoiceRecords, allWorkNoRecords, allQuotationRecords] = await Promise.all([
      getWorkNoRecordsByCustomer(customerRecord.文字列__1行_.value, currentPeriod),
      getQuotationRecordsByCustomer(customerRecord.文字列__1行_.value, currentPeriod),
      getOrderRecordsByCustomer(customerRecord.文字列__1行_.value, currentPeriod),
      getMachineRecordsByCustomer(customerRecord.文字列__1行_.value),
      getCustomerStaffByCustomer(customerRecord.文字列__1行_.value),
      getInvoiceRecordsByCustomer(customerRecord.会社名.value, currentPeriod),
      getInvoiceRecordsByCustomer(customerRecord.会社名.value), // グラフ用に全期間のデータを取得
      getWorkNoRecordsByCustomer(customerRecord.文字列__1行_.value), // グラフ用に全期間の工事データを取得
      getQuotationRecordsByCustomer(customerRecord.文字列__1行_.value), // グラフ用に全期間の見積データを取得
    ]);
    

    return (
      <CustomerDetailContent
        locale={locale}
        language={language}
        customerRecord={customerRecord}
        workNoRecords={workNoRecords}
        quotationRecords={quotationRecords}
        orderRecords={orderRecords}
        machineRecords={machineRecords}
        customerStaffRecords={customerStaffRecords}
        invoiceRecords={invoiceRecords}
        allInvoiceRecords={allInvoiceRecords}
        allWorkNoRecords={allWorkNoRecords}
        allQuotationRecords={allQuotationRecords}
      />
    );
  } catch (error) {
    console.error('Error fetching customer data:', error);
    
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {language === 'ja' ? 'エラーが発生しました' : language === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred'}
        </div>
      </div>
    );
  }
}