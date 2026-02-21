import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type SupabaseAny = any;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 工数一覧
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data, error } = await (supabase
      .from('dom_labor') as SupabaseAny)
      .select('*')
      .eq('dom_header_id', id)
      .eq('is_deleted', false)
      .order('sort_order');

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching labor:', error);
    return NextResponse.json({ error: 'Failed to fetch labor' }, { status: 500 });
  }
}

// POST: 工数作成
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];

    const insertData = items.map((item) => ({
      dom_header_id: id,
      discipline: item.discipline,
      work_type: item.work_type,
      description: item.description || null,
      hours: item.hours ?? 0,
      hourly_rate: item.hourly_rate ?? 0,
      amount: (item.hours ?? 0) * (item.hourly_rate ?? 0),
      assigned_to: item.assigned_to || null,
      notes: item.notes || null,
      sort_order: item.sort_order || 0,
      created_by: user.id,
    }));

    const { data, error } = await (supabase
      .from('dom_labor') as SupabaseAny)
      .insert(insertData)
      .select();

    if (error) throw error;

    return NextResponse.json(Array.isArray(body) ? data : data[0]);
  } catch (error) {
    console.error('Error creating labor:', error);
    return NextResponse.json({ error: 'Failed to create labor' }, { status: 500 });
  }
}

// PATCH: 工数更新
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];

    const results = [];
    for (const item of items) {
      const { id, ...updateFields } = item;
      if (!id) continue;

      if ('hours' in updateFields || 'hourly_rate' in updateFields) {
        const hours = updateFields.hours ?? item.hours ?? 0;
        const hourlyRate = updateFields.hourly_rate ?? item.hourly_rate ?? 0;
        updateFields.amount = hours * hourlyRate;
      }

      const { data, error } = await (supabase
        .from('dom_labor') as SupabaseAny)
        .update(updateFields)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      results.push(data);
    }

    return NextResponse.json(Array.isArray(body) ? results : results[0]);
  } catch (error) {
    console.error('Error updating labor:', error);
    return NextResponse.json({ error: 'Failed to update labor' }, { status: 500 });
  }
}

// DELETE: 工数論理削除
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ error: 'ids required' }, { status: 400 });
    }

    const idList = ids.split(',');
    const { error } = await (supabase
      .from('dom_labor') as SupabaseAny)
      .update({ is_deleted: true })
      .in('id', idList);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting labor:', error);
    return NextResponse.json({ error: 'Failed to delete labor' }, { status: 500 });
  }
}
