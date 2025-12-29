import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 組織メンバー一覧取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // 認証チェック
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const { data: members, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', id)
      .eq('is_active', true)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching members:', error);
      return NextResponse.json({ error: 'メンバーの取得に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/members:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// 組織メンバー追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // 認証チェック
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { employee_id, role } = body;

    if (!employee_id) {
      return NextResponse.json({ error: '従業員IDは必須です' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: id,
        employee_id,
        role: role || 'member',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding member:', error);
      if (error.code === '23505') {
        return NextResponse.json({ error: 'この従業員は既にこの組織のメンバーです' }, { status: 400 });
      }
      return NextResponse.json({ error: 'メンバーの追加に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ member: data });
  } catch (error) {
    console.error('Error in POST /api/organizations/[id]/members:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}


