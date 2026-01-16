import { createClient } from '@/lib/supabase/server';

// 権限タイプ
export type Permission =
  | 'manage_users'
  | 'manage_organizations'
  | 'manage_employees'
  | 'manage_quotations'
  | 'view_all_records'
  | 'edit_all_records'
  | 'delete_records'
  | 'export_data'
  | 'import_data'
  | 'manage_settings';

// 権限マップ（DB列名との対応）
const PERMISSION_COLUMN_MAP: Record<Permission, string> = {
  manage_users: 'can_manage_users',
  manage_organizations: 'can_manage_organizations',
  manage_employees: 'can_manage_employees',
  manage_quotations: 'can_manage_quotations',
  view_all_records: 'can_view_all_records',
  edit_all_records: 'can_edit_all_records',
  delete_records: 'can_delete_records',
  export_data: 'can_export_data',
  import_data: 'can_import_data',
  manage_settings: 'can_manage_settings',
};

// ロールの権限情報
export interface RolePermissions {
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

// ユーザー権限情報
export interface UserPermissions {
  employeeId: string;
  roles: RolePermissions[];
  permissions: Set<Permission>;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  isAdmin: boolean;
}

/**
 * 従業員IDからユーザーの権限情報を取得
 */
export async function getUserPermissions(employeeId: string): Promise<UserPermissions | null> {
  if (!employeeId) {
    return null;
  }

  const supabase = await createClient();

  // ユーザーのアクティブなロールを取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRolesTable = supabase.from('user_roles') as any;

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
    return null;
  }

  // ロール情報を抽出
  const roles: RolePermissions[] = (userRoles || [])
    .map((ur: { role: RolePermissions | null }) => ur.role)
    .filter((role: RolePermissions | null): role is RolePermissions => role !== null);

  // 全ロールの権限を集約
  const permissions = new Set<Permission>();
  let isAdmin = false;

  for (const role of roles) {
    // system_adminロールはすべての権限を持つ
    if (role.code === 'system_admin' || role.is_system_role) {
      isAdmin = true;
    }

    // 各権限をチェック
    for (const [permission, columnName] of Object.entries(PERMISSION_COLUMN_MAP)) {
      if (role[columnName as keyof RolePermissions] === true) {
        permissions.add(permission as Permission);
      }
    }
  }

  // 管理者は全権限を持つ
  if (isAdmin) {
    for (const permission of Object.keys(PERMISSION_COLUMN_MAP) as Permission[]) {
      permissions.add(permission);
    }
  }

  return {
    employeeId,
    roles,
    permissions,
    hasPermission: (permission: Permission) => isAdmin || permissions.has(permission),
    hasAnyPermission: (perms: Permission[]) => isAdmin || perms.some(p => permissions.has(p)),
    hasAllPermissions: (perms: Permission[]) => isAdmin || perms.every(p => permissions.has(p)),
    isAdmin,
  };
}

/**
 * 現在のログインユーザーの権限情報を取得
 */
export async function getCurrentUserPermissions(): Promise<UserPermissions | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // メールアドレスから従業員を特定
  const userEmail = user.email || '';
  const employeeNumberFromMeta = user.user_metadata?.employee_number || '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const employeesTable = supabase.from('employees') as any;

  // 従業員番号で検索
  if (employeeNumberFromMeta) {
    const { data: employee } = await employeesTable
      .select('id')
      .eq('employee_number', employeeNumberFromMeta)
      .single();

    if (employee) {
      return getUserPermissions(employee.id);
    }
  }

  // 社内メールアドレスで検索
  if (userEmail) {
    // 内部ドメインの場合は従業員番号として検索
    if (userEmail.endsWith('@mtt.internal')) {
      const employeeNumber = userEmail.replace('@mtt.internal', '');
      const { data: employee } = await employeesTable
        .select('id')
        .eq('employee_number', employeeNumber)
        .single();

      if (employee) {
        return getUserPermissions(employee.id);
      }
    }

    // company_emailで検索
    const { data: employee } = await employeesTable
      .select('id')
      .eq('company_email', userEmail)
      .single();

    if (employee) {
      return getUserPermissions(employee.id);
    }
  }

  return null;
}

/**
 * 権限チェックヘルパー - API Routeで使用
 * 権限がない場合はエラーレスポンスを返す
 */
export async function requirePermission(
  permission: Permission
): Promise<{ allowed: true; permissions: UserPermissions } | { allowed: false; error: string; status: number }> {
  const userPermissions = await getCurrentUserPermissions();

  if (!userPermissions) {
    return { allowed: false, error: 'Unauthorized', status: 401 };
  }

  if (!userPermissions.hasPermission(permission)) {
    return { allowed: false, error: 'Permission denied', status: 403 };
  }

  return { allowed: true, permissions: userPermissions };
}

/**
 * 複数権限のいずれかが必要な場合のチェック
 */
export async function requireAnyPermission(
  permissions: Permission[]
): Promise<{ allowed: true; permissions: UserPermissions } | { allowed: false; error: string; status: number }> {
  const userPermissions = await getCurrentUserPermissions();

  if (!userPermissions) {
    return { allowed: false, error: 'Unauthorized', status: 401 };
  }

  if (!userPermissions.hasAnyPermission(permissions)) {
    return { allowed: false, error: 'Permission denied', status: 403 };
  }

  return { allowed: true, permissions: userPermissions };
}
