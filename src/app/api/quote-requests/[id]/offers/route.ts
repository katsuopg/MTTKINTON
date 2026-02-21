import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { QuoteRequestItemOfferCreate } from '@/types/quote-request';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 見積依頼の全オファー取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 見積依頼の明細とオファーを取得
    const { data: items, error } = await (supabase
      .from('quote_request_items') as SupabaseAny)
      .select(`
        *,
        offers:quote_request_item_offers(*)
      `)
      .eq('quote_request_id', id)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(items || []);
  } catch (error) {
    console.error('Error fetching offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}

// POST: 見積オファー追加
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body: QuoteRequestItemOfferCreate = await request.json();

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 明細が見積依頼に属するか確認
    const { data: item } = await (supabase
      .from('quote_request_items') as SupabaseAny)
      .select('id')
      .eq('id', body.quote_request_item_id)
      .eq('quote_request_id', id)
      .single();

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found in this quote request' },
        { status: 404 }
      );
    }

    // オファー作成
    const { data: offer, error } = await (supabase
      .from('quote_request_item_offers') as SupabaseAny)
      .insert({
        quote_request_item_id: body.quote_request_item_id,
        supplier_code: body.supplier_code,
        supplier_name: body.supplier_name,
        quoted_price: body.quoted_price,
        quoted_unit_price: body.quoted_unit_price,
        quoted_delivery_date: body.quoted_delivery_date,
        lead_time_days: body.lead_time_days,
        purchaser_remarks: body.purchaser_remarks,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    );
  }
}

// PATCH: オファー更新（複数オファーの一括更新対応）
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

    const { offer_id, ...updateData } = body;

    if (!offer_id) {
      return NextResponse.json(
        { error: 'offer_id is required' },
        { status: 400 }
      );
    }

    // オファーが見積依頼に属するか確認
    const { data: existingOffer } = await (supabase
      .from('quote_request_item_offers') as SupabaseAny)
      .select(`
        *,
        item:quote_request_items!inner(quote_request_id)
      `)
      .eq('id', offer_id)
      .single();

    if (!existingOffer || existingOffer.item?.quote_request_id !== id) {
      return NextResponse.json(
        { error: 'Offer not found in this quote request' },
        { status: 404 }
      );
    }

    // 更新可能フィールド
    const allowedFields = [
      'supplier_code',
      'supplier_name',
      'quoted_price',
      'quoted_unit_price',
      'quoted_delivery_date',
      'lead_time_days',
      'purchaser_remarks',
    ];

    const filteredData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    const { data: offer, error } = await (supabase
      .from('quote_request_item_offers') as SupabaseAny)
      .update(filteredData)
      .eq('id', offer_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error('Error updating offer:', error);
    return NextResponse.json(
      { error: 'Failed to update offer' },
      { status: 500 }
    );
  }
}
