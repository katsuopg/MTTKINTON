import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * 監査ログ一覧取得（管理者のみ）
 * GET /api/audit-logs?page=1&pageSize=50&action=record_update&userId=xxx&appCode=xxx&from=2026-01-01&to=2026-12-31
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 管理者チェック
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRoles } = await (supabase.from('user_roles') as any)
    .select('role:roles(code, is_system_role)')
    .eq('employee_id', user.id);

  const isAdmin = (userRoles || []).some((r: any) =>
    r.role?.code === 'administrator' || r.role?.is_system_role
  );

  // employee_idで検索し直し
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: emp } = await (supabase.from('employees') as any)
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (emp) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: empRoles } = await (supabase.from('user_roles') as any)
      .select('role:roles(code, is_system_role)')
      .eq('employee_id', emp.id);

    const isEmpAdmin = (empRoles || []).some((r: any) =>
      r.role?.code === 'administrator' || r.role?.is_system_role
    );

    if (!isAdmin && !isEmpAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
  } else if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50')));
  const action = searchParams.get('action');
  const userId = searchParams.get('userId');
  const appCode = searchParams.get('appCode');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('audit_logs' as any) as any)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (action) query = query.eq('action', action);
  if (userId) query = query.eq('user_id', userId);
  if (appCode) query = query.eq('app_code', appCode);
  if (from) query = query.gte('created_at', `${from}T00:00:00Z`);
  if (to) query = query.lte('created_at', `${to}T23:59:59Z`);

  const { data: logs, count, error } = await query;

  if (error) {
    console.error('Audit log query error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }

  return NextResponse.json({
    logs: logs || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
  });
}
