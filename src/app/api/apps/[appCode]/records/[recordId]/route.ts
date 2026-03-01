import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  requireAppPermission,
  getRecordPermissionRules,
  evaluateRecordPermissions,
  getUserContext,
} from '@/lib/auth/app-permissions';
import { validateRecordData } from '@/lib/dynamic-app/validation';
import type { FieldDefinition } from '@/types/dynamic-app';
import { fireNotifications } from '@/lib/dynamic-app/notification-engine';
import { fireWebhooks } from '@/lib/dynamic-app/webhook-engine';

/**
 * レコード詳細を取得
 * GET /api/apps/[appCode]/records/[recordId]
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ appCode: string; recordId: string }> }
) {
  try {
    const { appCode, recordId } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    const { data: app } = await appsTable
      .select('id')
      .eq('code', appCode)
      .eq('is_active', true)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recordsTable = supabase.from('app_records') as any;
    const { data: record, error } = await recordsTable
      .select('*')
      .eq('id', recordId)
      .eq('app_id', app.id)
      .single();

    if (error || !record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // レコード権限チェック
    const rules = await getRecordPermissionRules(app.id);
    if (rules.length > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { roleIds, orgIds } = await getUserContext(user.id);
        const perm = evaluateRecordPermissions(record, rules, user.id, roleIds, orgIds);
        if (perm && !perm.can_view) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        // レコードに権限情報を付加
        return NextResponse.json({ record, recordPermissions: perm });
      }
    }

    return NextResponse.json({ record });
  } catch (error) {
    console.error('Error in GET /api/apps/[appCode]/records/[recordId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * レコードを更新
 * PATCH /api/apps/[appCode]/records/[recordId]
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ appCode: string; recordId: string }> }
) {
  try {
    const { appCode, recordId } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_edit');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const body = await request.json();
    const { data } = body as { data: Record<string, unknown> };

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'data object is required' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    const { data: app } = await appsTable
      .select('id, enable_history')
      .eq('code', appCode)
      .eq('is_active', true)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // 既存レコードを取得
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recordsTable = supabase.from('app_records') as any;
    const { data: existingRecord } = await recordsTable
      .select('*')
      .eq('id', recordId)
      .eq('app_id', app.id)
      .single();

    if (!existingRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // レコード権限チェック（can_edit）
    const rules = await getRecordPermissionRules(app.id);
    if (rules.length > 0) {
      const { roleIds, orgIds } = await getUserContext(user!.id);
      const perm = evaluateRecordPermissions(existingRecord, rules, user!.id, roleIds, orgIds);
      if (perm && !perm.can_edit) {
        return NextResponse.json({ error: 'Edit access denied' }, { status: 403 });
      }
    }

    // 既存データとマージ
    const oldData = existingRecord.data as Record<string, unknown>;
    const mergedData = { ...oldData, ...data };

    // フィールド定義を取得してバリデーション
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldsTable = supabase.from('app_fields') as any;
    const { data: fields } = await fieldsTable
      .select('*')
      .eq('app_id', app.id)
      .eq('is_active', true);

    if (fields && fields.length > 0) {
      const validation = validateRecordData(fields as FieldDefinition[], mergedData);
      if (!validation.valid) {
        return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 });
      }
    }

    const { data: record, error } = await recordsTable
      .update({
        data: mergedData,
        updated_by: user?.id || null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', recordId)
      .eq('app_id', app.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating record:', error);
      return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
    }

    // 変更履歴を記録（差分があるフィールドのみ、enable_historyがtrueの場合のみ）
    if (app.enable_history) {
      const historyRows: Array<{
        app_id: string;
        record_id: string;
        field_code: string;
        old_value: unknown;
        new_value: unknown;
        changed_by: string | null;
      }> = [];

      for (const [fieldCode, newValue] of Object.entries(data)) {
        const oldValue = oldData[fieldCode];
        if (JSON.stringify(oldValue ?? null) !== JSON.stringify(newValue ?? null)) {
          historyRows.push({
            app_id: app.id,
            record_id: recordId,
            field_code: fieldCode,
            old_value: oldValue ?? null,
            new_value: newValue ?? null,
            changed_by: user?.id || null,
          });
        }
      }

      if (historyRows.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const historyTable = supabase.from('app_record_history') as any;
        const { error: histError } = await historyTable.insert(historyRows);
        if (histError) {
          console.error('Failed to record history:', histError);
        }
      }
    }

    // 条件通知を発火
    fireNotifications({
      appId: app.id,
      appCode,
      appName: appCode,
      trigger: 'record_edited',
      record,
      actorUserId: user?.id || '',
    }).catch(() => {});

    fireWebhooks({
      appId: app.id,
      appCode,
      trigger: 'record_edited',
      record,
      actorUserId: user?.id || '',
    }).catch(() => {});

    return NextResponse.json({ record });
  } catch (error) {
    console.error('Error in PATCH /api/apps/[appCode]/records/[recordId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * レコードを削除
 * DELETE /api/apps/[appCode]/records/[recordId]
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ appCode: string; recordId: string }> }
) {
  try {
    const { appCode, recordId } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_delete');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    const { data: app } = await appsTable
      .select('id')
      .eq('code', appCode)
      .eq('is_active', true)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recordsTable = supabase.from('app_records') as any;

    // レコード権限チェック（can_delete）
    const rules = await getRecordPermissionRules(app.id);
    if (rules.length > 0) {
      const { data: existingRecord } = await recordsTable
        .select('*')
        .eq('id', recordId)
        .eq('app_id', app.id)
        .single();

      if (existingRecord) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { roleIds, orgIds } = await getUserContext(user.id);
          const perm = evaluateRecordPermissions(existingRecord, rules, user.id, roleIds, orgIds);
          if (perm && !perm.can_delete) {
            return NextResponse.json({ error: 'Delete access denied' }, { status: 403 });
          }
        }
      }
    }

    const { error } = await recordsTable
      .delete()
      .eq('id', recordId)
      .eq('app_id', app.id);

    if (error) {
      console.error('Error deleting record:', error);
      return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
    }

    fireWebhooks({
      appId: app.id,
      appCode,
      trigger: 'record_deleted',
      recordId,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/apps/[appCode]/records/[recordId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
