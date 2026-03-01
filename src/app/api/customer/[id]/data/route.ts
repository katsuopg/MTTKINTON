import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireAppPermission('customers', 'can_view');
  if (!permCheck.allowed) {
    return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
  }

  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period');
  const type = searchParams.get('type');
  const { id: customerId } = await params;

  if (!type) {
    return NextResponse.json({ error: 'type parameter is required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    switch (type) {
      case 'workno': {
        let query = supabase
          .from('work_orders')
          .select('*')
          .eq('customer_id', customerId)
          .order('work_no', { ascending: false });
        if (period) {
          query = query.like('work_no', `${period}-%`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return NextResponse.json(data || []);
      }

      case 'quotation': {
        // 顧客のwork_noを取得してフィルタ
        let woQuery = supabase
          .from('work_orders')
          .select('work_no')
          .eq('customer_id', customerId);
        if (period) {
          woQuery = woQuery.like('work_no', `${period}-%`);
        }
        const { data: workOrders } = await woQuery;
        const workNos = (workOrders || []).map(w => w.work_no);

        if (workNos.length === 0) {
          return NextResponse.json([]);
        }

        const { data, error } = await supabase
          .from('quote_requests')
          .select('id, request_no, work_no, status_id, requester_name, desired_delivery_date, created_at, status:quote_request_statuses(code, name)')
          .in('work_no', workNos)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return NextResponse.json(data || []);
      }

      case 'po': {
        let query = supabase
          .from('po_records')
          .select('*')
          .eq('cs_id', customerId)
          .order('po_date', { ascending: false });
        if (period) {
          query = query.like('work_no', `${period}-%`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return NextResponse.json(data || []);
      }

      case 'invoice': {
        let query = supabase
          .from('invoices')
          .select('*')
          .eq('customer_id', customerId)
          .order('invoice_date', { ascending: false });
        if (period) {
          query = query.eq('period', period);
        }
        const { data, error } = await query;
        if (error) throw error;
        return NextResponse.json(data || []);
      }

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching customer data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
