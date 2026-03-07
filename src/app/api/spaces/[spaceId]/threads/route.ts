import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type SA = any;

// GET: スレッド一覧（作成者名付き、reply_count付き）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const { spaceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // スレッド一覧取得
  const { data: threads, error } = await (supabase.from('space_threads' as SA) as SA)
    .select('*')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const threadList = threads || [];
  if (threadList.length === 0) {
    return NextResponse.json({ threads: [] });
  }

  // 作成者名をemployeesテーブルから取得
  const creatorIds = [...new Set(threadList.map((t: SA) => t.created_by))];
  let employeeMap: Record<string, string> = {};
  if (creatorIds.length > 0) {
    const { data: emps } = await (supabase.from('employees') as SA)
      .select('user_id, employee_name_ja')
      .in('user_id', creatorIds);
    for (const e of (emps || [])) {
      employeeMap[e.user_id] = e.employee_name_ja || 'Unknown';
    }
  }

  // 各スレッドの返信数を取得
  const threadIds = threadList.map((t: SA) => t.id);
  const { data: replies } = await (supabase.from('space_thread_replies' as SA) as SA)
    .select('thread_id')
    .in('thread_id', threadIds);

  const replyCountMap: Record<string, number> = {};
  for (const r of (replies || [])) {
    replyCountMap[r.thread_id] = (replyCountMap[r.thread_id] || 0) + 1;
  }

  // スレッドに作成者名と返信数を付与
  const enrichedThreads = threadList.map((t: SA) => ({
    ...t,
    created_by_name: employeeMap[t.created_by] || 'Unknown',
    reply_count: replyCountMap[t.id] || 0,
  }));

  return NextResponse.json({ threads: enrichedThreads });
}

// POST: スレッド作成
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const { spaceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { title, body: threadBody } = body;

  if (!title || !threadBody) {
    return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
  }

  // スレッド作成
  const { data: thread, error } = await (supabase.from('space_threads' as SA) as SA)
    .insert({
      space_id: spaceId,
      title,
      body: threadBody,
      created_by: user.id,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ thread }, { status: 201 });
}
