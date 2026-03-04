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
 * レコード一覧を取得
 * GET /api/apps/[appCode]/records?page=1&pageSize=20&search=xxx&sortField=xxx&sortOrder=asc&viewId=xxx&filters=[...]&filterMatchType=and
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ appCode: string }> }
) {
  try {
    const { appCode } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const viewId = searchParams.get('viewId') || '';

    // デフォルト値
    let sortField = searchParams.get('sortField') || 'record_number';
    let sortOrder = searchParams.get('sortOrder') || 'desc';
    let page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    let pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
    let filterConditions: { field_code: string; operator: string; value?: unknown }[] = [];
    let filterMatchType = searchParams.get('filterMatchType') || 'and';

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

    // ビュー設定からデフォルト値を読み込み
    if (viewId && viewId !== 'default-table') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: viewData } = await (supabase.from('app_views') as any)
        .select('config')
        .eq('id', viewId)
        .single();

      if (viewData?.config) {
        const cfg = viewData.config as Record<string, unknown>;
        if (cfg.sort_field && !searchParams.has('sortField')) sortField = cfg.sort_field as string;
        if (cfg.sort_order && !searchParams.has('sortOrder')) sortOrder = cfg.sort_order as string;
        if (cfg.page_size && !searchParams.has('pageSize')) pageSize = Math.min(100, Math.max(1, cfg.page_size as number));
        if (Array.isArray(cfg.filter_conditions) && cfg.filter_conditions.length > 0) {
          filterConditions = cfg.filter_conditions as typeof filterConditions;
        }
        if (cfg.filter_match_type && !searchParams.has('filterMatchType')) {
          filterMatchType = cfg.filter_match_type as string;
        }
      }
    }

    // アドホックフィルター（URLパラメータ）はビュー設定に追加
    const filtersParam = searchParams.get('filters');
    if (filtersParam) {
      try {
        const adHocFilters = JSON.parse(filtersParam);
        if (Array.isArray(adHocFilters)) {
          filterConditions = [...filterConditions, ...adHocFilters];
        }
      } catch {
        // ignore invalid JSON
      }
    }

    // RPC関数でフィルタリング+ソート+ページネーション
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: records, error } = await (supabase.rpc as any)('filter_app_records', {
      p_app_id: app.id,
      p_search: search,
      p_filter_conditions: JSON.stringify(filterConditions),
      p_filter_match_type: filterMatchType,
      p_sort_field: sortField,
      p_sort_order: sortOrder,
      p_page: page,
      p_page_size: pageSize,
    });

    if (error) {
      console.error('Error fetching records:', error);
      return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }

    const rows = (records || []) as (Record<string, unknown> & { total_count: number })[];
    const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

    // total_countフィールドをレコードから除去
    const cleanRecords = rows.map(({ total_count: _tc, ...rest }) => rest);

    // レコード権限フィルタリング
    let filteredRecords = cleanRecords;
    const rules = await getRecordPermissionRules(app.id);
    if (rules.length > 0 && filteredRecords.length > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { roleIds, orgIds } = await getUserContext(user.id);
        filteredRecords = filteredRecords.filter((record: Record<string, unknown>) => {
          const perm = evaluateRecordPermissions(record, rules, user.id, roleIds, orgIds);
          return !perm || perm.can_view;
        });
      }
    }

    const effectiveTotal = rules.length > 0 ? filteredRecords.length : total;

    return NextResponse.json({
      records: filteredRecords,
      total: effectiveTotal,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(effectiveTotal / pageSize)),
    });
  } catch (error) {
    console.error('Error in GET /api/apps/[appCode]/records:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * レコードを追加
 * POST /api/apps/[appCode]/records
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ appCode: string }> }
) {
  try {
    const { appCode } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_add');
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
      .select('id')
      .eq('code', appCode)
      .eq('is_active', true)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // フィールド定義を取得してバリデーション
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldsTable = supabase.from('app_fields') as any;
    const { data: fields } = await fieldsTable
      .select('*')
      .eq('app_id', app.id)
      .eq('is_active', true);

    if (fields && fields.length > 0) {
      const validation = validateRecordData(fields as FieldDefinition[], data);
      if (!validation.valid) {
        return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recordsTable = supabase.from('app_records') as any;
    const { data: record, error } = await recordsTable
      .insert({
        app_id: app.id,
        data,
        created_by: user?.id || null,
        updated_by: user?.id || null,
      } as never)
      .select()
      .single();

    if (error) {
      console.error('Error creating record:', error);
      return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
    }

    // プロセス管理が有効な場合、初期ステータスを設定
    try {
      const { data: processDef } = await (supabase.from('process_definitions') as any)
        .select('id, enabled')
        .eq('app_id', app.id)
        .single();

      if (processDef?.enabled) {
        const { data: initialStatus } = await (supabase.from('process_statuses') as any)
          .select('id, name')
          .eq('process_definition_id', processDef.id)
          .eq('is_initial', true)
          .single();

        if (initialStatus) {
          // record_process_states に初期状態を作成
          await (supabase.from('record_process_states') as any)
            .insert({
              record_id: record.id,
              record_table: 'app_records',
              current_status_id: initialStatus.id,
            });

          // app_records.status を初期ステータス名で設定
          await recordsTable
            .update({ status: initialStatus.name })
            .eq('id', record.id);
        }
      }
    } catch (processErr) {
      // プロセス初期化に失敗してもレコード作成は成功させる
      console.error('Failed to initialize process state:', processErr);
    }

    // 条件通知を発火
    fireNotifications({
      appId: app.id,
      appCode,
      appName: appCode,
      trigger: 'record_added',
      record,
      actorUserId: user?.id || '',
    }).catch(() => {});

    fireWebhooks({
      appId: app.id,
      appCode,
      trigger: 'record_added',
      record,
      actorUserId: user?.id || '',
    }).catch(() => {});

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/apps/[appCode]/records:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
