'use server';

import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';

export async function setCookie(name: string, value: string, options: CookieOptions) {
  try {
    // @ts-expect-error - Next.jsの型定義の問題を回避
    cookies().set(name, value, options);
  } catch (error) {
    console.error('Failed to set cookie:', error);
    throw error;
  }
}

export async function deleteCookie(name: string) {
  try {
    // @ts-expect-error - Next.jsの型定義の問題を回避
    cookies().delete(name);
  } catch (error) {
    console.error('Failed to delete cookie:', error);
    throw error;
  }
}