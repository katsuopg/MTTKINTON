import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 見積依頼詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 見積依頼ヘッダー取得（ステータス、明細、オファー、発注情報を含む）
    const { data: quoteRequest, error } = await (supabase
      .from('quote_requests') as SupabaseAny)
      .select(`
        *,
        status:quote_request_statuses(*),
        items:quote_request_items(
          *,
          status:quote_request_statuses(*),
          offers:quote_request_item_offers(*),
          orders:quote_request_item_orders(*)
        ),
        files:quote_request_files(*),
        status_logs:quote_request_status_logs(
          *,
          from_status:quote_request_statuses!from_status_id(*),
          to_status:quote_request_statuses!to_status_id(*)
        )
      `)
      .eq('id', id)
      .order('sort_order', { referencedTable: 'quote_request_items', ascending: true })
      .order('created_at', { referencedTable: 'quote_request_status_logs', ascending: false })
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Quote request not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(quoteRequest);
  } catch (error) {
    console.error('Error fetching quote request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote request' },
      { status: 500 }
    );
  }
}

// PATCH: 見積依頼更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 更新可能なフィールドのみ抽出
    const updateData: Record<string, unknown> = {
      updated_by: user.id,
    };

    const allowedFields = [
      'work_no',
      'project_code',
      'desired_delivery_date',
      'remarks',
      'purchaser_id',
      'purchaser_name',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { data: quoteRequest, error } = await (supabase
      .from('quote_requests') as SupabaseAny)
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        status:quote_request_statuses(*)
      `)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(quoteRequest);
  } catch (error) {
    console.error('Error updating quote request:', error);
    return NextResponse.json(
      { error: 'Failed to update quote request' },
      { status: 500 }
    );
  }
}

// DELETE: 見積依頼キャンセル（論理削除）
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason') || '';

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 現在のステータス取得
    const { data: currentRequest } = await (supabase
      .from('quote_requests') as SupabaseAny)
      .select('status_id')
      .eq('id', id)
      .single();

    // キャンセルステータス取得
    const { data: cancelledStatus } = await (supabase
      .from('quote_request_statuses') as SupabaseAny)
      .select('id')
      .eq('code', 'cancelled')
      .single();

    if (!cancelledStatus) {
      return NextResponse.json(
        { error: 'Cancelled status not found' },
        { status: 500 }
      );
    }

    // 見積依頼をキャンセル
    const { data: quoteRequest, error } = await (supabase
      .from('quote_requests') as SupabaseAny)
      .update({
        status_id: cancelledStatus.id,
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        cancel_reason: reason,
        updated_by: user.id,
      })
      .eq('id', id)
      .select(`
        *,
        status:quote_request_statuses(*)
      `)
      .single();

    if (error) {
      throw error;
    }

    // ステータスログ記録
    await (supabase.from('quote_request_status_logs') as SupabaseAny)
      .insert({
        quote_request_id: id,
        from_status_id: currentRequest?.status_id,
        to_status_id: cancelledStatus.id,
        reason: reason,
        changed_by: user.id,
      });

    return NextResponse.json(quoteRequest);
  } catch (error) {
    console.error('Error cancelling quote request:', error);
    return NextResponse.json(
      { error: 'Failed to cancel quote request' },
      { status: 500 }
    );
  }
}
