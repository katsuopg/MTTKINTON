import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PartSectionCreate, PartSection } from '@/types/parts';

// Note: 部品表テーブルはマイグレーション適用後に型が生成されます
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

// GET: セクション一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const projectCode = searchParams.get('project_code');
    const categoryId = searchParams.get('category_id');

    if (!projectCode) {
      return NextResponse.json(
        { error: 'project_code is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('part_sections')
      .select('*')
      .eq('project_code', projectCode)
      .order('sort_order');

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}

// POST: セクション追加
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: PartSectionCreate = await request.json();

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 次のsort_orderを取得
    const { data: existingSections } = await supabase
      .from('part_sections')
      .select('sort_order')
      .eq('project_code', body.project_code)
      .eq('category_id', body.category_id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const sections = existingSections as SupabaseAny[];
    const nextSortOrder = sections && sections.length > 0
      ? sections[0].sort_order + 1
      : 1;

    const { data, error } = await (supabase
      .from('part_sections') as SupabaseAny)
      .insert({
        ...body,
        sort_order: body.sort_order ?? nextSortOrder,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    );
  }
}

// PATCH: セクション更新
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const { data, error } = await (supabase
      .from('part_sections') as SupabaseAny)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json(
      { error: 'Failed to update section' },
      { status: 500 }
    );
  }
}

// DELETE: セクション削除
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // セクションに紐づく部品のsection_idをnullに更新
    await (supabase
      .from('part_list_items') as SupabaseAny)
      .update({ section_id: null })
      .eq('section_id', id);

    const { error } = await supabase
      .from('part_sections')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}
