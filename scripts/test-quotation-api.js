const { KintoneClient } = require('../dist/lib/kintone/client');

async function testQuotationAPI() {
  try {
    const client = new KintoneClient('8', process.env.KINTONE_API_TOKEN_QUOTATION || 'OQMvIddi4sGCbCtld2xCXQEHGwNRWnE0WNPYgNpK');
    
    // 1件だけレコードを取得
    const records = await client.getRecords('limit 1');
    
    if (records && records.length > 0) {
      const record = records[0];
      console.log('=== 見積もり管理アプリの実際のフィールド ===\n');
      
      // フィールドコードのみリスト化
      const fields = Object.keys(record).filter(key => key !== '$id' && key !== '$revision');
      
      console.log('フィールドコード一覧：');
      fields.forEach(fieldCode => {
        const field = record[fieldCode];
        const sampleValue = field.value;
        const valueStr = typeof sampleValue === 'object' ? JSON.stringify(sampleValue).substring(0, 50) : sampleValue;
        console.log(`- ${fieldCode} (${field.type}): ${valueStr || '(空)'}`);
      });
    }
  } catch (error) {
    console.error('エラー:', error);
  }
}

// Next.js環境変数をセット
process.env.NEXT_PUBLIC_KINTONE_SUBDOMAIN = 'md34y';
process.env.KINTONE_DOMAIN = 'md34y.cybozu.com';
process.env.KINTONE_API_TOKEN_QUOTATION = 'OQMvIddi4sGCbCtld2xCXQEHGwNRWnE0WNPYgNpK';

testQuotationAPI();