import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

type SupabaseAny = any;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: DOMヘッダー詳細（セクション・全アイテム含む）
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // アプリ権限チェック: プロジェクトの閲覧権限が必要
    const permCheck = await requireAppPermission('projects', 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    const { id } = await params;

    // ヘッダー + セクション取得
    const { data, error } = await (supabase
      .from('dom_headers') as SupabaseAny)
      .select(`
        *,
        sections:dom_sections(*)
      `)
      .eq('id', id)
      .order('sort_order', { referencedTable: 'sections' })
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw error;
    }

    // セクションごとにメカ部品を取得
    const sectionIds = (data.sections || []).map((s: SupabaseAny) => s.id);
    let mechItems: SupabaseAny[] = [];
    if (sectionIds.length > 0) {
      const { data: items } = await (supabase
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
      mechItems = items || [];
    }

    // セクションにメカ部品を紐付け
    data.sections = (data.sections || []).map((s: SupabaseAny) => ({
      ...s,
      mech_items: mechItems.filter((m: SupabaseAny) => m.dom_section_id === s.id),
    }));

    // 電気部品取得
    const { data: elecItems } = await (supabase
      .from('dom_elec_items') as SupabaseAny)
      .select('*')
      .eq('dom_header_id', id)
      .eq('is_deleted', false)
      .order('sort_order');
    data.elec_items = elecItems || [];

    // 工数取得
    const { data: labor } = await (supabase
      .from('dom_labor') as SupabaseAny)
      .select('*')
      .eq('dom_header_id', id)
      .eq('is_deleted', false)
      .order('sort_order');
    data.labor = labor || [];

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    console.error('Error fetching DOM header:', error);
    return NextResponse.json({ error: 'Failed to fetch DOM header' }, { status: 500 });
  }
}

// PATCH: DOMヘッダー更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const permCheck = await requireAppPermission('projects', 'can_edit');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      'customer_name', 'machine_name', 'machine_model', 'project_deadline',
      'version', 'status', 'total_cost',
      'designed_by', 'checked_by', 'approved_by',
      'designed_at', 'checked_at', 'approved_at',
      'notes',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const { data, error } = await (supabase
      .from('dom_headers') as SupabaseAny)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating DOM header:', error);
    return NextResponse.json({ error: 'Failed to update DOM header' }, { status: 500 });
  }
}

// DELETE: DOMヘッダー削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const permCheck = await requireAppPermission('projects', 'can_delete');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    const { id } = await params;

    const { error } = await (supabase
      .from('dom_headers') as SupabaseAny)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting DOM header:', error);
    return NextResponse.json({ error: 'Failed to delete DOM header' }, { status: 500 });
  }
}
