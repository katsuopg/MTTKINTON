import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { QuoteRequestStatusCode } from '@/types/quote-request';
import { requireAppPermission } from '@/lib/auth/app-permissions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ステータス遷移ルール
const STATUS_TRANSITIONS: Record<QuoteRequestStatusCode, QuoteRequestStatusCode[]> = {
  requested: ['quoting', 'cancelled'],
  quoting: ['quoted', 'cancelled'],
  quoted: ['order_requested', 'cancelled'],
  order_requested: ['po_issued', 'cancelled'],
  po_issued: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

// PATCH: ステータス変更
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const permCheck = await requireAppPermission('quotations', 'can_edit');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const body = await request.json();

    const { status_code, reason } = body as {
      status_code: QuoteRequestStatusCode;
      reason?: string;
    };

    if (!status_code) {
      return NextResponse.json(
        { error: 'status_code is required' },
        { status: 400 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();

    // 現在の見積依頼取得
    const { data: currentRequest } = await (supabase
      .from('quote_requests') as SupabaseAny)
      .select(`
        *,
        status:quote_request_statuses(*)
      `)
      .eq('id', id)
      .single();

    if (!currentRequest) {
      return NextResponse.json(
        { error: 'Quote request not found' },
        { status: 404 }
      );
    }

    const currentStatusCode = currentRequest.status?.code as QuoteRequestStatusCode;

    // 遷移可能かチェック
    const allowedTransitions = STATUS_TRANSITIONS[currentStatusCode] || [];
    if (!allowedTransitions.includes(status_code)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${currentStatusCode} to ${status_code}`,
          allowed: allowedTransitions
        },
        { status: 400 }
      );
    }

    // 新しいステータス取得
    const { data: newStatus } = await (supabase
      .from('quote_request_statuses') as SupabaseAny)
      .select('*')
      .eq('code', status_code)
      .single();

    if (!newStatus) {
      return NextResponse.json(
        { error: 'Invalid status code' },
        { status: 400 }
      );
    }

    // ステータス更新データ
    const updateData: Record<string, unknown> = {
      status_id: newStatus.id,
      updated_by: user!.id,
    };

    // キャンセルの場合は追加情報を保存
    if (status_code === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancelled_by = user!.id;
      updateData.cancel_reason = reason || null;
    }

    // 見積依頼更新
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

    // ステータスログ記録
    await (supabase.from('quote_request_status_logs') as SupabaseAny)
      .insert({
        quote_request_id: id,
        from_status_id: currentRequest.status_id,
        to_status_id: newStatus.id,
        reason: reason || null,
        changed_by: user!.id,
      });

    // 通知作成（必要に応じて）
    if (['quoted', 'po_issued'].includes(status_code)) {
      await (supabase.from('quote_request_notifications') as SupabaseAny)
        .insert({
          quote_request_id: id,
          notification_type: status_code,
          recipient_id: currentRequest.requester_id,
        });
    }

    return NextResponse.json(quoteRequest);
  } catch (error) {
    console.error('Error updating quote request status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
