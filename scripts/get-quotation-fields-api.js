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
  console.error('subdomain:', subdomain);
  console.error('apiToken exists:', !!apiToken);
  process.exit(1);
}

// アプリのフォームフィールド情報を取得
const postData = JSON.stringify({
  app: appId
});

const options = {
  hostname: `${subdomain}.cybozu.com`,
  port: 443,
  path: '/k/v1/app/form/fields.json',
  method: 'GET',
  headers: {
    'X-Cybozu-API-Token': apiToken,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
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
      
      if (res.statusCode === 200 && response.properties) {
        console.log('=== 見積もり管理アプリのフィールド一覧 ===\n');
        console.log(`アプリID: ${appId}`);
        console.log(`サブドメイン: ${subdomain}\n`);
        
        const fields = [];
        for (const [fieldCode, field] of Object.entries(response.properties)) {
          // システムフィールドとレイアウト要素を除外
          if (!['RECORD_NUMBER', 'CREATED_TIME', 'UPDATED_TIME', 'CREATOR', 'MODIFIER', 'STATUS_ASSIGNEE'].includes(field.type) &&
              !['LABEL', 'SPACER', 'HR', 'GROUP'].includes(field.type)) {
            fields.push({
              code: fieldCode,
              label: field.label,
              type: field.type,
              required: field.required || false,
              unique: field.unique || false,
              options: field.options || null,
              lookup: field.lookup || null
            });
          }
        }
        
        // タイプごとにグループ化
        const groupedFields = {};
        fields.forEach(field => {
          if (!groupedFields[field.type]) {
            groupedFields[field.type] = [];
          }
          groupedFields[field.type].push(field);
        });
        
        // タイプごとに出力
        for (const [type, typeFields] of Object.entries(groupedFields)) {
          console.log(`\n--- ${type} フィールド ---`);
          typeFields.forEach(field => {
            console.log(`${field.code}: ${field.label}${field.required ? ' (必須)' : ''}${field.unique ? ' (重複禁止)' : ''}`);
            
            // ドロップダウンの選択肢を表示
            if (field.options && ['DROP_DOWN', 'RADIO_BUTTON', 'CHECK_BOX', 'MULTI_SELECT'].includes(field.type)) {
              console.log(`  選択肢: ${Object.keys(field.options).join(', ')}`);
            }
            
            // ルックアップ情報を表示
            if (field.lookup) {
              console.log(`  ルックアップ: アプリ${field.lookup.relatedApp.app} - ${field.lookup.relatedApp.code}フィールド`);
            }
          });
        }
        
        // TypeScript型定義の生成
        console.log('\n\n=== TypeScript型定義（完全版） ===\n');
        console.log('export interface QuotationRecord extends KintoneRecord {');
        
        fields.forEach(field => {
          const optional = field.required ? '' : '?';
          const typeMap = {
            'SINGLE_LINE_TEXT': 'string',
            'MULTI_LINE_TEXT': 'string',
            'RICH_TEXT': 'string',
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
            'ORGANIZATION_SELECT': 'Array<{ code: string; name: string }>',
            'GROUP_SELECT': 'Array<{ code: string; name: string }>',
            'STATUS': 'string',
            'FILE': 'Array<{ fileKey: string; name: string; contentType: string; size: string }>',
            'LINK': 'string',
            'SUBTABLE': 'any[]' // サブテーブルは別途定義が必要
          };
          
          const valueType = typeMap[field.type] || 'any';
          const sanitizedCode = field.code.replace(/-/g, '_');
          
          // コメントに追加情報を含める
          let comment = field.label;
          if (field.options) {
            comment += ` [${Object.keys(field.options).join(', ')}]`;
          }
          
          console.log(`  ${sanitizedCode}${optional}: { type: "${field.type}"; value: ${valueType} }; // ${comment}`);
        });
        
        console.log('}');
        
        // 新規登録・編集画面用の情報
        console.log('\n\n=== 新規登録・編集画面用情報 ===\n');
        console.log('必須フィールド:');
        fields.filter(f => f.required).forEach(field => {
          console.log(`- ${field.code} (${field.label})`);
        });
        
        console.log('\n重複禁止フィールド:');
        fields.filter(f => f.unique).forEach(field => {
          console.log(`- ${field.code} (${field.label})`);
        });
        
        console.log('\nドロップダウンフィールドと選択肢:');
        fields.filter(f => f.type === 'DROP_DOWN' && f.options).forEach(field => {
          console.log(`- ${field.code} (${field.label}): ${Object.keys(field.options).join(', ')}`);
        });
        
      } else {
        console.error('APIエラー:', res.statusCode, response);
      }
    } catch (error) {
      console.error('パースエラー:', error);
      console.error('レスポンス:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('リクエストエラー:', error);
});

// リクエストボディを送信
req.write(postData);
req.end();