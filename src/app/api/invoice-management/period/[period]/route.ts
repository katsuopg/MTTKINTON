import { NextRequest, NextResponse } from 'next/server';
import { getInvoicesFromSupabase } from '@/lib/supabase/invoices';
import { convertSupabaseInvoicesToKintone } from '@/lib/supabase/transformers';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ period: string }> }
) {
  try {
    const { period } = await context.params;
    console.log('API: Fetching invoice records for period:', period);
    
    // Supabaseから会計期間のデータを取得
    const invoices = await getInvoicesFromSupabase(period, 500);
    const records = convertSupabaseInvoicesToKintone(invoices);
    
    return NextResponse.json({
      records,
      count: records.length,
      period
    });
  } catch (error) {
    console.error('Error fetching invoice records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice records' },
      { status: 500 }
    );
  }
}
