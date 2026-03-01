import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

/**
 * レコード変更履歴取得
 * GET /api/apps/[appCode]/records/[recordId]/history
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ appCode: string; recordId: string }> }
) {
  try {
    const { appCode, recordId } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    const { data: app } = await appsTable
      .select('id')
      .eq('code', appCode)
      .eq('is_active', true)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const historyTable = supabase.from('app_record_history') as any;
    const { data: history, error } = await historyTable
      .select('id, field_code, old_value, new_value, changed_by, changed_at')
      .eq('app_id', app.id)
      .eq('record_id', recordId)
      .order('changed_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Error fetching history:', error);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    // ユーザー名を解決
    const userIds = [...new Set((history || []).map((h: { changed_by: string }) => h.changed_by).filter(Boolean))];
    let userMap: Record<string, string> = {};

    if (userIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const employeesTable = supabase.from('employees') as any;
      const { data: employees } = await employeesTable
        .select('employee_uuid, name_ja, name_en')
        .in('employee_uuid', userIds);

      if (employees) {
        for (const emp of employees) {
          userMap[emp.employee_uuid] = emp.name_ja || emp.name_en || 'Unknown';
        }
      }
    }

    const enrichedHistory = (history || []).map((h: { id: string; field_code: string; old_value: unknown; new_value: unknown; changed_by: string; changed_at: string }) => ({
      ...h,
      changed_by_name: userMap[h.changed_by] || 'Unknown',
    }));

    return NextResponse.json({ history: enrichedHistory });
  } catch (error) {
    console.error('Error in GET history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
