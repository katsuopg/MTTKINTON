import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: プロセス定義取得
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ appCode: string }> }
) {
  const { appCode } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // アプリ取得
  const { data: app } = await supabase
    .from('apps')
    .select('id')
    .eq('code', appCode)
    .single();
  if (!app) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  // プロセス定義取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: definition } = await (supabase.from('process_definitions') as any)
    .select('*')
    .eq('app_id', app.id)
    .single();

  if (!definition) {
    return NextResponse.json({
      definition: null,
      statuses: [],
      actions: [],
    });
  }

  const defId = definition.id;

  // ステータス + アクションを並列取得
  const [statusesRes, actionsRes] = await Promise.all([
    (supabase.from('process_statuses') as any)
      .select('*')
      .eq('process_definition_id', defId)
      .order('display_order'),
    (supabase.from('process_actions') as any)
      .select('*')
      .eq('process_definition_id', defId)
      .order('display_order'),
  ]);

  return NextResponse.json({
    definition,
    statuses: statusesRes.data || [],
    actions: actionsRes.data || [],
  });
}

// PUT: プロセス定義一括更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ appCode: string }> }
) {
  const { appCode } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: app } = await supabase
    .from('apps')
    .select('id')
    .eq('code', appCode)
    .single();
  if (!app) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  const body = await request.json();
  const { enabled, statuses, actions } = body;

  // 1. process_definitions upsert
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: defData, error: defErr } = await (supabase.from('process_definitions') as any)
    .upsert(
      {
        app_id: app.id,
        enabled: enabled ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'app_id' }
    )
    .select()
    .single();

  if (defErr || !defData) {
    return NextResponse.json({ error: 'Failed to save process definition', details: defErr?.message }, { status: 500 });
  }

  const defId = (defData as any).id;

  // 2. 既存ステータス・アクションを削除（CASCADE でassigneesも削除される）
  await (supabase.from('process_actions') as any)
    .delete()
    .eq('process_definition_id', defId);

  await (supabase.from('process_statuses') as any)
    .delete()
    .eq('process_definition_id', defId);

  // 3. ステータス再作成
  const statusMap: Record<string, string> = {}; // tempId → realId

  if (statuses && statuses.length > 0) {
    for (let i = 0; i < statuses.length; i++) {
      const s = statuses[i];
      const { data: newStatus, error: sErr } = await (supabase.from('process_statuses') as any)
        .insert({
          process_definition_id: defId,
          name: s.name,
          display_order: i,
          is_initial: s.is_initial ?? false,
          is_final: s.is_final ?? false,
          assignee_type: s.assignee_type || null,
        })
        .select()
        .single();

      if (sErr || !newStatus) {
        return NextResponse.json({ error: `Failed to save status: ${s.name}`, details: sErr?.message }, { status: 500 });
      }

      // tempIdまたはoldIdをマッピング
      statusMap[s.id || s.temp_id || `s_${i}`] = (newStatus as any).id;
    }
  }

  // 4. アクション再作成
  if (actions && actions.length > 0) {
    for (let i = 0; i < actions.length; i++) {
      const a = actions[i];
      const fromId = statusMap[a.from_status_id];
      const toId = statusMap[a.to_status_id];

      if (!fromId || !toId) continue; // 無効な参照はスキップ

      const { error: aErr } = await (supabase.from('process_actions') as any)
        .insert({
          process_definition_id: defId,
          name: a.name,
          from_status_id: fromId,
          to_status_id: toId,
          filter_condition: a.filter_condition || null,
          action_type: a.action_type || 'NORMAL',
          requirement_type: a.requirement_type || null,
          display_order: i,
        });

      if (aErr) {
        return NextResponse.json({ error: `Failed to save action: ${a.name}`, details: aErr?.message }, { status: 500 });
      }
    }
  }

  // 5. 最新データを返却
  const [statusesRes, actionsRes] = await Promise.all([
    (supabase.from('process_statuses') as any)
      .select('*')
      .eq('process_definition_id', defId)
      .order('display_order'),
    (supabase.from('process_actions') as any)
      .select('*')
      .eq('process_definition_id', defId)
      .order('display_order'),
  ]);

  return NextResponse.json({
    definition: defData,
    statuses: statusesRes.data || [],
    actions: actionsRes.data || [],
  });
}
