import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { KintoneClient } from '@/lib/kintone/client';
import { QuotationRecord, KINTONE_APPS } from '@/types/kintone';
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

const toTextOrNull = (val: unknown): string | null => {
  if (!val) return null;
  if (typeof val === 'string') return val || null;
  if (typeof val === 'object' && val !== null && 'name' in val) {
    return String((val as { name: string }).name) || null;
  }
  return String(val) || null;
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
    const apiToken = process.env.KINTONE_API_TOKEN_QUOTATION;
    if (!apiToken) {
      return NextResponse.json({ error: 'KINTONE_API_TOKEN_QUOTATION is not set' }, { status: 500 });
    }

    const client = new KintoneClient(
      String(KINTONE_APPS.QUOTATION.appId),
      apiToken
    );

    const query = `order by レコード番号 desc limit ${PAGE_SIZE} offset ${offset}`;
    const records = await client.getRecords<QuotationRecord>(query);

    const hasMore = records.length === PAGE_SIZE;
    const batchSize = 10;
    let imported = 0;
    let errors = 0;
    const errorDetails: { offset: number; error: string }[] = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const rows = batch.map(record => ({
        kintone_record_id: record.$id.value,
        quotation_no: record.qtno2?.value || null,
        quotation_date: toDateOrNull(record.日付?.value),
        expected_order_date: toDateOrNull(record.日付_0?.value),
        delivery_date: record.文字列__1行__8?.value || null,
        valid_until: record.ドロップダウン_3?.value || null,
        sales_staff: toTextOrNull(record.sales_staff?.value),
        status: record.ドロップダウン?.value || null,
        probability: record.Drop_down?.value || null,
        title: record.文字列__1行__4?.value || null,
        customer_id: record.文字列__1行__10?.value || null,
        customer_name: record.name?.value || null,
        company_name: record.文字列__1行__3?.value || null,
        project_name: record.ドロップダウン_0?.value || null,
        work_no: record.Text_0?.value || record.WorkNo?.value || null,
        type: record.Type?.value || null,
        vendor: record.文字列__1行__5?.value || null,
        model: record.文字列__1行__6?.value || null,
        machine_no: record.文字列__1行__9?.value || null,
        serial_no: record.文字列__1行__7?.value || null,
        contact_person: record.ルックアップ_1?.value || null,
        cc: record.Text_2?.value || null,
        sales_forecast: record.sales_forecast?.value || null,
        sub_total: toNumberOrNull(record.Sub_total?.value),
        discount: toNumberOrNull(record.Discount?.value),
        grand_total: toNumberOrNull(record.Grand_total?.value || record.grand_total?.value),
        gross_profit: toNumberOrNull(record.profit_total1?.value),
        gross_profit_rate: record.Profit_2?.value || null,
        sales_profit: toNumberOrNull(record.profit_total1_0?.value),
        sales_profit_rate: record.Profit_0?.value || null,
        cost_total: toNumberOrNull(record.costtotal?.value),
        other_total: toNumberOrNull(record.costtotal_0?.value),
        payment_terms_1: record.payment_1?.value || null,
        payment_terms_2: record.ドロップダウン_4?.value || null,
        payment_terms_3: record.ドロップダウン_5?.value || null,
        remarks: record.文字列__複数行__2?.value || null,
      }));

      const { error } = await supabase
        .from('quotations')
        .upsert(rows as any[], { onConflict: 'kintone_record_id' });

      if (error) {
        console.error(`Batch error at offset ${offset + i}:`, error.message);
        errorDetails.push({ offset: offset + i, error: error.message });
        errors += batch.length;
      } else {
        imported += batch.length;
      }
    }

    let supabaseCount: number | null = null;
    if (!hasMore) {
      const { count } = await supabase
        .from('quotations')
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
    console.error('Quotations import error:', error);
    return NextResponse.json({
      error: '見積データの取り込み中にエラーが発生しました',
      details: String(error)
    }, { status: 500 });
  }
}
