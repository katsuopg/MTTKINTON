import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

type Params = { params: Promise<{ appCode: string }> };

/**
 * カテゴリー一覧取得（ツリー構造）
 * GET /api/apps/[appCode]/categories
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: categories } = await ((supabase.from('app_categories' as any) as any) as any)
    .select('id, name, parent_id, filter_condition, display_order')
    .eq('app_id', app.id)
    .eq('is_active', true)
    .order('display_order');

  return NextResponse.json({ categories: categories || [] });
}

/**
 * カテゴリー一括保存（管理者用）
 * PUT /api/apps/[appCode]/categories
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
  const { categories } = body as {
    categories: {
      id?: string;
      name: string;
      parent_id?: string | null;
      filter_condition?: unknown;
      display_order?: number;
    }[];
  };

  if (!Array.isArray(categories)) {
    return NextResponse.json({ error: 'categories array is required' }, { status: 400 });
  }

  // 既存を無効化
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await ((supabase.from('app_categories' as any) as any) as any)
    .update({ is_active: false })
    .eq('app_id', app.id);

  // upsert
  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    const data = {
      app_id: app.id,
      name: c.name,
      parent_id: c.parent_id || null,
      filter_condition: c.filter_condition || null,
      display_order: c.display_order ?? i,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    if (c.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await ((supabase.from('app_categories' as any) as any) as any)
        .update(data)
        .eq('id', c.id);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await ((supabase.from('app_categories' as any) as any) as any)
        .insert(data);
    }
  }

  return NextResponse.json({ success: true });
}
