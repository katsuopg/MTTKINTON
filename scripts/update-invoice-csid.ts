import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const KINTONE_DOMAIN = process.env.KINTONE_DOMAIN;
const KINTONE_API_TOKEN = process.env.KINTONE_API_TOKEN_INVOICE; // 請求書管理用APIトークン
const INVOICE_APP_ID = process.env.KINTONE_APP_INVOICE_MANAGEMENT || '26';

if (!KINTONE_DOMAIN || !KINTONE_API_TOKEN) {
  console.error('必要な環境変数が設定されていません');
  process.exit(1);
}

async function updateInvoiceCSID() {
  try {
    // 1. まず全件取得してからフィルタリング
    console.log('請求書データを取得中...');
    
    const searchResponse = await fetch(
      `https://${KINTONE_DOMAIN}/k/v1/records.json?app=${INVOICE_APP_ID}&query=${encodeURIComponent('order by $id asc limit 500')}`,
      {
        headers: {
          'X-Cybozu-API-Token': KINTONE_API_TOKEN,
        },
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`検索エラー: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    const allRecords = searchData.records;
    
    // Work_Noが "64-116 SSK-" で始まるレコードをフィルタ
    const records = allRecords.filter((record: any) => {
      const workNo = record.Work_No?.value || '';
      return workNo.startsWith('64-116 SSK-');
    });
    
    console.log(`全レコード数: ${allRecords.length}件`);
    console.log(`対象レコード数: ${records.length}件`);

    if (records.length === 0) {
      console.log('更新対象のレコードがありません');
      return;
    }

    // 2. レコードを更新（Work_Noを "64-116 SSK-" から "64-116-SSK-" に変更）
    const updates = records.map((record: any) => {
      const currentWorkNo = record.Work_No.value;
      const newWorkNo = currentWorkNo.replace('64-116 SSK-', '64-116-SSK-');
      
      console.log(`${currentWorkNo} → ${newWorkNo}`);
      
      return {
        id: record.$id.value,
        record: {
          Work_No: {
            value: newWorkNo
          }
        }
      };
    });

    // バッチ更新（100件ずつ）
    const batchSize = 100;
    let updatedCount = 0;

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      const updateResponse = await fetch(
        `https://${KINTONE_DOMAIN}/k/v1/records.json`,
        {
          method: 'PUT',
          headers: {
            'X-Cybozu-API-Token': KINTONE_API_TOKEN,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            app: INVOICE_APP_ID,
            records: batch,
          }),
        }
      );

      if (!updateResponse.ok) {
        const error = await updateResponse.text();
        throw new Error(`更新エラー: ${updateResponse.status} ${error}`);
      }

      updatedCount += batch.length;
      console.log(`更新完了: ${updatedCount}/${updates.length}件`);
    }

    console.log('\n✅ 全ての更新が完了しました！');
    console.log(`合計 ${updatedCount} 件のレコードで Work_No を "64-116 SSK-" から "64-116-SSK-" に更新しました`);

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// 実行
updateInvoiceCSID();