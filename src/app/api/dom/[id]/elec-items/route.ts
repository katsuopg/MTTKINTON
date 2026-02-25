import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

type SupabaseAny = any;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 電気部品一覧
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const permCheck = await requireAppPermission('projects', 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    const { id } = await params;

    const { data, error } = await (supabase
      .from('dom_elec_items') as SupabaseAny)
      .select('*')
      .eq('dom_header_id', id)
      .eq('is_deleted', false)
      .order('sort_order');

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching elec items:', error);
    return NextResponse.json({ error: 'Failed to fetch elec items' }, { status: 500 });
  }
}

// POST: 電気部品作成
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const permCheck = await requireAppPermission('projects', 'can_add');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { id } = await params;
    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];

    const insertData = items.map((item) => ({
      dom_header_id: id,
      item_number: item.item_number || 0,
      category: item.category || 'buy',
      mark: item.mark || null,
      part_name: item.part_name || null,
      model_number: item.model_number || null,
      manufacturer: item.manufacturer || null,
      quantity: item.quantity ?? 1,
      unit: item.unit || '個',
      unit_price: item.unit_price ?? 0,
      amount: (item.quantity ?? 1) * (item.unit_price ?? 0),
      notes: item.notes || null,
      sort_order: item.sort_order || 0,
      created_by: user!.id,
    }));

    const { data, error } = await (supabase
      .from('dom_elec_items') as SupabaseAny)
      .insert(insertData)
      .select();

    if (error) throw error;

    return NextResponse.json(Array.isArray(body) ? data : data[0]);
  } catch (error) {
    console.error('Error creating elec items:', error);
    return NextResponse.json({ error: 'Failed to create elec items' }, { status: 500 });
  }
}

// PATCH: 電気部品更新
export async function PATCH(request: NextRequest) {
  try {
    const permCheck = await requireAppPermission('projects', 'can_edit');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];

    const results = [];
    for (const item of items) {
      const { id, ...updateFields } = item;
      if (!id) continue;

      if ('quantity' in updateFields || 'unit_price' in updateFields) {
        const quantity = updateFields.quantity ?? item.quantity ?? 1;
        const unitPrice = updateFields.unit_price ?? item.unit_price ?? 0;
        updateFields.amount = quantity * unitPrice;
      }

      const { data, error } = await (supabase
        .from('dom_elec_items') as SupabaseAny)
        .update(updateFields)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      results.push(data);
    }

    return NextResponse.json(Array.isArray(body) ? results : results[0]);
  } catch (error) {
    console.error('Error updating elec items:', error);
    return NextResponse.json({ error: 'Failed to update elec items' }, { status: 500 });
  }
}

// DELETE: 電気部品論理削除
export async function DELETE(request: NextRequest) {
  try {
    const permCheck = await requireAppPermission('projects', 'can_delete');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ error: 'ids required' }, { status: 400 });
    }

    const idList = ids.split(',');
    const { error } = await (supabase
      .from('dom_elec_items') as SupabaseAny)
      .update({ is_deleted: true })
      .in('id', idList);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting elec items:', error);
    return NextResponse.json({ error: 'Failed to delete elec items' }, { status: 500 });
  }
}
