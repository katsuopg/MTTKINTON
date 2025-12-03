import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getSupabaseTables() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  try {
    // PostgreSQLのinformation_schemaから全テーブル情報を取得
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_all_tables')
      .select();

    if (tablesError) {
      // RPCが存在しない場合は、直接SQLクエリを実行
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('information_schema.tables' as any)
        .select('table_name, table_type')
        .eq('table_schema', 'public')
        .not('table_name', 'like', 'pg_%')
        .not('table_name', 'like', 'sql_%');

      if (error) {
        console.error('Error fetching tables:', error);
        return { error: error.message };
      }

      return { tables: data };
    }

    return { tables };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { error: 'Failed to fetch tables' };
  }
}

// 特定のテーブルのカラム情報を取得
export async function getTableColumns(tableName: string) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch { /* ignored */ }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch { /* ignored */ }
        },
      },
    }
  );

  try {
    const { data, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('information_schema.columns' as any)
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .order('ordinal_position');

    if (error) {
      console.error(`Error fetching columns for ${tableName}:`, error);
      return { error: error.message };
    }

    return { columns: data };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { error: 'Failed to fetch columns' };
  }
}

// Supabaseのテーブルから実際のデータを取得（例）
export async function getTableData(tableName: string, limit = 10) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch { /* ignored */ }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch { /* ignored */ }
        },
      },
    }
  );

  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(limit);

    if (error) {
      console.error(`Error fetching data from ${tableName}:`, error);
      return { error: error.message };
    }

    return { data, count };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { error: 'Failed to fetch data' };
  }
}