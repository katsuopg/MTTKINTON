import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';

/**
 * レコード権限ルール一覧を取得
 * GET /api/record-permissions?app_code=employees
 */
export async function GET(request: NextRequest) {
  try {
    const permCheck = await requirePermission('manage_settings');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    const searchParams = request.nextUrl.searchParams;
    const appCode = searchParams.get('app_code');
    const appId = searchParams.get('app_id');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recordPermissionRulesTable = supabase.from('record_permission_rules') as any;

    let targetAppId = appId;

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

    let query = recordPermissionRulesTable
      .select(`
        *,
        app:apps(code, name)
      `)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (targetAppId) {
      query = query.eq('app_id', targetAppId);
    }

    const { data: rules, error } = await query;

    if (error) {
      console.error('Error fetching record permission rules:', error);
      return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
    }

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error in GET /api/record-permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * レコード権限ルールを作成
 */
export async function POST(request: Request) {
  try {
    const permCheck = await requirePermission('manage_settings');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      app_id,
      app_code,
      name,
      description,
      condition,
      target_type,
      target_id,
      target_field,
      can_view,
      can_edit,
      can_delete,
      include_sub_organizations,
      priority,
    } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recordPermissionRulesTable = supabase.from('record_permission_rules') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employeesTable = supabase.from('employees') as any;

    let targetAppId = app_id;

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

    if (!targetAppId || !name || !condition || !target_type) {
      return NextResponse.json({
        error: 'app_id (or app_code), name, condition, and target_type are required'
      }, { status: 400 });
    }

    const { data: employee } = await employeesTable
      .select('id')
      .eq('user_id', user!.id)
      .single();

    const { data: rule, error } = await recordPermissionRulesTable
      .insert({
        app_id: targetAppId,
        name,
        description: description || null,
        condition,
        target_type,
        target_id: target_id || null,
        target_field: target_field || null,
        can_view: can_view ?? false,
        can_edit: can_edit ?? false,
        can_delete: can_delete ?? false,
        include_sub_organizations: include_sub_organizations ?? true,
        priority: priority ?? 0,
        created_by: employee?.id || null,
      } as never)
      .select()
      .single();

    if (error) {
      console.error('Error creating record permission rule:', error);
      return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
    }

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/record-permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * レコード権限ルールを更新
 */
export async function PATCH(request: Request) {
  try {
    const permCheck = await requirePermission('manage_settings');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recordPermissionRulesTable = supabase.from('record_permission_rules') as any;

    const { data: rule, error } = await recordPermissionRulesTable
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating record permission rule:', error);
      return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
    }

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Error in PATCH /api/record-permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * レコード権限ルールを削除
 */
export async function DELETE(request: Request) {
  try {
    const permCheck = await requirePermission('manage_settings');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recordPermissionRulesTable = supabase.from('record_permission_rules') as any;

    const { error } = await recordPermissionRulesTable
      .update({ is_active: false, updated_at: new Date().toISOString() } as never)
      .eq('id', id);

    if (error) {
      console.error('Error deleting record permission rule:', error);
      return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/record-permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
