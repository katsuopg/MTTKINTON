/**
 * 顧客レコードのCs_Nameフィールドを更新するスクリプト
 *
 * CS ID (文字列__1行_) から数字とハイフンを削除してCs_Nameに転記
 * 例: 55-001-MGT → MGT, 57-012-MNB-LP → MNB-LP
 *
 * 使用方法:
 * npx tsx scripts/update-customer-cs-name.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const KINTONE_DOMAIN = process.env.KINTONE_DOMAIN!;
const KINTONE_API_TOKEN = process.env.KINTONE_API_TOKEN_CUSTOMER!;
const CUSTOMER_APP_ID = '7';

interface KintoneRecord {
  $id: { value: string };
  文字列__1行_: { value: string }; // CS ID
  会社名?: { value: string };
  Cs_Name?: { value: string };
  Cs_Name_Th?: { value: string };
}

interface KintoneResponse {
  records: KintoneRecord[];
  totalCount?: string;
}

/**
 * CS IDから短縮名を抽出
 * 55-001-MGT → MGT
 * 57-012-MNB-LP → MNB-LP
 */
function extractCsName(csId: string): string {
  if (!csId) return '';

  // パターン: XX-XXX- (2桁数字-3桁数字-)を削除
  // 例: "55-001-MGT" → "MGT"
  // 例: "57-012-MNB-LP" → "MNB-LP"
  const match = csId.match(/^\d{2}-\d{3}-(.+)$/);
  if (match) {
    return match[1];
  }

  // パターンに一致しない場合は元の値を返す
  return csId;
}

async function getCustomerRecords(): Promise<KintoneRecord[]> {
  const allRecords: KintoneRecord[] = [];
  let offset = 0;
  const limit = 500;

  while (true) {
    const query = `order by $id asc limit ${limit} offset ${offset}`;
    const url = `https://${KINTONE_DOMAIN}/k/v1/records.json?app=${CUSTOMER_APP_ID}&query=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        'X-Cybozu-API-Token': KINTONE_API_TOKEN,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kintone API error: ${response.status} - ${error}`);
    }

    const data: KintoneResponse = await response.json();
    allRecords.push(...data.records);

    if (data.records.length < limit) {
      break;
    }
    offset += limit;
  }

  return allRecords;
}

async function updateRecord(recordId: string, csName: string): Promise<void> {
  const url = `https://${KINTONE_DOMAIN}/k/v1/record.json`;

  const body = {
    app: CUSTOMER_APP_ID,
    id: recordId,
    record: {
      Cs_Name: { value: csName },
    },
  };

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'X-Cybozu-API-Token': KINTONE_API_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update record ${recordId}: ${response.status} - ${error}`);
  }
}

async function main() {
  console.log('=== Cs_Name更新スクリプト ===\n');

  if (!KINTONE_DOMAIN || !KINTONE_API_TOKEN) {
    console.error('環境変数が設定されていません: KINTONE_DOMAIN, KINTONE_API_TOKEN_CUSTOMER');
    process.exit(1);
  }

  console.log('顧客レコードを取得中...');
  const records = await getCustomerRecords();
  console.log(`取得完了: ${records.length}件\n`);

  // 変換プレビュー
  console.log('=== 変換プレビュー（最初の10件） ===');
  const previewRecords = records.slice(0, 10);
  for (const record of previewRecords) {
    const csId = record.文字列__1行_?.value || '';
    const csName = extractCsName(csId);
    const currentCsName = record.Cs_Name?.value || '';
    console.log(`  ${csId} → ${csName} (現在: ${currentCsName || '未設定'})`);
  }
  console.log('...\n');

  // 全レコードの変換リスト
  const updateList = records
    .filter(record => {
      const csId = record.文字列__1行_?.value || '';
      const csName = extractCsName(csId);
      const currentCsName = record.Cs_Name?.value || '';
      // 空でなく、かつ現在値と異なる場合のみ更新
      return csName && csName !== currentCsName;
    })
    .map(record => ({
      id: record.$id.value,
      csId: record.文字列__1行_?.value || '',
      csName: extractCsName(record.文字列__1行_?.value || ''),
      companyName: record.会社名?.value || '',
    }));

  console.log(`更新対象: ${updateList.length}件\n`);

  if (updateList.length === 0) {
    console.log('更新対象がありません。');
    return;
  }

  // ユーザー確認
  console.log('更新を開始しますか？ (y/n)');
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise<string>((resolve) => {
    rl.question('> ', resolve);
  });
  rl.close();

  if (answer.toLowerCase() !== 'y') {
    console.log('キャンセルしました。');
    return;
  }

  // 更新実行
  console.log('\n更新を開始します...\n');
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < updateList.length; i++) {
    const item = updateList[i];
    try {
      await updateRecord(item.id, item.csName);
      successCount++;
      if ((i + 1) % 10 === 0 || i === updateList.length - 1) {
        console.log(`進捗: ${i + 1}/${updateList.length} (成功: ${successCount}, エラー: ${errorCount})`);
      }
      // APIレート制限を避けるため少し待機
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      errorCount++;
      console.error(`エラー: ${item.csId} (ID: ${item.id}) - ${error}`);
    }
  }

  console.log('\n=== 完了 ===');
  console.log(`成功: ${successCount}件`);
  console.log(`エラー: ${errorCount}件`);
}

main().catch(console.error);
