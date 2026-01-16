import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * 現在のログインユーザーの権限情報を取得
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.email || '';
    const employeeNumberFromMeta = user.user_metadata?.employee_number || '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employeesTable = supabase.from('employees') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRolesTable = supabase.from('user_roles') as any;

    let employeeId: string | null = null;

    // 1. 従業員番号で検索
    if (employeeNumberFromMeta) {
      const { data: employee } = await employeesTable
        .select('id')
        .eq('employee_number', employeeNumberFromMeta)
        .single();
      if (employee) {
        employeeId = employee.id;
      }
    }

    // 2. 内部メールアドレスから従業員番号を抽出
    if (!employeeId && userEmail.endsWith('@mtt.internal')) {
      const employeeNumber = userEmail.replace('@mtt.internal', '');
      const { data: employee } = await employeesTable
        .select('id')
        .eq('employee_number', employeeNumber)
        .single();
      if (employee) {
        employeeId = employee.id;
      }
    }

    // 3. company_emailで検索
    if (!employeeId && userEmail) {
      const { data: employee } = await employeesTable
        .select('id')
        .eq('company_email', userEmail)
        .single();
      if (employee) {
        employeeId = employee.id;
      }
    }

    if (!employeeId) {
      return NextResponse.json({
        employeeId: null,
        roles: [],
        permissions: {
          manage_users: false,
          manage_organizations: false,
          manage_employees: false,
          manage_quotations: false,
          view_all_records: false,
          edit_all_records: false,
          delete_records: false,
          export_data: false,
          import_data: false,
          manage_settings: false,
        },
        isAdmin: false,
      });
    }

    // ユーザーのアクティブなロールを取得
    const { data: userRoles, error } = await userRolesTable
      .select(`
        role:roles(
          id,
          code,
          name,
          can_manage_users,
          can_manage_organizations,
          can_manage_employees,
          can_manage_quotations,
          can_view_all_records,
          can_edit_all_records,
          can_delete_records,
          can_export_data,
          can_import_data,
          can_manage_settings,
          is_system_role
        )
      `)
      .eq('employee_id', employeeId)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()');

    if (error) {
      console.error('Error fetching user roles:', error);
      return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
    }

    // ロール情報を抽出
    interface RoleData {
      id: string;
      code: string;
      name: string;
      can_manage_users: boolean;
      can_manage_organizations: boolean;
      can_manage_employees: boolean;
      can_manage_quotations: boolean;
      can_view_all_records: boolean;
      can_edit_all_records: boolean;
      can_delete_records: boolean;
      can_export_data: boolean;
      can_import_data: boolean;
      can_manage_settings: boolean;
      is_system_role: boolean;
    }

    const roles: RoleData[] = (userRoles || [])
      .map((ur: { role: RoleData | null }) => ur.role)
      .filter((role: RoleData | null): role is RoleData => role !== null);

    // 権限を集約
    const permissions = {
      manage_users: false,
      manage_organizations: false,
      manage_employees: false,
      manage_quotations: false,
      view_all_records: false,
      edit_all_records: false,
      delete_records: false,
      export_data: false,
      import_data: false,
      manage_settings: false,
    };

    let isAdmin = false;

    for (const role of roles) {
      if (role.code === 'system_admin' || role.is_system_role) {
        isAdmin = true;
      }

      if (role.can_manage_users) permissions.manage_users = true;
      if (role.can_manage_organizations) permissions.manage_organizations = true;
      if (role.can_manage_employees) permissions.manage_employees = true;
      if (role.can_manage_quotations) permissions.manage_quotations = true;
      if (role.can_view_all_records) permissions.view_all_records = true;
      if (role.can_edit_all_records) permissions.edit_all_records = true;
      if (role.can_delete_records) permissions.delete_records = true;
      if (role.can_export_data) permissions.export_data = true;
      if (role.can_import_data) permissions.import_data = true;
      if (role.can_manage_settings) permissions.manage_settings = true;
    }

    // 管理者は全権限を持つ
    if (isAdmin) {
      Object.keys(permissions).forEach((key) => {
        permissions[key as keyof typeof permissions] = true;
      });
    }

    return NextResponse.json({
      employeeId,
      roles: roles.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
      })),
      permissions,
      isAdmin,
    });
  } catch (error) {
    console.error('Error in GET /api/permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
