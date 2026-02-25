import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';

// ユーザーロール一覧取得
export async function GET(request: Request) {
  try {
    const permCheck = await requirePermission('manage_users');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');
    const roleId = searchParams.get('role_id');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRolesTable = supabase.from('user_roles') as any;

    let query = userRolesTable
      .select(`
        *,
        role:roles(*),
        employee:employees!user_roles_employee_id_fkey(id, name, employee_number),
        organization:organizations(id, name, code)
      `)
      .eq('is_active', true);

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    if (roleId) {
      query = query.eq('role_id', roleId);
    }

    const { data: userRoles, error } = await query.order('granted_at', { ascending: false });

    if (error) {
      console.error('Error fetching user roles:', error);
      return NextResponse.json({ error: 'Failed to fetch user roles' }, { status: 500 });
    }

    return NextResponse.json({ userRoles });
  } catch (error) {
    console.error('Error in GET /api/user-roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ユーザーにロールを割り当て
export async function POST(request: Request) {
  try {
    const permCheck = await requirePermission('manage_users');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { employee_id, role_id, organization_id, expires_at } = body;

    if (!employee_id || !role_id) {
      return NextResponse.json(
        { error: 'employee_id and role_id are required' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRolesTable = supabase.from('user_roles') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employeesTable = supabase.from('employees') as any;

    // 既存の同じ割り当てがあるか確認
    let existingQuery = userRolesTable
      .select('id')
      .eq('employee_id', employee_id)
      .eq('role_id', role_id)
      .eq('is_active', true);

    if (organization_id) {
      existingQuery = existingQuery.eq('organization_id', organization_id);
    } else {
      existingQuery = existingQuery.is('organization_id', null);
    }

    const { data: existing } = await existingQuery.single();

    if (existing) {
      return NextResponse.json(
        { error: 'This role is already assigned to the user' },
        { status: 409 }
      );
    }

    // 付与者の従業員IDを取得
    const { data: granter } = await employeesTable
      .select('id')
      .eq('company_email', user!.email)
      .single();

    const { data: userRole, error } = await userRolesTable
      .insert({
        employee_id,
        role_id,
        organization_id: organization_id || null,
        granted_by: granter?.id || null,
        expires_at: expires_at || null,
      })
      .select(`
        *,
        role:roles(*),
        employee:employees!user_roles_employee_id_fkey(id, name, employee_number)
      `)
      .single();

    if (error) {
      console.error('Error assigning role:', error);
      return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 });
    }

    return NextResponse.json({ userRole }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/user-roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ユーザーロールを削除（無効化）
export async function DELETE(request: Request) {
  try {
    const permCheck = await requirePermission('manage_users');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRolesTable = supabase.from('user_roles') as any;

    const { error } = await userRolesTable
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error removing user role:', error);
      return NextResponse.json({ error: 'Failed to remove role' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/user-roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
