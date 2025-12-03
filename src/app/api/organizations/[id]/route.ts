import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 組織更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // 認証チェック
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code, name, name_en, name_th, parent_id, description, display_order, is_active } = body;

    // 組織コードが変更される場合、重複チェック
    if (code !== undefined && code !== null && code !== '') {
      // 現在の組織のコードを取得
      const { data: currentOrg, error: currentError } = await supabase
        .from('organizations')
        .select('code')
        .eq('id', id)
        .single();

      if (currentError) {
        console.error('Error fetching current organization:', currentError);
        return NextResponse.json({ error: '組織の取得に失敗しました' }, { status: 500 });
      }

      const currentCode = currentOrg?.code?.trim();
      const newCode = String(code).trim();

      console.log('Code check:', { 
        currentCode: currentCode, 
        newCode: newCode, 
        isSame: currentCode === newCode,
        organizationId: id,
        currentCodeType: typeof currentCode,
        newCodeType: typeof newCode
      });

      // コードが変更されていない場合は重複チェックをスキップ
      // 大文字小文字を区別して比較（PostgreSQLは大文字小文字を区別するため）
      if (currentCode !== newCode) {
        const { data: existingOrgs, error: checkError } = await supabase
          .from('organizations')
          .select('id, code')
          .eq('code', newCode)
          .neq('id', id);

        if (checkError) {
          console.error('Error checking code uniqueness:', checkError);
          return NextResponse.json({ error: '組織コードの確認に失敗しました' }, { status: 500 });
        }

        console.log('Existing organizations with same code:', existingOrgs);

        if (existingOrgs && existingOrgs.length > 0) {
          console.error('Code conflict:', { 
            requested: newCode, 
            current: currentCode,
            existing: existingOrgs,
            organizationId: id
          });
          return NextResponse.json({ error: `組織コード「${newCode}」は既に使用されています` }, { status: 400 });
        }
      } else {
        console.log('Code unchanged, skipping duplicate check');
      }
    }

    const updateData: any = {
      updated_by: user.email || 'system',
      updated_at: new Date().toISOString(),
    };

    // リクエストボディの内容をログに出力
    console.log('Update request body:', {
      code,
      name,
      name_en,
      name_th,
      parent_id,
      description,
      display_order,
      is_active
    });

    if (code !== undefined) {
      updateData.code = code;
      console.log('Code will be updated to:', code);
    }
    if (name !== undefined) updateData.name = name;
    if (name_en !== undefined) updateData.name_en = name_en || null;
    if (name_th !== undefined) updateData.name_th = name_th || null;
    // parent_idが空文字列の場合はnullに変換
    if (parent_id !== undefined) updateData.parent_id = parent_id === '' || parent_id === null ? null : parent_id;
    if (description !== undefined) updateData.description = description || null;
    // display_orderを数値に変換（0も有効な値として扱う）
    if (display_order !== undefined && display_order !== null) {
      const orderValue = parseInt(String(display_order), 10);
      updateData.display_order = isNaN(orderValue) ? 0 : orderValue;
      console.log('Display order will be updated:', {
        original: display_order,
        originalType: typeof display_order,
        parsed: orderValue,
        final: updateData.display_order
      });
    } else {
      console.log('Display order is undefined or null, skipping update');
    }
    if (is_active !== undefined) updateData.is_active = is_active;

    console.log('Update data to be sent:', updateData);

    const { data, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    console.log('Update result:', { data, error });

    if (error) {
      console.error('Error updating organization:', error);
      console.error('Update data:', updateData);
      console.error('Organization ID:', id);
      
      // Supabaseのエラーコードに基づいて適切なメッセージを返す
      let errorMessage = '組織の更新に失敗しました';
      if (error.code === '23505') {
        errorMessage = '組織コードが既に使用されています';
      } else if (error.code === '23503') {
        errorMessage = '親組織が存在しません';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return NextResponse.json({ 
        error: errorMessage, 
        code: error.code,
        details: error 
      }, { status: 500 });
    }

    return NextResponse.json({ organization: data });
  } catch (error) {
    console.error('Error in PUT /api/organizations/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました';
    return NextResponse.json({ 
      error: errorMessage,
      type: 'server_error'
    }, { status: 500 });
  }
}

// 組織削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // 認証チェック
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    // 子組織が存在するかチェック
    const { data: children, error: childrenError } = await supabase
      .from('organizations')
      .select('id')
      .eq('parent_id', id);

    if (childrenError) {
      console.error('Error checking children:', childrenError);
      return NextResponse.json({ error: '子組織の確認に失敗しました' }, { status: 500 });
    }

    if (children && children.length > 0) {
      return NextResponse.json(
        { error: '子組織が存在するため削除できません。先に子組織を削除してください。' },
        { status: 400 }
      );
    }

    // メンバーが存在するかチェック
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', id)
      .eq('is_active', true);

    if (membersError) {
      console.error('Error checking members:', membersError);
      return NextResponse.json({ error: 'メンバーの確認に失敗しました' }, { status: 500 });
    }

    if (members && members.length > 0) {
      return NextResponse.json(
        { error: 'メンバーが存在するため削除できません。先にメンバーを削除してください。' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting organization:', error);
      return NextResponse.json({ error: '組織の削除に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/organizations/[id]:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}


