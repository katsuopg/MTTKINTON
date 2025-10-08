import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const KINTONE_DOMAIN = process.env.KINTONE_DOMAIN;
const KINTONE_API_TOKEN = process.env.KINTONE_API_TOKEN_INVOICE;
const INVOICE_APP_ID = process.env.KINTONE_APP_INVOICE_MANAGEMENT || '26';

if (!KINTONE_DOMAIN || !KINTONE_API_TOKEN) {
  console.error('必要な環境変数が設定されていません');
  process.exit(1);
}

async function getAllRecords() {
  const allRecords = [];
  let offset = 0;
  const limit = 500;
  
  while (true) {
    const query = `order by $id asc limit ${limit} offset ${offset}`;
    const response = await fetch(
      `https://${KINTONE_DOMAIN}/k/v1/records.json?app=${INVOICE_APP_ID}&query=${encodeURIComponent(query)}`,
      {
        headers: {
          'X-Cybozu-API-Token': KINTONE_API_TOKEN,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`検索エラー: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const records = data.records;
    
    if (records.length === 0) {
      break;
    }
    
    allRecords.push(...records);
    console.log(`取得済み: ${allRecords.length}件`);
    
    offset += limit;
  }
  
  return allRecords;
}

async function searchAll64116() {
  try {
    console.log('全請求書データを取得中...');
    const allRecords = await getAllRecords();
    console.log(`\n全レコード数: ${allRecords.length}件`);
    
    // 空でないWork_Noをカウント
    const nonEmptyWorkNo = allRecords.filter(record => record.Work_No?.value);
    console.log(`Work_Noが入力されているレコード数: ${nonEmptyWorkNo.length}件`);
    
    // 64-116を含むレコードを探す
    const matches64116 = allRecords.filter((record: any) => {
      const workNo = record.Work_No?.value || '';
      return workNo.includes('64-116');
    });
    
    console.log(`\n"64-116"を含むレコード数: ${matches64116.length}件`);
    
    if (matches64116.length > 0) {
      // Work_Noでグループ化
      const workNoGroups = new Map<string, number>();
      matches64116.forEach(record => {
        const workNo = record.Work_No.value;
        workNoGroups.set(workNo, (workNoGroups.get(workNo) || 0) + 1);
      });
      
      console.log('\nWork_No別の内訳:');
      Array.from(workNoGroups.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(0, 50) // 最初の50種類まで表示
        .forEach(([workNo, count]) => {
          console.log(` - ${workNo} (${count}件)`);
        });
        
      // "64-116 SSK"を含むものを特定
      const sskMatches = Array.from(workNoGroups.keys()).filter(workNo => workNo.includes('64-116 SSK'));
      if (sskMatches.length > 0) {
        console.log('\n"64-116 SSK"を含むWork_No:');
        sskMatches.forEach(workNo => {
          const count = workNoGroups.get(workNo) || 0;
          console.log(` - ${workNo} (${count}件)`);
        });
        
        // 合計件数
        const totalSSK = sskMatches.reduce((sum, workNo) => sum + (workNoGroups.get(workNo) || 0), 0);
        console.log(`\n"64-116 SSK"を含む合計レコード数: ${totalSSK}件`);
      } else {
        console.log('\n"64-116 SSK"を含むレコードはありませんでした');
      }
    }

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// 実行
searchAll64116();