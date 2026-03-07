import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any;

/**
 * 定期レポート設定 CRUD
 */

// GET: アプリの定期レポート一覧
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const appCode = searchParams.get('appCode');

  let query = (supabase.from('scheduled_reports' as SA) as SA)
    .select('*, app:apps(code, name)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (appCode) {
    const { data: app } = await (supabase.from('apps') as SA)
      .select('id')
      .eq('code', appCode)
      .eq('is_active', true)
      .single();
    if (app) {
      query = query.eq('app_id', app.id);
    }
  }

  const { data: reports } = await query;
  return NextResponse.json({ reports: reports || [] });
}

// POST: 定期レポート作成
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, app_code, report_type, config, schedule_type, schedule_day, schedule_hour, notify_type, notify_target_id } = body;

  if (!name || !app_code) {
    return NextResponse.json({ error: 'name and app_code are required' }, { status: 400 });
  }

  const permCheck = await requireAppPermission(app_code, 'can_manage');
  if (!permCheck.allowed) {
    return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
  }

  const { data: app } = await (supabase.from('apps') as SA)
    .select('id')
    .eq('code', app_code)
    .eq('is_active', true)
    .single();

  if (!app) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  const { data: report, error } = await (supabase.from('scheduled_reports' as SA) as SA)
    .insert({
      name,
      app_id: app.id,
      report_type: report_type || 'summary',
      config: config || {},
      schedule_type: schedule_type || 'weekly',
      schedule_day: schedule_day ?? 1,
      schedule_hour: schedule_hour ?? 9,
      notify_type: notify_type || 'creator',
      notify_target_id: notify_target_id || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create scheduled report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }

  return NextResponse.json({ report }, { status: 201 });
}

// DELETE: 定期レポート無効化
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  await (supabase.from('scheduled_reports' as SA) as SA)
    .update({ is_active: false })
    .eq('id', id)
    .eq('created_by', user.id);

  return NextResponse.json({ success: true });
}
