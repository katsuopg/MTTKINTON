import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

// GET: 顧客一覧取得（検索対応）
export async function GET(request: NextRequest) {
  try {
    // 権限チェック
    const permCheck = await requireAppPermission('customers', 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let query = (supabase.from('customers') as SupabaseAny)
      .select('customer_id, company_name')
      .order('customer_id', { ascending: true });

    if (search) {
      query = query.or(
        `customer_id.ilike.%${search}%,company_name.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ customers: data || [] });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
