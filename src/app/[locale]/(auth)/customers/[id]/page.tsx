import { Metadata } from 'next';
import { getCustomerById } from '@/lib/kintone/customer';
import { CustomerDetailContent } from './CustomerDetailContent';
import { getWorkNoRecordsByCustomer } from '@/lib/kintone/workno';
import { getQuotationRecordsByCustomer } from '@/lib/kintone/quotation';
import { getOrderRecordsByCustomer } from '@/lib/kintone/order';
import { getCustomerStaffByCustomer } from '@/lib/kintone/customer-staff';
import { getInvoicesByCustomerFromSupabase } from '@/lib/supabase/invoices';
import { getMachinesByCustomerFromSupabase } from '@/lib/supabase/machines';
import { convertSupabaseInvoicesToKintone, convertSupabaseMachinesToKintone } from '@/lib/supabase/transformers';
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
    const customerId = customerRecord.文字列__1行_.value;
    const customerName = customerRecord.会社名.value;
    const [workNoRecords, quotationRecords, orderRecords, machinesSupabase, customerStaffRecords, allWorkNoRecords, allQuotationRecords] = await Promise.all([
      getWorkNoRecordsByCustomer(customerId, currentPeriod),
      getQuotationRecordsByCustomer(customerId, currentPeriod),
      getOrderRecordsByCustomer(customerId, currentPeriod),
      getMachinesByCustomerFromSupabase(customerId),
      getCustomerStaffByCustomer(customerId),
      getWorkNoRecordsByCustomer(customerId), // グラフ用に全期間の工事データを取得
      getQuotationRecordsByCustomer(customerId), // グラフ用に全期間の見積データを取得
    ]);

    const [invoiceRecordsSupabase, allInvoiceRecordsSupabase] = await Promise.all([
      getInvoicesByCustomerFromSupabase({ customerId, customerName }, currentPeriod),
      getInvoicesByCustomerFromSupabase({ customerId, customerName }),
    ]);

    const invoiceRecords = convertSupabaseInvoicesToKintone(invoiceRecordsSupabase);
    const allInvoiceRecords = convertSupabaseInvoicesToKintone(allInvoiceRecordsSupabase);
    const machineRecords = convertSupabaseMachinesToKintone(machinesSupabase);


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
