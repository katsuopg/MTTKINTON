import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { KintoneClient } from '@/lib/kintone/client';
import { PORecord, KINTONE_APPS } from '@/types/kintone';

type SupabaseAny = any;

const PAGE_SIZE = 500;

// POデータをバッチでSupabaseに取り込むAPIルート
// ?offset=0 で500件ずつ取得→upsert。hasMore=falseで完了。
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    // Kintoneから500件取得
    const poClient = new KintoneClient(
      KINTONE_APPS.PO_MANAGEMENT.appId.toString(),
      process.env.KINTONE_API_TOKEN_PO!
    );
    const query = `limit ${PAGE_SIZE} offset ${offset}`;
    const records = await poClient.getRecords<PORecord>(query);
    console.log(`Kintone PO offset=${offset}: ${records.length}件取得`);

    let imported = 0;
    let errors = 0;
    const errorDetails: { record_id: string; error: string }[] = [];

    // 空文字列をnullに変換するヘルパー
    const toDateOrNull = (val: string | undefined): string | null => {
      if (!val || val.trim() === '') return null;
      return val;
    };
    const toNumberOrNull = (val: string | undefined): number | null => {
      if (!val || val.trim() === '') return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    // 10件ずつバッチ処理
    const batchSize = 10;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const rows = batch.map((po) => ({
        kintone_record_id: po.$id.value,
        approval_status: po.ステータス?.value || null,
        work_no: po.ルックアップ?.value || null,
        po_no: po.文字列__1行__1?.value || null,
        cs_id: po.文字列__1行__2?.value || null,
        supplier_name: po.ルックアップ_1?.value || null,
        po_date: toDateOrNull(po.日付?.value),
        delivery_date: toDateOrNull(po.日付_0?.value),
        date_1: toDateOrNull(po.日付_1?.value),
        date_2: toDateOrNull(po.日付_2?.value),
        date_3: toDateOrNull(po.日付_3?.value),
        date_4: toDateOrNull(po.日付_4?.value),
        date_5: toDateOrNull(po.日付_5?.value),
        date_6: toDateOrNull(po.日付_6?.value),
        date_7: toDateOrNull(po.日付_7?.value),
        subtotal: toNumberOrNull(po.subtotal?.value),
        discount: toNumberOrNull(po.discount?.value),
        grand_total: toNumberOrNull(po.grand_total?.value),
        payment_term: po.ドロップダウン_0?.value || null,
        po_status: po.ドロップダウン_1?.value || null,
        data_status: po.ドロップダウン_4?.value || null,
        mc_item: po.McItem?.value || null,
        model: po.文字列__1行__9?.value || null,
        subject: po.文字列__1行__4?.value || null,
        qt_no: po.文字列__1行__3?.value || null,
        requester: po.requester?.value || null,
        forward: po.forward?.value || null,
      }));

      const { data: upsertedData, error } = await (supabase.from('po_records') as SupabaseAny)
        .upsert(rows, { onConflict: 'kintone_record_id' })
        .select('id, kintone_record_id');

      if (error) {
        console.error(`PO バッチupsertエラー (offset=${offset}, i=${i}):`, error.message);
        errors += batch.length;
        batch.forEach((p) => errorDetails.push({ record_id: p.$id.value, error: error.message }));
        continue;
      }

      imported += batch.length;

      // 明細行の処理
      if (upsertedData) {
        for (const upserted of upsertedData) {
          const originalRecord = batch.find((p) => p.$id.value === upserted.kintone_record_id);
          if (!originalRecord?.Table?.value || originalRecord.Table.value.length === 0) continue;

          // 既存明細を削除
          await (supabase.from('po_line_items') as SupabaseAny)
            .delete()
            .eq('po_record_id', upserted.id);

          // 新しい明細行を挿入
          const lineItems = originalRecord.Table.value.map((item, idx) => ({
            po_record_id: upserted.id,
            kintone_row_id: item.id,
            item_no: item.value.文字列__1行_?.value || null,
            description: item.value.文字列__1行__0?.value || null,
            quantity: toNumberOrNull(item.value.QTY?.value),
            unit: item.value.ドロップダウン?.value || null,
            unit_price: toNumberOrNull(item.value.unit_price?.value),
            amount: toNumberOrNull(item.value.total?.value),
            line_status: item.value.ドロップダウン_2?.value || null,
            line_payment: item.value.ドロップダウン_3?.value || null,
            line_date_1: toDateOrNull(item.value.日付_3?.value ?? undefined),
            line_date_2: toDateOrNull(item.value.日付_4?.value ?? undefined),
            notes: item.value.文字列__1行__4?.value || null,
            sort_order: idx,
          }));

          const { error: lineError } = await (supabase.from('po_line_items') as SupabaseAny)
            .insert(lineItems);

          if (lineError) {
            console.error(`明細行挿入エラー (record_id=${upserted.kintone_record_id}):`, lineError.message);
          }
        }
      }
    }

    const hasMore = records.length === PAGE_SIZE;

    // 最終バッチの場合のみSupabase総件数を取得
    let supabaseCount: number | null = null;
    if (!hasMore) {
      const { count } = await supabase
        .from('po_records')
        .select('*', { count: 'exact', head: true });
      supabaseCount = count;
    }

    console.log(`PO offset=${offset}: 成功${imported}件, エラー${errors}件, hasMore=${hasMore}`);

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
    console.error('PO取り込みエラー:', error);
    return NextResponse.json({
      error: '取り込み中にエラーが発生しました',
      details: String(error),
    }, { status: 500 });
  }
}
