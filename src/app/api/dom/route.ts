import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

type SupabaseAny = any;

// GET: DOMヘッダー一覧（?project_id=で絞り込み）
export async function GET(request: NextRequest) {
  try {
    const permCheck = await requireAppPermission('projects', 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    let query = (supabase.from('dom_headers') as SupabaseAny)
      .select('*')
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    console.error('Error fetching DOM headers:', error);
    return NextResponse.json({ error: 'Failed to fetch DOM headers' }, { status: 500 });
  }
}

// POST: DOMヘッダー作成 + デフォルトS1セクション自動生成
export async function POST(request: NextRequest) {
  try {
    const permCheck = await requireAppPermission('projects', 'can_add');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();

    // DOMヘッダー作成
    const { data: header, error: headerError } = await (supabase
      .from('dom_headers') as SupabaseAny)
      .insert({
        project_id: body.project_id,
        customer_name: body.customer_name || null,
        machine_name: body.machine_name || null,
        machine_model: body.machine_model || null,
        project_deadline: body.project_deadline || null,
        notes: body.notes || null,
        designed_by: user!.id,
        created_by: user!.id,
      })
      .select()
      .single();

    if (headerError) throw headerError;

    // デフォルトS1セクション作成
    const { error: sectionError } = await (supabase
      .from('dom_sections') as SupabaseAny)
      .insert({
        dom_header_id: header.id,
        section_number: 1,
        section_code: 'S1',
        section_name: '',
        sort_order: 1,
      });

    if (sectionError) {
      console.error('Error creating default section:', sectionError);
    }

    // 作成したヘッダーをセクション込みで再取得
    const { data: result, error: fetchError } = await (supabase
      .from('dom_headers') as SupabaseAny)
      .select(`
        *,
        sections:dom_sections(*)
      `)
      .eq('id', header.id)
      .order('sort_order', { referencedTable: 'dom_sections' })
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating DOM header:', error);
    return NextResponse.json({ error: 'Failed to create DOM header' }, { status: 500 });
  }
}
