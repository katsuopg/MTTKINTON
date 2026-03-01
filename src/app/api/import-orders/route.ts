import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { KintoneClient } from '@/lib/kintone/client';
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

interface KintoneOrderRecord {
  $id: { value: string };
  文字列__1行_: { value: string };   // PO番号
  文字列__1行__0: { value: string }; // CS ID
  文字列__1行__2: { value: string }; // 工事番号
  文字列__1行__3?: { value: string }; // 会社名
  文字列__1行__4: { value: string }; // 顧客名
  文字列__1行__5?: { value: string }; // ベンダー
  文字列__1行__6?: { value: string }; // 型式
  文字列__1行__7: { value: string }; // 件名
  文字列__1行__8?: { value: string }; // シリアル番号
  文字列__1行__9?: { value: string }; // Model (display)
  McItem: { value: string };         // M/C Item
  ルックアップ: { value: string };    // 見積番号
  日付: { value: string };           // 注文日
  日付_0: { value: string };         // 見積日
  Drop_down: { value: string };      // ステータス
  数値_3: { value: string };         // 値引き前金額
  数値_4: { value: string };         // 値引き額
  AF: { value: string };             // 値引き後金額
  amount: { value: string };         // 合計金額（税込）
  vat: { value: string };            // 消費税額
  添付ファイル: { value: Array<{
    fileKey: string;
    name: string;
    contentType: string;
    size: string;
  }> };
  更新日時: { value: string };
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  const permCheck = await requirePermission('import_data');
  if (!permCheck.allowed) {
    return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
  }

  const supabase = await createClient();
  const url = new URL(request.url);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const apiToken = process.env.KINTONE_API_TOKEN_ORDER;
    const appId = process.env.KINTONE_APP_ORDER_MANAGEMENT;
    if (!apiToken || !appId) {
      return NextResponse.json({ error: 'KINTONE_API_TOKEN_ORDER or KINTONE_APP_ORDER_MANAGEMENT is not set' }, { status: 500 });
    }

    const client = new KintoneClient(appId, apiToken);

    const query = `order by レコード番号 desc limit ${PAGE_SIZE} offset ${offset}`;
    const records = await client.getRecords<KintoneOrderRecord>(query);

    const hasMore = records.length === PAGE_SIZE;
    const batchSize = 10;
    let imported = 0;
    let errors = 0;
    const errorDetails: { offset: number; error: string }[] = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const rows = batch.map(record => ({
        kintone_record_id: record.$id.value,
        po_number: record.文字列__1行_?.value || null,
        customer_id: record.文字列__1行__0?.value || null,
        work_no: record.文字列__1行__2?.value || null,
        company_name: record.文字列__1行__3?.value || null,
        customer_name: record.文字列__1行__4?.value || null,
        vendor: record.文字列__1行__5?.value || null,
        model: record.文字列__1行__6?.value || record.文字列__1行__9?.value || null,
        subject: record.文字列__1行__7?.value || null,
        serial_no: record.文字列__1行__8?.value || null,
        mc_item: record.McItem?.value || null,
        quotation_no: record.ルックアップ?.value || null,
        order_date: toDateOrNull(record.日付?.value),
        quotation_date: toDateOrNull(record.日付_0?.value),
        status: record.Drop_down?.value || null,
        amount_before_discount: toNumberOrNull(record.数値_3?.value),
        discount_amount: toNumberOrNull(record.数値_4?.value),
        amount_after_discount: toNumberOrNull(record.AF?.value),
        vat: toNumberOrNull(record.vat?.value),
        total_amount: toNumberOrNull(record.amount?.value),
        attachments: record.添付ファイル?.value?.map((f: any) => ({
          fileKey: f.fileKey,
          name: f.name,
          contentType: f.contentType,
          size: f.size,
        })) || [],
        updated_at_kintone: record.更新日時?.value || null,
      }));

      const { error } = await supabase
        .from('customer_orders')
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
        .from('customer_orders')
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
    console.error('Orders import error:', error);
    return NextResponse.json({
      error: '注文書データの取り込み中にエラーが発生しました',
      details: String(error)
    }, { status: 500 });
  }
}
