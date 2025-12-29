import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  
  // サインアウト処理
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Sign out error:', error);
  }
  
  // ログインページにリダイレクト
  const origin = request.headers.get('origin') || 'http://localhost:3000';
  return NextResponse.redirect(new URL('/ja/auth/login', origin));
}