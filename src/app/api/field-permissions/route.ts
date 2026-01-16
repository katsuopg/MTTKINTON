import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * フィールド権限一覧を取得
 * GET /api/field-permissions?app_code=employees
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
    const fieldPermissionsTable = supabase.from('field_permissions') as any;

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

    let query = fieldPermissionsTable
      .select(`
        *,
        app:apps(code, name)
      `)
      .eq('is_active', true)
      .order('field_name')
      .order('priority', { ascending: false });

    if (targetAppId) {
      query = query.eq('app_id', targetAppId);
    }

    const { data: permissions, error } = await query;

    if (error) {
      console.error('Error fetching field permissions:', error);
      return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
    }

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Error in GET /api/field-permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * フィールド権限を作成
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
      field_name,
      field_label,
      target_type,
      target_id,
      access_level,
      include_sub_organizations,
      priority,
    } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldPermissionsTable = supabase.from('field_permissions') as any;
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

    if (!targetAppId || !field_name || !target_type || !access_level) {
      return NextResponse.json({
        error: 'app_id (or app_code), field_name, target_type, and access_level are required'
      }, { status: 400 });
    }

    const validAccessLevels = ['view', 'edit', 'hidden'];
    if (!validAccessLevels.includes(access_level)) {
      return NextResponse.json({
        error: 'access_level must be one of: view, edit, hidden'
      }, { status: 400 });
    }

    const { data: employee } = await employeesTable
      .select('id')
      .eq('user_id', user.id)
      .single();

    const { data: permission, error } = await fieldPermissionsTable
      .insert({
        app_id: targetAppId,
        field_name,
        field_label: field_label || null,
        target_type,
        target_id: target_id || null,
        access_level,
        include_sub_organizations: include_sub_organizations ?? true,
        priority: priority ?? 0,
        created_by: employee?.id || null,
      } as never)
      .select()
      .single();

    if (error) {
      console.error('Error creating field permission:', error);
      return NextResponse.json({ error: 'Failed to create permission' }, { status: 500 });
    }

    return NextResponse.json({ permission }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/field-permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * フィールド権限を更新
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

    // access_levelのバリデーション
    if (updateData.access_level) {
      const validAccessLevels = ['view', 'edit', 'hidden'];
      if (!validAccessLevels.includes(updateData.access_level)) {
        return NextResponse.json({
          error: 'access_level must be one of: view, edit, hidden'
        }, { status: 400 });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldPermissionsTable = supabase.from('field_permissions') as any;

    const { data: permission, error } = await fieldPermissionsTable
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating field permission:', error);
      return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 });
    }

    return NextResponse.json({ permission });
  } catch (error) {
    console.error('Error in PATCH /api/field-permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * フィールド権限を削除
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
    const fieldPermissionsTable = supabase.from('field_permissions') as any;

    const { error } = await fieldPermissionsTable
      .update({ is_active: false, updated_at: new Date().toISOString() } as never)
      .eq('id', id);

    if (error) {
      console.error('Error deleting field permission:', error);
      return NextResponse.json({ error: 'Failed to delete permission' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/field-permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
