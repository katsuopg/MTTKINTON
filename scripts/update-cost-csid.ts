import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const KINTONE_DOMAIN = process.env.KINTONE_DOMAIN;
const KINTONE_API_TOKEN = process.env.KINTONE_API_TOKEN_COST; // コスト管理用APIトークン
const COST_APP_ID = process.env.KINTONE_APP_COST_MANAGEMENT || '88';

if (!KINTONE_DOMAIN || !KINTONE_API_TOKEN) {
  console.error('必要な環境変数が設定されていません');
  process.exit(1);
}

async function updateCostCSID() {
  try {
    // 1. CS IDが "64-116 SSK" のレコードを検索
    const searchQuery = '文字列__1行__2 = "64-116 SSK"';
    console.log('検索クエリ:', searchQuery);
    
    const searchResponse = await fetch(
      `https://${KINTONE_DOMAIN}/k/v1/records.json?app=${COST_APP_ID}&query=${encodeURIComponent(searchQuery)}`,
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
    const records = searchData.records;
    
    console.log(`対象レコード数: ${records.length}件`);

    if (records.length === 0) {
      console.log('更新対象のレコードがありません');
      return;
    }

    // 2. レコードを更新
    const updates = records.map((record: any) => ({
      id: record.$id.value,
      record: {
        文字列__1行__2: {
          value: '64-116-SSK'
        }
      }
    }));

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
            app: COST_APP_ID,
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
    console.log(`合計 ${updatedCount} 件のレコードで CS ID を "64-116 SSK" から "64-116-SSK" に更新しました`);

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// 実行
updateCostCSID();