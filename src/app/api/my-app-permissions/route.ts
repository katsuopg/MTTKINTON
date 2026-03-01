import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * 現在のユーザーの全アプリに対するcan_view権限を一括取得
 * GET /api/my-app-permissions
 *
 * レスポンス例:
 * {
 *   isAdmin: true,
 *   appPermissions: {
 *     employees: { can_view: true, can_manage: true },
 *     customers: { can_view: true, can_manage: true },
 *     ...
 *   }
 * }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appPermissionsTable = supabase.from('app_permissions') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const organizationMembersTable = supabase.from('organization_members') as any;

    // 従業員IDを特定（UUID + kintone_record_id）
    let employeeId: string | null = null;
    let kintoneRecordId: string | null = null;

    if (employeeNumberFromMeta) {
      const { data: employee } = await employeesTable
        .select('id, kintone_record_id')
        .eq('employee_number', employeeNumberFromMeta)
        .single();
      if (employee) {
        employeeId = employee.id;
        kintoneRecordId = employee.kintone_record_id;
      }
    }

    if (!employeeId && userEmail.endsWith('@mtt.internal')) {
      const employeeNumber = userEmail.replace('@mtt.internal', '');
      const { data: employee } = await employeesTable
        .select('id, kintone_record_id')
        .eq('employee_number', employeeNumber)
        .single();
      if (employee) {
        employeeId = employee.id;
        kintoneRecordId = employee.kintone_record_id;
      }
    }

    if (!employeeId && userEmail) {
      const { data: employee } = await employeesTable
        .select('id, kintone_record_id')
        .eq('company_email', userEmail)
        .single();
      if (employee) {
        employeeId = employee.id;
        kintoneRecordId = employee.kintone_record_id;
      }
    }

    if (!employeeId) {
      // 従業員でないユーザー → 全アプリ権限なし
      const { data: apps } = await appsTable
        .select('code')
        .eq('is_active', true);

      const appPermissions: Record<string, { can_view: boolean; can_manage: boolean }> = {};
      for (const app of apps || []) {
        appPermissions[app.code] = { can_view: false, can_manage: false };
      }

      return NextResponse.json({ isAdmin: false, appPermissions });
    }

    // ユーザーのロール情報を取得
    const { data: userRoles } = await userRolesTable
      .select('role_id, role:roles(code, is_system_role)')
      .eq('employee_id', employeeId)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()');

    const roleIds = (userRoles || []).map((r: { role_id: string }) => r.role_id);

    // 管理者チェック
    const isAdmin = (userRoles || []).some(
      (r: { role: { code: string; is_system_role: boolean } | null }) =>
        r.role?.code === 'system_admin' || r.role?.is_system_role
    );

    // 全アプリを取得
    const { data: apps } = await appsTable
      .select('id, code')
      .eq('is_active', true);

    // 管理者は全アプリにアクセス・管理可能
    if (isAdmin) {
      const appPermissions: Record<string, { can_view: boolean; can_manage: boolean }> = {};
      for (const app of apps || []) {
        appPermissions[app.code] = { can_view: true, can_manage: true };
      }
      return NextResponse.json({ isAdmin: true, appPermissions });
    }

    // 所属組織を取得
    // organization_members.employee_id は kintone_record_id を格納している
    const orgMemberEmployeeId = kintoneRecordId || employeeId;
    const { data: orgMembers } = await organizationMembersTable
      .select('organization_id')
      .eq('employee_id', orgMemberEmployeeId)
      .eq('is_active', true);

    const orgIds = (orgMembers || []).map((m: { organization_id: string }) => m.organization_id);

    // 全アプリの権限を取得
    const { data: allPermissions } = await appPermissionsTable
      .select('app_id, target_type, target_id, can_view, can_manage')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    // アプリごとに権限を集約
    const appPermissions: Record<string, { can_view: boolean; can_manage: boolean }> = {};

    for (const app of apps || []) {
      const appPerms = (allPermissions || []).filter(
        (p: { app_id: string }) => p.app_id === app.id
      );

      let canView = false;
      let canManage = false;

      for (const perm of appPerms) {
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
          if (perm.can_view) canView = true;
          if (perm.can_manage) canManage = true;
          if (canView && canManage) break;
        }
      }

      appPermissions[app.code] = { can_view: canView, can_manage: canManage };
    }

    return NextResponse.json({ isAdmin: false, appPermissions });
  } catch (error) {
    console.error('Error in GET /api/my-app-permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
