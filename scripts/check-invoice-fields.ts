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

async function checkInvoiceFields() {
  try {
    // 最初の5件を取得してフィールド構造を確認
    const response = await fetch(
      `https://${KINTONE_DOMAIN}/k/v1/records.json?app=${INVOICE_APP_ID}&query=${encodeURIComponent('order by $id desc limit 5')}`,
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
      console.log('=== 最初のレコードのフィールド一覧 ===');
      const firstRecord = records[0];
      
      // フィールド名と値を表示
      Object.entries(firstRecord).forEach(([fieldCode, field]: [string, any]) => {
        if (field && typeof field === 'object' && 'value' in field) {
          const value = field.value || '(空)';
          console.log(`${fieldCode}: ${JSON.stringify(value).substring(0, 100)}`);
        }
      });
      
      console.log('\n=== 全レコードの主要フィールド ===');
      records.forEach((record: any, index: number) => {
        console.log(`\nレコード${index + 1}:`);
        console.log(` ID: ${record.$id?.value}`);
        console.log(` Work_No: ${record.Work_No?.value || '(空)'}`);
        console.log(` INV_NO: ${record.INV_NO?.value || '(空)'}`);
        console.log(` INV_DATE: ${record.INV_DATE?.value || '(空)'}`);
        
        // 64-116を含むフィールドを探す
        Object.entries(record).forEach(([fieldCode, field]: [string, any]) => {
          if (field && typeof field === 'object' && 'value' in field) {
            const value = String(field.value || '');
            if (value.includes('64-116')) {
              console.log(` ★ ${fieldCode}: ${value}`);
            }
          }
        });
      });
    }

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// 実行
checkInvoiceFields();