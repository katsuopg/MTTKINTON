import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Supabaseの内部スキーマ情報を取得するための高度な関数
export async function introspectDatabase() {
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
          } catch (error) {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {}
        },
      },
    }
  );

  try {
    // PostgreSQLのシステムカタログを使用してより詳細な情報を取得
    const query = `
      SELECT 
        t.table_name,
        t.table_type,
        obj_description(c.oid) as table_comment,
        json_agg(
          json_build_object(
            'column_name', col.column_name,
            'data_type', col.data_type,
            'udt_name', col.udt_name,
            'character_maximum_length', col.character_maximum_length,
            'is_nullable', col.is_nullable,
            'column_default', col.column_default,
            'ordinal_position', col.ordinal_position
          ) ORDER BY col.ordinal_position
        ) as columns
      FROM information_schema.tables t
      JOIN pg_class c ON c.relname = t.table_name
      JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
      LEFT JOIN information_schema.columns col 
        ON col.table_schema = t.table_schema 
        AND col.table_name = t.table_name
      WHERE t.table_schema = 'public'
        AND t.table_type IN ('BASE TABLE', 'VIEW')
      GROUP BY t.table_name, t.table_type, c.oid
      ORDER BY t.table_name;
    `;

    // Supabaseでは直接SQLクエリを実行できないため、
    // 代替方法として個別にテーブルとカラム情報を取得
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables' as any)
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .in('table_type', ['BASE TABLE', 'VIEW']);

    if (tablesError) {
      throw new Error(tablesError.message);
    }

    // 各テーブルのカラム情報を取得
    const tablesWithColumns = await Promise.all(
      (tablesData || []).map(async (table) => {
        const { data: columnsData, error: columnsError } = await supabase
          .from('information_schema.columns' as any)
          .select('*')
          .eq('table_schema', 'public')
          .eq('table_name', table.table_name)
          .order('ordinal_position');

        if (columnsError) {
          console.error(`Error fetching columns for ${table.table_name}:`, columnsError);
          return { ...table, columns: [] };
        }

        return {
          ...table,
          columns: columnsData || []
        };
      })
    );

    return { tables: tablesWithColumns };
  } catch (error) {
    console.error('Database introspection error:', error);
    return { error: 'Failed to introspect database' };
  }
}

// 外部キー関係を取得
export async function getTableRelationships(tableName: string) {
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
          } catch (error) {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {}
        },
      },
    }
  );

  try {
    // 外部キー制約情報を取得
    const { data, error } = await supabase
      .from('information_schema.key_column_usage' as any)
      .select(`
        constraint_name,
        column_name,
        referenced_table_name:table_name,
        referenced_column_name:column_name
      `)
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .not('referenced_table_name', 'is', null);

    if (error) {
      throw new Error(error.message);
    }

    return { relationships: data || [] };
  } catch (error) {
    console.error('Relationships fetch error:', error);
    return { error: 'Failed to fetch relationships' };
  }
}