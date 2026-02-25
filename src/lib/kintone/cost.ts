import { KintoneRecordsResponse, CostRecord, KINTONE_APPS } from '@/types/kintone';
import { KintoneClient } from '@/lib/kintone/client';

const APP_ID = KINTONE_APPS.COST_MANAGEMENT.appId;

function getCostClient() {
  return new KintoneClient(APP_ID.toString(), process.env.KINTONE_API_TOKEN_COST!);
}

/**
 * コスト管理レコードを取得
 * queryを省略すると全件取得（KintoneClientの自動ページネーション）
 */
export async function getCostRecords(
  query?: string
): Promise<KintoneRecordsResponse<CostRecord>> {

  try {
    const costRecords = await getCostClient().getRecords<CostRecord>(query);

    return { records: costRecords };

  } catch (error) {
    console.error('Cost Management API Error:', error);
    throw new Error(`Failed to fetch cost records: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 特定のコストレコードを取得
 */
export async function getCostRecord(recordId: string): Promise<CostRecord> {
  const domain = process.env.KINTONE_DOMAIN!;
  const apiToken = process.env.KINTONE_API_TOKEN_COST!;
  const url = `https://${domain}/k/v1/record.json`;

  const params = new URLSearchParams({
    app: APP_ID.toString(),
    id: recordId,
  });

  const response = await fetch(`${url}?${params}`, {
    method: 'GET',
    headers: {
      'X-Cybozu-API-Token': apiToken,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch cost record: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.record;
}

/**
 * 工事番号でコストレコードを検索
 */
export async function getCostRecordsByWorkNo(workNo: string): Promise<KintoneRecordsResponse<CostRecord>> {
  const query = `文字列__1行__15 = "${workNo}" order by レコード番号 desc`;
  return getCostRecords(query);
}

