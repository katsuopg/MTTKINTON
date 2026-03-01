import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

/**
 * フィールド設定を更新
 * PATCH /api/apps/[appCode]/fields/[fieldId]
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ appCode: string; fieldId: string }> }
) {
  try {
    const { appCode, fieldId } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_manage');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const body = await request.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldsTable = supabase.from('app_fields') as any;

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const allowedFields = [
      'field_code', 'field_type', 'label', 'description',
      'required', 'unique_field', 'default_value', 'options',
      'validation', 'display_order', 'row_index', 'col_index', 'col_span',
    ];

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    const { data: field, error } = await fieldsTable
      .update(updateData as never)
      .eq('id', fieldId)
      .select()
      .single();

    if (error) {
      console.error('Error updating field:', error);
      return NextResponse.json({ error: 'Failed to update field' }, { status: 500 });
    }

    return NextResponse.json({ field });
  } catch (error) {
    console.error('Error in PATCH /api/apps/[appCode]/fields/[fieldId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * フィールドを削除（論理削除）
 * DELETE /api/apps/[appCode]/fields/[fieldId]
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ appCode: string; fieldId: string }> }
) {
  try {
    const { appCode, fieldId } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_manage');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldsTable = supabase.from('app_fields') as any;

    const { error } = await fieldsTable
      .update({ is_active: false, updated_at: new Date().toISOString() } as never)
      .eq('id', fieldId);

    if (error) {
      console.error('Error deleting field:', error);
      return NextResponse.json({ error: 'Failed to delete field' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/apps/[appCode]/fields/[fieldId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
