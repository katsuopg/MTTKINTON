import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type SupabaseAny = any;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: コスト集計
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // セクションIDを取得
    const { data: sections } = await (supabase
      .from('dom_sections') as SupabaseAny)
      .select('id')
      .eq('dom_header_id', id);

    const sectionIds = sections?.map((s: { id: string }) => s.id) || [];

    // メカ部品の集計（quantity × unit_price で都度計算）
    let mechMakeTotal = 0;
    let mechBuyTotal = 0;
    let mechMakeCount = 0;
    let mechBuyCount = 0;

    if (sectionIds.length > 0) {
      const { data: mechItems } = await (supabase
        .from('dom_mech_items') as SupabaseAny)
        .select('category, quantity, unit_price')
        .in('dom_section_id', sectionIds)
        .eq('is_deleted', false);

      if (mechItems) {
        for (const item of mechItems) {
          const amt = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
          if (item.category === 'make') {
            mechMakeTotal += amt;
            mechMakeCount++;
          } else {
            mechBuyTotal += amt;
            mechBuyCount++;
          }
        }
      }
    }

    // 電気部品の集計（quantity × unit_price で都度計算）
    const { data: elecItems } = await (supabase
      .from('dom_elec_items') as SupabaseAny)
      .select('category, quantity, unit_price')
      .eq('dom_header_id', id)
      .eq('is_deleted', false);

    let elecMakeTotal = 0;
    let elecBuyTotal = 0;
    let elecMakeCount = 0;
    let elecBuyCount = 0;

    if (elecItems) {
      for (const item of elecItems) {
        const amt = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
        if (item.category === 'make') {
          elecMakeTotal += amt;
          elecMakeCount++;
        } else {
          elecBuyTotal += amt;
          elecBuyCount++;
        }
      }
    }

    // 工数の集計（hours × hourly_rate で都度計算）
    const { data: laborItems } = await (supabase
      .from('dom_labor') as SupabaseAny)
      .select('discipline, hours, hourly_rate')
      .eq('dom_header_id', id)
      .eq('is_deleted', false);

    let mechLaborTotal = 0;
    let elecLaborTotal = 0;
    let mechLaborCount = 0;
    let elecLaborCount = 0;

    if (laborItems) {
      for (const item of laborItems) {
        const amt = (Number(item.hours) || 0) * (Number(item.hourly_rate) || 0);
        if (item.discipline === 'mech') {
          mechLaborTotal += amt;
          mechLaborCount++;
        } else {
          elecLaborTotal += amt;
          elecLaborCount++;
        }
      }
    }

    const grandTotal = mechMakeTotal + mechBuyTotal + elecMakeTotal + elecBuyTotal + mechLaborTotal + elecLaborTotal;

    const summary = {
      mech_make_total: mechMakeTotal,
      mech_buy_total: mechBuyTotal,
      elec_make_total: elecMakeTotal,
      elec_buy_total: elecBuyTotal,
      mech_labor_total: mechLaborTotal,
      elec_labor_total: elecLaborTotal,
      grand_total: grandTotal,
      mech_make_count: mechMakeCount,
      mech_buy_count: mechBuyCount,
      elec_make_count: elecMakeCount,
      elec_buy_count: elecBuyCount,
      mech_labor_count: mechLaborCount,
      elec_labor_count: elecLaborCount,
    };

    // DOMヘッダーのtotal_costを更新
    await (supabase
      .from('dom_headers') as SupabaseAny)
      .update({ total_cost: grandTotal })
      .eq('id', id);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching summary:', error);
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}
