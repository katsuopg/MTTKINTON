import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { KintoneClient } from '@/lib/kintone/client';
import { MachineRecord, KINTONE_APPS } from '@/types/kintone';
import { requirePermission } from '@/lib/auth/permissions';

export async function POST() {
  const permCheck = await requirePermission('import_data');
  if (!permCheck.allowed) {
    return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
  }

  const supabase = await createClient();

  try {
    const apiToken = process.env.KINTONE_API_TOKEN_MACHINE;
    if (!apiToken) {
      return NextResponse.json({ error: 'KINTONE_API_TOKEN_MACHINE is not set' }, { status: 500 });
    }

    const client = new KintoneClient(
      String(KINTONE_APPS.MACHINE_MANAGEMENT.appId),
      apiToken
    );

    const records = await client.getRecords<MachineRecord>('order by レコード番号 desc limit 500');

    const batchSize = 10;
    let imported = 0;
    let errors = 0;
    const errorDetails: any[] = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const rows = batch.map(record => ({
        kintone_record_id: record.$id.value,
        customer_id: record.CsId_db?.value || '',
        customer_name: record.CsName?.value || null,
        machine_category: record.MachineCategory?.value || null,
        machine_type: record.Drop_down_0?.value || null,
        vendor: record.Vender?.value || null,
        model: record.Moldel?.value || null,
        serial_number: record.SrialNo?.value || null,
        machine_number: record.MCNo?.value || null,
        machine_item: record.McItem?.value || null,
        install_date: record.InstallDate?.value || null,
        manufacture_date: record.ManufactureDate?.value || null,
        remarks: record.Text_area?.value || null,
        quotation_count: parseInt(record.Qt?.value || '0') || 0,
        work_order_count: parseInt(record.Wn?.value || '0') || 0,
        report_count: parseInt(record.RPT?.value || '0') || 0,
        quotation_history: record.QtHistory?.value ? JSON.stringify(record.QtHistory.value) : null,
      }));

      const { error } = await supabase
        .from('machines')
        .upsert(rows as any[], { onConflict: 'kintone_record_id' });

      if (error) {
        console.error(`Batch error at ${i}:`, error.message);
        errorDetails.push({ offset: i, error: error.message });
        errors += batch.length;
      } else {
        imported += batch.length;
      }
    }

    const { count } = await supabase
      .from('machines')
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
    console.error('Machine import error:', error);
    return NextResponse.json({
      error: '機械データの取り込み中にエラーが発生しました',
      details: String(error)
    }, { status: 500 });
  }
}
