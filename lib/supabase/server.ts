import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

// サーバーコンポーネント用のSupabaseクライアントを作成（読み取り専用）
export const createClient = async () => {
  const cookieStore = await cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // サーバーコンポーネントでは Cookie の設定を無効化
        },
        remove() {
          // サーバーコンポーネントでは Cookie の削除を無効化
        }
      }
    }
  );
};

// サーバーアクション用のSupabaseクライアントを作成
export const createActionClient = async () => {
  const cookieStore = await cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({
            name,
            value,
            path: options.path || '/',
            ...options,
          });
        },
        remove(name: string) {
          cookieStore.delete(name);
        }
      }
    }
  );
};