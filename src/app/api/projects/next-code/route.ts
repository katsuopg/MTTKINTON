import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

// GET: 次の自動採番コードをプレビュー
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 現在の西暦下2桁
    const year2 = new Date().getFullYear().toString().slice(-2);
    const prefix = `P${year2}`;

    // 今年の最大番号を取得
    const { data: rows } = await (supabase
      .from('projects') as SupabaseAny)
      .select('project_code')
      .like('project_code', `${prefix}%`);

    let maxNum = 0;
    if (rows) {
      for (const row of rows) {
        const numPart = row.project_code.slice(3);
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    const nextCode = `${prefix}${String(maxNum + 1).padStart(3, '0')}`;

    return NextResponse.json({ next_code: nextCode });
  } catch (error) {
    console.error('Error getting next project code:', error);
    return NextResponse.json(
      { error: 'Failed to get next code' },
      { status: 500 }
    );
  }
}
