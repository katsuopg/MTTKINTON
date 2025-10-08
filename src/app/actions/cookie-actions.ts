'use server';

import { cookies } from 'next/headers';
import { RequestCookies } from 'next/dist/server/web/spec-extension/cookies';
import type { CookieOptions } from '@supabase/ssr';

export async function setCookieInAction(name: string, value: string, options: CookieOptions) {
  try {
    const cookieStore = cookies();
    if (cookieStore instanceof Promise) {
      (await cookieStore as unknown as RequestCookies).set({ 
        name, 
        value, 
        path: options.path || '/',
        ...options 
      });
    } else {
      (cookieStore as unknown as RequestCookies).set({ 
        name, 
        value, 
        path: options.path || '/',
        ...options 
      });
    }
  } catch (error) {
    console.error('Failed to set cookie:', error);
  }
}

export async function deleteCookieInAction(name: string) {
  try {
    const cookieStore = cookies();
    if (cookieStore instanceof Promise) {
      (await cookieStore as unknown as RequestCookies).delete(name);
    } else {
      (cookieStore as unknown as RequestCookies).delete(name);
    }
  } catch (error) {
    console.error('Failed to delete cookie:', error);
  }
}