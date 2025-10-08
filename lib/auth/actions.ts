'use server';

import { createActionClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ログイン処理
export async function login(email: string, password: string) {
  const supabase = await createActionClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/');
  redirect('/ja/dashboard');
}

// ログアウト処理
export async function logout() {
  const supabase = await createActionClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/');
  redirect('/ja/auth/login');
}

// サインアップ処理
export async function signup(email: string, password: string) {
  const supabase = await createActionClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/');
  return data;
}