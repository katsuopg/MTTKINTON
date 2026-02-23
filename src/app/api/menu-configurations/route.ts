import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * メニュー設定CRUD API（設定画面用）
 *
 * GET ?organization_id=xxx  — 指定組織の設定取得（省略時はデフォルト設定）
 * PUT { organization_id, items } — 全置換保存
 * DELETE ?organization_id=xxx — 指定組織の設定を全削除（デフォルトに戻す）
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from('menu_configurations') as any;

    let query = table
      .select('id, organization_id, menu_key, display_order, is_visible')
      .order('display_order', { ascending: true });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    } else {
      query = query.is('organization_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching menu configurations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch (error) {
    console.error('Error in GET /api/menu-configurations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organization_id, items } = body as {
      organization_id: string | null;
      items: { menu_key: string; display_order: number; is_visible: boolean }[];
    };

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'items must be an array' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from('menu_configurations') as any;

    // 既存レコードを削除
    let deleteQuery = table.delete();
    if (organization_id) {
      deleteQuery = deleteQuery.eq('organization_id', organization_id);
    } else {
      deleteQuery = deleteQuery.is('organization_id', null);
    }
    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      console.error('Error deleting menu configurations:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 新規レコードを挿入
    if (items.length > 0) {
      const rows = items.map((item) => ({
        organization_id: organization_id || null,
        menu_key: item.menu_key,
        display_order: item.display_order,
        is_visible: item.is_visible,
      }));

      const { error: insertError } = await table.insert(rows);

      if (insertError) {
        console.error('Error inserting menu configurations:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/menu-configurations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from('menu_configurations') as any;

    let deleteQuery = table.delete();
    if (organizationId) {
      deleteQuery = deleteQuery.eq('organization_id', organizationId);
    } else {
      deleteQuery = deleteQuery.is('organization_id', null);
    }

    const { error } = await deleteQuery;

    if (error) {
      console.error('Error deleting menu configurations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/menu-configurations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
