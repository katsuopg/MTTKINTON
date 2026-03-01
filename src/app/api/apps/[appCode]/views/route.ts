import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

type Params = { params: Promise<{ appCode: string }> };

/**
 * ビュー一覧取得
 * GET /api/apps/[appCode]/views
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { appCode } = await params;
  const permCheck = await requireAppPermission(appCode, 'can_view');
  if (!permCheck.allowed) {
    return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: app } = await (supabase.from('apps') as any)
    .select('id')
    .eq('code', appCode)
    .eq('is_active', true)
    .single();

  if (!app) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  const { data: views, error } = await supabase.from('app_views')
    .select('*')
    .eq('app_id', app.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch views' }, { status: 500 });
  }

  return NextResponse.json({ views: views || [] });
}

/**
 * ビュー作成
 * POST /api/apps/[appCode]/views
 */
export async function POST(request: NextRequest, { params }: Params) {
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
    .eq('is_active', true)
    .single();

  if (!app) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  const body = await request.json();
  const { name, view_type, config, is_default } = body;

  if (!name || !view_type) {
    return NextResponse.json({ error: 'name and view_type are required' }, { status: 400 });
  }

  // is_default=trueの場合、他のデフォルトをリセット
  if (is_default) {
    await supabase.from('app_views')
      .update({ is_default: false })
      .eq('app_id', app.id);
  }

  // display_orderの最大値を取得
  const { data: maxOrder } = await supabase.from('app_views')
    .select('display_order')
    .eq('app_id', app.id)
    .eq('is_active', true)
    .order('display_order', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = maxOrder ? (maxOrder.display_order + 1) : 0;

  const { data: view, error } = await supabase.from('app_views')
    .insert({
      app_id: app.id,
      name,
      view_type,
      config: config || {},
      display_order: nextOrder,
      is_default: is_default || false,
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating view:', error);
    return NextResponse.json({ error: 'Failed to create view' }, { status: 500 });
  }

  return NextResponse.json({ view }, { status: 201 });
}

/**
 * ビュー更新
 * PUT /api/apps/[appCode]/views
 */
export async function PUT(request: NextRequest, { params }: Params) {
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
    .eq('is_active', true)
    .single();

  if (!app) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  const body = await request.json();
  const { id, is_default, ...updateData } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  // is_default=trueの場合、他のデフォルトをリセット
  if (is_default) {
    await supabase.from('app_views')
      .update({ is_default: false })
      .eq('app_id', app.id);
  }

  const { data: view, error } = await supabase.from('app_views')
    .update({ ...updateData, is_default: is_default ?? false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('app_id', app.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update view' }, { status: 500 });
  }

  return NextResponse.json({ view });
}

/**
 * ビュー削除（論理削除）
 * DELETE /api/apps/[appCode]/views
 */
export async function DELETE(request: NextRequest, { params }: Params) {
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
    .eq('is_active', true)
    .single();

  if (!app) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { error } = await supabase.from('app_views')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('app_id', app.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete view' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
