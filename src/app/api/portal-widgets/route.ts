import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any;

/**
 * ポータルウィジェット一覧（データ込み）
 * GET /api/portal-widgets
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: widgets } = await (supabase.from('portal_widgets' as SA) as SA)
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (!widgets || widgets.length === 0) {
    return NextResponse.json({ widgets: [] });
  }

  // 各ウィジェットのデータを取得
  const enrichedWidgets = await Promise.all(
    (widgets as SA[]).map(async (widget: SA) => {
      try {
        const data = await fetchWidgetData(supabase, widget, user.id);
        return { ...widget, data };
      } catch {
        return { ...widget, data: null };
      }
    })
  );

  return NextResponse.json({ widgets: enrichedWidgets });
}

/**
 * ポータルウィジェット作成/更新（管理者用）
 * POST /api/portal-widgets
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, title, widget_type, config, width, display_order } = body;

  if (!title || !widget_type) {
    return NextResponse.json({ error: 'title and widget_type are required' }, { status: 400 });
  }

  if (id) {
    await (supabase.from('portal_widgets' as SA) as SA)
      .update({
        title,
        widget_type,
        config: config || {},
        width: width || 'half',
        display_order: display_order ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  } else {
    await (supabase.from('portal_widgets' as SA) as SA)
      .insert({
        title,
        widget_type,
        config: config || {},
        width: width || 'half',
        display_order: display_order ?? 0,
        created_by: user.id,
      });
  }

  return NextResponse.json({ success: true });
}

/**
 * ポータルウィジェット削除
 * DELETE /api/portal-widgets?id=xxx
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  await (supabase.from('portal_widgets' as SA) as SA)
    .update({ is_active: false })
    .eq('id', id);

  return NextResponse.json({ success: true });
}

// ウィジェットタイプ別のデータ取得
async function fetchWidgetData(supabase: SA, widget: SA, userId: string): Promise<unknown> {
  const config = widget.config || {};

  switch (widget.widget_type) {
    case 'announcement':
      return { content: config.content || '' };

    case 'notifications': {
      const { data } = await supabase.from('notifications')
        .select('id, title, message, type, link, is_read, created_at')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(config.limit || 10);
      return { notifications: data || [] };
    }

    case 'app_summary': {
      if (!config.app_code) return null;
      const { data: app } = await (supabase.from('apps') as SA)
        .select('id')
        .eq('code', config.app_code)
        .eq('is_active', true)
        .single();
      if (!app) return null;

      const { data: records } = await (supabase.rpc as SA)('filter_app_records', {
        p_app_id: app.id,
        p_search: '',
        p_filter_conditions: '[]',
        p_filter_match_type: 'and',
        p_sort_field: 'record_number',
        p_sort_order: 'desc',
        p_page: 1,
        p_page_size: 500,
      });

      const rows = (records || []) as SA[];
      const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

      if (config.group_by) {
        const groups: Record<string, number> = {};
        for (const row of rows) {
          const key = String(row.data?.[config.group_by] ?? '(empty)');
          groups[key] = (groups[key] || 0) + 1;
        }
        return { total, groups };
      }
      return { total };
    }

    case 'recent_records': {
      if (!config.app_code) return null;
      const { data: app } = await (supabase.from('apps') as SA)
        .select('id')
        .eq('code', config.app_code)
        .eq('is_active', true)
        .single();
      if (!app) return null;

      const { data: records } = await (supabase.rpc as SA)('filter_app_records', {
        p_app_id: app.id,
        p_search: '',
        p_filter_conditions: '[]',
        p_filter_match_type: 'and',
        p_sort_field: 'updated_at',
        p_sort_order: 'desc',
        p_page: 1,
        p_page_size: config.limit || 5,
      });

      return { records: (records || []).map((r: SA) => ({
        id: r.id,
        record_number: r.record_number,
        data: r.data,
        updated_at: r.updated_at,
      })) };
    }

    default:
      return null;
  }
}
