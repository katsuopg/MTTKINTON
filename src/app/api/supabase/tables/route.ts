import { NextResponse } from 'next/server';
import { getSupabaseTables, getTableColumns } from '@/lib/supabase/get-tables';

export async function GET(request: Request) {
  try {
    // URLパラメータからテーブル名を取得
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table');

    if (tableName) {
      // 特定のテーブルのカラム情報を取得
      const result = await getTableColumns(tableName);
      return NextResponse.json(result);
    } else {
      // 全テーブル一覧を取得
      const result = await getSupabaseTables();
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table information' },
      { status: 500 }
    );
  }
}