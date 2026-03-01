import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * 動的アプリ一覧を取得（ナビゲーション用・認証済みユーザーのみ）
 * GET /api/apps/dynamic
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    const { data: apps, error } = await appsTable
      .select('code, name, name_en, name_th, icon, color')
      .eq('is_active', true)
      .eq('app_type', 'dynamic')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching dynamic apps:', error);
      return NextResponse.json({ error: 'Failed to fetch apps' }, { status: 500 });
    }

    return NextResponse.json({ apps: apps || [] });
  } catch (error) {
    console.error('Error in GET /api/apps/dynamic:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
