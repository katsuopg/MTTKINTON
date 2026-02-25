import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';

// ロール詳細取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rolesTable = supabase.from('roles') as any;
    const { data: role, error } = await rolesTable
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching role:', error);
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error('Error in GET /api/roles/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ロール更新
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 設定管理権限が必要
    const permCheck = await requirePermission('manage_settings');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const { id } = await params;
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rolesTable = supabase.from('roles') as any;

    // システムロールは編集不可
    const { data: existingRole } = await rolesTable
      .select('is_system_role')
      .eq('id', id)
      .single();

    if (existingRole?.is_system_role) {
      return NextResponse.json({ error: 'Cannot modify system role' }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    const allowedFields = [
      'code', 'name', 'name_en', 'name_th', 'description',
      'can_manage_users', 'can_manage_organizations', 'can_manage_employees',
      'can_manage_quotations', 'can_view_all_records', 'can_edit_all_records',
      'can_delete_records', 'can_export_data', 'can_import_data',
      'can_manage_settings', 'is_active', 'display_order'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    updateData.updated_at = new Date().toISOString();

    const { data: role, error } = await rolesTable
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating role:', error);
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error('Error in PUT /api/roles/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ロール削除
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 設定管理権限が必要
    const permCheck = await requirePermission('manage_settings');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const { id } = await params;
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rolesTable = supabase.from('roles') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRolesTable = supabase.from('user_roles') as any;

    // システムロールは削除不可
    const { data: existingRole } = await rolesTable
      .select('is_system_role')
      .eq('id', id)
      .single();

    if (existingRole?.is_system_role) {
      return NextResponse.json({ error: 'Cannot delete system role' }, { status: 403 });
    }

    // このロールを使用しているユーザーがいるか確認
    const { count } = await userRolesTable
      .select('*', { count: 'exact', head: true })
      .eq('role_id', id)
      .eq('is_active', true);

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role that is assigned to users' },
        { status: 409 }
      );
    }

    const { error } = await rolesTable
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting role:', error);
      return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/roles/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
