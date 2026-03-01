import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

/**
 * 通知ルール一覧取得
 * GET /api/apps/[appCode]/notifications
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ appCode: string }> }
) {
  const { appCode } = await params;
  const permCheck = await requireAppPermission(appCode, 'can_manage');
  if (!permCheck.allowed) {
    return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: app } = await (supabase.from('apps') as any)
    .select('id')
    .eq('code', appCode)
    .single();

  if (!app) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  const { data: rules, error } = await supabase.from('app_notification_rules')
    .select('*')
    .eq('app_id', app.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch notification rules' }, { status: 500 });
  }

  return NextResponse.json({ rules: rules || [] });
}

/**
 * 通知ルール作成
 * POST /api/apps/[appCode]/notifications
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appCode: string }> }
) {
  const { appCode } = await params;
  const permCheck = await requireAppPermission(appCode, 'can_manage');
  if (!permCheck.allowed) {
    return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: app } = await (supabase.from('apps') as any)
    .select('id')
    .eq('code', appCode)
    .single();

  if (!app) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  const body = await request.json();
  const { name, trigger_type, condition, notify_type, notify_target_id, notify_target_field, title_template, message_template } = body;

  if (!name || !trigger_type || !notify_type) {
    return NextResponse.json({ error: 'name, trigger_type, notify_type are required' }, { status: 400 });
  }

  const { data: rule, error } = await supabase.from('app_notification_rules')
    .insert({
      app_id: app.id,
      name,
      trigger_type,
      condition: condition || null,
      notify_type,
      notify_target_id: notify_target_id || null,
      notify_target_field: notify_target_field || null,
      title_template: title_template || null,
      message_template: message_template || null,
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification rule:', error);
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
  }

  return NextResponse.json({ rule }, { status: 201 });
}

/**
 * 通知ルール更新
 * PUT /api/apps/[appCode]/notifications
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ appCode: string }> }
) {
  const { appCode } = await params;
  const permCheck = await requireAppPermission(appCode, 'can_manage');
  if (!permCheck.allowed) {
    return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
  }

  const supabase = await createClient();

  const body = await request.json();
  const { id, ...updateData } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { data: rule, error } = await supabase.from('app_notification_rules')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
  }

  return NextResponse.json({ rule });
}

/**
 * 通知ルール削除（論理削除）
 * DELETE /api/apps/[appCode]/notifications
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ appCode: string }> }
) {
  const { appCode } = await params;
  const permCheck = await requireAppPermission(appCode, 'can_manage');
  if (!permCheck.allowed) {
    return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
  }

  const supabase = await createClient();
  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { error } = await supabase.from('app_notification_rules')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
