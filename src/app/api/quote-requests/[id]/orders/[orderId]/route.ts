import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

interface RouteParams {
  params: Promise<{ id: string; orderId: string }>;
}

// PATCH: 発注ステータス更新（PO番号設定・納品確認）
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, orderId } = await params;

    const permCheck = await requireAppPermission('quotations', 'can_edit');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const body = await request.json();
    const { data: { user } } = await supabase.auth.getUser();

    // 発注レコードの検証
    const { data: order } = await (supabase
      .from('quote_request_item_orders') as SupabaseAny)
      .select(`
        *,
        item:quote_request_items!inner(
          id,
          quote_request_id,
          dom_mech_item_id,
          dom_elec_item_id
        )
      `)
      .eq('id', orderId)
      .single();

    if (!order || order.item?.quote_request_id !== id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // PO番号設定
    if (body.po_number !== undefined) {
      updateData.po_number = body.po_number;

      // DOM連携: ordering
      if (order.item.dom_mech_item_id) {
        await (supabase.from('dom_mech_items') as SupabaseAny)
          .update({ status: 'ordering' })
          .eq('id', order.item.dom_mech_item_id);
      }
      if (order.item.dom_elec_item_id) {
        await (supabase.from('dom_elec_items') as SupabaseAny)
          .update({ status: 'ordering' })
          .eq('id', order.item.dom_elec_item_id);
      }

      // ヘッダーステータスを po_issued に
      const { data: poIssuedStatus } = await (supabase
        .from('quote_request_statuses') as SupabaseAny)
        .select('id')
        .eq('code', 'po_issued')
        .single();

      if (poIssuedStatus) {
        await (supabase
          .from('quote_requests') as SupabaseAny)
          .update({ status_id: poIssuedStatus.id })
          .eq('id', id);
      }
    }

    // 納品確認
    if (body.action === 'deliver') {
      updateData.order_status = 'delivered';
      updateData.delivered_at = new Date().toISOString();
      updateData.delivered_by = user!.id;

      // DOM連携: delivered
      if (order.item.dom_mech_item_id) {
        await (supabase.from('dom_mech_items') as SupabaseAny)
          .update({ status: 'delivered' })
          .eq('id', order.item.dom_mech_item_id);
      }
      if (order.item.dom_elec_item_id) {
        await (supabase.from('dom_elec_items') as SupabaseAny)
          .update({ status: 'delivered' })
          .eq('id', order.item.dom_elec_item_id);
      }
    }

    // 納期設定
    if (body.delivery_date !== undefined) {
      updateData.delivery_date = body.delivery_date;
    }

    // 備考
    if (body.remarks !== undefined) {
      updateData.remarks = body.remarks;
    }

    const { data: updatedOrder, error } = await (supabase
      .from('quote_request_item_orders') as SupabaseAny)
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE: 発注取消
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id, orderId } = await params;

    const permCheck = await requireAppPermission('quotations', 'can_edit');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    // 発注レコードの検証
    const { data: order } = await (supabase
      .from('quote_request_item_orders') as SupabaseAny)
      .select(`
        *,
        item:quote_request_items!inner(
          id,
          quote_request_id,
          dom_mech_item_id,
          dom_elec_item_id
        )
      `)
      .eq('id', orderId)
      .single();

    if (!order || order.item?.quote_request_id !== id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 発注レコード削除
    const { error } = await (supabase
      .from('quote_request_item_orders') as SupabaseAny)
      .delete()
      .eq('id', orderId);

    if (error) throw error;

    // DOM連携: quote_done に戻す
    if (order.item.dom_mech_item_id) {
      await (supabase.from('dom_mech_items') as SupabaseAny)
        .update({ status: 'quote_done' })
        .eq('id', order.item.dom_mech_item_id);
    }
    if (order.item.dom_elec_item_id) {
      await (supabase.from('dom_elec_items') as SupabaseAny)
        .update({ status: 'quote_done' })
        .eq('id', order.item.dom_elec_item_id);
    }

    // 明細ステータスを quoted に戻す
    const { data: quotedStatus } = await (supabase
      .from('quote_request_statuses') as SupabaseAny)
      .select('id')
      .eq('code', 'quoted')
      .single();

    if (quotedStatus) {
      await (supabase
        .from('quote_request_items') as SupabaseAny)
        .update({ status_id: quotedStatus.id })
        .eq('id', order.quote_request_item_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
