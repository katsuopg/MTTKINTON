import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

/**
 * アプリの高度な設定を取得
 * GET /api/apps/[appCode]/settings
 */
export async function GET(
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

    const { data: app, error } = await supabase
      .from('apps')
      .select('code, name, enable_bulk_delete, enable_history, enable_comments')
      .eq('code', appCode)
      .eq('is_active', true)
      .single();

    if (error || !app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    return NextResponse.json({ settings: app });
  } catch (error) {
    console.error('Error in GET /api/apps/[appCode]/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * アプリの高度な設定を更新
 * PUT /api/apps/[appCode]/settings
 * body: { enable_bulk_delete?, enable_history?, enable_comments? }
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

    const allowedFields = ['enable_bulk_delete', 'enable_history', 'enable_comments'];
    const updateData: Record<string, boolean> = {};
    for (const field of allowedFields) {
      if (typeof body[field] === 'boolean') {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: app, error } = await supabase
      .from('apps')
      .update(updateData)
      .eq('code', appCode)
      .eq('is_active', true)
      .select('code, name, enable_bulk_delete, enable_history, enable_comments')
      .single();

    if (error || !app) {
      console.error('Error updating app settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ settings: app });
  } catch (error) {
    console.error('Error in PUT /api/apps/[appCode]/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
