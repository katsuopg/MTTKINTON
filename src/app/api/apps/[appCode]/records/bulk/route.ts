import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

/**
 * レコード一括削除
 * DELETE /api/apps/[appCode]/records/bulk
 * body: { ids: string[] }
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ appCode: string }> }
) {
  try {
    const { appCode } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_delete');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }

    if (ids.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 records at once' }, { status: 400 });
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    const { data: app } = await appsTable
      .select('id, enable_bulk_delete')
      .eq('code', appCode)
      .eq('is_active', true)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    if (!app.enable_bulk_delete) {
      return NextResponse.json({ error: 'Bulk delete is disabled for this app' }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recordsTable = supabase.from('app_records') as any;
    const { error, count } = await recordsTable
      .delete({ count: 'exact' })
      .eq('app_id', app.id)
      .in('id', ids);

    if (error) {
      console.error('Error bulk deleting records:', error);
      return NextResponse.json({ error: 'Failed to delete records' }, { status: 500 });
    }

    return NextResponse.json({ deleted: count || 0 });
  } catch (error) {
    console.error('Error in DELETE /api/apps/[appCode]/records/bulk:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
