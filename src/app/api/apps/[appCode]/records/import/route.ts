import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';
import type { FieldDefinition } from '@/types/dynamic-app';
import { NON_INPUT_FIELD_TYPES } from '@/types/dynamic-app';

/**
 * CSVファイルをアップロードしてレコードを一括インポート
 * POST /api/apps/[appCode]/records/import
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ appCode: string }> }
) {
  try {
    const { appCode } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_import');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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

    // フィールド定義取得
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: fields } = await (supabase.from('app_fields') as any)
      .select('*')
      .eq('app_id', app.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    const inputFields = (fields || []).filter(
      (f: FieldDefinition) => !NON_INPUT_FIELD_TYPES.has(f.field_type)
    ) as FieldDefinition[];

    // CSVファイル取得
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const updateMode = formData.get('update_mode') === 'true'; // trueなら既存レコード更新

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length < 2) {
      return NextResponse.json({ error: 'CSV must have at least a header row and one data row' }, { status: 400 });
    }

    const headers = rows[0];
    const dataRows = rows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));

    // ヘッダーのfield_codeマッピング
    // ヘッダーはfield_codeまたはフィールドラベル(ja)で照合
    const fieldMap: Map<number, FieldDefinition> = new Map();
    const recordNumberColIndex = headers.findIndex(
      h => h === 'record_number' || h === 'レコード番号' || h === 'No.'
    );

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].trim();
      if (!header) continue;

      const field = inputFields.find(f =>
        f.field_code === header ||
        f.label.ja === header ||
        f.label.en === header ||
        f.label.th === header
      );

      if (field) {
        fieldMap.set(i, field);
      }
    }

    if (fieldMap.size === 0) {
      return NextResponse.json({
        error: 'No matching fields found in CSV headers',
        details: { headers, available_fields: inputFields.map(f => f.field_code) },
      }, { status: 400 });
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors: { row: number; error: string }[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recordsTable = supabase.from('app_records') as any;

    for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
      const row = dataRows[rowIdx];
      try {
        const data: Record<string, unknown> = {};

        for (const [colIdx, field] of fieldMap) {
          const rawValue = row[colIdx]?.trim() ?? '';
          data[field.field_code] = convertValue(rawValue, field);
        }

        // 更新モード: record_numberが存在するレコードを更新
        if (updateMode && recordNumberColIndex >= 0) {
          const recordNumber = parseInt(row[recordNumberColIndex]?.trim() || '');
          if (!isNaN(recordNumber)) {
            const { data: existing } = await recordsTable
              .select('id, data')
              .eq('app_id', app.id)
              .eq('record_number', recordNumber)
              .single();

            if (existing) {
              const mergedData = { ...(existing.data as Record<string, unknown>), ...data };
              await recordsTable
                .update({
                  data: mergedData,
                  updated_by: user?.id || null,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id);
              updatedCount++;
              continue;
            }
          }
        }

        // 新規作成
        const { error: insertErr } = await recordsTable
          .insert({
            app_id: app.id,
            data,
            created_by: user?.id || null,
            updated_by: user?.id || null,
          });

        if (insertErr) {
          throw new Error(insertErr.message);
        }
        insertedCount++;
      } catch (err) {
        errorCount++;
        errors.push({ row: rowIdx + 2, error: String(err) });
        if (errors.length >= 50) break; // エラーが多すぎる場合は中断
      }
    }

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      updated: updatedCount,
      errors: errorCount,
      error_details: errors.slice(0, 20),
      total_rows: dataRows.length,
    });
  } catch (error) {
    console.error('Error in POST /api/apps/[appCode]/records/import:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * CSVパーサー（ダブルクォート対応）
 */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current);
        current = '';
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        row.push(current);
        current = '';
        rows.push(row);
        row = [];
        if (ch === '\r') i++;
      } else if (ch === '\r') {
        row.push(current);
        current = '';
        rows.push(row);
        row = [];
      } else {
        current += ch;
      }
    }
  }

  // 最終行
  if (current || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows;
}

/**
 * フィールドタイプに基づいて値を変換
 */
function convertValue(raw: string, field: FieldDefinition): unknown {
  if (raw === '') return null;

  switch (field.field_type) {
    case 'number':
      return isNaN(Number(raw)) ? raw : Number(raw);
    case 'checkbox':
    case 'multi_select':
      // カンマ区切りまたはJSON配列
      if (raw.startsWith('[')) {
        try { return JSON.parse(raw); } catch { /* fall through */ }
      }
      return raw.split(/[,;、]/).map(s => s.trim()).filter(Boolean);
    case 'date':
    case 'datetime':
    case 'time':
      return raw;
    default:
      return raw;
  }
}
