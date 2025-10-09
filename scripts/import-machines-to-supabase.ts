import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { getAllMachineRecords } from '../src/lib/kintone/machine';
import type { MachineRecord } from '../src/types/kintone';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Supabase URL または Service Role Key が設定されていません');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

type Attachment = { fileKey: string; name: string; contentType?: string; size?: number };
type QuotationHistoryEntry = {
  qt_no: string;
  qt_date: string | null;
  title: string;
  project_type: string;
  grand_total: number | null;
  work_no: string;
  status: string;
  sales: string;
  quotation_id: string;
};

function parseAttachments(value: any): Attachment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => ({
    fileKey: item?.fileKey ?? '',
    name: item?.name ?? '',
    contentType: item?.contentType ?? item?.content_type,
    size: item?.size ? Number(item.size) : undefined,
  })).filter((item) => item.fileKey && item.name);
}

function parseIntOrNull(value?: string | null): number | null {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeCustomerId(value?: string | null): string {
  if (!value) return '';
  return value.trim().replace(/\s+/g, '-');
}

function mapMachineRecord(record: MachineRecord) {
  const photoFiles = parseAttachments(record.Photo?.value);
  const nameplateFiles = parseAttachments(record.NamePlate?.value);
  const customerId = normalizeCustomerId(record.CsId_db?.value);

  const quotationHistory: QuotationHistoryEntry[] = Array.isArray(record.QtHistory?.value)
    ? record.QtHistory!.value.map((entry) => ({
        qt_no: entry.value.QtNo?.value ?? '',
        qt_date: entry.value.QtDate?.value ?? null,
        title: entry.value.QtTitle?.value ?? '',
        project_type: entry.value.QtProject?.value ?? '',
        grand_total: parseIntOrNull(entry.value.QtGrandTotal?.value ?? ''),
        work_no: entry.value.QtWn?.value ?? '',
        status: entry.value.QtStatus?.value ?? '',
        sales: entry.value.QtSales?.value ?? '',
        quotation_id: entry.value.QtId?.value ?? '',
      }))
    : [];

  return {
    kintone_record_id: record.$id.value,
    customer_id: customerId,
    customer_name: record.CsName?.value ?? '',
    machine_category: record.MachineCategory?.value ?? null,
    machine_type: record.Drop_down_0?.value ?? null,
    vendor: record.Vender?.value ?? null,
    model: record.Moldel?.value ?? null,
    serial_number: record.SrialNo?.value ?? null,
    machine_number: record.MCNo?.value ?? null,
    machine_item: record.McItem?.value ?? null,
    install_date: record.InstallDate?.value ?? null,
    manufacture_date: record.ManufactureDate?.value ?? null,
    remarks: record.Text_area?.value ?? null,
    photo_files: photoFiles,
    nameplate_files: nameplateFiles,
    quotation_count: parseIntOrNull(record.Qt?.value ?? '') ?? 0,
    work_order_count: parseIntOrNull(record.Wn?.value ?? '') ?? 0,
    report_count: parseIntOrNull(record.RPT?.value ?? '') ?? 0,
    quotation_history: quotationHistory,
  };
}

async function importMachines() {
  console.log('=== 機械データのSupabase取り込みを開始します ===');

  const records = await getAllMachineRecords();
  console.log(`Kintoneから${records.length}件の機械データを取得しました`);

  const batchSize = 50;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const payload = batch.map(mapMachineRecord);

    const { error } = await supabase
      .from('machines')
      .upsert(payload, { onConflict: 'kintone_record_id' });

    if (error) {
      console.error('アップサートエラー:', error.message);
      errors += batch.length;
    } else {
      imported += batch.length;
      console.log(`アップサート完了: ${imported}/${records.length}`);
    }
  }

  console.log('=== 取り込み結果 ===');
  console.log(`成功: ${imported}件`);
  console.log(`エラー: ${errors}件`);

  const { count, error: countError } = await supabase
    .from('machines')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Supabase件数取得エラー:', countError.message);
  } else {
    console.log(`Supabaseのmachinesテーブル件数: ${count}`);
  }
}

importMachines().catch((error) => {
  console.error('取り込み中にエラーが発生しました:', error);
  process.exit(1);
});
