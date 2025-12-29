'use server';

import { createActionClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { employeeNumberToEmail } from './utils';

// ログイン処理（従業員番号 または 既存メールアドレスで認証）
export async function login(identifier: string, password: string) {
  const supabase = await createActionClient();

  // @を含む場合は既存のメールアドレスとして扱う（後方互換性）
  const email = identifier.includes('@')
    ? identifier
    : employeeNumberToEmail(identifier);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // より分かりやすいエラーメッセージに変換
    if (error.message === 'Invalid login credentials') {
      throw new Error('従業員番号またはパスワードが正しくありません');
    }
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

// サインアップ処理（従業員番号で登録）
export async function signup(employeeNumber: string, password: string) {
  const supabase = await createActionClient();
  const email = employeeNumberToEmail(employeeNumber);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        employee_number: employeeNumber.toUpperCase(),
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/');
  return data;
}