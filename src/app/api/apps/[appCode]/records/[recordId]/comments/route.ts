import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';
import { fireNotifications } from '@/lib/dynamic-app/notification-engine';
import { fireWebhooks } from '@/lib/dynamic-app/webhook-engine';

type Params = { params: Promise<{ appCode: string; recordId: string }> };

/**
 * コメント一覧取得
 * GET /api/apps/[appCode]/records/[recordId]/comments
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { appCode, recordId } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    const { data: app } = await appsTable
      .select('id, enable_comments')
      .eq('code', appCode)
      .eq('is_active', true)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    if (!app.enable_comments) {
      return NextResponse.json({ comments: [] });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commentsTable = supabase.from('app_record_comments') as any;
    const { data: comments, error } = await commentsTable
      .select('id, user_id, body, created_at, updated_at, is_deleted')
      .eq('app_id', app.id)
      .eq('record_id', recordId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    // ユーザー名を解決
    const userIds = [...new Set((comments || []).map((c: { user_id: string }) => c.user_id).filter(Boolean))];
    let userMap: Record<string, string> = {};

    if (userIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const employeesTable = supabase.from('employees') as any;
      const { data: employees } = await employeesTable
        .select('employee_uuid, name_ja, name_en')
        .in('employee_uuid', userIds);

      if (employees) {
        for (const emp of employees) {
          userMap[emp.employee_uuid] = emp.name_ja || emp.name_en || 'Unknown';
        }
      }
    }

    const enrichedComments = (comments || []).map((c: { id: string; user_id: string; body: string; created_at: string; updated_at: string }) => ({
      ...c,
      user_name: userMap[c.user_id] || 'Unknown',
    }));

    return NextResponse.json({ comments: enrichedComments });
  } catch (error) {
    console.error('Error in GET comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * コメント投稿
 * POST /api/apps/[appCode]/records/[recordId]/comments
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const { appCode, recordId } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { body: commentBody } = body as { body: string };

    if (!commentBody || typeof commentBody !== 'string' || commentBody.trim().length === 0) {
      return NextResponse.json({ error: 'Comment body is required' }, { status: 400 });
    }

    if (commentBody.length > 10000) {
      return NextResponse.json({ error: 'Comment too long (max 10000 chars)' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    const { data: app } = await appsTable
      .select('id, enable_comments')
      .eq('code', appCode)
      .eq('is_active', true)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    if (!app.enable_comments) {
      return NextResponse.json({ error: 'Comments are disabled for this app' }, { status: 403 });
    }

    // レコード存在確認
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recordsTable = supabase.from('app_records') as any;
    const { data: record } = await recordsTable
      .select('id')
      .eq('id', recordId)
      .eq('app_id', app.id)
      .single();

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commentsTable = supabase.from('app_record_comments') as any;
    const { data: comment, error } = await commentsTable
      .insert({
        app_id: app.id,
        record_id: recordId,
        user_id: user.id,
        body: commentBody.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    // 条件通知を発火（comment_added）
    const { data: fullRecord } = await recordsTable
      .select('*')
      .eq('id', recordId)
      .single();

    if (fullRecord) {
      fireNotifications({
        appId: app.id,
        appCode,
        appName: appCode,
        trigger: 'comment_added',
        record: fullRecord as Record<string, unknown>,
        actorUserId: user.id,
      }).catch(() => {});

      fireWebhooks({
        appId: app.id,
        appCode,
        trigger: 'comment_added',
        record: fullRecord as Record<string, unknown>,
        recordId,
        actorUserId: user.id,
        extra: { comment: { id: comment.id, body: comment.body } },
      }).catch(() => {});
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error in POST comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * コメント削除（論理削除）
 * DELETE /api/apps/[appCode]/records/[recordId]/comments?commentId=xxx
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { appCode } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const url = new URL(request.url);
    const commentId = url.searchParams.get('commentId');
    if (!commentId) {
      return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
    }

    // 自分のコメントのみ削除可能（RLSでも制限あり）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commentsTable = supabase.from('app_record_comments') as any;
    const { error } = await commentsTable
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting comment:', error);
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
