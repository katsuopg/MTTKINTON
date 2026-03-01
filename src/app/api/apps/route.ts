import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';

/**
 * アプリ一覧を取得
 * GET /api/apps
 * クエリパラメータ:
 *   type=dynamic|static|all (デフォルト: all)
 */
export async function GET(request: Request) {
  try {
    const permCheck = await requirePermission('manage_settings');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type') || 'all';
    const includeDeleted = searchParams.get('include_deleted') === 'true';

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('apps') as any)
      .select('*')
      .order('display_order', { ascending: true });

    if (includeDeleted) {
      // 削除済みのみ表示
      query = query.eq('is_active', false).not('deleted_at', 'is', null);
    } else {
      query = query.eq('is_active', true);
    }

    if (typeFilter === 'dynamic') {
      query = query.eq('app_type', 'dynamic');
    } else if (typeFilter === 'static') {
      query = query.eq('app_type', 'static');
    }

    const { data: apps, error } = await query;

    if (error) {
      console.error('Error fetching apps:', error);
      return NextResponse.json({ error: 'Failed to fetch apps' }, { status: 500 });
    }

    return NextResponse.json({ apps });
  } catch (error) {
    console.error('Error in GET /api/apps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * 動的アプリを作成
 * POST /api/apps
 */
export async function POST(request: Request) {
  try {
    const permCheck = await requirePermission('manage_settings');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const body = await request.json();
    const { code, name, name_en, name_th, description, icon, color } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'code, name are required' }, { status: 400 });
    }

    // コードフォーマットチェック（英数字+アンダースコアのみ）
    if (!/^[a-z][a-z0-9_]*$/.test(code)) {
      return NextResponse.json({ error: 'code must start with lowercase letter and contain only lowercase letters, numbers, and underscores' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;

    // 重複チェック
    const { data: existing } = await appsTable.select('id').eq('code', code).single();
    if (existing) {
      return NextResponse.json({ error: 'App code already exists' }, { status: 409 });
    }

    // 最大display_orderを取得
    const { data: maxOrderResult } = await appsTable
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();
    const nextOrder = (maxOrderResult?.display_order || 0) + 10;

    // アプリ作成（動的アプリはtable_name='app_records'固定）
    const { data: app, error } = await appsTable
      .insert({
        code,
        name,
        name_en: name_en || null,
        name_th: name_th || null,
        description: description || null,
        table_name: 'app_records',
        icon: icon || null,
        color: color || null,
        display_order: nextOrder,
        app_type: 'dynamic',
      } as never)
      .select()
      .single();

    if (error) {
      console.error('Error creating app:', error);
      return NextResponse.json({ error: 'Failed to create app' }, { status: 500 });
    }

    // デフォルト権限を自動設定（everyone: can_view=true）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appPermissionsTable = supabase.from('app_permissions') as any;
    await appPermissionsTable.insert({
      app_id: app.id,
      target_type: 'everyone',
      target_id: null,
      can_view: true,
      can_add: true,
      can_edit: true,
      can_delete: false,
      can_manage: false,
      can_export: false,
      can_import: false,
      priority: 0,
      is_active: true,
    } as never);

    // メニュー設定に追加
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const menuConfigTable = supabase.from('menu_configurations') as any;
    const { data: maxMenuOrder } = await menuConfigTable
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();
    const nextMenuOrder = (maxMenuOrder?.display_order || 0) + 10;

    await menuConfigTable.insert({
      menu_key: code,
      display_order: nextMenuOrder,
      is_visible: true,
    } as never);

    return NextResponse.json({ app }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/apps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
