import { NextRequest, NextResponse } from 'next/server';
import { getInvoiceRecords } from '@/lib/kintone/invoice';
import { requireAppPermission } from '@/lib/auth/app-permissions';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ period: string }> }
) {
  try {
    // 権限チェック
    const permCheck = await requireAppPermission('invoices', 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const { period } = await context.params;
    console.log('API: Fetching invoice records for period:', period);
    
    // 会計期間のデータを取得
    const records = await getInvoiceRecords(period, 500);
    
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