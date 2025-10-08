const https = require('https');
const fs = require('fs');
const path = require('path');

// .env.localから環境変数を読み込む
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
  }
});

const domain = envVars.KINTONE_DOMAIN;
const subdomain = domain ? domain.split('.')[0] : null;
const appId = envVars.KINTONE_APP_QUOTATION || '8';
const apiToken = envVars.KINTONE_API_TOKEN_QUOTATION;

if (!subdomain || !apiToken) {
  console.error('必要な環境変数が設定されていません');
  process.exit(1);
}

// レコードを1件取得してフィールドを確認
const options = {
  hostname: `${subdomain}.cybozu.com`,
  port: 443,
  path: `/k/v1/records.json?app=${appId}&query=${encodeURIComponent('limit 1')}`,
  method: 'GET',
  headers: {
    'X-Cybozu-API-Token': apiToken,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.records && response.records.length > 0) {
        const record = response.records[0];
        console.log('=== 見積もり管理アプリのフィールド一覧（レコードサンプルから取得） ===\n');
        
        const fields = [];
        for (const [fieldCode, field] of Object.entries(record)) {
          fields.push({
            code: fieldCode,
            type: field.type,
            value: field.value,
            sample: typeof field.value === 'object' ? JSON.stringify(field.value).substring(0, 50) + '...' : field.value
          });
        }
        
        // タイプごとにグループ化して出力
        const groupedFields = {};
        fields.forEach(field => {
          if (!groupedFields[field.type]) {
            groupedFields[field.type] = [];
          }
          groupedFields[field.type].push(field);
        });
        
        for (const [type, typeFields] of Object.entries(groupedFields)) {
          console.log(`\n--- ${type} ---`);
          typeFields.forEach(field => {
            console.log(`${field.code}: ${field.sample || '(空)'}`);
          });
        }
        
        // TypeScript型定義の更新案
        console.log('\n\n=== TypeScript型定義（更新案） ===\n');
        console.log('export interface QuotationRecord extends KintoneRecord {');
        
        // 既知のフィールドは除外
        const knownFields = ['$id', '$revision', 'レコード番号', '作成者', '作成日時', '更新者', '更新日時'];
        
        fields.filter(f => !knownFields.includes(f.code)).forEach(field => {
          const typeMap = {
            'SINGLE_LINE_TEXT': 'string',
            'MULTI_LINE_TEXT': 'string',
            'NUMBER': 'string',
            'CALC': 'string',
            'DATE': 'string',
            'TIME': 'string',
            'DATETIME': 'string',
            'DROP_DOWN': 'string',
            'RADIO_BUTTON': 'string',
            'CHECK_BOX': 'string[]',
            'MULTI_SELECT': 'string[]',
            'USER_SELECT': 'Array<{ code: string; name: string }>',
            'STATUS': 'string',
            'FILE': 'any[]',
            'LINK': 'string',
            'SUBTABLE': 'Array<{ id: string; value: any }>'
          };
          const valueType = typeMap[field.type] || 'any';
          const fieldCode = field.code.replace(/-/g, '_').replace(/\./g, '_');
          console.log(`  ${fieldCode}?: { type: "${field.type}"; value: ${valueType} };`);
        });
        console.log('}');
        
      } else {
        console.error('レコードが取得できませんでした:', response);
      }
    } catch (error) {
      console.error('エラー:', error);
      console.error('レスポンス:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('リクエストエラー:', error);
});

req.end();