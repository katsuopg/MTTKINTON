import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type SA = any;

// GET: スペース詳細 + メンバー + アプリ
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const { spaceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // スペース情報
  const { data: space } = await (supabase.from('spaces' as SA) as SA)
    .select('*')
    .eq('id', spaceId)
    .eq('is_active', true)
    .single();

  if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 });

  // メンバー一覧（employee名前付き）
  const { data: members } = await (supabase.from('space_members' as SA) as SA)
    .select('id, user_id, role')
    .eq('space_id', spaceId);

  // メンバーの名前を取得
  const memberUserIds = (members || []).map((m: SA) => m.user_id);
  let employeeMap: Record<string, string> = {};
  if (memberUserIds.length > 0) {
    const { data: emps } = await (supabase.from('employees') as SA)
      .select('user_id, employee_name_ja')
      .in('user_id', memberUserIds);
    for (const e of (emps || [])) {
      employeeMap[e.user_id] = e.employee_name_ja || 'Unknown';
    }
  }

  const enrichedMembers = (members || []).map((m: SA) => ({
    ...m,
    user_name: employeeMap[m.user_id] || 'Unknown',
  }));

  // アプリ一覧
  const { data: spaceApps } = await (supabase.from('space_apps' as SA) as SA)
    .select('app_id')
    .eq('space_id', spaceId);

  let apps: SA[] = [];
  if (spaceApps && spaceApps.length > 0) {
    const appIds = spaceApps.map((sa: SA) => sa.app_id);
    const { data: appData } = await (supabase.from('apps') as SA)
      .select('id, code, name')
      .in('id', appIds)
      .eq('is_active', true);
    apps = (appData || []).map((a: SA) => ({
      app_id: a.id,
      app_code: a.code,
      app_name: a.name,
    }));
  }

  return NextResponse.json({ space, members: enrichedMembers, apps });
}

// DELETE: スペース論理削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const { spaceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await (supabase.from('spaces' as SA) as SA)
    .update({ is_active: false })
    .eq('id', spaceId);

  return NextResponse.json({ success: true });
}
