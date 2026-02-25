import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

// 従業員一覧取得
export async function GET(request: Request) {
  try {
    // 権限チェック
    const permCheck = await requireAppPermission('employees', 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employeesTable = supabase.from('employees') as any;

    let query = employeesTable
      .select('id, employee_number, name, department, position, status, profile_image_url, company_email')
      .order('employee_number', { ascending: true });

    // ステータスフィルター
    if (status) {
      query = query.eq('status', status);
    }

    // 部署フィルター
    if (department) {
      query = query.eq('department', department);
    }

    // 検索フィルター（名前または従業員番号）
    if (search) {
      query = query.or(`name.ilike.%${search}%,employee_number.ilike.%${search}%`);
    }

    const { data: employees, error } = await query;

    if (error) {
      console.error('Error fetching employees:', error);
      return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Error in GET /api/employees:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
