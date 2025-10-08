import { KintoneClient } from '@/lib/kintone/client';

// 注文書レコードの型定義
export interface OrderRecord {
  $id: { type: "__ID__"; value: string };
  レコード番号: { type: "RECORD_NUMBER"; value: string };
  文字列__1行_: { type: "SINGLE_LINE_TEXT"; value: string }; // PO番号
  文字列__1行__0: { type: "SINGLE_LINE_TEXT"; value: string }; // CS ID
  文字列__1行__2: { type: "SINGLE_LINE_TEXT"; value: string }; // 工事番号
  文字列__1行__4: { type: "SINGLE_LINE_TEXT"; value: string }; // 顧客名
  文字列__1行__7: { type: "SINGLE_LINE_TEXT"; value: string }; // 件名
  McItem: { type: "SINGLE_LINE_TEXT"; value: string }; // M/C ITEM
  文字列__1行__9: { type: "SINGLE_LINE_TEXT"; value: string }; // Model
  日付: { type: "DATE"; value: string }; // 注文日
  日付_0: { type: "DATE"; value: string }; // 見積日
  ルックアップ: { type: "SINGLE_LINE_TEXT"; value: string }; // 見積番号
  数値_3: { type: "NUMBER"; value: string }; // 値引き前金額
  数値_4: { type: "NUMBER"; value: string }; // 値引き額
  AF: { type: "NUMBER"; value: string }; // 値引き後金額
  amount: { type: "CALC"; value: string }; // 合計金額（税込）
  vat: { type: "CALC"; value: string }; // 消費税額
  Drop_down: { type: "DROP_DOWN"; value: string }; // ステータス
  添付ファイル: { type: "FILE"; value: Array<{
    fileKey: string;
    name: string;
    contentType: string;
    size: string;
  }> };
  更新日時: { type: "UPDATED_TIME"; value: string };
}

const APP_ID = process.env.KINTONE_APP_ORDER_MANAGEMENT || '';
const API_TOKEN = process.env.KINTONE_API_TOKEN_ORDER || '';

export async function getOrderRecordsByCustomer(customerId: string, fiscalPeriod?: string): Promise<OrderRecord[]> {
  const client = new KintoneClient(APP_ID, API_TOKEN);
  let query = `文字列__1行__0 = "${customerId}"`;
  
  // 会計期間の指定がある場合は、工事番号でフィルタリング
  if (fiscalPeriod) {
    query += ` and 文字列__1行__2 like "${fiscalPeriod}-"`;
  }
  
  query += ` order by 日付 desc limit 500`;
  
  try {
    const records = await client.getRecords<OrderRecord>(query);
    console.log(`Fetched ${records.length} order records for customer ${customerId} (Period: ${fiscalPeriod || 'all'})`);
    return records;
  } catch (error) {
    console.error('Error fetching order data:', error);
    return [];
  }
}