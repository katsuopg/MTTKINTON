import { KintoneRecordsResponse, CostRecord, KINTONE_APPS } from '@/types/kintone';
import { KintoneClient } from '@/lib/kintone/client';

const API_TOKEN = process.env.KINTONE_API_TOKEN_COST!;
const APP_ID = KINTONE_APPS.COST_MANAGEMENT.appId;

// KintoneClientインスタンスを作成
const costClient = new KintoneClient(APP_ID.toString(), API_TOKEN);

// 比較用WorkNoクライアント（デバッグ用）
const workNoClient = new KintoneClient('21', process.env.KINTONE_API_TOKEN_WORKNO!);

/**
 * コスト管理レコードを取得
 */
export async function getCostRecords(
  query?: string,
  limit: number = 100,
  offset: number = 0
): Promise<KintoneRecordsResponse<CostRecord>> {
  
  try {
    const queryStr = query || (limit ? `limit ${limit}` : '');
    const costRecords = await costClient.getRecords<CostRecord>(queryStr);
    
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
  const url = `https://${KINTONE_DOMAIN}/k/v1/record.json`;
  
  const params = new URLSearchParams({
    app: APP_ID.toString(),
    id: recordId,
  });

  const response = await fetch(`${url}?${params}`, {
    method: 'GET',
    headers: {
      'X-Cybozu-API-Token': API_TOKEN,
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

