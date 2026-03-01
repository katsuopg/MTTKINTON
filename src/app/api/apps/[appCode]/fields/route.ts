import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';
import type { FieldInput } from '@/types/dynamic-app';

/**
 * フィールド一覧を取得
 * GET /api/apps/[appCode]/fields
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ appCode: string }> }
) {
  try {
    const { appCode } = await params;
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
    const fieldsTable = supabase.from('app_fields') as any;
    const { data: fields, error } = await fieldsTable
      .select('*')
      .eq('app_id', app.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching fields:', error);
      return NextResponse.json({ error: 'Failed to fetch fields' }, { status: 500 });
    }

    return NextResponse.json({ fields: fields || [] });
  } catch (error) {
    console.error('Error in GET /api/apps/[appCode]/fields:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * フィールドを追加
 * POST /api/apps/[appCode]/fields
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ appCode: string }> }
) {
  try {
    const { appCode } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_manage');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const body: FieldInput = await request.json();

    if (!body.field_code || !body.field_type || !body.label) {
      return NextResponse.json({ error: 'field_code, field_type, label are required' }, { status: 400 });
    }

    // field_codeフォーマットチェック
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(body.field_code)) {
      return NextResponse.json({ error: 'field_code must start with a letter and contain only letters, numbers, and underscores' }, { status: 400 });
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldsTable = supabase.from('app_fields') as any;

    // display_orderの最大値を取得
    const { data: maxOrderResult } = await fieldsTable
      .select('display_order')
      .eq('app_id', app.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();
    const nextOrder = (maxOrderResult?.display_order || 0) + 1;

    const { data: field, error } = await fieldsTable
      .insert({
        app_id: app.id,
        field_code: body.field_code,
        field_type: body.field_type,
        label: body.label,
        description: body.description || {},
        required: body.required || false,
        unique_field: body.unique_field || false,
        default_value: body.default_value ?? null,
        options: body.options ?? null,
        validation: body.validation ?? null,
        display_order: body.display_order ?? nextOrder,
        row_index: body.row_index ?? nextOrder,
        col_index: body.col_index ?? 0,
        col_span: body.col_span ?? 2,
      } as never)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Field code already exists in this app' }, { status: 409 });
      }
      console.error('Error creating field:', error);
      return NextResponse.json({ error: 'Failed to create field' }, { status: 500 });
    }

    return NextResponse.json({ field }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/apps/[appCode]/fields:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * フィールドを一括更新（並び替え・設定変更）
 * PUT /api/apps/[appCode]/fields
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ appCode: string }> }
) {
  try {
    const { appCode } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_manage');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const body = await request.json();
    const { fields } = body as { fields: Array<FieldInput & { id?: string }> };

    if (!fields || !Array.isArray(fields)) {
      return NextResponse.json({ error: 'fields array is required' }, { status: 400 });
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldsTable = supabase.from('app_fields') as any;

    // 既存フィールドを取得
    const { data: existingFields } = await fieldsTable
      .select('id')
      .eq('app_id', app.id)
      .eq('is_active', true);
    const existingIds = new Set((existingFields || []).map((f: { id: string }) => f.id));

    // リクエスト内のIDを収集
    const requestIds = new Set<string>(fields.filter((f: { id?: string }) => f.id).map((f: { id?: string }) => f.id as string));

    // リクエストにないフィールドは論理削除
    for (const existingId of existingIds) {
      if (!requestIds.has(existingId as string)) {
        await fieldsTable
          .update({ is_active: false, updated_at: new Date().toISOString() } as never)
          .eq('id', existingId);
      }
    }

    const updatedFields = [];

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const fieldData = {
        app_id: app.id,
        field_code: field.field_code,
        field_type: field.field_type,
        label: field.label,
        description: field.description || {},
        required: field.required || false,
        unique_field: field.unique_field || false,
        default_value: field.default_value ?? null,
        options: field.options ?? null,
        validation: field.validation ?? null,
        display_order: field.display_order ?? i,
        row_index: field.row_index ?? i,
        col_index: field.col_index ?? 0,
        col_span: field.col_span ?? 2,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      if (field.id && existingIds.has(field.id)) {
        // 既存フィールドの更新
        const { data: updated } = await fieldsTable
          .update(fieldData as never)
          .eq('id', field.id)
          .select()
          .single();
        if (updated) updatedFields.push(updated);
      } else {
        // 新規フィールドの追加
        const { data: created } = await fieldsTable
          .insert(fieldData as never)
          .select()
          .single();
        if (created) updatedFields.push(created);
      }
    }

    return NextResponse.json({ fields: updatedFields });
  } catch (error) {
    console.error('Error in PUT /api/apps/[appCode]/fields:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
