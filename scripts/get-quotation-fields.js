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

// フィールド情報を取得
const options = {
  hostname: `${subdomain}.cybozu.com`,
  port: 443,
  path: `/k/v1/app/form/fields.json?app=${appId}`,
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
      
      if (response.properties) {
        console.log('=== 見積もり管理アプリのフィールド一覧 ===\n');
        
        const fields = [];
        for (const [fieldCode, field] of Object.entries(response.properties)) {
          // ラベルフィールドやスペーサーなどは除外
          if (field.type !== 'LABEL' && field.type !== 'SPACER' && field.type !== 'GROUP') {
            fields.push({
              code: fieldCode,
              label: field.label,
              type: field.type,
              required: field.required || false,
              options: field.options || null
            });
          }
        }
        
        // タイプごとにグループ化
        const groupedFields = {
          'SINGLE_LINE_TEXT': [],
          'MULTI_LINE_TEXT': [],
          'NUMBER': [],
          'CALC': [],
          'DATE': [],
          'TIME': [],
          'DATETIME': [],
          'DROP_DOWN': [],
          'RADIO_BUTTON': [],
          'CHECK_BOX': [],
          'MULTI_SELECT': [],
          'USER_SELECT': [],
          'STATUS': [],
          'SUBTABLE': [],
          'FILE': [],
          'LINK': [],
          'OTHER': []
        };
        
        fields.forEach(field => {
          if (groupedFields[field.type]) {
            groupedFields[field.type].push(field);
          } else {
            groupedFields.OTHER.push(field);
          }
        });
        
        // タイプごとに出力
        for (const [type, typeFields] of Object.entries(groupedFields)) {
          if (typeFields.length > 0) {
            console.log(`\n--- ${type} ---`);
            typeFields.forEach(field => {
              console.log(`${field.code}: ${field.label}${field.required ? ' (必須)' : ''}`);
              if (field.options) {
                console.log(`  選択肢: ${Object.keys(field.options).join(', ')}`);
              }
            });
          }
        }
        
        // TypeScript型定義の生成
        console.log('\n\n=== TypeScript型定義 ===\n');
        console.log('export interface QuotationRecord extends KintoneRecord {');
        fields.forEach(field => {
          const optional = field.required ? '' : '?';
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
            'LINK': 'string'
          };
          const valueType = typeMap[field.type] || 'any';
          console.log(`  ${field.code}${optional}: { type: "${field.type}"; value: ${valueType} }; // ${field.label}`);
        });
        console.log('}');
        
      } else {
        console.error('フィールド情報が取得できませんでした:', response);
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