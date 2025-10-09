import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KintoneClient } from '@/lib/kintone/client';
import { WorkNoRecord, InvoiceRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { invoiceCache } from '@/lib/kintone/invoice-cache';
import { type Language } from '@/lib/kintone/field-mappings';
import WorkNoClient from './WorkNoClient';

// ページレベルのキャッシュ設定（5分）
export const revalidate = 300;

interface ProjectsPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    fiscalYear?: string;
    search?: string;
  }>;
}

export default async function ProjectsPage({ params, searchParams }: ProjectsPageProps) {
  const { locale } = await params;
  const searchParamsResolved = await searchParams;
  const supabase = await createClient();

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Convert locale to Language type
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  
  // 会計期間の取得（デフォルトは25-26年度）
  const selectedFiscalYear = searchParamsResolved.fiscalYear ? parseInt(searchParamsResolved.fiscalYear) : 14;
  const searchQuery = searchParamsResolved.search || '';
  
  // kintoneからWork No.アプリのレコードを取得
  let workNoRecords: WorkNoRecord[] = [];
  
  try {
    // Work No.アプリから受注後のプロジェクトを取得
    const workNoClient = new KintoneClient(
      '21', // Work No.アプリID
      process.env.KINTONE_API_TOKEN_WORKNO!
    );
    
    // 工事番号の頭で期をフィルタリング
    const query = `WorkNo like "${selectedFiscalYear}-" order by 更新日時 desc limit 200`;
    workNoRecords = await workNoClient.getRecords<WorkNoRecord>(query);
    console.log(`Found ${workNoRecords.length} Work No records for fiscal year ${selectedFiscalYear}`);
  } catch (error) {
    console.error('Error fetching kintone data:', error);
  }

  // 請求書管理アプリから請求書データを取得
  let invoiceRecords: InvoiceRecord[] = [];
  
  try {
    // キャッシュから請求書データを取得
    const { records, fromCache } = await invoiceCache.getInvoices();
    invoiceRecords = records;
    
    console.log(`Found ${invoiceRecords.length} invoice records (from ${fromCache ? 'cache' : 'API'})`);
    
    // 工事番号ごとの請求書数をカウント（デバッグ用）
    if (!fromCache) {
      const invoiceCountByWorkNo = new Map<string, number>();
      invoiceRecords.forEach(record => {
        const workNo = record.文字列__1行_?.value || ''; // 工事番号フィールド
        if (workNo) {
          invoiceCountByWorkNo.set(workNo, (invoiceCountByWorkNo.get(workNo) || 0) + 1);
        }
      });
      
      console.log('=== Invoice data by Work No ===');
      invoiceCountByWorkNo.forEach((count, workNo) => {
        if (count > 1) {
          console.log(`${workNo}: ${count} invoices`);
        }
      });
    }
  } catch (error) {
    console.error('Error fetching invoice data:', error);
    // エラーの場合もWork No.レコード内の請求書フィールドでフォールバック
    console.log('Fallback to Work No record invoice fields for INV badge determination');
  }

  const pageTitle = language === 'ja' ? '工事番号管理' : language === 'th' ? 'จัดการหมายเลขงาน' : 'Work No. Management';
  
  return (
    <DashboardLayout locale={locale} userEmail={user.email} title={pageTitle}>
      <WorkNoClient
        locale={locale}
        language={language}
        initialRecords={workNoRecords}
        initialInvoiceRecords={invoiceRecords}
        initialFiscalYear={selectedFiscalYear}
        initialSearchQuery={searchQuery}
      />
    </DashboardLayout>
  );
}
