import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

type Params = { params: Promise<{ appCode: string }> };

/**
 * アプリアクション一覧取得
 * GET /api/apps/[appCode]/actions
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
  const { data: actions } = await (supabase.from('app_actions' as any) as any)
    .select('id, name, description, target_app_id, field_mappings, condition, display_order, target_app:apps!app_actions_target_app_id_fkey(code, name)')
    .eq('app_id', app.id)
    .eq('is_active', true)
    .order('display_order');

  return NextResponse.json({ actions: actions || [] });
}

/**
 * アプリアクション実行（転記）
 * POST /api/apps/[appCode]/actions
 * body: { action_id, record_id }
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { appCode } = await params;
  const permCheck = await requireAppPermission(appCode, 'can_view');
  if (!permCheck.allowed) {
    return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { action_id, record_id } = body;

  if (!action_id || !record_id) {
    return NextResponse.json({ error: 'action_id and record_id are required' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: app } = await (supabase.from('apps') as any)
    .select('id')
    .eq('code', appCode)
    .eq('is_active', true)
    .single();

  if (!app) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  // アクション定義取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: action } = await (supabase.from('app_actions' as any) as any)
    .select('*')
    .eq('id', action_id)
    .eq('app_id', app.id)
    .eq('is_active', true)
    .single();

  if (!action) return NextResponse.json({ error: 'Action not found' }, { status: 404 });

  // 転記元レコード取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sourceRecord } = await (supabase.from('app_records') as any)
    .select('*')
    .eq('id', record_id)
    .eq('app_id', app.id)
    .single();

  if (!sourceRecord) return NextResponse.json({ error: 'Source record not found' }, { status: 404 });

  // 転記先アプリの追加権限チェック
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: targetApp } = await (supabase.from('apps') as any)
    .select('id, code')
    .eq('id', action.target_app_id)
    .eq('is_active', true)
    .single();

  if (!targetApp) return NextResponse.json({ error: 'Target app not found' }, { status: 404 });

  const targetPermCheck = await requireAppPermission(targetApp.code, 'can_add');
  if (!targetPermCheck.allowed) {
    return NextResponse.json({ error: 'No permission to add records to target app' }, { status: 403 });
  }

  // フィールドマッピングに基づいてデータ構築
  const sourceData = (sourceRecord.data || {}) as Record<string, unknown>;
  const targetData: Record<string, unknown> = {};
  const mappings = (action.field_mappings || []) as {
    source_field: string;
    target_field: string;
    copy_type: 'value' | 'fixed';
    fixed_value?: unknown;
  }[];

  for (const mapping of mappings) {
    if (mapping.copy_type === 'fixed') {
      targetData[mapping.target_field] = mapping.fixed_value ?? null;
    } else {
      targetData[mapping.target_field] = sourceData[mapping.source_field] ?? null;
    }
  }

  // 転記先にレコード作成
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newRecord, error } = await (supabase.from('app_records') as any)
    .insert({
      app_id: targetApp.id,
      data: targetData,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create target record:', error);
    return NextResponse.json({ error: 'Failed to create target record' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    source_record_id: record_id,
    target_record_id: newRecord.id,
    target_app_code: targetApp.code,
    target_record_number: newRecord.record_number,
  }, { status: 201 });
}

/**
 * アプリアクション設定（管理者用）
 * PUT /api/apps/[appCode]/actions
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
  const { actions } = body as {
    actions: {
      id?: string;
      name: string;
      description?: string;
      target_app_id: string;
      field_mappings: unknown[];
      condition?: unknown;
      display_order?: number;
    }[];
  };

  if (!Array.isArray(actions)) {
    return NextResponse.json({ error: 'actions array is required' }, { status: 400 });
  }

  // 既存アクションを無効化
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('app_actions' as any) as any)
    .update({ is_active: false })
    .eq('app_id', app.id);

  // 新しいアクションを挿入/更新
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    if (a.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('app_actions' as any) as any)
        .update({
          name: a.name,
          description: a.description || null,
          target_app_id: a.target_app_id,
          field_mappings: a.field_mappings,
          condition: a.condition || null,
          display_order: i,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', a.id);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('app_actions' as any) as any)
        .insert({
          app_id: app.id,
          name: a.name,
          description: a.description || null,
          target_app_id: a.target_app_id,
          field_mappings: a.field_mappings,
          condition: a.condition || null,
          display_order: i,
        });
    }
  }

  return NextResponse.json({ success: true });
}
