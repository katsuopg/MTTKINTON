import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';
import type { FieldDefinition } from '@/types/dynamic-app';
import { NON_INPUT_FIELD_TYPES } from '@/types/dynamic-app';

/**
 * レコードをCSVエクスポート
 * GET /api/apps/[appCode]/records/export
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ appCode: string }> }
) {
  try {
    const { appCode } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_export');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    const { data: app } = await appsTable
      .select('id, name')
      .eq('code', appCode)
      .eq('is_active', true)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // フィールド定義取得（入力フィールドのみ）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldsTable = supabase.from('app_fields') as any;
    const { data: fields } = await fieldsTable
      .select('*')
      .eq('app_id', app.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    const exportFields = ((fields || []) as FieldDefinition[]).filter(
      (f) => !NON_INPUT_FIELD_TYPES.has(f.field_type)
    );

    // 全レコード取得（CSVなのでページング不要、最大10000件）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recordsTable = supabase.from('app_records') as any;
    const { data: records, error } = await recordsTable
      .select('*')
      .eq('app_id', app.id)
      .order('record_number', { ascending: true })
      .limit(10000);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }

    // CSV生成
    const headers = ['record_number', ...exportFields.map((f) => f.field_code), 'created_at', 'updated_at'];
    const headerLabels = [
      'レコード番号',
      ...exportFields.map((f) => f.label.ja || f.field_code),
      '作成日時',
      '更新日時',
    ];

    const csvRows = [headerLabels.join(',')];

    for (const record of (records || [])) {
      const row = [
        String(record.record_number),
        ...exportFields.map((f) => {
          const val = record.data?.[f.field_code];
          if (val === null || val === undefined) return '';
          if (Array.isArray(val)) return `"${(val as string[]).join(', ')}"`;
          const str = String(val);
          // CSVエスケープ: カンマ、改行、ダブルクォートを含む場合
          if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }),
        record.created_at || '',
        record.updated_at || '',
      ];
      csvRows.push(row.join(','));
    }

    const csv = '\uFEFF' + csvRows.join('\n'); // BOM付きUTF-8
    const fileName = `${app.name}_${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/apps/[appCode]/records/export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
