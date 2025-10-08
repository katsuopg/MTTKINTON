import { createClient } from '../../../../../lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function TestSupabasePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  // Supabaseからデータ取得
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .limit(5)
    .order('customer_id');

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .limit(5)
    .order('invoice_date', { ascending: false });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabaseデータ確認</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">顧客データ（{customers?.length || 0}件）</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers?.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{customer.customer_id}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{customer.company_name}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{customer.customer_rank}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{customer.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">請求書データ（{invoices?.length || 0}件）</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Work No</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice No</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices?.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{invoice.work_no}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{invoice.invoice_no}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{invoice.customer_name}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                    {new Intl.NumberFormat('th-TH').format(invoice.grand_total)} THB
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}