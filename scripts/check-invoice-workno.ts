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

async function checkInvoiceWorkNo() {
  try {
    // 64-116を含むWork_Noを検索
    const query = 'Work_No like "64-116"';
    console.log('検索クエリ:', query);
    
    const response = await fetch(
      `https://${KINTONE_DOMAIN}/k/v1/records.json?app=${INVOICE_APP_ID}&query=${encodeURIComponent(query + ' order by $id asc limit 100')}`,
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
    
    console.log(`\n64-116を含むレコード数: ${records.length}件\n`);
    
    if (records.length > 0) {
      console.log('Work_Noの一覧:');
      // Work_Noの値でグループ化してカウント
      const workNoCounts = new Map<string, number>();
      
      records.forEach((record: any) => {
        const workNo = record.Work_No?.value || '';
        if (workNo) {
          workNoCounts.set(workNo, (workNoCounts.get(workNo) || 0) + 1);
        }
      });
      
      // ソートして表示
      Array.from(workNoCounts.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([workNo, count]) => {
          console.log(` - ${workNo} (${count}件)`);
        });
        
      // 64-116 SSKを含むものを特定
      console.log('\n"64-116 SSK"を含むもの:');
      Array.from(workNoCounts.keys())
        .filter(workNo => workNo.includes('64-116 SSK'))
        .forEach(workNo => {
          console.log(` - ${workNo}`);
        });
    }

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// 実行
checkInvoiceWorkNo();