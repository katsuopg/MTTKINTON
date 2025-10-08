import { CustomerListContent } from '../customers/CustomerListContent';
import { createClient } from '../../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCustomersFromSupabase } from '@/lib/supabase/customers';
import { getSalesSummaryByCustomersFromSupabase } from '@/lib/supabase/invoices';
import { CustomerRecord } from '@/types/kintone';

interface CustomerListPageProps {
  params: Promise<{
    locale: string;
  }>;
}

// Supabaseのデータ構造をKintoneの形式に変換
function convertToKintoneFormat(customers: any[]): CustomerRecord[] {
  return customers.map(customer => ({
    $id: { type: '__ID__', value: customer.kintone_record_id },
    文字列__1行_: { type: 'SINGLE_LINE_TEXT', value: customer.customer_id },
    会社名: { type: 'SINGLE_LINE_TEXT', value: customer.company_name },
    顧客ランク: customer.customer_rank ? { type: 'SINGLE_LINE_TEXT', value: customer.customer_rank } : undefined,
    文字列__1行__4: customer.country ? { type: 'SINGLE_LINE_TEXT', value: customer.country } : undefined,
    TEL: customer.phone_number ? { type: 'SINGLE_LINE_TEXT', value: customer.phone_number } : undefined,
    FAX: customer.fax_number ? { type: 'SINGLE_LINE_TEXT', value: customer.fax_number } : undefined,
    文字列__1行__11: customer.tax_id ? { type: 'SINGLE_LINE_TEXT', value: customer.tax_id } : undefined,
    ドロップダウン: customer.payment_terms ? { type: 'DROP_DOWN', value: customer.payment_terms } : undefined,
    複数行__0: customer.address ? { type: 'MULTI_LINE_TEXT', value: customer.address } : undefined,
    リンク_ウェブサイト: customer.website_url ? { type: 'LINK', value: customer.website_url } : undefined,
    文字列__複数行_: customer.notes ? { type: 'MULTI_LINE_TEXT', value: customer.notes } : undefined,
    作成者: { type: 'CREATOR', value: { code: '', name: '' } },
    更新者: { type: 'MODIFIER', value: { code: '', name: '' } },
    作成日時: { type: 'CREATED_TIME', value: customer.created_at },
    更新日時: { type: 'UPDATED_TIME', value: customer.updated_at }
  }));
}

export default async function CustomerListSupabasePage({ params }: CustomerListPageProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  // Supabaseから顧客一覧を取得
  const customers = await getCustomersFromSupabase();
  
  // Kintone形式に変換
  const kintoneFormatCustomers = convertToKintoneFormat(customers);

  // 顧客名のリストを作成
  const customerNames = customers.map(c => c.company_name);
  
  // 売上サマリーを取得
  const salesSummary = await getSalesSummaryByCustomersFromSupabase(customerNames);

  return (
    <CustomerListContent 
      customers={kintoneFormatCustomers} 
      locale={locale} 
      userEmail={user.email || ''} 
      salesSummary={salesSummary}
    />
  );
}