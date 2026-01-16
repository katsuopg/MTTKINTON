import { createClient } from '@/lib/supabase/server';

// アプリ権限タイプ
export interface AppPermission {
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_manage: boolean;
  can_export: boolean;
  can_import: boolean;
}

// フィールド権限タイプ
export interface FieldPermission {
  field_name: string;
  access_level: 'view' | 'edit' | 'hidden';
}

// レコード権限条件タイプ
export interface RecordPermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'not_in' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value?: string | number | boolean;
  values?: (string | number)[];
}

// ユーザーの全権限情報
export interface UserAppPermissions {
  employeeId: string;
  appCode: string;
  appPermission: AppPermission;
  fieldPermissions: FieldPermission[];
  hasAppPermission: (permission: keyof AppPermission) => boolean;
  getFieldPermission: (fieldName: string) => 'view' | 'edit' | 'hidden' | 'full';
}

// デフォルト権限（権限なし）
const DEFAULT_APP_PERMISSION: AppPermission = {
  can_view: false,
  can_add: false,
  can_edit: false,
  can_delete: false,
  can_manage: false,
  can_export: false,
  can_import: false,
};

// 管理者権限（全権限あり）
const ADMIN_APP_PERMISSION: AppPermission = {
  can_view: true,
  can_add: true,
  can_edit: true,
  can_delete: true,
  can_manage: true,
  can_export: true,
  can_import: true,
};

/**
 * ユーザーのアプリ権限を取得
 */
export async function getUserAppPermissions(appCode: string): Promise<UserAppPermissions | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const employeesTable = supabase.from('employees') as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appsTable = supabase.from('apps') as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appPermissionsTable = supabase.from('app_permissions') as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fieldPermissionsTable = supabase.from('field_permissions') as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const organizationMembersTable = supabase.from('organization_members') as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRolesTable = supabase.from('user_roles') as any;

  // 従業員IDを取得
  let employeeId: string | null = null;
  const userEmail = user.email || '';
  const employeeNumberFromMeta = user.user_metadata?.employee_number || '';

  // 1. user_idで検索
  const { data: empByUserId } = await employeesTable
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (empByUserId) {
    employeeId = empByUserId.id;
  }

  // 2. 従業員番号で検索
  if (!employeeId && employeeNumberFromMeta) {
    const { data: employee } = await employeesTable
      .select('id')
      .eq('employee_number', employeeNumberFromMeta)
      .single();
    if (employee) {
      employeeId = employee.id;
    }
  }

  // 3. 内部メールで検索
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

  // 4. 会社メールで検索
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
    return {
      employeeId: '',
      appCode,
      appPermission: DEFAULT_APP_PERMISSION,
      fieldPermissions: [],
      hasAppPermission: () => false,
      getFieldPermission: () => 'hidden' as const,
    };
  }

  // アプリIDを取得
  const { data: app } = await appsTable
    .select('id')
    .eq('code', appCode)
    .eq('is_active', true)
    .single();

  if (!app) {
    return {
      employeeId,
      appCode,
      appPermission: DEFAULT_APP_PERMISSION,
      fieldPermissions: [],
      hasAppPermission: () => false,
      getFieldPermission: () => 'hidden' as const,
    };
  }

  // ユーザーの所属組織IDリストを取得
  const { data: orgMembers } = await organizationMembersTable
    .select('organization_id')
    .eq('employee_id', employeeId)
    .eq('is_active', true);

  const orgIds = (orgMembers || []).map((m: { organization_id: string }) => m.organization_id);

  // ユーザーのロールIDリストを取得
  const { data: userRoles } = await userRolesTable
    .select('role_id, role:roles(code, is_system_role)')
    .eq('employee_id', employeeId)
    .eq('is_active', true)
    .or('expires_at.is.null,expires_at.gt.now()');

  const roleIds = (userRoles || []).map((r: { role_id: string }) => r.role_id);

  // 管理者チェック
  const isAdmin = (userRoles || []).some((r: { role: { code: string; is_system_role: boolean } | null }) =>
    r.role?.code === 'administrator' || r.role?.is_system_role
  );

  // 管理者は全権限
  if (isAdmin) {
    return {
      employeeId,
      appCode,
      appPermission: ADMIN_APP_PERMISSION,
      fieldPermissions: [],
      hasAppPermission: () => true,
      getFieldPermission: () => 'edit' as const,
    };
  }

  // アプリ権限を取得
  const { data: appPermissions } = await appPermissionsTable
    .select('*')
    .eq('app_id', app.id)
    .eq('is_active', true)
    .order('priority', { ascending: false });

  // 権限を集約
  const aggregatedPermission: AppPermission = { ...DEFAULT_APP_PERMISSION };

  for (const perm of appPermissions || []) {
    let matches = false;

    switch (perm.target_type) {
      case 'everyone':
        matches = true;
        break;
      case 'user':
        matches = perm.target_id === employeeId;
        break;
      case 'organization':
        matches = orgIds.includes(perm.target_id);
        break;
      case 'role':
        matches = roleIds.includes(perm.target_id);
        break;
    }

    if (matches) {
      if (perm.can_view) aggregatedPermission.can_view = true;
      if (perm.can_add) aggregatedPermission.can_add = true;
      if (perm.can_edit) aggregatedPermission.can_edit = true;
      if (perm.can_delete) aggregatedPermission.can_delete = true;
      if (perm.can_manage) aggregatedPermission.can_manage = true;
      if (perm.can_export) aggregatedPermission.can_export = true;
      if (perm.can_import) aggregatedPermission.can_import = true;
    }
  }

  // フィールド権限を取得
  const { data: fieldPerms } = await fieldPermissionsTable
    .select('field_name, access_level, priority, target_type, target_id')
    .eq('app_id', app.id)
    .eq('is_active', true)
    .order('priority', { ascending: false });

  // フィールドごとに最も高い優先順位の権限を採用
  const fieldPermissionMap = new Map<string, 'view' | 'edit' | 'hidden'>();

  for (const fp of fieldPerms || []) {
    let matches = false;

    switch (fp.target_type) {
      case 'everyone':
        matches = true;
        break;
      case 'user':
        matches = fp.target_id === employeeId;
        break;
      case 'organization':
        matches = orgIds.includes(fp.target_id);
        break;
      case 'role':
        matches = roleIds.includes(fp.target_id);
        break;
    }

    if (matches && !fieldPermissionMap.has(fp.field_name)) {
      fieldPermissionMap.set(fp.field_name, fp.access_level);
    }
  }

  const fieldPermissions: FieldPermission[] = Array.from(fieldPermissionMap.entries()).map(
    ([field_name, access_level]) => ({ field_name, access_level })
  );

  return {
    employeeId,
    appCode,
    appPermission: aggregatedPermission,
    fieldPermissions,
    hasAppPermission: (permission: keyof AppPermission) => aggregatedPermission[permission],
    getFieldPermission: (fieldName: string) => {
      const fp = fieldPermissionMap.get(fieldName);
      return fp || 'full'; // 明示的な権限がなければフルアクセス
    },
  };
}

