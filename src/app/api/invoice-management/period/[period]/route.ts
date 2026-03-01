import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ period: string }> }
) {
  try {
    const permCheck = await requireAppPermission('invoices', 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const { period } = await context.params;
    const supabase = await createClient();

    // 会計期間でフィルタリング（work_noの先頭が期番号）
    let query = supabase
      .from('invoices')
      .select('id, kintone_record_id, work_no, invoice_no, invoice_date, customer_id, customer_name, sub_total, discount, after_discount, vat, grand_total, status, po_no, tax_rate, vat_price, wht, wht_rate, wht_price, payment_terms, due_date, payment_date, repair_description, detail')
      .order('invoice_date', { ascending: false })
      .limit(500);

    if (period) {
      // 1桁の場合は0埋めパターンも考慮
      if (period.length === 1) {
        query = query.or(`work_no.ilike.${period}-%,work_no.ilike.0${period}-%`);
      } else {
        query = query.ilike('work_no', `${period}-%`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching invoices from Supabase:', error);
      return NextResponse.json({ error: 'Failed to fetch invoice records' }, { status: 500 });
    }

    return NextResponse.json({
      records: data || [],
      count: data?.length || 0,
      period
    });
  } catch (error) {
    console.error('Error fetching invoice records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice records' },
      { status: 500 }
    );
  }
}
