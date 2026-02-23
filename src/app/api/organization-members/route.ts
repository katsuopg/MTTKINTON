import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface OrganizationMemberUpdate {
  is_active?: boolean;
  left_at?: string | null;
}

interface OrganizationMemberInsert {
  organization_id: string;
  employee_id: string;
  role: string;
  is_active: boolean;
  joined_at: string;
}

// 従業員の所属組織一覧を取得
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // 認証チェック
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employee_id');

  try {
    let query = supabase
      .from('organization_members')
      .select(`
        id,
        organization_id,
        employee_id,
        role,
        is_active,
        joined_at,
        left_at,
        organizations (
          id,
          code,
          name,
          name_en,
          name_th
        )
      `)
      .eq('is_active', true);

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching organization members:', error);
      return NextResponse.json(
        { error: '所属組織の取得に失敗しました' },
        { status: 500 }
      );
    }

    // employee_id(kintone_record_id) → employees.id(UUID)のマッピングを追加
    const kintoneIds = (data || []).map((m: { employee_id: string }) => m.employee_id);
    const uniqueKintoneIds = [...new Set(kintoneIds)];

    let employeeMap: Record<string, string> = {};
    if (uniqueKintoneIds.length > 0) {
      const { data: employees } = await supabase
        .from('employees')
        .select('id, kintone_record_id')
        .in('kintone_record_id', uniqueKintoneIds);

      if (employees) {
        employeeMap = Object.fromEntries(
          employees.map((e: { id: string; kintone_record_id: string }) => [e.kintone_record_id, e.id])
        );
      }
    }

    // レスポンスにemployee_uuid（employees.id）を追加
    const membersWithUuid = (data || []).map((m: { employee_id: string; [key: string]: unknown }) => ({
      ...m,
      employee_uuid: employeeMap[m.employee_id] || null,
    }));

    return NextResponse.json({ members: membersWithUuid });
  } catch (error) {
    console.error('Error in organization-members API:', error);
    return NextResponse.json(
      { error: '所属組織の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 従業員の所属組織を更新（複数組織対応）
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 認証チェック
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { employee_id, employee_uuid, organization_ids } = body;

    // employee_uuid（employees.id）が渡された場合、kintone_record_idに変換
    let resolvedEmployeeId = employee_id;
    if (!resolvedEmployeeId && employee_uuid) {
      const { data: emp, error: empError } = await supabase
        .from('employees')
        .select('kintone_record_id')
        .eq('id', employee_uuid)
        .single();

      if (empError || !emp) {
        return NextResponse.json(
          { error: '従業員が見つかりません' },
          { status: 404 }
        );
      }
      resolvedEmployeeId = (emp as { kintone_record_id: string }).kintone_record_id;
    }

    if (!resolvedEmployeeId) {
      return NextResponse.json(
        { error: '従業員IDが必要です' },
        { status: 400 }
      );
    }

    if (!Array.isArray(organization_ids)) {
      return NextResponse.json(
        { error: '組織IDの配列が必要です' },
        { status: 400 }
      );
    }

    // 既存の所属を無効化（削除ではなくis_active=falseに）
    const updateData: OrganizationMemberUpdate = { is_active: false, left_at: new Date().toISOString() };
    const { error: updateError } = await supabase
      .from('organization_members')
      .update(updateData as never)
      .eq('employee_id', resolvedEmployeeId)
      .eq('is_active', true);

    if (updateError) {
      console.error('Error deactivating old memberships:', updateError);
      return NextResponse.json(
        { error: '所属組織の更新に失敗しました' },
        { status: 500 }
      );
    }

    // 新しい所属を追加
    if (organization_ids.length > 0) {
      const newMembers: OrganizationMemberInsert[] = organization_ids.map((org_id: string) => ({
        organization_id: org_id,
        employee_id: resolvedEmployeeId,
        role: 'member',
        is_active: true,
        joined_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('organization_members')
        .upsert(newMembers as never[], {
          onConflict: 'organization_id,employee_id',
          ignoreDuplicates: false,
        });

      if (insertError) {
        console.error('Error inserting new memberships:', insertError);
        return NextResponse.json(
          { error: '所属組織の追加に失敗しました' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in organization-members POST:', error);
    return NextResponse.json(
      { error: '所属組織の更新に失敗しました' },
      { status: 500 }
    );
  }
}
