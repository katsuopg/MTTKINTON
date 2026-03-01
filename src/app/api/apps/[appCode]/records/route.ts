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
 * GET /api/apps/[appCode]/records?page=1&pageSize=20&search=xxx&sortField=xxx&sortOrder=asc
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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
    const search = searchParams.get('search') || '';
    const sortField = searchParams.get('sortField') || 'record_number';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? true : false;

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

    // 件数取得
    let countQuery = recordsTable
      .select('id', { count: 'exact', head: true })
      .eq('app_id', app.id);

    if (search) {
      // JSONB内のテキスト検索（data全体をテキスト変換して検索）
      countQuery = countQuery.ilike('data::text', `%${search}%`);
    }

    const { count } = await countQuery;
    const total = count || 0;

    // データ取得
    const offset = (page - 1) * pageSize;
    let dataQuery = recordsTable
      .select('*')
      .eq('app_id', app.id);

    if (search) {
      dataQuery = dataQuery.ilike('data::text', `%${search}%`);
    }

    // ソート
    if (sortField === 'record_number' || sortField === 'created_at' || sortField === 'updated_at') {
      dataQuery = dataQuery.order(sortField, { ascending: sortOrder });
    } else {
      // JSONBフィールドによるソートはcreated_atで代替
      dataQuery = dataQuery.order('created_at', { ascending: false });
    }

    dataQuery = dataQuery.range(offset, offset + pageSize - 1);

    const { data: records, error } = await dataQuery;

    if (error) {
      console.error('Error fetching records:', error);
      return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }

    // レコード権限フィルタリング
    let filteredRecords = records || [];
    const rules = await getRecordPermissionRules(app.id);
    if (rules.length > 0 && filteredRecords.length > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { roleIds, orgIds } = await getUserContext(user.id);
        filteredRecords = filteredRecords.filter((record: Record<string, unknown>) => {
          const perm = evaluateRecordPermissions(record, rules, user.id, roleIds, orgIds);
          return !perm || perm.can_view; // ルールにマッチしない場合はデフォルト表示
        });
      }
    }

    return NextResponse.json({
      records: filteredRecords,
      total: rules.length > 0 ? filteredRecords.length : total,
      page,
      pageSize,
      totalPages: Math.ceil((rules.length > 0 ? filteredRecords.length : total) / pageSize),
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
