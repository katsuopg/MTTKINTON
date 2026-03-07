import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any;

/**
 * スペース一覧取得（ユーザーが参加しているスペースのみ）
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 参加スペース取得
  const { data: memberships } = await (supabase.from('space_members' as SA) as SA)
    .select('space_id, role')
    .eq('user_id', user.id);

  if (!memberships || memberships.length === 0) {
    // 公開スペースも表示
    const { data: publicSpaces } = await (supabase.from('spaces' as SA) as SA)
      .select('*')
      .eq('is_private', false)
      .eq('is_active', true)
      .order('name');
    return NextResponse.json({ spaces: publicSpaces || [], memberships: [] });
  }

  const spaceIds = memberships.map((m: SA) => m.space_id);
  const { data: spaces } = await (supabase.from('spaces' as SA) as SA)
    .select('*')
    .in('id', spaceIds)
    .eq('is_active', true)
    .order('name');

  // 公開スペース（未参加も含む）
  const { data: publicSpaces } = await (supabase.from('spaces' as SA) as SA)
    .select('*')
    .eq('is_private', false)
    .eq('is_active', true)
    .order('name');

  const allSpaces = [...(spaces || [])];
  for (const ps of (publicSpaces || [])) {
    if (!allSpaces.find((s: SA) => s.id === ps.id)) {
      allSpaces.push(ps);
    }
  }

  return NextResponse.json({ spaces: allSpaces, memberships });
}

/**
 * スペース作成
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, description, is_private, icon, color } = body;

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const { data: space, error } = await (supabase.from('spaces' as SA) as SA)
    .insert({
      name,
      description: description || null,
      is_private: is_private ?? false,
      icon: icon || 'Users',
      color: color || '#4F46E5',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create space:', error);
    return NextResponse.json({ error: 'Failed to create space' }, { status: 500 });
  }

  // 作成者をadminとして追加
  await (supabase.from('space_members' as SA) as SA)
    .insert({ space_id: space.id, user_id: user.id, role: 'admin' });

  return NextResponse.json({ space }, { status: 201 });
}
