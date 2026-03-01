import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';

/**
 * 削除済みアプリを復旧
 * POST /api/apps/[appCode]/restore
 */
export async function POST(
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
      .select('id, app_type, is_active, deleted_at')
      .eq('code', appCode)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    if (app.is_active) {
      return NextResponse.json({ error: 'App is not deleted' }, { status: 400 });
    }

    // 復旧（is_active=true、deleted_at/deleted_byをクリア）
    const { data: restored, error } = await appsTable
      .update({
        is_active: true,
        deleted_at: null,
        deleted_by: null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', app.id)
      .select()
      .single();

    if (error) {
      console.error('Error restoring app:', error);
      return NextResponse.json({ error: 'Failed to restore app' }, { status: 500 });
    }

    return NextResponse.json({ app: restored });
  } catch (error) {
    console.error('Error in POST /api/apps/[appCode]/restore:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
