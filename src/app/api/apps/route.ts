import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * アプリ一覧を取得
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
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching apps:', error);
      return NextResponse.json({ error: 'Failed to fetch apps' }, { status: 500 });
    }

    return NextResponse.json({ apps });
  } catch (error) {
    console.error('Error in GET /api/apps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * アプリを作成（管理者のみ）
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, name, name_en, name_th, description, table_name, icon, color, display_order } = body;

    if (!code || !name || !table_name) {
      return NextResponse.json({ error: 'code, name, table_name are required' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;

    const { data: app, error } = await appsTable
      .insert({
        code,
        name,
        name_en: name_en || null,
        name_th: name_th || null,
        description: description || null,
        table_name,
        icon: icon || null,
        color: color || null,
        display_order: display_order || 0,
      } as never)
      .select()
      .single();

    if (error) {
      console.error('Error creating app:', error);
      return NextResponse.json({ error: 'Failed to create app' }, { status: 500 });
    }

    return NextResponse.json({ app }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/apps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
