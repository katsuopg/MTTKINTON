import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    return NextResponse.json({ members: data });
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
    const { employee_id, organization_ids } = body;

    if (!employee_id) {
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
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ is_active: false, left_at: new Date().toISOString() })
      .eq('employee_id', employee_id)
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
      const newMembers = organization_ids.map((org_id: string) => ({
        organization_id: org_id,
        employee_id,
        role: 'member',
        is_active: true,
        joined_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('organization_members')
        .upsert(newMembers, {
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
