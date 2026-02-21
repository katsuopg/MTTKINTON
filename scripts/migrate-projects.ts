import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const KINTONE_DOMAIN = process.env.KINTONE_DOMAIN;
const KINTONE_API_TOKEN = process.env.KINTONE_API_TOKEN_PROJECT;
const KINTONE_APP_ID = process.env.KINTONE_APP_PROJECT_MANAGEMENT || '114';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface KintoneProjectRecord {
  $id: { value: string };
  PJ_code: { value: string };
  PjName: { value: string };
  WorkNo: { value: string };
  Status: { value: string };
  Start_date: { value: string };
  Due_date: { value: string };
  Customer: { value: string };
  Cs_ID: { value: string };
  Description: { value: string };
  [key: string]: any;
}

// Kintoneステータス → Supabaseステータスコード マッピング
const STATUS_MAP: Record<string, string> = {
  '見積中': 'estimating',
  'Estimating': 'estimating',
  '受注': 'ordered',
  'Ordered': 'ordered',
  '進行中': 'in_progress',
  'In Progress': 'in_progress',
  'On progress': 'in_progress',
  '完了': 'completed',
  'Completed': 'completed',
  'Complete': 'completed',
  '保留': 'on_hold',
  'On Hold': 'on_hold',
  '失注': 'lost',
  'Lost': 'lost',
  'キャンセル': 'cancelled',
  'Cancelled': 'cancelled',
};

async function fetchAllRecords(): Promise<KintoneProjectRecord[]> {
  const allRecords: KintoneProjectRecord[] = [];
  let offset = 0;
  const limit = 500;

  console.log(`Kintone App ${KINTONE_APP_ID} からプロジェクトデータ取得中...`);

  while (true) {
    const query = encodeURIComponent(`order by $id asc limit ${limit} offset ${offset}`);
    const url = `https://${KINTONE_DOMAIN}/k/v1/records.json?app=${KINTONE_APP_ID}&query=${query}&totalCount=true`;

    const response = await fetch(url, {
      headers: {
        'X-Cybozu-API-Token': KINTONE_API_TOKEN!,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Kintone API error:', text);
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = await response.json();
    const records = data.records as KintoneProjectRecord[];
    const totalCount = parseInt(data.totalCount || '0');

    allRecords.push(...records);
    console.log(`取得: ${allRecords.length} / ${totalCount} 件`);

    if (records.length < limit || allRecords.length >= totalCount) {
      break;
    }

    offset += limit;
  }

  return allRecords;
}

async function migrate() {
  console.log('=== プロジェクトデータ移行開始 ===\n');

  // 1. ステータスマスタ取得
  const { data: statuses, error: statusError } = await supabase
    .from('project_statuses')
    .select('*');

  if (statusError || !statuses) {
    console.error('ステータスマスタ取得エラー:', statusError);
    throw new Error('project_statuses テーブルが見つかりません');
  }

  const statusMap = new Map(statuses.map((s: any) => [s.code, s.id]));
  console.log(`ステータスマスタ: ${statuses.length} 件`);

  // デフォルトステータス（マッピングに一致しない場合）
  const defaultStatusId = statusMap.get('estimating');

  // 2. Kintoneからデータ取得
  const kintoneRecords = await fetchAllRecords();
  console.log(`\nKintone レコード数: ${kintoneRecords.length}\n`);

  if (kintoneRecords.length === 0) {
    console.log('移行対象のレコードがありません。');
    return;
  }

  // 最初のレコードのフィールド名をデバッグ出力
  console.log('最初のレコードのフィールド:');
  const firstRecord = kintoneRecords[0];
  for (const [key, val] of Object.entries(firstRecord)) {
    if (typeof val === 'object' && val !== null && 'value' in val) {
      console.log(`  ${key}: "${val.value}"`);
    }
  }
  console.log('');

  // 3. ステータスマッピングの集計
  const statusCounts: Record<string, number> = {};
  const unmappedStatuses = new Set<string>();

  for (const record of kintoneRecords) {
    const status = record.Status?.value || '';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    if (status && !STATUS_MAP[status]) {
      unmappedStatuses.add(status);
    }
  }

  console.log('ステータス分布:');
  for (const [status, count] of Object.entries(statusCounts)) {
    const mapped = STATUS_MAP[status] || '(未マッピング→estimating)';
    console.log(`  "${status}": ${count}件 → ${mapped}`);
  }

  if (unmappedStatuses.size > 0) {
    console.log(`\n⚠️ 未マッピングステータス: ${Array.from(unmappedStatuses).join(', ')}`);
    console.log('  → デフォルト "estimating" にマッピングします');
  }
  console.log('');

  // 4. データ変換
  const projects = kintoneRecords.map(record => {
    const kintoneStatus = record.Status?.value || '';
    const statusCode = STATUS_MAP[kintoneStatus] || 'estimating';
    const statusId = statusMap.get(statusCode) || defaultStatusId;

    const projectCode = record.PJ_code?.value || '';
    const startDate = record.Start_date?.value || null;
    const dueDate = record.Due_date?.value || null;

    return {
      project_code: projectCode || `KT-${record.$id.value}`,
      project_name: record.PjName?.value || record.Customer?.value || '-',
      description: record.Description?.value || null,
      status_id: statusId,
      customer_code: record.Cs_ID?.value || null,
      customer_name: record.Customer?.value || null,
      work_no: record.WorkNo?.value || null,
      start_date: startDate || null,
      due_date: dueDate || null,
    };
  });

  console.log('サンプルデータ:');
  console.log(JSON.stringify(projects.slice(0, 3), null, 2));
  console.log('');

  // 5. Supabaseにupsert（project_codeをキーに）
  console.log('Supabase にアップサート中...');

  // バッチ処理（50件ずつ）
  const batchSize = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < projects.length; i += batchSize) {
    const batch = projects.slice(i, i + batchSize);

    const { error } = await supabase
      .from('projects')
      .upsert(batch, { onConflict: 'project_code' });

    if (error) {
      console.error(`バッチ ${i}-${i + batch.length} エラー:`, error);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  console.log(`\n挿入成功: ${inserted}件, エラー: ${errors}件`);

  // 6. 確認
  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });

  console.log(`\n=== 移行完了！Supabase projects テーブル: ${count} 件 ===`);
}

migrate().catch(console.error);
