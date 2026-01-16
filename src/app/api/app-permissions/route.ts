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

    // クエリ構築
    let query = appPermissionsTable
      .select(`
        *,
        app:apps(code, name),
        target_employee:employees!app_permissions_target_id_fkey(id, name, employee_number),
        target_organization:organizations!app_permissions_target_id_fkey(id, code, name),
        target_role:roles!app_permissions_target_id_fkey(id, code, name)
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

    return NextResponse.json({ permissions });
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
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appPermissionsTable = supabase.from('app_permissions') as any;

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
 * アプリ権限を削除
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

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
