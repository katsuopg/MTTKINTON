import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';
import { filterFieldsByPermission } from '@/lib/auth/app-permissions';

// 許可されたフィールドのリスト（SQLインジェクション防止）
const ALLOWED_FIELDS = [
  'name',
  'gender',
  'department',
  'position',
  'date_of_birth',
  'hire_date',
  'employment_type',
  'salary_type',
  'tel',
  'email',
  'company_email',
  'address',
  'passport_number',
  'passport_expiry',
  'id_expiry',
  'emergency_contact_name',
  'emergency_contact_tel',
  'status',
  'visa_number',
  'visa_expiry',
  'visa_type',
  'license_number',
  'license_expiry',
];

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    // アプリ権限チェック: 従業員の編集権限が必要
    const permCheck = await requireAppPermission('employees', 'can_edit');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const { employeeId } = await params;
    const supabase = await createClient();

    const body = await request.json();

    // 更新データを構築（許可されたフィールドのみ）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        // 空文字列はnullに変換
        updateData[field] = body[field] === '' ? null : body[field];
      }
    }

    // Supabaseでレコードを更新
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employeesTable = supabase.from('employees') as any;
    const { error } = await employeesTable
      .update(updateData)
      .eq('id', employeeId);

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    // アプリ権限チェック: 従業員の閲覧権限が必要
    const permCheck = await requireAppPermission('employees', 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const { employeeId } = await params;
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employeesTable = supabase.from('employees') as any;
    const { data: employee, error } = await employeesTable
      .select('*')
      .eq('id', employeeId)
      .single();

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // フィールド権限でデータをフィルタリング（給与等の機密フィールドを隠す）
    const filtered = filterFieldsByPermission(employee, permCheck.permissions.fieldPermissions);
    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
