import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

type SupabaseAny = any;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: メカ部品一覧（DOMヘッダーIDでフィルタ）
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const permCheck = await requireAppPermission('projects', 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('section_id');

    // まずセクションIDを取得
    const { data: sections } = await (supabase
      .from('dom_sections') as SupabaseAny)
      .select('id')
      .eq('dom_header_id', id);

    if (!sections || sections.length === 0) {
      return NextResponse.json([]);
    }

    const sectionIds = sectionId
      ? [sectionId]
      : sections.map((s: { id: string }) => s.id);

    const { data, error } = await (supabase
      .from('dom_mech_items') as SupabaseAny)
      .select(`
        *,
        material:master_materials(*),
        heat_treatment:master_heat_treatments(*),
        surface_treatment:master_surface_treatments(*)
      `)
      .in('dom_section_id', sectionIds)
      .eq('is_deleted', false)
      .order('sort_order');

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching mech items:', error);
    return NextResponse.json({ error: 'Failed to fetch mech items' }, { status: 500 });
  }
}

// POST: メカ部品作成
export async function POST(request: NextRequest) {
  try {
    const permCheck = await requireAppPermission('projects', 'can_add');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];

    const insertData = items.map((item) => ({
      dom_section_id: item.dom_section_id,
      parent_id: item.parent_id || null,
      item_number: item.item_number || 0,
      category: item.category || 'make',
      item_type: item.item_type || null,
      part_code: item.part_code || null,
      revision: item.revision || 0,
      part_name: item.part_name || null,
      model_number: item.model_number || null,
      material_id: item.material_id || null,
      heat_treatment_id: item.heat_treatment_id || null,
      surface_treatment_id: item.surface_treatment_id || null,
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
      .from('dom_mech_items') as SupabaseAny)
      .insert(insertData)
      .select(`
        *,
        material:master_materials(*),
        heat_treatment:master_heat_treatments(*),
        surface_treatment:master_surface_treatments(*)
      `);

    if (error) throw error;

    return NextResponse.json(Array.isArray(body) ? data : data[0]);
  } catch (error) {
    console.error('Error creating mech items:', error);
    return NextResponse.json({ error: 'Failed to create mech items' }, { status: 500 });
  }
}

// PATCH: メカ部品更新
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

      // 金額自動計算（常に再計算）
      if ('quantity' in updateFields || 'unit_price' in updateFields) {
        // DBから現在の値を取得して正確に計算
        const { data: current } = await (supabase
          .from('dom_mech_items') as SupabaseAny)
          .select('quantity, unit_price')
          .eq('id', id)
          .single();

        const quantity = updateFields.quantity ?? current?.quantity ?? 1;
        const unitPrice = updateFields.unit_price ?? current?.unit_price ?? 0;
        updateFields.amount = Number(quantity) * Number(unitPrice);
      }

      const { data, error } = await (supabase
        .from('dom_mech_items') as SupabaseAny)
        .update(updateFields)
        .eq('id', id)
        .select(`
          *,
          material:master_materials(*),
          heat_treatment:master_heat_treatments(*),
          surface_treatment:master_surface_treatments(*)
        `)
        .single();

      if (error) throw error;
      results.push(data);
    }

    return NextResponse.json(Array.isArray(body) ? results : results[0]);
  } catch (error) {
    console.error('Error updating mech items:', error);
    return NextResponse.json({ error: 'Failed to update mech items' }, { status: 500 });
  }
}

// DELETE: メカ部品論理削除
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
      .from('dom_mech_items') as SupabaseAny)
      .update({ is_deleted: true })
      .in('id', idList);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting mech items:', error);
    return NextResponse.json({ error: 'Failed to delete mech items' }, { status: 500 });
  }
}
