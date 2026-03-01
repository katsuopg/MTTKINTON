import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fireNotifications } from '@/lib/dynamic-app/notification-engine';
import { fireWebhooks } from '@/lib/dynamic-app/webhook-engine';

// POST: アクション実行（ステータス遷移）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appCode: string; recordId: string }> }
) {
  const { appCode, recordId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { action_id, comment } = body;

  if (!action_id) {
    return NextResponse.json({ error: 'action_id is required' }, { status: 400 });
  }

  // アプリ取得
  const { data: app } = await supabase
    .from('apps')
    .select('id')
    .eq('code', appCode)
    .single();
  if (!app) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  // レコード存在確認
  const { data: record } = await supabase
    .from('app_records' as any)
    .select('id, status')
    .eq('id', recordId)
    .eq('app_id', app.id)
    .single();
  if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

  // プロセス定義取得
  const { data: definition } = await supabase
    .from('process_definitions' as any)
    .select('id, enabled')
    .eq('app_id', app.id)
    .single();
  if (!definition || !(definition as any).enabled) {
    return NextResponse.json({ error: 'Process management is not enabled' }, { status: 400 });
  }

  // アクション取得
  const { data: action } = await supabase
    .from('process_actions' as any)
    .select('*')
    .eq('id', action_id)
    .eq('process_definition_id', (definition as any).id)
    .single();
  if (!action) return NextResponse.json({ error: 'Action not found' }, { status: 404 });

  const fromStatusId = (action as any).from_status_id;
  const toStatusId = (action as any).to_status_id;

  // 現在のステータス確認
  const { data: currentState } = await supabase
    .from('record_process_states' as any)
    .select('id, current_status_id')
    .eq('record_id', recordId)
    .eq('record_table', 'app_records')
    .single();

  if (currentState) {
    // 既存状態がある場合、fromステータスが一致するか確認
    if ((currentState as any).current_status_id !== fromStatusId) {
      return NextResponse.json({ error: 'Invalid action for current status' }, { status: 400 });
    }

    // ステータス更新
    await supabase
      .from('record_process_states' as any)
      .update({
        current_status_id: toStatusId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', (currentState as any).id);

    // 既存の作業者をクリア
    await supabase
      .from('record_assignees' as any)
      .delete()
      .eq('record_process_state_id', (currentState as any).id);
  } else {
    // 初期ステータスからの遷移（状態レコードがない場合）
    // fromが初期ステータスかチェック
    const { data: fromStatus } = await supabase
      .from('process_statuses' as any)
      .select('is_initial')
      .eq('id', fromStatusId)
      .single();

    if (!fromStatus || !(fromStatus as any).is_initial) {
      return NextResponse.json({ error: 'No process state exists for this record' }, { status: 400 });
    }

    // 状態レコード作成
    await supabase
      .from('record_process_states' as any)
      .insert({
        record_id: recordId,
        record_table: 'app_records',
        current_status_id: toStatusId,
      });
  }

  // アクションログ記録
  await supabase
    .from('process_action_logs' as any)
    .insert({
      record_id: recordId,
      record_table: 'app_records',
      action_id,
      from_status_id: fromStatusId,
      to_status_id: toStatusId,
      executed_by: user.id,
      comment: comment || null,
    });

  // app_records.status もステータス名で同期
  const { data: toStatus } = await supabase
    .from('process_statuses' as any)
    .select('name')
    .eq('id', toStatusId)
    .single();

  if (toStatus) {
    await supabase
      .from('app_records' as any)
      .update({ status: (toStatus as any).name, updated_by: user.id })
      .eq('id', recordId);
  }

  // 条件通知（ステータス変更）
  const { data: fullRecord } = await (supabase
    .from('app_records' as any) as any)
    .select('*')
    .eq('id', recordId)
    .single();

  if (fullRecord) {
    fireNotifications({
      appId: app.id,
      appCode,
      appName: appCode,
      trigger: 'status_changed',
      record: fullRecord as Record<string, unknown>,
      actorUserId: user.id,
      extraContext: { new_status: (toStatus as any)?.name || '' },
    }).catch(() => {});

    fireWebhooks({
      appId: app.id,
      appCode,
      trigger: 'status_changed',
      record: fullRecord as Record<string, unknown>,
      recordId,
      actorUserId: user.id,
      extra: { new_status: (toStatus as any)?.name || '' },
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, status: (toStatus as any)?.name });
}

// GET: レコードのプロセス状態 + 利用可能アクション + ログ取得
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ appCode: string; recordId: string }> }
) {
  const { appCode, recordId } = await params;
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
  const { data: definition } = await supabase
    .from('process_definitions' as any)
    .select('id, enabled')
    .eq('app_id', app.id)
    .single();

  if (!definition || !(definition as any).enabled) {
    return NextResponse.json({ enabled: false });
  }

  const defId = (definition as any).id;

  // ステータス一覧取得
  const { data: allStatuses } = await supabase
    .from('process_statuses' as any)
    .select('*')
    .eq('process_definition_id', defId)
    .order('display_order');

  const statusList = (allStatuses || []) as any[];

  // 現在の状態取得
  const { data: currentState } = await supabase
    .from('record_process_states' as any)
    .select('id, current_status_id')
    .eq('record_id', recordId)
    .eq('record_table', 'app_records')
    .single();

  // 現在のステータスを特定
  let currentStatusId: string | null = null;
  let currentStatusName: string | null = null;

  if (currentState) {
    currentStatusId = (currentState as any).current_status_id;
    const found = statusList.find((s: any) => s.id === currentStatusId);
    currentStatusName = found?.name || null;
  } else {
    // 初期ステータスを使用
    const initial = statusList.find((s: any) => s.is_initial);
    if (initial) {
      currentStatusId = initial.id;
      currentStatusName = initial.name;
    }
  }

  // 現在のステータスから実行可能なアクション取得
  let availableActions: any[] = [];
  if (currentStatusId) {
    const { data: actionsData } = await supabase
      .from('process_actions' as any)
      .select('*')
      .eq('process_definition_id', defId)
      .eq('from_status_id', currentStatusId)
      .order('display_order');

    availableActions = (actionsData || []).map((a: any) => {
      const toStatus = statusList.find((s: any) => s.id === a.to_status_id);
      return {
        ...a,
        to_status_name: toStatus?.name || '',
      };
    });
  }

  // アクションログ取得（最新20件）
  const { data: logsData } = await supabase
    .from('process_action_logs' as any)
    .select('*')
    .eq('record_id', recordId)
    .eq('record_table', 'app_records')
    .order('executed_at', { ascending: false })
    .limit(20);

  // ログにステータス名とユーザー名を付与
  const logs = (logsData || []).map((log: any) => {
    const fromStatus = statusList.find((s: any) => s.id === log.from_status_id);
    const toStatus = statusList.find((s: any) => s.id === log.to_status_id);
    return {
      ...log,
      from_status_name: fromStatus?.name || '',
      to_status_name: toStatus?.name || '',
    };
  });

  // ユーザー名解決
  const userIds = [...new Set(logs.map((l: any) => l.executed_by).filter(Boolean))];
  let userMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: employees } = await supabase
      .from('employees')
      .select('employee_uuid, name_ja, name_en')
      .in('employee_uuid', userIds as string[]);
    if (employees) {
      for (const emp of employees as any[]) {
        userMap[emp.employee_uuid] = emp.name_ja || emp.name_en || emp.employee_uuid;
      }
    }
  }

  const enrichedLogs = logs.map((l: any) => ({
    ...l,
    executed_by_name: userMap[l.executed_by] || l.executed_by,
  }));

  return NextResponse.json({
    enabled: true,
    current_status_id: currentStatusId,
    current_status_name: currentStatusName,
    is_final: statusList.find((s: any) => s.id === currentStatusId)?.is_final ?? false,
    available_actions: availableActions,
    logs: enrichedLogs,
    statuses: statusList,
  });
}
