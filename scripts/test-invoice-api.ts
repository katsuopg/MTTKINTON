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

async function testInvoiceAPI() {
  try {
    // 最初の5件を取得してデータ構造を確認
    const query = 'order by $id desc limit 5';
    console.log('=== Invoice Management API Test ===');
    console.log('Domain:', KINTONE_DOMAIN);
    console.log('App ID:', INVOICE_APP_ID);
    console.log('Query:', query);
    console.log('');
    
    const response = await fetch(
      `https://${KINTONE_DOMAIN}/k/v1/records.json?app=${INVOICE_APP_ID}&query=${encodeURIComponent(query)}`,
      {
        headers: {
          'X-Cybozu-API-Token': KINTONE_API_TOKEN,
        },
      }
    );

    console.log('Response Status:', response.status);
    console.log('Response OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error Response:', errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('\n=== API Response ===');
    console.log('Records Count:', data.records?.length || 0);
    
    if (data.records && data.records.length > 0) {
      console.log('\n=== First Record Structure ===');
      const firstRecord = data.records[0];
      
      // フィールド名と値を表示
      Object.entries(firstRecord).forEach(([fieldCode, field]: [string, any]) => {
        if (field && typeof field === 'object' && 'value' in field) {
          const value = field.value || '(空)';
          console.log(`${fieldCode}: ${typeof value === 'string' ? value.substring(0, 50) : JSON.stringify(value).substring(0, 50)}`);
        }
      });
      
      // 特定フィールドの詳細確認
      console.log('\n=== Key Fields ===');
      console.log('文字列__1行_:', firstRecord.文字列__1行_?.value || 'フィールドなし');
      console.log('文字列__1行__0:', firstRecord.文字列__1行__0?.value || 'フィールドなし');
      console.log('日付:', firstRecord.日付?.value || 'フィールドなし');
      console.log('文字列__1行__3:', firstRecord.文字列__1行__3?.value || 'フィールドなし');
      console.log('CS_name:', firstRecord.CS_name?.value || 'フィールドなし');
      console.log('total:', firstRecord.total?.value || 'フィールドなし');
      console.log('計算:', firstRecord.計算?.value || 'フィールドなし');
      console.log('ラジオボタン:', firstRecord.ラジオボタン?.value || 'フィールドなし');
    }

  } catch (error) {
    console.error('\n=== Error ===');
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    console.error('Full Error:', error);
  }
}

// 実行
testInvoiceAPI();