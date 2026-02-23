import { Metadata } from 'next';
import { getCustomerById } from '@/lib/kintone/customer';
import { CustomerDetailContent } from './CustomerDetailContent';
import { getWorkNoRecordsByCustomer } from '@/lib/kintone/workno';
import { getQuotationRecordsByCustomer } from '@/lib/kintone/quotation';
import { getOrderRecordsByCustomer } from '@/lib/kintone/order';
import { getMachineRecordsByCustomer } from '@/lib/kintone/machine';
import { getCustomerStaffByCustomer } from '@/lib/kintone/customer-staff';
import { getInvoiceRecordsByCustomer } from '@/lib/kintone/invoice';
import type { Language } from '@/lib/kintone/field-mappings';
import { getCurrentUserInfo } from '@/lib/auth/user-info';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { detailStyles } from '@/components/ui/DetailStyles';
import Link from 'next/link';

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
  const pageTitle = language === 'ja' ? '顧客詳細' : language === 'th' ? 'รายละเอียดลูกค้า' : 'Customer Detail';
  const userInfo = await getCurrentUserInfo();

  try {
    const customerRecord = await getCustomerById(id);

    const currentPeriod = '14';
    const [workNoRecords, quotationRecords, orderRecords, machineRecords, customerStaffRecords, invoiceRecords, allInvoiceRecords, allWorkNoRecords, allQuotationRecords] = await Promise.all([
      getWorkNoRecordsByCustomer(customerRecord.文字列__1行_.value, currentPeriod),
      getQuotationRecordsByCustomer(customerRecord.文字列__1行_.value, currentPeriod),
      getOrderRecordsByCustomer(customerRecord.文字列__1行_.value, currentPeriod),
      getMachineRecordsByCustomer(customerRecord.文字列__1行_.value),
      getCustomerStaffByCustomer(customerRecord.文字列__1行_.value),
      getInvoiceRecordsByCustomer(customerRecord.会社名.value, currentPeriod),
      getInvoiceRecordsByCustomer(customerRecord.会社名.value),
      getWorkNoRecordsByCustomer(customerRecord.文字列__1行_.value),
      getQuotationRecordsByCustomer(customerRecord.文字列__1行_.value),
    ]);

    return (
      <DashboardLayout
        locale={locale}
        title={pageTitle}
        userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
      >
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
      </DashboardLayout>
    );
  } catch (error) {
    console.error('Error fetching customer data:', error);

    return (
      <DashboardLayout
        locale={locale}
        title={pageTitle}
        userInfo={userInfo ? { email: userInfo.email, name: userInfo.name, avatarUrl: userInfo.avatarUrl } : undefined}
      >
        <div className={detailStyles.pageWrapper}>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">
              {language === 'ja' ? 'エラーが発生しました' : language === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred'}
            </p>
            <Link href={`/${locale}/customers`} className={`mt-4 inline-block ${detailStyles.link}`}>
              {language === 'ja' ? '一覧に戻る' : language === 'th' ? 'กลับไปที่รายการ' : 'Back to List'}
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }
}