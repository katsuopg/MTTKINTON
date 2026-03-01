import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

/**
 * アプリ詳細 + フィールド定義を取得
 * GET /api/apps/[appCode]
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
    const { data: app, error } = await appsTable
      .select('*')
      .eq('code', appCode)
      .eq('is_active', true)
      .single();

    if (error || !app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // フィールド定義を取得
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldsTable = supabase.from('app_fields') as any;
    const { data: fields } = await fieldsTable
      .select('*')
      .eq('app_id', app.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    return NextResponse.json({ app: { ...app, fields: fields || [] } });
  } catch (error) {
    console.error('Error in GET /api/apps/[appCode]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * アプリ情報を更新（動的アプリのみ）
 * PATCH /api/apps/[appCode]
 */
export async function PATCH(
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    const { data: app } = await appsTable
      .select('id, app_type')
      .eq('code', appCode)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // 静的アプリはname系のみ変更可
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.name_en !== undefined) updateData.name_en = body.name_en;
    if (body.name_th !== undefined) updateData.name_th = body.name_th;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.color !== undefined) updateData.color = body.color;

    const { data: updated, error } = await appsTable
      .update(updateData as never)
      .eq('id', app.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating app:', error);
      return NextResponse.json({ error: 'Failed to update app' }, { status: 500 });
    }

    return NextResponse.json({ app: updated });
  } catch (error) {
    console.error('Error in PATCH /api/apps/[appCode]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * アプリを削除（動的アプリのみ、論理削除）
 * DELETE /api/apps/[appCode]
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ appCode: string }> }
) {
  try {
    const { appCode } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_manage');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    const { data: app } = await appsTable
      .select('id, app_type')
      .eq('code', appCode)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    if (app.app_type !== 'dynamic') {
      return NextResponse.json({ error: 'Cannot delete static apps' }, { status: 400 });
    }

    // ユーザーIDを取得
    const { data: { user } } = await supabase.auth.getUser();

    // 論理削除（deleted_at + deleted_byも設定）
    const now = new Date().toISOString();
    const { error } = await appsTable
      .update({
        is_active: false,
        deleted_at: now,
        deleted_by: user?.id || null,
        updated_at: now,
      } as never)
      .eq('id', app.id);

    if (error) {
      console.error('Error deleting app:', error);
      return NextResponse.json({ error: 'Failed to delete app' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/apps/[appCode]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
