import { InvoiceManagementClient } from '../invoices/InvoiceManagementClient';
import { createClient } from '../../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import { getInvoicesFromSupabase } from '@/lib/supabase/invoices';
import { InvoiceRecord } from '@/types/kintone';

interface InvoiceManagementPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    period?: string;
  }>;
}

// Supabaseのデータ構造をKintoneの形式に変換
function convertToKintoneFormat(invoices: any[]): InvoiceRecord[] {
  return invoices.map(invoice => ({
    $id: { type: '__ID__', value: invoice.kintone_record_id },
    文字列__1行_: { type: 'SINGLE_LINE_TEXT', value: invoice.work_no },
    文字列__1行__0: { type: 'SINGLE_LINE_TEXT', value: invoice.invoice_no },
    日付: invoice.invoice_date ? { type: 'DATE', value: invoice.invoice_date } : undefined,
    文字列__1行__3: invoice.customer_id ? { type: 'SINGLE_LINE_TEXT', value: invoice.customer_id } : undefined,
    CS_name: invoice.customer_name ? { type: 'SINGLE_LINE_TEXT', value: invoice.customer_name } : undefined,
    数値: { type: 'NUMBER', value: invoice.sub_total.toString() },
    数値_0: { type: 'NUMBER', value: invoice.discount.toString() },
    計算_0: { type: 'CALC', value: invoice.after_discount.toString() },
    計算_1: { type: 'CALC', value: invoice.vat.toString() },
    計算: { type: 'CALC', value: invoice.grand_total.toString() },
    ラジオボタン: invoice.status ? { type: 'RADIO_BUTTON', value: invoice.status } : undefined,
    作成者: { type: 'CREATOR', value: { code: '', name: invoice.created_by || '' } },
    更新者: { type: 'MODIFIER', value: { code: '', name: invoice.updated_by || '' } },
    作成日時: { type: 'CREATED_TIME', value: invoice.created_at },
    更新日時: { type: 'UPDATED_TIME', value: invoice.updated_at }
  }));
}

export default async function InvoiceManagementSupabasePage({ 
  params, 
  searchParams 
}: InvoiceManagementPageProps) {
  const { locale } = await params;
  const { period = '14' } = await searchParams;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  // Supabaseから請求書データを取得
  const invoices = await getInvoicesFromSupabase(period, 500);
  
  // Kintone形式に変換
  const kintoneFormatInvoices = convertToKintoneFormat(invoices);

  return (
    <InvoiceManagementClient 
      initialRecords={kintoneFormatInvoices} 
      locale={locale}
      userEmail={user.email || ''}
      initialPeriod={period}
    />
  );
}