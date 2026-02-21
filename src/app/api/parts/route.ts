import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PartListItemCreate, PartListItemUpdate, PartListItem } from '@/types/parts';

// Note: 部品表テーブルはマイグレーション適用後に型が生成されます
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

// GET: 部品表データ取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectCode = searchParams.get('project_code');
    const categoryId = searchParams.get('category_id');

    if (!projectCode) {
      return NextResponse.json(
        { error: 'project_code is required' },
        { status: 400 }
      );
    }

    // カテゴリ一覧取得
    const { data: categories, error: catError } = await supabase
      .from('part_categories')
      .select('*')
      .order('sort_order');

    if (catError) {
      throw catError;
    }

    // セクション一覧取得
    const { data: sections, error: secError } = await supabase
      .from('part_sections')
      .select('*')
      .eq('project_code', projectCode)
      .order('sort_order');

    if (secError) {
      throw secError;
    }

    // 部品一覧取得
    let itemsQuery = supabase
      .from('part_list_items')
      .select('*')
      .eq('project_code', projectCode)
      .eq('is_deleted', false)
      .order('sort_order');

    if (categoryId) {
      itemsQuery = itemsQuery.eq('category_id', categoryId);
    }

    const { data: items, error: itemsError } = await itemsQuery;

    if (itemsError) {
      throw itemsError;
    }

    return NextResponse.json({
      categories,
      sections: sections || [],
      items: items || [],
    });
  } catch (error) {
    console.error('Error fetching parts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parts data' },
      { status: 500 }
    );
  }
}

// POST: 部品追加
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: PartListItemCreate | PartListItemCreate[] = await request.json();

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = Array.isArray(body) ? body : [body];

    // 各アイテムにcreated_byを追加
    const itemsWithCreator = items.map(item => ({
      ...item,
      created_by: user.id,
    }));

    const { data, error } = await (supabase
      .from('part_list_items') as SupabaseAny)
      .insert(itemsWithCreator)
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating parts:', error);
    return NextResponse.json(
      { error: 'Failed to create parts' },
      { status: 500 }
    );
  }
}

// PATCH: 部品更新
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: PartListItemUpdate | PartListItemUpdate[] = await request.json();

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = Array.isArray(body) ? body : [body];
    const results: PartListItem[] = [];

    for (const item of items) {
      const { id, ...updateData } = item;
      const { data, error } = await (supabase
        .from('part_list_items') as SupabaseAny)
        .update({
          ...updateData,
          updated_by: user.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      results.push(data as PartListItem);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error updating parts:', error);
    return NextResponse.json(
      { error: 'Failed to update parts' },
      { status: 500 }
    );
  }
}

// DELETE: 部品削除（論理削除）
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetIds = ids ? ids.split(',') : id ? [id] : [];

    if (targetIds.length === 0) {
      return NextResponse.json(
        { error: 'id or ids is required' },
        { status: 400 }
      );
    }

    const { error } = await (supabase
      .from('part_list_items') as SupabaseAny)
      .update({
        is_deleted: true,
        updated_by: user.id,
      })
      .in('id', targetIds);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, deleted: targetIds.length });
  } catch (error) {
    console.error('Error deleting parts:', error);
    return NextResponse.json(
      { error: 'Failed to delete parts' },
      { status: 500 }
    );
  }
}
