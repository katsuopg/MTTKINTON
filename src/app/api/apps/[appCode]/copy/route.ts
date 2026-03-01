import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

/**
 * アプリをコピー（フィールド定義・ビュー・プロセス・通知・権限を複製）
 * POST /api/apps/[appCode]/copy
 * body: { code, name, name_en?, name_th?, description? }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ appCode: string }> }
) {
  try {
    const { appCode } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const body = await request.json();
    const { code: newCode, name: newName, name_en, name_th, description } = body;

    if (!newCode || !newName) {
      return NextResponse.json({ error: 'code and name are required' }, { status: 400 });
    }

    if (!/^[a-z][a-z0-9_]*$/.test(newCode)) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const from = (table: string) => (supabase as any).from(table);

    // 重複チェック
    const { data: existing } = await from('apps').select('id').eq('code', newCode).single();
    if (existing) {
      return NextResponse.json({ error: 'App code already exists' }, { status: 409 });
    }

    // コピー元アプリを取得
    const { data: sourceApp } = await from('apps')
      .select('*')
      .eq('code', appCode)
      .eq('is_active', true)
      .single();

    if (!sourceApp) {
      return NextResponse.json({ error: 'Source app not found' }, { status: 404 });
    }

    // 最大display_orderを取得
    const { data: maxOrderResult } = await from('apps')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();
    const nextOrder = (maxOrderResult?.display_order || 0) + 10;

    // 1. 新しいアプリを作成
    const { data: newApp, error: appError } = await from('apps')
      .insert({
        code: newCode,
        name: newName,
        name_en: name_en || sourceApp.name_en,
        name_th: name_th || sourceApp.name_th,
        description: description || sourceApp.description,
        table_name: 'app_records',
        icon: sourceApp.icon,
        color: sourceApp.color,
        display_order: nextOrder,
        app_type: 'dynamic',
      } as never)
      .select()
      .single();

    if (appError || !newApp) {
      console.error('Error creating copied app:', appError);
      return NextResponse.json({ error: 'Failed to create copied app' }, { status: 500 });
    }

    const sourceAppId = sourceApp.id;
    const newAppId = newApp.id;

    // 2. フィールド定義をコピー
    const { data: sourceFields } = await from('app_fields')
      .select('*')
      .eq('app_id', sourceAppId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (sourceFields && sourceFields.length > 0) {
      const fieldIdMap = new Map<string, string>(); // 旧ID → 新ID

      for (const field of sourceFields) {
        const { id: _oldId, app_id: _appId, created_at: _ca, updated_at: _ua, ...fieldData } = field;
        const { data: newField } = await from('app_fields')
          .insert({
            ...fieldData,
            app_id: newAppId,
          } as never)
          .select('id')
          .single();
        if (newField) {
          fieldIdMap.set(_oldId, newField.id);
        }
      }
    }

    // 3. ビュー定義をコピー
    const { data: sourceViews } = await from('app_views')
      .select('*')
      .eq('app_id', sourceAppId)
      .eq('is_active', true);

    if (sourceViews && sourceViews.length > 0) {
      for (const view of sourceViews) {
        const { id: _id, app_id: _appId, created_at: _ca, updated_at: _ua, ...viewData } = view;
        await from('app_views').insert({
          ...viewData,
          app_id: newAppId,
        } as never);
      }
    }

    // 4. プロセス定義をコピー
    const { data: sourceProcessDef } = await from('process_definitions')
      .select('*')
      .eq('app_id', sourceAppId)
      .single();

    if (sourceProcessDef) {
      const { data: newProcessDef } = await from('process_definitions')
        .insert({
          app_id: newAppId,
          enabled: sourceProcessDef.enabled,
        } as never)
        .select('id')
        .single();

      if (newProcessDef) {
        // ステータスをコピー
        const { data: sourceStatuses } = await from('process_statuses')
          .select('*')
          .eq('definition_id', sourceProcessDef.id)
          .order('display_order', { ascending: true });

        const statusIdMap = new Map<string, string>();
        if (sourceStatuses) {
          for (const status of sourceStatuses) {
            const { id: oldId, definition_id: _defId, created_at: _ca, ...statusData } = status;
            const { data: newStatus } = await from('process_statuses')
              .insert({
                ...statusData,
                definition_id: newProcessDef.id,
              } as never)
              .select('id')
              .single();
            if (newStatus) {
              statusIdMap.set(oldId, newStatus.id);
            }
          }
        }

        // アクションをコピー（ステータスIDをマッピング）
        const { data: sourceActions } = await from('process_actions')
          .select('*')
          .eq('definition_id', sourceProcessDef.id);

        if (sourceActions) {
          for (const action of sourceActions) {
            const { id: _id, definition_id: _defId, created_at: _ca, ...actionData } = action;
            const newFromId = statusIdMap.get(action.from_status_id);
            const newToId = statusIdMap.get(action.to_status_id);
            if (newFromId && newToId) {
              await from('process_actions').insert({
                ...actionData,
                definition_id: newProcessDef.id,
                from_status_id: newFromId,
                to_status_id: newToId,
              } as never);
            }
          }
        }
      }
    }

    // 5. 通知ルールをコピー
    const { data: sourceNotifications } = await from('app_notification_rules')
      .select('*')
      .eq('app_id', sourceAppId)
      .eq('is_active', true);

    if (sourceNotifications && sourceNotifications.length > 0) {
      for (const notification of sourceNotifications) {
        const { id: _id, app_id: _appId, created_at: _ca, updated_at: _ua, ...notifData } = notification;
        await from('app_notification_rules').insert({
          ...notifData,
          app_id: newAppId,
        } as never);
      }
    }

    // 6. 権限をコピー
    const { data: sourcePermissions } = await from('app_permissions')
      .select('*')
      .eq('app_id', sourceAppId)
      .eq('is_active', true);

    if (sourcePermissions && sourcePermissions.length > 0) {
      for (const perm of sourcePermissions) {
        const { id: _id, app_id: _appId, created_at: _ca, updated_at: _ua, ...permData } = perm;
        await from('app_permissions').insert({
          ...permData,
          app_id: newAppId,
        } as never);
      }
    }

    // 7. メニュー設定に追加
    const { data: maxMenuOrder } = await from('menu_configurations')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();
    const nextMenuOrder = (maxMenuOrder?.display_order || 0) + 10;

    await from('menu_configurations').insert({
      menu_key: newCode,
      display_order: nextMenuOrder,
      is_visible: true,
    } as never);

    return NextResponse.json({ app: newApp }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/apps/[appCode]/copy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
