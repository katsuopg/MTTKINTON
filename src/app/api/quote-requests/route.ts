import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { QuoteRequestCreate, QuoteRequestSearchParams } from '@/types/quote-request';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

// GET: 見積依頼一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const params: QuoteRequestSearchParams = {
      status_code: searchParams.get('status_code') as QuoteRequestSearchParams['status_code'] || undefined,
      requester_id: searchParams.get('requester_id') || undefined,
      purchaser_id: searchParams.get('purchaser_id') || undefined,
      work_no: searchParams.get('work_no') || undefined,
      project_code: searchParams.get('project_code') || undefined,
      from_date: searchParams.get('from_date') || undefined,
      to_date: searchParams.get('to_date') || undefined,
      search: searchParams.get('search') || undefined,
    };

    // ステータス一覧取得
    const { data: statuses } = await (supabase
      .from('quote_request_statuses') as SupabaseAny)
      .select('*')
      .order('sort_order');

    // 見積依頼一覧取得
    let query = (supabase.from('quote_requests') as SupabaseAny)
      .select(`
        *,
        status:quote_request_statuses(*),
        items:quote_request_items(count)
      `)
      .order('created_at', { ascending: false });

    // フィルター適用
    if (params.status_code && statuses) {
      const status = statuses.find((s: SupabaseAny) => s.code === params.status_code);
      if (status) {
        query = query.eq('status_id', status.id);
      }
    }

    if (params.requester_id) {
      query = query.eq('requester_id', params.requester_id);
    }

    if (params.purchaser_id) {
      query = query.eq('purchaser_id', params.purchaser_id);
    }

    if (params.work_no) {
      query = query.eq('work_no', params.work_no);
    }

    if (params.project_code) {
      query = query.eq('project_code', params.project_code);
    }

    if (params.from_date) {
      query = query.gte('created_at', params.from_date);
    }

    if (params.to_date) {
      query = query.lte('created_at', params.to_date + 'T23:59:59');
    }

    if (params.search) {
      query = query.or(`request_no.ilike.%${params.search}%,requester_name.ilike.%${params.search}%`);
    }

    const { data: requests, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      statuses: statuses || [],
      requests: requests || [],
    });
  } catch (error) {
    console.error('Error fetching quote requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote requests' },
      { status: 500 }
    );
  }
}

// POST: 見積依頼作成
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: QuoteRequestCreate = await request.json();

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザー名取得
    const { data: employee } = await (supabase.from('employees') as SupabaseAny)
      .select('name, name_en')
      .eq('user_id', user.id)
      .single();

    const requesterName = employee?.name || employee?.name_en || user.email;

    // デフォルトステータス取得
    const { data: defaultStatus } = await (supabase
      .from('quote_request_statuses') as SupabaseAny)
      .select('id')
      .eq('code', 'requested')
      .single();

    if (!defaultStatus) {
      return NextResponse.json(
        { error: 'Default status not found' },
        { status: 500 }
      );
    }

    // 見積依頼ヘッダー作成
    const { data: quoteRequest, error: requestError } = await (supabase
      .from('quote_requests') as SupabaseAny)
      .insert({
        requester_id: user.id,
        requester_name: requesterName,
        work_no: body.work_no,
        project_code: body.project_code,
        status_id: defaultStatus.id,
        desired_delivery_date: body.desired_delivery_date,
        remarks: body.remarks,
        created_by: user.id,
      })
      .select()
      .single();

    if (requestError) {
      throw requestError;
    }

    // 明細作成
    if (body.items && body.items.length > 0) {
      const itemsToInsert = body.items.map((item, index) => ({
        quote_request_id: quoteRequest.id,
        part_list_item_id: item.part_list_item_id,
        model_number: item.model_number,
        manufacturer: item.manufacturer,
        quantity: item.quantity,
        unit: item.unit || '個',
        item_remarks: item.item_remarks,
        status_id: defaultStatus.id,
        sort_order: index + 1,
      }));

      const { error: itemsError } = await (supabase
        .from('quote_request_items') as SupabaseAny)
        .insert(itemsToInsert);

      if (itemsError) {
        // ヘッダーを削除してロールバック
        await (supabase.from('quote_requests') as SupabaseAny)
          .delete()
          .eq('id', quoteRequest.id);
        throw itemsError;
      }
    }

    // ステータスログ記録
    await (supabase.from('quote_request_status_logs') as SupabaseAny)
      .insert({
        quote_request_id: quoteRequest.id,
        to_status_id: defaultStatus.id,
        changed_by: user.id,
      });

    return NextResponse.json(quoteRequest);
  } catch (error) {
    console.error('Error creating quote request:', error);
    return NextResponse.json(
      { error: 'Failed to create quote request' },
      { status: 500 }
    );
  }
}
