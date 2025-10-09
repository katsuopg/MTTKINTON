import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const KINTONE_DOMAIN = process.env.KINTONE_DOMAIN;
const KINTONE_API_TOKEN = process.env.KINTONE_API_TOKEN_INVOICE;
const INVOICE_APP_ID = process.env.KINTONE_APP_INVOICE_MANAGEMENT || '26';

if (!KINTONE_DOMAIN || !KINTONE_API_TOKEN) {
  console.error('環境変数 KINTONE_DOMAIN または KINTONE_API_TOKEN_INVOICE が設定されていません');
  process.exit(1);
}

type InvoiceRecord = {
  $id: { value: string };
  $revision?: { value: string };
  文字列__1行__3?: { value?: string };
  [key: string]: any;
};

async function fetchInvoicesByCustomerId(customerId: string): Promise<InvoiceRecord[]> {
  const results: InvoiceRecord[] = [];
  const limit = 500;
  let offset = 0;

  while (true) {
    const query = `文字列__1行__3 = "${customerId}" order by $id asc limit ${limit} offset ${offset}`;
    const response = await fetch(
      `https://${KINTONE_DOMAIN}/k/v1/records.json?app=${INVOICE_APP_ID}&query=${encodeURIComponent(query)}`,
      {
        headers: {
          'X-Cybozu-API-Token': KINTONE_API_TOKEN,
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`検索エラー (${customerId}): ${response.status} ${response.statusText} ${errorBody}`);
    }

    const data = await response.json();
    const records: InvoiceRecord[] = data.records ?? [];
    results.push(...records);

    if (records.length < limit) {
      break;
    }
    offset += limit;
  }

  return results;
}

async function updateInvoiceRecords(updates: { id: string; revision?: string; newCustomerId: string }[]) {
  const batchSize = 100;
  let processed = 0;

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    const body = {
      app: INVOICE_APP_ID,
      records: batch.map((item) => ({
        id: item.id,
        revision: item.revision,
        record: {
          文字列__1行__3: {
            value: item.newCustomerId,
          },
          Lookup: {
            value: item.newCustomerId,
          },
        },
      })),
    };

    const response = await fetch(`https://${KINTONE_DOMAIN}/k/v1/records.json`, {
      method: 'PUT',
      headers: {
        'X-Cybozu-API-Token': KINTONE_API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`更新エラー: ${response.status} ${response.statusText} ${errorBody}`);
    }

    processed += batch.length;
    console.log(`  更新完了: ${processed}/${updates.length}件`);
  }
}

async function main() {
  const corrections = [
    {
      oldId: '57-012-MNB-Lopburi',
      newId: null,
      description: 'NMB-MINEBEA THAI LIMITED Lopburi (delete outdated records)',
    },
    {
      oldId: '66-141-SVPT',
      newId: '66-142-SVPT',
      description: 'SERVICE PRESS (THAILAND) COMPANY LIMITED',
    },
  ];

  for (const correction of corrections) {
    console.log(`\n=== ${correction.description} ===`);
    console.log(`旧CS ID: ${correction.oldId}`);
    console.log(`新CS ID: ${correction.newId}`);

    const records = await fetchInvoicesByCustomerId(correction.oldId);
    console.log(`対象レコード数: ${records.length}件`);

    if (records.length === 0) {
      console.log('更新対象のレコードはありません。');
      continue;
    }

    if (correction.newId === null) {
      const ids = records.map((record) => record.$id.value);
      const response = await fetch(`https://${KINTONE_DOMAIN}/k/v1/records.json`, {
        method: 'DELETE',
        headers: {
          'X-Cybozu-API-Token': KINTONE_API_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app: INVOICE_APP_ID,
          ids,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`削除エラー: ${response.status} ${response.statusText} ${errorBody}`);
      }

      console.log(`🗑️  ${records.length} 件のレコードを削除しました`);
      continue;
    }

    const updates = records.map((record) => ({
      id: record.$id.value,
      revision: record.$revision?.value,
      newCustomerId: correction.newId!,
    }));

    await updateInvoiceRecords(updates);
    console.log(`✅ ${records.length} 件のCS IDを更新しました`);
  }

  console.log('\nすべての指定CS IDの更新が完了しました。');
}

main().catch((error) => {
  console.error('処理中にエラーが発生しました:', error);
  process.exit(1);
});
