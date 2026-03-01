import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';

/**
 * テンプレート一覧取得
 * GET /api/apps/templates
 */
export async function GET() {
  try {
    const permCheck = await requirePermission('manage_settings');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: templates, error } = await (supabase.from('app_templates') as any)
      .select('id, name, name_en, name_th, description, icon, color, is_system, created_at')
      .order('is_system', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error('Error in GET /api/apps/templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * 既存アプリからテンプレートを作成
 * POST /api/apps/templates
 * body: { appCode, name, name_en?, name_th?, description? }
 */
export async function POST(request: Request) {
  try {
    const permCheck = await requirePermission('manage_settings');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const body = await request.json();
    const { appCode, name, name_en, name_th, description } = body;

    if (!appCode || !name) {
      return NextResponse.json({ error: 'appCode and name are required' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const from = (table: string) => (supabase as any).from(table);

    // ソースアプリ取得
    const { data: app } = await from('apps')
      .select('*')
      .eq('code', appCode)
      .eq('is_active', true)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // フィールド定義を取得
    const { data: fields } = await from('app_fields')
      .select('field_code, field_type, label, description, required, unique_field, default_value, options, validation, display_order, row_index, col_index, col_span')
      .eq('app_id', app.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // ビュー定義を取得
    const { data: views } = await from('app_views')
      .select('name, view_type, config, display_order, is_default')
      .eq('app_id', app.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // プロセス定義を取得
    let processData = null;
    const { data: processDef } = await from('process_definitions')
      .select('enabled')
      .eq('app_id', app.id)
      .single();

    if (processDef) {
      const { data: statuses } = await from('process_statuses')
        .select('name, name_en, name_th, is_initial, is_final, assignee_type, display_order')
        .eq('definition_id', processDef.id || '')
        .order('display_order', { ascending: true });

      // アクションはステータスインデックスで参照（IDは新規生成されるため）
      const { data: actions } = await from('process_actions')
        .select('name, name_en, name_th, from_status_id, to_status_id, action_type, requirement_type, filter_condition')
        .eq('definition_id', processDef.id || '');

      // ステータスIDをインデックスに変換
      const statusIdToIndex = new Map<string, number>();
      if (statuses) {
        statuses.forEach((s: { id?: string }, i: number) => { if (s.id) statusIdToIndex.set(s.id, i); });
      }

      const mappedActions = (actions || []).map((a: Record<string, unknown>) => ({
        name: a.name,
        name_en: a.name_en,
        name_th: a.name_th,
        from_status_index: statusIdToIndex.get(a.from_status_id as string) ?? 0,
        to_status_index: statusIdToIndex.get(a.to_status_id as string) ?? 0,
        action_type: a.action_type,
        requirement_type: a.requirement_type,
        filter_condition: a.filter_condition,
      }));

      processData = {
        enabled: processDef.enabled,
        statuses: (statuses || []).map((s: Record<string, unknown>) => {
          const { id: _id, ...rest } = s;
          return rest;
        }),
        actions: mappedActions,
      };
    }

    // 通知ルールを取得
    const { data: notifications } = await from('app_notification_rules')
      .select('name, trigger_type, condition, notify_type, notify_target_type, notify_target_id, notify_target_field, title_template, message_template')
      .eq('app_id', app.id)
      .eq('is_active', true);

    // 権限を取得
    const { data: permissions } = await from('app_permissions')
      .select('target_type, target_id, can_view, can_add, can_edit, can_delete, can_manage, can_export, can_import, priority')
      .eq('app_id', app.id)
      .eq('is_active', true);

    // テンプレートデータを構築
    const templateData = {
      fields: fields || [],
      views: views || [],
      process: processData,
      notifications: notifications || [],
      permissions: permissions || [],
    };

    // ユーザーID取得
    const { data: { user } } = await supabase.auth.getUser();

    // テンプレートを保存
    const { data: template, error } = await from('app_templates')
      .insert({
        name,
        name_en: name_en || null,
        name_th: name_th || null,
        description: description || app.description,
        icon: app.icon,
        color: app.color,
        template_data: templateData,
        is_system: false,
        created_by: user?.id || null,
      } as never)
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/apps/templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
