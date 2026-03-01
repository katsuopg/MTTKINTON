import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

/**
 * ルックアップ検索API
 * GET /api/apps/[appCode]/lookup?targetApp=xxx&keyField=yyy&query=zzz&recordId=xxx
 *
 * targetApp: 参照先アプリコード
 * keyField: 検索キーフィールド（参照先）
 * query: 検索文字列
 * recordId: 特定レコードの取得（ルックアップ解決用）
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ appCode: string }> }
) {
  try {
    const { appCode } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const targetAppCode = searchParams.get('targetApp');
    const keyField = searchParams.get('keyField');
    const query = searchParams.get('query') || '';
    const recordId = searchParams.get('recordId');

    if (!targetAppCode || !keyField) {
      return NextResponse.json({ error: 'targetApp and keyField are required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 参照先アプリ存在確認
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    const { data: targetApp } = await appsTable
      .select('id')
      .eq('code', targetAppCode)
      .eq('is_active', true)
      .single();

    if (!targetApp) {
      return NextResponse.json({ error: 'Target app not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recordsTable = supabase.from('app_records') as any;

    // 特定レコードの取得（ルックアップ値解決）
    if (recordId) {
      const { data: record } = await recordsTable
        .select('id, record_number, data')
        .eq('app_id', targetApp.id)
        .eq('id', recordId)
        .single();

      return NextResponse.json({ record: record || null });
    }

    // 検索クエリ
    let dataQuery = recordsTable
      .select('id, record_number, data')
      .eq('app_id', targetApp.id);

    if (query) {
      // JSONB内のキーフィールド値でテキスト検索
      dataQuery = dataQuery.ilike('data::text', `%${query}%`);
    }

    dataQuery = dataQuery.order('record_number', { ascending: false }).limit(20);

    const { data: records, error } = await dataQuery;

    if (error) {
      console.error('Lookup search error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    // キーフィールドの値でフィルタリング（JSOBNのilike検索は広範囲すぎるので）
    const filtered = query
      ? (records || []).filter((r: { data: Record<string, unknown> }) => {
          const val = String(r.data?.[keyField] ?? '');
          return val.toLowerCase().includes(query.toLowerCase());
        })
      : (records || []);

    // レスポンスを軽量化：キーフィールド値 + レコード番号 + idのみ返す
    const results = filtered.map((r: { id: string; record_number: number; data: Record<string, unknown> }) => ({
      id: r.id,
      record_number: r.record_number,
      key_value: String(r.data?.[keyField] ?? ''),
      data: r.data,
    }));

    return NextResponse.json({ records: results });
  } catch (error) {
    console.error('Error in GET /api/apps/[appCode]/lookup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
