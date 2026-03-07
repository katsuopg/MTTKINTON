import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any;

/**
 * アプリグループ一覧取得
 * GET /api/app-groups
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: groups } = await (supabase.from('app_groups' as SA) as SA)
    .select('id, name, description, icon, color, display_order')
    .eq('is_active', true)
    .order('display_order');

  // 各グループのアプリ一覧
  const groupIds = (groups || []).map((g: SA) => g.id);
  let items: SA[] = [];
  if (groupIds.length > 0) {
    const { data } = await (supabase.from('app_group_items' as SA) as SA)
      .select('group_id, app_id, display_order, app:apps(code, name, name_en, name_th, icon, color, app_type)')
      .in('group_id', groupIds)
      .order('display_order');
    items = data || [];
  }

  // グループにアプリを紐付け
  const result = (groups || []).map((g: SA) => ({
    ...g,
    apps: items.filter((i: SA) => i.group_id === g.id).map((i: SA) => ({
      app_id: i.app_id,
      display_order: i.display_order,
      ...i.app,
    })),
  }));

  return NextResponse.json({ groups: result });
}

/**
 * アプリグループ作成/更新
 * POST /api/app-groups
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 管理者チェック
  const { data: emp } = await (supabase.from('employees') as SA)
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (emp) {
    const { data: roles } = await (supabase.from('user_roles') as SA)
      .select('role:roles(code, is_system_role)')
      .eq('employee_id', emp.id);
    const isAdmin = (roles || []).some((r: SA) => r.role?.code === 'administrator' || r.role?.is_system_role);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
  }

  const body = await request.json();
  const { id, name, description, icon, color, display_order, app_ids } = body;

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  let groupId = id;

  if (id) {
    // 更新
    await (supabase.from('app_groups' as SA) as SA)
      .update({
        name,
        description: description || null,
        icon: icon || 'Folder',
        color: color || '#6366F1',
        display_order: display_order ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  } else {
    // 作成
    const { data: group } = await (supabase.from('app_groups' as SA) as SA)
      .insert({
        name,
        description: description || null,
        icon: icon || 'Folder',
        color: color || '#6366F1',
        display_order: display_order ?? 0,
      })
      .select('id')
      .single();
    groupId = group?.id;
  }

  // アプリ紐付け更新
  if (groupId && Array.isArray(app_ids)) {
    await (supabase.from('app_group_items' as SA) as SA)
      .delete()
      .eq('group_id', groupId);

    if (app_ids.length > 0) {
      const rows = app_ids.map((appId: string, i: number) => ({
        group_id: groupId,
        app_id: appId,
        display_order: i,
      }));
      await (supabase.from('app_group_items' as SA) as SA).insert(rows);
    }
  }

  return NextResponse.json({ success: true, group_id: groupId });
}

/**
 * アプリグループ削除
 * DELETE /api/app-groups?id=xxx
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  await (supabase.from('app_groups' as SA) as SA)
    .update({ is_active: false })
    .eq('id', id);

  return NextResponse.json({ success: true });
}
