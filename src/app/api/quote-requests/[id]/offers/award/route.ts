import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: オファー採用
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const permCheck = await requireAppPermission('quotations', 'can_edit');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const body = await request.json();

    const { offer_id } = body;

    if (!offer_id) {
      return NextResponse.json(
        { error: 'offer_id is required' },
        { status: 400 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();

    // オファー取得と検証
    const { data: offer } = await (supabase
      .from('quote_request_item_offers') as SupabaseAny)
      .select(`
        *,
        item:quote_request_items!inner(
          id,
          quote_request_id
        )
      `)
      .eq('id', offer_id)
      .single();

    if (!offer || offer.item?.quote_request_id !== id) {
      return NextResponse.json(
        { error: 'Offer not found in this quote request' },
        { status: 404 }
      );
    }

    const itemId = offer.item.id;

    // 同じ明細の他のオファーの採用を解除
    await (supabase
      .from('quote_request_item_offers') as SupabaseAny)
      .update({
        is_awarded: false,
        awarded_at: null,
        awarded_by: null,
      })
      .eq('quote_request_item_id', itemId)
      .neq('id', offer_id);

    // 対象オファーを採用
    const { data: awardedOffer, error } = await (supabase
      .from('quote_request_item_offers') as SupabaseAny)
      .update({
        is_awarded: true,
        awarded_at: new Date().toISOString(),
        awarded_by: user!.id,
      })
      .eq('id', offer_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 明細ステータスを「見積完了」に更新
    const { data: quotedStatus } = await (supabase
      .from('quote_request_statuses') as SupabaseAny)
      .select('id')
      .eq('code', 'quoted')
      .single();

    if (quotedStatus) {
      await (supabase
        .from('quote_request_items') as SupabaseAny)
        .update({ status_id: quotedStatus.id })
        .eq('id', itemId);
    }

    return NextResponse.json(awardedOffer);
  } catch (error) {
    console.error('Error awarding offer:', error);
    return NextResponse.json(
      { error: 'Failed to award offer' },
      { status: 500 }
    );
  }
}

// DELETE: オファー採用取消
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const permCheck = await requireAppPermission('quotations', 'can_edit');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get('offer_id');

    if (!offerId) {
      return NextResponse.json(
        { error: 'offer_id is required' },
        { status: 400 }
      );
    }

    // オファー取得と検証
    const { data: offer } = await (supabase
      .from('quote_request_item_offers') as SupabaseAny)
      .select(`
        *,
        item:quote_request_items!inner(quote_request_id)
      `)
      .eq('id', offerId)
      .single();

    if (!offer || offer.item?.quote_request_id !== id) {
      return NextResponse.json(
        { error: 'Offer not found in this quote request' },
        { status: 404 }
      );
    }

    // 採用取消
    const { data: updatedOffer, error } = await (supabase
      .from('quote_request_item_offers') as SupabaseAny)
      .update({
        is_awarded: false,
        awarded_at: null,
        awarded_by: null,
      })
      .eq('id', offerId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(updatedOffer);
  } catch (error) {
    console.error('Error removing award:', error);
    return NextResponse.json(
      { error: 'Failed to remove award' },
      { status: 500 }
    );
  }
}
