import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

/**
 * Webhook更新
 * PATCH /api/apps/[appCode]/webhooks/[webhookId]
 * body: { name?, url?, trigger_type?, headers?, is_active? }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ appCode: string; webhookId: string }> }
) {
  try {
    const { appCode, webhookId } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_manage');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const body = await request.json();

    // URL検証
    if (body.url) {
      try {
        new URL(body.url);
      } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }
    }

    // trigger_type検証
    if (body.trigger_type) {
      const validTriggers = ['record_added', 'record_edited', 'record_deleted', 'comment_added', 'status_changed'];
      if (!validTriggers.includes(body.trigger_type)) {
        return NextResponse.json({ error: 'Invalid trigger_type' }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const allowedFields = ['name', 'url', 'trigger_type', 'headers', 'is_active'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: webhook, error } = await (supabase as any).from('app_webhooks')
      .update(updateData)
      .eq('id', webhookId)
      .select()
      .single();

    if (error || !webhook) {
      console.error('Error updating webhook:', error);
      return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 });
    }

    return NextResponse.json({ webhook });
  } catch (error) {
    console.error('Error in PATCH /api/apps/[appCode]/webhooks/[webhookId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Webhook削除
 * DELETE /api/apps/[appCode]/webhooks/[webhookId]
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ appCode: string; webhookId: string }> }
) {
  try {
    const { appCode, webhookId } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_manage');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('app_webhooks')
      .delete()
      .eq('id', webhookId);

    if (error) {
      console.error('Error deleting webhook:', error);
      return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/apps/[appCode]/webhooks/[webhookId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
