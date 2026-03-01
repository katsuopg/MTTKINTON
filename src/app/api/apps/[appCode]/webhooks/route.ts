import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

/**
 * Webhook一覧取得
 * GET /api/apps/[appCode]/webhooks
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ appCode: string }> }
) {
  try {
    const { appCode } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_manage');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    // アプリID取得
    const { data: app } = await supabase
      .from('apps')
      .select('id')
      .eq('code', appCode)
      .eq('is_active', true)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: webhooks, error } = await (supabase as any).from('app_webhooks')
      .select('id, name, url, trigger_type, headers, is_active, created_at, updated_at')
      .eq('app_id', app.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching webhooks:', error);
      return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
    }

    return NextResponse.json({ webhooks: webhooks || [] });
  } catch (error) {
    console.error('Error in GET /api/apps/[appCode]/webhooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Webhook作成
 * POST /api/apps/[appCode]/webhooks
 * body: { name, url, trigger_type, headers?, is_active? }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ appCode: string }> }
) {
  try {
    const { appCode } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_manage');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const body = await request.json();
    const { name, url, trigger_type, headers, is_active } = body;

    if (!name || !url || !trigger_type) {
      return NextResponse.json({ error: 'name, url, and trigger_type are required' }, { status: 400 });
    }

    const validTriggers = ['record_added', 'record_edited', 'record_deleted', 'comment_added', 'status_changed'];
    if (!validTriggers.includes(trigger_type)) {
      return NextResponse.json({ error: 'Invalid trigger_type' }, { status: 400 });
    }

    // URL検証
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // アプリID取得
    const { data: app } = await supabase
      .from('apps')
      .select('id')
      .eq('code', appCode)
      .eq('is_active', true)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    const { data: { user } } = await supabase.auth.getUser();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: webhook, error } = await (supabase as any).from('app_webhooks')
      .insert({
        app_id: app.id,
        name,
        url,
        trigger_type,
        headers: headers || {},
        is_active: is_active !== false,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating webhook:', error);
      return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
    }

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/apps/[appCode]/webhooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
