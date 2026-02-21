import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type SupabaseAny = any;

// GET: 全マスタデータ一括取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [materialsRes, heatRes, surfaceRes] = await Promise.all([
      (supabase.from('master_materials') as SupabaseAny)
        .select('*')
        .eq('is_active', true)
        .order('sort_order'),
      (supabase.from('master_heat_treatments') as SupabaseAny)
        .select('*')
        .eq('is_active', true)
        .order('sort_order'),
      (supabase.from('master_surface_treatments') as SupabaseAny)
        .select('*')
        .eq('is_active', true)
        .order('sort_order'),
    ]);

    if (materialsRes.error) throw materialsRes.error;
    if (heatRes.error) throw heatRes.error;
    if (surfaceRes.error) throw surfaceRes.error;

    return NextResponse.json({
      materials: materialsRes.data,
      heat_treatments: heatRes.data,
      surface_treatments: surfaceRes.data,
    });
  } catch (error) {
    console.error('Error fetching masters:', error);
    return NextResponse.json({ error: 'Failed to fetch masters' }, { status: 500 });
  }
}
