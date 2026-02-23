import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * アプリ権限一覧を取得
 * GET /api/app-permissions?app_code=employees
 * GET /api/app-permissions?app_id=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const appCode = searchParams.get('app_code');
    const appId = searchParams.get('app_id');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appPermissionsTable = supabase.from('app_permissions') as any;

    let targetAppId = appId;

    // app_codeからapp_idを取得
    if (appCode && !appId) {
      const { data: app, error: appError } = await appsTable
        .select('id')
        .eq('code', appCode)
        .single();

      if (appError || !app) {
        return NextResponse.json({ error: 'App not found' }, { status: 404 });
      }
      targetAppId = app.id;
    }

    // クエリ構築（target_idはFKなしの多態カラムのため個別に解決）
    let query = appPermissionsTable
      .select(`
        *,
        app:apps(code, name)
      `)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (targetAppId) {
      query = query.eq('app_id', targetAppId);
    }

    const { data: permissions, error } = await query;

    if (error) {
      console.error('Error fetching app permissions:', error);
      return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
    }

    // target_idを種別ごとに解決
    const perms = permissions || [];
    const roleIds = perms.filter((p: { target_type: string; target_id: string | null }) => p.target_type === 'role' && p.target_id).map((p: { target_id: string }) => p.target_id);
    const orgIds = perms.filter((p: { target_type: string; target_id: string | null }) => p.target_type === 'organization' && p.target_id).map((p: { target_id: string }) => p.target_id);
    const userIds = perms.filter((p: { target_type: string; target_id: string | null }) => p.target_type === 'user' && p.target_id).map((p: { target_id: string }) => p.target_id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rolesTable = supabase.from('roles') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orgsTable = supabase.from('organizations') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const empsTable = supabase.from('employees') as any;

    const [rolesRes, orgsRes, empsRes] = await Promise.all([
      roleIds.length > 0 ? rolesTable.select('id, code, name').in('id', roleIds) : { data: [] },
      orgIds.length > 0 ? orgsTable.select('id, code, name').in('id', orgIds) : { data: [] },
      userIds.length > 0 ? empsTable.select('id, name, employee_number').in('id', userIds) : { data: [] },
    ]);

    const roleMap = Object.fromEntries((rolesRes.data || []).map((r: { id: string }) => [r.id, r]));
    const orgMap = Object.fromEntries((orgsRes.data || []).map((o: { id: string }) => [o.id, o]));
    const empMap = Object.fromEntries((empsRes.data || []).map((e: { id: string }) => [e.id, e]));

    const enriched = perms.map((p: { target_type: string; target_id: string | null }) => ({
      ...p,
      target_role: p.target_type === 'role' && p.target_id ? roleMap[p.target_id] || null : null,
      target_organization: p.target_type === 'organization' && p.target_id ? orgMap[p.target_id] || null : null,
      target_employee: p.target_type === 'user' && p.target_id ? empMap[p.target_id] || null : null,
    }));

    return NextResponse.json({ permissions: enriched });
  } catch (error) {
    console.error('Error in GET /api/app-permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * アプリ権限を作成
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      app_id,
      app_code,
      target_type,
      target_id,
      can_view,
      can_add,
      can_edit,
      can_delete,
      can_manage,
      can_export,
      can_import,
      include_sub_organizations,
      priority,
    } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appPermissionsTable = supabase.from('app_permissions') as any;

    let targetAppId = app_id;

    // app_codeからapp_idを取得
    if (app_code && !app_id) {
      const { data: app, error: appError } = await appsTable
        .select('id')
        .eq('code', app_code)
        .single();

      if (appError || !app) {
        return NextResponse.json({ error: 'App not found' }, { status: 404 });
      }
      targetAppId = app.id;
    }

    if (!targetAppId || !target_type) {
      return NextResponse.json({ error: 'app_id (or app_code) and target_type are required' }, { status: 400 });
    }

    // 従業員IDを取得（created_by用）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employeesTable = supabase.from('employees') as any;
    const { data: employee } = await employeesTable
      .select('id')
      .eq('user_id', user.id)
      .single();

    const { data: permission, error } = await appPermissionsTable
      .insert({
        app_id: targetAppId,
        target_type,
        target_id: target_id || null,
        can_view: can_view ?? false,
        can_add: can_add ?? false,
        can_edit: can_edit ?? false,
        can_delete: can_delete ?? false,
        can_manage: can_manage ?? false,
        can_export: can_export ?? false,
        can_import: can_import ?? false,
        include_sub_organizations: include_sub_organizations ?? true,
        priority: priority ?? 0,
        created_by: employee?.id || null,
      } as never)
      .select()
      .single();

    if (error) {
      console.error('Error creating app permission:', error);
      return NextResponse.json({ error: 'Failed to create permission' }, { status: 500 });
    }

    return NextResponse.json({ permission }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/app-permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * アプリ権限を更新
 * 単一更新: { id, ...updateData }
 * バッチ更新: { items: [{ id, priority }] }
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appPermissionsTable = supabase.from('app_permissions') as any;

    // バッチ更新: { items: [{ id, priority }] }
    if (Array.isArray(body.items)) {
      const now = new Date().toISOString();
      const results = await Promise.all(
        body.items.map((item: { id: string; priority: number }) =>
          appPermissionsTable
            .update({ priority: item.priority, updated_at: now } as never)
            .eq('id', item.id)
        )
      );

      const failed = results.filter((r: { error: unknown }) => r.error);
      if (failed.length > 0) {
        console.error('Error batch updating app permissions:', failed[0].error);
        return NextResponse.json({ error: 'Failed to update some permissions' }, { status: 500 });
      }

      return NextResponse.json({ success: true, updated: body.items.length });
    }

    // 単一更新: { id, ...updateData }
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data: permission, error } = await appPermissionsTable
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating app permission:', error);
      return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 });
    }

    return NextResponse.json({ permission });
  } catch (error) {
    console.error('Error in PATCH /api/app-permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * アプリ権限を削除（論理削除）
 * DELETE /api/app-permissions?id=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // query parameterからidを取得（DELETEリクエストのbody問題を回避）
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appPermissionsTable = supabase.from('app_permissions') as any;

    // 論理削除
    const { error } = await appPermissionsTable
      .update({ is_active: false, updated_at: new Date().toISOString() } as never)
      .eq('id', id);

    if (error) {
      console.error('Error deleting app permission:', error);
      return NextResponse.json({ error: 'Failed to delete permission' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/app-permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
