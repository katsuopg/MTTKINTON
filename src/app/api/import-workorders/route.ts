import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { KintoneClient } from '@/lib/kintone/client';
import { WorkNoRecord, KINTONE_APPS } from '@/types/kintone';
import { requirePermission } from '@/lib/auth/permissions';

const PAGE_SIZE = 500;

const toDateOrNull = (val: string | undefined): string | null => {
  if (!val || val.trim() === '') return null;
  return val;
};

const toNumberOrNull = (val: string | undefined): number | null => {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

export async function POST(request: NextRequest) {
  const permCheck = await requirePermission('import_data');
  if (!permCheck.allowed) {
    return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
  }

  const supabase = await createClient();
  const url = new URL(request.url);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const apiToken = process.env.KINTONE_API_TOKEN_WORKNO;
    if (!apiToken) {
      return NextResponse.json({ error: 'KINTONE_API_TOKEN_WORKNO is not set' }, { status: 500 });
    }

    const client = new KintoneClient(
      String(KINTONE_APPS.WORK_NO.appId),
      apiToken
    );

    const query = `order by WorkNo desc limit ${PAGE_SIZE} offset ${offset}`;
    const records = await client.getRecords<WorkNoRecord>(query);

    const hasMore = records.length === PAGE_SIZE;
    const batchSize = 10;
    let imported = 0;
    let errors = 0;
    const errorDetails: any[] = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const rows = batch.map(record => ({
        kintone_record_id: record.$id.value,
        work_no: record.WorkNo?.value || '',
        status: record.Status?.value || 'Working',
        start_date: toDateOrNull(record.日付_6?.value),
        finish_date: toDateOrNull(record.日付_5?.value),
        sales_date: toDateOrNull(record.Salesdate?.value),
        sales_staff: record.Salesstaff?.value?.[0]?.name || null,
        customer_id: record.文字列__1行__8?.value || null,
        customer_name: record.文字列__1行__0?.value || null,
        category: record.文字列__1行__1?.value || null,
        description: record.文字列__1行__2?.value || null,
        machine_type: record.Type?.value || null,
        vendor: record.文字列__1行__5?.value || null,
        model: record.文字列__1行__9?.value || null,
        serial_number: record.文字列__1行__10?.value || null,
        machine_number: record.文字列__1行__11?.value || null,
        machine_item: record.McItem?.value || null,
        invoice_no_1: record.文字列__1行__3?.value || null,
        invoice_no_2: record.文字列__1行__4?.value || null,
        invoice_no_3: record.文字列__1行__6?.value || null,
        invoice_no_4: record.文字列__1行__7?.value || null,
        invoice_date_1: toDateOrNull(record.日付_7?.value),
        invoice_date_2: toDateOrNull(record.日付_8?.value),
        invoice_date_3: toDateOrNull(record.日付_9?.value),
        sub_total: toNumberOrNull(record.Sub_total?.value),
        discount: toNumberOrNull(record.Discount?.value),
        grand_total: toNumberOrNull(record.grand_total?.value),
        purchase_cost: toNumberOrNull(record.cost?.value),
        labor_cost: toNumberOrNull(record.Labor_cost?.value),
        cost_total: toNumberOrNull(record.Cost_Total?.value),
        overhead_rate: toNumberOrNull(record.OverRate?.value),
        commission_rate: toNumberOrNull(record.ComRate?.value),
        person_in_charge: record.Parson_in_charge?.value || null,
        po_list: record.ルックアップ?.value || null,
        inv_list: record.ルックアップ_0?.value || null,
      }));

      const { error } = await supabase
        .from('work_orders')
        .upsert(rows as any[], { onConflict: 'kintone_record_id' });

      if (error) {
        console.error(`Batch error at offset ${offset + i}:`, error.message);
        errorDetails.push({ offset: offset + i, error: error.message });
        errors += batch.length;
      } else {
        imported += batch.length;
      }
    }

    // 最終バッチのみ総件数取得
    let supabaseCount: number | null = null;
    if (!hasMore) {
      const { count } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true });
      supabaseCount = count;
    }

    return NextResponse.json({
      success: true,
      imported,
      errors,
      errorDetails: errorDetails.slice(0, 5),
      hasMore,
      nextOffset: hasMore ? offset + PAGE_SIZE : null,
      supabaseCount,
    });
  } catch (error) {
    console.error('Work orders import error:', error);
    return NextResponse.json({
      error: '工事番号の取り込み中にエラーが発生しました',
      details: String(error)
    }, { status: 500 });
  }
}
