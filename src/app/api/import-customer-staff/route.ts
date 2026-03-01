import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { KintoneClient } from '@/lib/kintone/client';
import { CustomerStaffRecord, KINTONE_APPS } from '@/types/kintone';
import { requirePermission } from '@/lib/auth/permissions';

export async function POST() {
  const permCheck = await requirePermission('import_data');
  if (!permCheck.allowed) {
    return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
  }

  const supabase = await createClient();

  try {
    const apiToken = process.env.KINTONE_API_TOKEN_CUSTOMER_STAFF;
    if (!apiToken) {
      return NextResponse.json({ error: 'KINTONE_API_TOKEN_CUSTOMER_STAFF is not set' }, { status: 500 });
    }

    const client = new KintoneClient(
      String(KINTONE_APPS.CUSTOMER_STAFF.appId),
      apiToken
    );

    const records = await client.getRecords<CustomerStaffRecord>('order by レコード番号 desc limit 500');

    const batchSize = 10;
    let imported = 0;
    let errors = 0;
    const errorDetails: any[] = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const rows = batch.map(record => ({
        kintone_record_id: record.$id.value,
        customer_id: record.CsId_db?.value || null,
        company_name: record.ルックアップ?.value || null,
        staff_name: record.担当者名?.value || '',
        division: record.Divison?.value || null,
        position: record.Position?.value || null,
        email: record.メールアドレス?.value || null,
        telephone: record.電話番号?.value || null,
        line_id: record.LINE_ID?.value || null,
        notes: record.備考?.value || null,
      }));

      const { error } = await supabase
        .from('customer_staff')
        .upsert(rows as any[], { onConflict: 'kintone_record_id' });

      if (error) {
        console.error(`Batch error at ${i}:`, error.message);
        errorDetails.push({ offset: i, error: error.message });
        errors += batch.length;
      } else {
        imported += batch.length;
      }
    }

    // 取り込み後の件数確認
    const { count } = await supabase
      .from('customer_staff')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      totalRecords: records.length,
      imported,
      errors,
      errorDetails: errorDetails.slice(0, 5),
      supabaseCount: count,
    });
  } catch (error) {
    console.error('Customer staff import error:', error);
    return NextResponse.json({
      error: '顧客担当者の取り込み中にエラーが発生しました',
      details: String(error)
    }, { status: 500 });
  }
}