/**
 * アプリ権限チェックヘルパー - API Routeで使用
 */
export async function requireAppPermission(
  appCode: string,
  permission: keyof AppPermission
): Promise<{ allowed: true; permissions: UserAppPermissions } | { allowed: false; error: string; status: number }> {
  const userPermissions = await getUserAppPermissions(appCode);

  if (!userPermissions || !userPermissions.employeeId) {
    return { allowed: false, error: 'Unauthorized', status: 401 };
  }

  if (!userPermissions.hasAppPermission(permission)) {
    return { allowed: false, error: 'Permission denied', status: 403 };
  }

  return { allowed: true, permissions: userPermissions };
}

/**
 * レコード権限条件をチェック
 */
export function checkRecordCondition(
  record: Record<string, unknown>,
  condition: RecordPermissionCondition
): boolean {
  const fieldValue = record[condition.field];

  switch (condition.operator) {
    case 'eq':
      return fieldValue === condition.value;
    case 'ne':
      return fieldValue !== condition.value;
    case 'in':
      return condition.values ? condition.values.includes(fieldValue as string | number) : false;
    case 'not_in':
      return condition.values ? !condition.values.includes(fieldValue as string | number) : true;
    case 'gt':
      return (fieldValue as number) > (condition.value as number);
    case 'lt':
      return (fieldValue as number) < (condition.value as number);
    case 'gte':
      return (fieldValue as number) >= (condition.value as number);
    case 'lte':
      return (fieldValue as number) <= (condition.value as number);
    case 'contains':
      return String(fieldValue).includes(String(condition.value));
    default:
      return false;
  }
}

/**
 * フィールドをフィルタリング（権限に基づいて非表示フィールドを除外）
 */
export function filterFieldsByPermission<T extends Record<string, unknown>>(
  record: T,
  fieldPermissions: FieldPermission[]
): Partial<T> {
  const hiddenFields = new Set(
    fieldPermissions
      .filter((fp) => fp.access_level === 'hidden')
      .map((fp) => fp.field_name)
  );

  const filteredRecord: Partial<T> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!hiddenFields.has(key)) {
      filteredRecord[key as keyof T] = value as T[keyof T];
    }
  }

  return filteredRecord;
}
