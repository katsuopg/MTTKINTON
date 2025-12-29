import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// ロール一覧取得
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rolesTable = supabase.from('roles') as any;
    const { data: roles, error } = await rolesTable
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching roles:', error);
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error in GET /api/roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ロール作成
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      name,
      name_en,
      name_th,
      description,
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
      display_order,
    } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rolesTable = supabase.from('roles') as any;
    const { data: role, error } = await rolesTable
      .insert({
        code,
        name,
        name_en: name_en || null,
        name_th: name_th || null,
        description: description || null,
        can_manage_users: can_manage_users || false,
        can_manage_organizations: can_manage_organizations || false,
        can_manage_employees: can_manage_employees || false,
        can_manage_quotations: can_manage_quotations || false,
        can_view_all_records: can_view_all_records || false,
        can_edit_all_records: can_edit_all_records || false,
        can_delete_records: can_delete_records || false,
        can_export_data: can_export_data || false,
        can_import_data: can_import_data || false,
        can_manage_settings: can_manage_settings || false,
        is_system_role: false,
        display_order: display_order || 99,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating role:', error);
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Role code already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
    }

    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
