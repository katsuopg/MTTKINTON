import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 見積依頼の発注一覧
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const permCheck = await requireAppPermission('quotations', 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    // 見積依頼の明細IDを取得
    const { data: items } = await (supabase
      .from('quote_request_items') as SupabaseAny)
      .select('id')
      .eq('quote_request_id', id);

    if (!items || items.length === 0) {
      return NextResponse.json([]);
    }

    const itemIds = items.map((i: { id: string }) => i.id);

    const { data: orders, error } = await (supabase
      .from('quote_request_item_orders') as SupabaseAny)
      .select('*')
      .in('quote_request_item_id', itemIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(orders || []);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST: 発注依頼作成
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const permCheck = await requireAppPermission('quotations', 'can_edit');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const body = await request.json();
    const { data: { user } } = await supabase.auth.getUser();

    const { items: orderItems } = body;
    // orderItems: [{ quote_request_item_id, offer_id, order_quantity, order_amount, remarks }]

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({ error: 'items are required' }, { status: 400 });
    }

    // 明細が見積依頼に属しているか検証
    const itemIds = orderItems.map((i: { quote_request_item_id: string }) => i.quote_request_item_id);
    const { data: validItems } = await (supabase
      .from('quote_request_items') as SupabaseAny)
      .select('id, quote_request_id, dom_mech_item_id, dom_elec_item_id')
      .in('id', itemIds)
      .eq('quote_request_id', id);

    if (!validItems || validItems.length !== itemIds.length) {
      return NextResponse.json({ error: 'Invalid item IDs' }, { status: 400 });
    }

    // ステータス取得
    const { data: orderRequestedStatus } = await (supabase
      .from('quote_request_statuses') as SupabaseAny)
      .select('id')
      .eq('code', 'order_requested')
      .single();

    // 発注レコード作成
    const ordersToInsert = orderItems.map((item: {
      quote_request_item_id: string;
      offer_id?: string;
      order_quantity: number;
      order_amount?: number;
      remarks?: string;
    }) => ({
      quote_request_item_id: item.quote_request_item_id,
      offer_id: item.offer_id || null,
      order_quantity: item.order_quantity,
      order_amount: item.order_amount || null,
      order_date: new Date().toISOString().split('T')[0],
      order_status: 'ordered',
      remarks: item.remarks || null,
      created_by: user!.id,
    }));

    const { data: createdOrders, error: insertError } = await (supabase
      .from('quote_request_item_orders') as SupabaseAny)
      .insert(ordersToInsert)
      .select();

    if (insertError) throw insertError;

    // 明細ステータスを order_requested に更新
    if (orderRequestedStatus) {
      await (supabase
        .from('quote_request_items') as SupabaseAny)
        .update({ status_id: orderRequestedStatus.id })
        .in('id', itemIds);
    }

    // DOM連携: ステータスを order_requesting に更新
    for (const item of validItems) {
      if (item.dom_mech_item_id) {
        await (supabase.from('dom_mech_items') as SupabaseAny)
          .update({ status: 'order_requesting' })
          .eq('id', item.dom_mech_item_id);
      }
      if (item.dom_elec_item_id) {
        await (supabase.from('dom_elec_items') as SupabaseAny)
          .update({ status: 'order_requesting' })
          .eq('id', item.dom_elec_item_id);
      }
    }

    // 全明細が発注済みかチェック → ヘッダーも order_requested に
    const { data: allItems } = await (supabase
      .from('quote_request_items') as SupabaseAny)
      .select('id, status_id')
      .eq('quote_request_id', id);

    if (allItems && orderRequestedStatus) {
      const allOrdered = allItems.every(
        (i: { status_id: string }) => i.status_id === orderRequestedStatus.id
      );
      if (allOrdered) {
        await (supabase
          .from('quote_requests') as SupabaseAny)
          .update({ status_id: orderRequestedStatus.id })
          .eq('id', id);
      }
    }

    return NextResponse.json(createdOrders);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
