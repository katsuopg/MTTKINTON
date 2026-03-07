import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomBytes, createHash } from 'crypto';

/**
 * APIトークン管理
 */

// GET: トークン一覧
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tokens } = await (supabase.from('api_tokens' as any) as any)
    .select('id, name, token_prefix, app_id, permissions, expires_at, last_used_at, is_active, created_at, app:apps(code, name)')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ tokens: tokens || [] });
}

// POST: トークン作成
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, app_id, permissions, expires_at } = body;

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  // トークン生成
  const rawToken = `mttk_${randomBytes(32).toString('hex')}`;
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const tokenPrefix = rawToken.slice(0, 12);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: token, error } = await (supabase.from('api_tokens' as any) as any)
    .insert({
      name,
      token_hash: tokenHash,
      token_prefix: tokenPrefix,
      app_id: app_id || null,
      permissions: permissions || { can_view: true },
      created_by: user.id,
      expires_at: expires_at || null,
    })
    .select('id, name, token_prefix, app_id, permissions, expires_at, created_at')
    .single();

  if (error) {
    console.error('Failed to create API token:', error);
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
  }

  // 生のトークンは作成時のみ返す（以降はtoken_prefixのみ表示）
  return NextResponse.json({
    token: { ...token, raw_token: rawToken },
    message: 'Token created. Save the raw_token now - it will not be shown again.',
  }, { status: 201 });
}

// DELETE: トークン無効化
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get('id');
  if (!tokenId) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('api_tokens' as any) as any)
    .update({ is_active: false })
    .eq('id', tokenId)
    .eq('created_by', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to revoke token' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
