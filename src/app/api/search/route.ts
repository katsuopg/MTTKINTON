import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

interface SearchResultCategory {
  category: string;
  label: string;
  icon: string;
  items: SearchResultItem[];
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const locale = searchParams.get('locale') || 'ja';

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchPattern = `%${q}%`;

    // Supabase DB 並列検索
    const results = await Promise.allSettled([
      // 1. 顧客 (customers)
      (async (): Promise<SearchResultCategory> => {
        const { data } = await (supabase.from('customers') as any)
          .select('id, customer_id, company_name, country')
          .or(`company_name.ilike.${searchPattern},customer_id.ilike.${searchPattern}`)
          .order('customer_id', { ascending: true })
          .limit(5);
        const rows = (data || []) as Array<{
          id: string; customer_id: string; company_name: string; country: string | null;
        }>;
        return {
          category: 'customer',
          label: locale === 'ja' ? '顧客' : locale === 'th' ? 'ลูกค้า' : 'Customers',
          icon: 'users',
          items: rows.map((r) => ({
            id: r.customer_id,
            title: r.company_name || r.customer_id,
            subtitle: r.customer_id + (r.country ? ` (${r.country})` : ''),
            href: `/${locale}/customers/${r.customer_id}`,
          })),
        };
      })(),

      // 2. 従業員 (employees)
      (async (): Promise<SearchResultCategory> => {
        const { data } = await (supabase.from('employees') as any)
          .select('id, name, employee_number, position, department')
          .or(`name.ilike.${searchPattern},employee_number.ilike.${searchPattern}`)
          .limit(5);
        const rows = (data || []) as Array<{
          id: string; name: string | null; employee_number: string;
          position: string | null; department: string | null;
        }>;
        return {
          category: 'employee',
          label: locale === 'ja' ? '従業員' : locale === 'th' ? 'พนักงาน' : 'Employees',
          icon: 'user',
          items: rows.map((e) => ({
            id: e.id,
            title: e.name || e.employee_number,
            subtitle: [e.employee_number, e.position, e.department].filter(Boolean).join(' - '),
            href: `/${locale}/employees/${e.id}`,
          })),
        };
      })(),

      // 3. 仕入業者 (suppliers)
      (async (): Promise<SearchResultCategory> => {
        const { data } = await (supabase.from('suppliers') as any)
          .select('id, supplier_id, company_name, company_name_en')
          .or(`company_name.ilike.${searchPattern},company_name_en.ilike.${searchPattern},supplier_id.ilike.${searchPattern}`)
          .order('company_name_en', { ascending: true })
          .limit(5);
        const rows = (data || []) as Array<{
          id: string; supplier_id: string; company_name: string | null; company_name_en: string | null;
        }>;
        return {
          category: 'supplier',
          label: locale === 'ja' ? '仕入業者' : locale === 'th' ? 'ซัพพลายเออร์' : 'Suppliers',
          icon: 'truck',
          items: rows.map((r) => ({
            id: r.id,
            title: r.company_name_en || r.company_name || r.supplier_id,
            subtitle: r.company_name || '',
            href: `/${locale}/suppliers/${r.id}`,
          })),
        };
      })(),

      // 4. 請求書 (invoices)
      (async (): Promise<SearchResultCategory> => {
        const { data } = await (supabase.from('invoices') as any)
          .select('id, invoice_no, work_no, customer_name, grand_total')
          .or(`invoice_no.ilike.${searchPattern},work_no.ilike.${searchPattern},customer_name.ilike.${searchPattern}`)
          .order('invoice_date', { ascending: false })
          .limit(5);
        const rows = (data || []) as Array<{
          id: string; invoice_no: string; work_no: string;
          customer_name: string | null; grand_total: number;
        }>;
        return {
          category: 'invoice',
          label: locale === 'ja' ? '請求書' : locale === 'th' ? 'ใบแจ้งหนี้' : 'Invoices',
          icon: 'dollar',
          items: rows.map((r) => ({
            id: r.id,
            title: r.invoice_no || r.work_no,
            subtitle: [r.work_no, r.customer_name].filter(Boolean).join(' - '),
            href: `/${locale}/invoice-management`,
          })),
        };
      })(),

      // 5. 見積依頼 (quote_requests)
      (async (): Promise<SearchResultCategory> => {
        const { data } = await (supabase.from('quote_requests') as any)
          .select('id, request_number, title, requester_name')
          .or(`request_number.ilike.${searchPattern},title.ilike.${searchPattern},requester_name.ilike.${searchPattern}`)
          .order('created_at', { ascending: false })
          .limit(5);
        const rows = (data || []) as Array<{
          id: string; request_number: string | null; title: string | null;
          requester_name: string | null;
        }>;
        return {
          category: 'quote_request',
          label: locale === 'ja' ? '見積依頼' : locale === 'th' ? 'ใบขอใบเสนอราคา' : 'Quote Requests',
          icon: 'calculator',
          items: rows.map((r) => ({
            id: r.id,
            title: r.request_number || r.id.slice(0, 8),
            subtitle: [r.title, r.requester_name].filter(Boolean).join(' - '),
            href: `/${locale}/quote-requests/${r.id}`,
          })),
        };
      })(),
    ]);

    // 成功した結果のみ抽出（アイテムがある場合のみ）
    const categories: SearchResultCategory[] = results
      .filter((r): r is PromiseFulfilledResult<SearchResultCategory> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter((c) => c.items.length > 0);

    return NextResponse.json({ results: categories });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
