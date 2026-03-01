import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';

/**
 * アプリを完全削除（復旧不可）
 * DELETE /api/apps/[appCode]/permanent-delete
 * 削除済み（is_active=false）のアプリのみ対象
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ appCode: string }> }
) {
  try {
    const { appCode } = await params;
    const permCheck = await requirePermission('manage_settings');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    const { data: app } = await appsTable
      .select('id, app_type, is_active')
      .eq('code', appCode)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    if (app.app_type !== 'dynamic') {
      return NextResponse.json({ error: 'Cannot permanently delete static apps' }, { status: 400 });
    }

    if (app.is_active) {
      return NextResponse.json({ error: 'App must be deleted first (soft delete) before permanent deletion' }, { status: 400 });
    }

    const appId = app.id;

    // 関連データを全て削除（順序重要：外部キー依存順）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const from = (table: string) => (supabase as any).from(table);

    // 1. ファイル（Storageも削除）
    const { data: files } = await from('app_record_files')
      .select('file_path')
      .eq('app_id', appId);
    if (files && files.length > 0) {
      const filePaths = files.map((f: { file_path: string }) => f.file_path);
      await supabase.storage.from('app-files').remove(filePaths);
    }
    await from('app_record_files').delete().eq('app_id', appId);

    // 2. コメント
    await from('app_record_comments').delete().eq('app_id', appId);

    // 3. 変更履歴
    await from('app_record_history').delete().eq('app_id', appId);

    // 4. プロセス管理（ランタイム→定義の順）
    // record_assignees, process_action_logs はrecord_process_states経由
    const { data: processStates } = await from('record_process_states')
      .select('id')
      .eq('app_id', appId);
    if (processStates && processStates.length > 0) {
      const stateIds = processStates.map((s: { id: string }) => s.id);
      await from('record_assignees').delete().in('process_state_id', stateIds);
      await from('process_action_logs').delete().in('process_state_id', stateIds);
    }
    await from('record_process_states').delete().eq('app_id', appId);

    // プロセス定義
    const { data: processDefs } = await from('process_definitions')
      .select('id')
      .eq('app_id', appId);
    if (processDefs && processDefs.length > 0) {
      const defIds = processDefs.map((d: { id: string }) => d.id);
      // statuses → actions/assignees/executors
      const { data: statuses } = await from('process_statuses')
        .select('id')
        .in('definition_id', defIds);
      if (statuses && statuses.length > 0) {
        const statusIds = statuses.map((s: { id: string }) => s.id);
        await from('process_status_assignees').delete().in('status_id', statusIds);
        // actionsはfrom_status_id/to_status_idで参照
        const { data: actions } = await from('process_actions')
          .select('id')
          .in('from_status_id', statusIds);
        if (actions && actions.length > 0) {
          const actionIds = actions.map((a: { id: string }) => a.id);
          await from('process_action_executors').delete().in('action_id', actionIds);
        }
        await from('process_actions').delete().in('from_status_id', statusIds);
        await from('process_statuses').delete().in('definition_id', defIds);
      }
      await from('process_definitions').delete().eq('app_id', appId);
    }

    // 5. 通知ルール
    await from('app_notification_rules').delete().eq('app_id', appId);

    // 6. ビュー
    await from('app_views').delete().eq('app_id', appId);

    // 7. レコード権限ルール
    await from('record_permission_rules').delete().eq('app_id', appId);

    // 8. フィールド権限
    await from('field_permissions').delete().eq('app_id', appId);

    // 9. アプリ権限
    await from('app_permissions').delete().eq('app_id', appId);

    // 10. レコード
    await from('app_records').delete().eq('app_id', appId);

    // 11. フィールド定義
    await from('app_fields').delete().eq('app_id', appId);

    // 12. メニュー設定
    await from('menu_configurations').delete().eq('menu_key', appCode);

    // 13. アプリ本体を削除
    const { error } = await appsTable.delete().eq('id', appId);

    if (error) {
      console.error('Error permanently deleting app:', error);
      return NextResponse.json({ error: 'Failed to permanently delete app' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/apps/[appCode]/permanent-delete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
