import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

// GET: プロセス定義取得
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ appCode: string }> }
) {
  const { appCode } = await params;

  // GETはcan_view、PUTはcan_manageだがGETは閲覧権限で十分
  const permCheck = await requireAppPermission(appCode, 'can_view');
  if (!permCheck.allowed) {
    return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
  }

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

  // 各ステータスの作業者候補を取得
  const statusIds = (statusesRes.data || []).map((s: any) => s.id);
  let assigneesMap: Record<string, any[]> = {};
  if (statusIds.length > 0) {
    const { data: allAssignees } = await (supabase.from('process_status_assignees') as any)
      .select('*')
      .in('process_status_id', statusIds);
    if (allAssignees) {
      for (const a of allAssignees as any[]) {
        if (!assigneesMap[a.process_status_id]) assigneesMap[a.process_status_id] = [];
        assigneesMap[a.process_status_id].push({
          type: a.entity_type,
          target_id: a.entity_code,
        });
      }
    }
  }

  const statusesWithAssignees = (statusesRes.data || []).map((s: any) => ({
    ...s,
    assignees: assigneesMap[s.id] || [],
  }));

  return NextResponse.json({
    definition,
    statuses: statusesWithAssignees,
    actions: actionsRes.data || [],
  });
}

// PUT: プロセス定義一括更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ appCode: string }> }
) {
  const { appCode } = await params;

  // プロセス管理の変更にはアプリ管理権限が必要
  const permCheck = await requireAppPermission(appCode, 'can_manage');
  if (!permCheck.allowed) {
    return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
  }

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
      const realStatusId = (newStatus as any).id;
      statusMap[s.id || s.temp_id || `s_${i}`] = realStatusId;

      // 作業者候補を保存
      if (s.assignees && Array.isArray(s.assignees) && s.assignees.length > 0) {
        for (const assignee of s.assignees) {
          await (supabase.from('process_status_assignees') as any)
            .insert({
              process_status_id: realStatusId,
              entity_type: assignee.type,
              entity_code: assignee.target_id,
            });
        }
      }
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
  const [statusesRes2, actionsRes2] = await Promise.all([
    (supabase.from('process_statuses') as any)
      .select('*')
      .eq('process_definition_id', defId)
      .order('display_order'),
    (supabase.from('process_actions') as any)
      .select('*')
      .eq('process_definition_id', defId)
      .order('display_order'),
  ]);

  // 作業者候補も返却
  const savedStatusIds = (statusesRes2.data || []).map((s: any) => s.id);
  let savedAssigneesMap: Record<string, any[]> = {};
  if (savedStatusIds.length > 0) {
    const { data: savedAssignees } = await (supabase.from('process_status_assignees') as any)
      .select('*')
      .in('process_status_id', savedStatusIds);
    if (savedAssignees) {
      for (const a of savedAssignees as any[]) {
        if (!savedAssigneesMap[a.process_status_id]) savedAssigneesMap[a.process_status_id] = [];
        savedAssigneesMap[a.process_status_id].push({
          type: a.entity_type,
          target_id: a.entity_code,
        });
      }
    }
  }

  const savedStatusesWithAssignees = (statusesRes2.data || []).map((s: any) => ({
    ...s,
    assignees: savedAssigneesMap[s.id] || [],
  }));

  return NextResponse.json({
    definition: defData,
    statuses: savedStatusesWithAssignees,
    actions: actionsRes2.data || [],
  });
}
