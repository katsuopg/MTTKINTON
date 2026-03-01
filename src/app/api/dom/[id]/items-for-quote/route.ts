import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 見積依頼用のDOMアイテム取得（mech_ids, elec_idsでフィルタ）
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const permCheck = await requireAppPermission('projects', 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const mechIds = searchParams.get('mech_ids')?.split(',').filter(Boolean) || [];
    const elecIds = searchParams.get('elec_ids')?.split(',').filter(Boolean) || [];

    const result: { mech_items: SupabaseAny[]; elec_items: SupabaseAny[] } = {
      mech_items: [],
      elec_items: [],
    };

    // メカ部品取得
    if (mechIds.length > 0) {
      const { data: mechItems } = await (supabase
        .from('dom_mech_items') as SupabaseAny)
        .select('id, part_name, model_number, manufacturer, quantity, unit, status, category, dom_section_id')
        .in('id', mechIds)
        .eq('is_deleted', false);

      // dom_header_idの検証（セクション経由）
      if (mechItems && mechItems.length > 0) {
        const sectionIds = [...new Set(mechItems.map((i: SupabaseAny) => i.dom_section_id))];
        const { data: sections } = await (supabase
          .from('dom_sections') as SupabaseAny)
          .select('id')
          .in('id', sectionIds)
          .eq('dom_header_id', id);

        const validSectionIds = new Set((sections || []).map((s: SupabaseAny) => s.id));
        result.mech_items = mechItems.filter((i: SupabaseAny) => validSectionIds.has(i.dom_section_id));
      }
    }

    // 電気部品取得
    if (elecIds.length > 0) {
      const { data: elecItems } = await (supabase
        .from('dom_elec_items') as SupabaseAny)
        .select('id, part_name, model_number, manufacturer, quantity, unit, status, category')
        .in('id', elecIds)
        .eq('dom_header_id', id)
        .eq('is_deleted', false);

      result.elec_items = elecItems || [];
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching DOM items for quote:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}
