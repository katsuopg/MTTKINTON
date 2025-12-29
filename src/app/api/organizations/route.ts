import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 組織一覧取得
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // 認証チェック
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching organizations:', error);
      return NextResponse.json({ error: '組織の取得に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ organizations: organizations || [] });
  } catch (error) {
    console.error('Error in GET /api/organizations:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// 組織作成
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 認証チェック
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code, name, name_en, name_th, parent_id, description, display_order } = body;

    if (!code || !name) {
      return NextResponse.json({ error: '組織コードと組織名は必須です' }, { status: 400 });
    }

    const insertData = {
      code,
      name,
      name_en: name_en || null,
      name_th: name_th || null,
      // parent_idが空文字列の場合はnullに変換
      parent_id: parent_id === '' || parent_id === null ? null : parent_id,
      description: description || null,
      // display_orderを数値に変換
      display_order: parseInt(String(display_order), 10) || 0,
      created_by: user.email || 'system',
      updated_by: user.email || 'system',
    };
    const { data, error } = await supabase
      .from('organizations')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      console.error('Error creating organization:', error);
      if (error.code === '23505') {
        return NextResponse.json({ error: '組織コードが既に存在します' }, { status: 400 });
      }
      return NextResponse.json({ error: '組織の作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ organization: data });
  } catch (error) {
    console.error('Error in POST /api/organizations:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}


