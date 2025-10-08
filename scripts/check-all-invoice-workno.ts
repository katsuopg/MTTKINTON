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

async function checkAllInvoiceWorkNo() {
  try {
    // 最初の100件を取得
    const response = await fetch(
      `https://${KINTONE_DOMAIN}/k/v1/records.json?app=${INVOICE_APP_ID}&query=${encodeURIComponent('order by $id asc limit 100')}`,
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
    
    console.log(`取得したレコード数: ${records.length}件\n`);
    
    if (records.length > 0) {
      console.log('最初の20件のWork_No:');
      records.slice(0, 20).forEach((record: any, index: number) => {
        const workNo = record.Work_No?.value || '(空)';
        console.log(` ${index + 1}. ${workNo}`);
      });
      
      // 64-116を含むレコードを探す
      console.log('\n64-116を含むWork_No:');
      const matches = records.filter((record: any) => {
        const workNo = record.Work_No?.value || '';
        return workNo.includes('64-116');
      });
      
      if (matches.length > 0) {
        matches.forEach((record: any) => {
          console.log(` - ${record.Work_No.value}`);
        });
      } else {
        console.log('見つかりませんでした');
      }
      
      // 64-116 SSKを含むレコードを探す
      console.log('\n"64-116 SSK"を含むWork_No:');
      const sskMatches = records.filter((record: any) => {
        const workNo = record.Work_No?.value || '';
        return workNo.includes('64-116 SSK');
      });
      
      if (sskMatches.length > 0) {
        sskMatches.forEach((record: any) => {
          console.log(` - ${record.Work_No.value}`);
        });
      } else {
        console.log('見つかりませんでした');
      }
    }

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// 実行
checkAllInvoiceWorkNo();