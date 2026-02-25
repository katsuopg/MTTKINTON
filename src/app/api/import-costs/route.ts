import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { KintoneClient } from '@/lib/kintone/client';
import { CostRecord, KINTONE_APPS } from '@/types/kintone';

type SupabaseAny = any;

const PAGE_SIZE = 500;

// コストデータをバッチでSupabaseに取り込むAPIルート
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
    const costClient = new KintoneClient(
      KINTONE_APPS.COST_MANAGEMENT.appId.toString(),
      process.env.KINTONE_API_TOKEN_COST!
    );
    const query = `limit ${PAGE_SIZE} offset ${offset}`;
    const records = await costClient.getRecords<CostRecord>(query);
    console.log(`Kintone offset=${offset}: ${records.length}件取得`);

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

    // 10件ずつバッチupsert
    const batchSize = 10;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const rows = batch.map((cost) => ({
        kintone_record_id: cost.$id.value,
        record_no: cost.数値_0?.value || null,
        work_no: cost.文字列__1行__15?.value || cost.Work_No?.value || '',
        wn_status: cost.ドロップダウン?.value || null,
        start_date: toDateOrNull(cost.日付?.value),
        finish_date: toDateOrNull(cost.日付_0?.value),
        po_no: cost.文字列__1行__1?.value || null,
        po_date: toDateOrNull(cost.日付_1?.value),
        customer_id: cost.文字列__1行__2?.value || null,
        cost_status: cost.ドロップダウン_5?.value || null,
        arrival_date: toDateOrNull(cost.日付_2?.value),
        invoice_date: toDateOrNull(cost.日付_3?.value),
        payment_date: toDateOrNull(cost.日付_4?.value),
        payment_term: cost.ドロップダウン_0?.value || null,
        item_code: cost.文字列__1行__3?.value || null,
        description: cost.文字列__1行__7?.value || null,
        supplier_name: cost.ルックアップ_1?.value || null,
        model_type: cost.文字列__1行__9?.value || null,
        unit_price: toNumberOrNull(cost.unit_price_0?.value),
        unit: cost.ドロップダウン_3?.value || null,
        quantity: toNumberOrNull(cost.数値?.value),
        total_amount: toNumberOrNull(cost.total_0?.value),
        registered_by: cost.文字列__1行__8?.value || null,
      }));

      const { error } = await (supabase.from('cost_records') as SupabaseAny)
        .upsert(rows, { onConflict: 'kintone_record_id' });

      if (error) {
        console.error(`バッチupsertエラー (offset=${offset}, i=${i}):`, error.message);
        errors += batch.length;
        batch.forEach((c) => errorDetails.push({ record_id: c.$id.value, error: error.message }));
      } else {
        imported += batch.length;
      }
    }

    const hasMore = records.length === PAGE_SIZE;

    // 最終バッチの場合のみSupabase総件数を取得
    let supabaseCount: number | null = null;
    if (!hasMore) {
      const { count } = await supabase
        .from('cost_records')
        .select('*', { count: 'exact', head: true });
      supabaseCount = count;
    }

    console.log(`offset=${offset}: 成功${imported}件, エラー${errors}件, hasMore=${hasMore}`);

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
    console.error('取り込みエラー:', error);
    return NextResponse.json({
      error: '取り込み中にエラーが発生しました',
      details: String(error),
    }, { status: 500 });
  }
}
