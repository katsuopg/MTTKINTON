import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type SupabaseAny = any;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: セクション一覧
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data, error } = await (supabase
      .from('dom_sections') as SupabaseAny)
      .select('*')
      .eq('dom_header_id', id)
      .order('sort_order');

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
  }
}

// POST: セクション追加
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // 現在のセクション数を取得して次の番号を決定
    const { data: existing } = await (supabase
      .from('dom_sections') as SupabaseAny)
      .select('section_number')
      .eq('dom_header_id', id)
      .order('section_number', { ascending: false })
      .limit(1);

    const nextNumber = (existing?.[0]?.section_number || 0) + 1;

    const { data, error } = await (supabase
      .from('dom_sections') as SupabaseAny)
      .insert({
        dom_header_id: id,
        section_number: body.section_number || nextNumber,
        section_code: body.section_code || `S${nextNumber}`,
        section_name: body.section_name || '',
        sort_order: body.sort_order || nextNumber,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json({ error: 'Failed to create section' }, { status: 500 });
  }
}

// PATCH: セクション更新
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id: sectionId, ...updateData } = body;

    if (!sectionId) {
      return NextResponse.json({ error: 'section id required' }, { status: 400 });
    }

    const { data, error } = await (supabase
      .from('dom_sections') as SupabaseAny)
      .update(updateData)
      .eq('id', sectionId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
  }
}

// DELETE: セクション削除
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('section_id');

    if (!sectionId) {
      return NextResponse.json({ error: 'section_id required' }, { status: 400 });
    }

    const { error } = await (supabase
      .from('dom_sections') as SupabaseAny)
      .delete()
      .eq('id', sectionId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 });
  }
}
