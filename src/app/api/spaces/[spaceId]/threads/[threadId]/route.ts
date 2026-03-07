import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type SA = any;

// GET: スレッド詳細 + 返信一覧（返信者名付き）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string; threadId: string }> }
) {
  const { spaceId, threadId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // スレッド詳細取得
  const { data: thread, error: threadError } = await (supabase.from('space_threads' as SA) as SA)
    .select('*')
    .eq('id', threadId)
    .eq('space_id', spaceId)
    .single();

  if (threadError || !thread) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
  }

  // 返信一覧取得
  const { data: replies } = await (supabase.from('space_thread_replies' as SA) as SA)
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  const replyList = replies || [];

  // スレッド作成者 + 返信者の名前を一括取得
  const allUserIds = [
    thread.created_by,
    ...replyList.map((r: SA) => r.created_by),
  ];
  const uniqueUserIds = [...new Set(allUserIds)];

  let employeeMap: Record<string, string> = {};
  if (uniqueUserIds.length > 0) {
    const { data: emps } = await (supabase.from('employees') as SA)
      .select('user_id, employee_name_ja')
      .in('user_id', uniqueUserIds);
    for (const e of (emps || [])) {
      employeeMap[e.user_id] = e.employee_name_ja || 'Unknown';
    }
  }

  // スレッドに作成者名を付与
  const enrichedThread = {
    ...thread,
    created_by_name: employeeMap[thread.created_by] || 'Unknown',
  };

  // 返信に返信者名を付与
  const enrichedReplies = replyList.map((r: SA) => ({
    ...r,
    created_by_name: employeeMap[r.created_by] || 'Unknown',
  }));

  return NextResponse.json({ thread: enrichedThread, replies: enrichedReplies });
}

// POST: 返信投稿
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string; threadId: string }> }
) {
  const { spaceId, threadId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // スレッドの存在確認
  const { data: thread } = await (supabase.from('space_threads' as SA) as SA)
    .select('id')
    .eq('id', threadId)
    .eq('space_id', spaceId)
    .single();

  if (!thread) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
  }

  const body = await request.json();
  const { body: replyBody } = body;

  if (!replyBody) {
    return NextResponse.json({ error: 'body is required' }, { status: 400 });
  }

  // 返信作成
  const { data: reply, error } = await (supabase.from('space_thread_replies' as SA) as SA)
    .insert({
      thread_id: threadId,
      body: replyBody,
      created_by: user.id,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reply }, { status: 201 });
}
