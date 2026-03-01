import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';

/**
 * テンプレートからアプリを作成
 * POST /api/apps/templates/[templateId]/create
 * body: { code, name, name_en?, name_th?, description?, icon?, color? }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const permCheck = await requirePermission('manage_settings');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const body = await request.json();
    const { code, name, name_en, name_th, description, icon, color } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'code and name are required' }, { status: 400 });
    }

    if (!/^[a-z][a-z0-9_]*$/.test(code)) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const from = (table: string) => (supabase as any).from(table);

    // テンプレート取得
    const { data: template } = await from('app_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // 重複チェック
    const { data: existing } = await from('apps').select('id').eq('code', code).single();
    if (existing) {
      return NextResponse.json({ error: 'App code already exists' }, { status: 409 });
    }

    const templateData = template.template_data as {
      fields?: Record<string, unknown>[];
      views?: Record<string, unknown>[];
      process?: {
        enabled: boolean;
        statuses: Record<string, unknown>[];
        actions: Record<string, unknown>[];
      };
      notifications?: Record<string, unknown>[];
      permissions?: Record<string, unknown>[];
    };

    // 最大display_orderを取得
    const { data: maxOrderResult } = await from('apps')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();
    const nextOrder = (maxOrderResult?.display_order || 0) + 10;

    // 1. アプリ作成
    const { data: newApp, error: appError } = await from('apps')
      .insert({
        code,
        name,
        name_en: name_en || null,
        name_th: name_th || null,
        description: description || template.description,
        table_name: 'app_records',
        icon: icon || template.icon,
        color: color || template.color,
        display_order: nextOrder,
        app_type: 'dynamic',
      } as never)
      .select()
      .single();

    if (appError || !newApp) {
      console.error('Error creating app from template:', appError);
      return NextResponse.json({ error: 'Failed to create app' }, { status: 500 });
    }

    const appId = newApp.id;

    // 2. フィールド定義を復元
    if (templateData.fields && templateData.fields.length > 0) {
      for (const field of templateData.fields) {
        await from('app_fields').insert({
          ...field,
          app_id: appId,
        } as never);
      }
    }

    // 3. ビュー定義を復元
    if (templateData.views && templateData.views.length > 0) {
      for (const view of templateData.views) {
        await from('app_views').insert({
          ...view,
          app_id: appId,
        } as never);
      }
    }

    // 4. プロセス定義を復元
    if (templateData.process) {
      const { data: newProcessDef } = await from('process_definitions')
        .insert({
          app_id: appId,
          enabled: templateData.process.enabled,
        } as never)
        .select('id')
        .single();

      if (newProcessDef && templateData.process.statuses) {
        const statusIndexToId = new Map<number, string>();

        for (let i = 0; i < templateData.process.statuses.length; i++) {
          const status = templateData.process.statuses[i];
          const { data: newStatus } = await from('process_statuses')
            .insert({
              ...status,
              definition_id: newProcessDef.id,
            } as never)
            .select('id')
            .single();
          if (newStatus) {
            statusIndexToId.set(i, newStatus.id);
          }
        }

        // アクションを復元（インデックスからIDに変換）
        if (templateData.process.actions) {
          for (const action of templateData.process.actions) {
            const fromId = statusIndexToId.get(action.from_status_index as number);
            const toId = statusIndexToId.get(action.to_status_index as number);
            if (fromId && toId) {
              const { from_status_index: _fi, to_status_index: _ti, ...actionData } = action;
              await from('process_actions').insert({
                ...actionData,
                definition_id: newProcessDef.id,
                from_status_id: fromId,
                to_status_id: toId,
              } as never);
            }
          }
        }
      }
    }

    // 5. 通知ルールを復元
    if (templateData.notifications && templateData.notifications.length > 0) {
      for (const notification of templateData.notifications) {
        await from('app_notification_rules').insert({
          ...notification,
          app_id: appId,
        } as never);
      }
    }

    // 6. 権限を復元（テンプレートの権限があればそれを使用、なければデフォルト）
    if (templateData.permissions && templateData.permissions.length > 0) {
      for (const perm of templateData.permissions) {
        await from('app_permissions').insert({
          ...perm,
          app_id: appId,
          is_active: true,
        } as never);
      }
    } else {
      // デフォルト権限
      await from('app_permissions').insert({
        app_id: appId,
        target_type: 'everyone',
        target_id: null,
        can_view: true,
        can_add: true,
        can_edit: true,
        can_delete: false,
        can_manage: false,
        can_export: false,
        can_import: false,
        priority: 0,
        is_active: true,
      } as never);
    }

    // 7. メニュー設定に追加
    const { data: maxMenuOrder } = await from('menu_configurations')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();
    const nextMenuOrder = (maxMenuOrder?.display_order || 0) + 10;

    await from('menu_configurations').insert({
      menu_key: code,
      display_order: nextMenuOrder,
      is_visible: true,
    } as never);

    return NextResponse.json({ app: newApp }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/apps/templates/[templateId]/create:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
