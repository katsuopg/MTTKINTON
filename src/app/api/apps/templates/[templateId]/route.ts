import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';

/**
 * テンプレート詳細取得
 * GET /api/apps/templates/[templateId]
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const permCheck = await requirePermission('manage_settings');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: template, error } = await (supabase.from('app_templates') as any)
      .select('*')
      .eq('id', templateId)
      .single();

    if (error || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error in GET /api/apps/templates/[templateId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * テンプレート削除
 * DELETE /api/apps/templates/[templateId]
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const permCheck = await requirePermission('manage_settings');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const templatesTable = supabase.from('app_templates') as any;

    // システムテンプレートは削除不可
    const { data: template } = await templatesTable
      .select('id, is_system')
      .eq('id', templateId)
      .single();

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (template.is_system) {
      return NextResponse.json({ error: 'Cannot delete system templates' }, { status: 400 });
    }

    const { error } = await templatesTable.delete().eq('id', templateId);

    if (error) {
      console.error('Error deleting template:', error);
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/apps/templates/[templateId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
