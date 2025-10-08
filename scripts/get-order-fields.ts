const dotenv = require('dotenv');
const path = require('path');

// .env.localファイルを読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const KINTONE_DOMAIN = process.env.KINTONE_DOMAIN;
const API_TOKEN = process.env.KINTONE_API_TOKEN_ORDER;
const APP_ID = process.env.KINTONE_APP_ORDER_MANAGEMENT;

async function getOrderFields() {
  if (!KINTONE_DOMAIN || !API_TOKEN || !APP_ID) {
    console.error('環境変数が設定されていません');
    return;
  }

  try {
    // フィールド情報を取得
    const response = await fetch(
      `https://${KINTONE_DOMAIN}/k/v1/app/form/fields.json?app=${APP_ID}`,
      {
        method: 'GET',
        headers: {
          'X-Cybozu-API-Token': API_TOKEN,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('=== Order Management (注文書管理) App Fields ===');
    console.log(`App ID: ${APP_ID}`);
    console.log('\nフィールド一覧:');
    
    // フィールドを整理して表示
    const fields: any[] = [];
    
    Object.entries(data.properties).forEach(([fieldCode, fieldInfo]: [string, any]) => {
      if (fieldInfo.type === 'SUBTABLE') {
        console.log(`\n[サブテーブル] ${fieldCode}:`);
        if (fieldInfo.fields) {
          Object.entries(fieldInfo.fields).forEach(([subFieldCode, subFieldInfo]: [string, any]) => {
            console.log(`  - ${subFieldCode}: ${subFieldInfo.type} (${subFieldInfo.label})`);
          });
        }
      } else {
        fields.push({
          code: fieldCode,
          type: fieldInfo.type,
          label: fieldInfo.label
        });
      }
    });
    
    // 通常フィールドを表示
    fields.sort((a, b) => a.code.localeCompare(b.code));
    fields.forEach(field => {
      console.log(`${field.code}: ${field.type} (${field.label})`);
    });

    // 最初のレコードを取得してフィールド値を確認
    console.log('\n=== サンプルレコード ===');
    const recordResponse = await fetch(
      `https://${KINTONE_DOMAIN}/k/v1/records.json?app=${APP_ID}&query=order by $id desc limit 1`,
      {
        method: 'GET',
        headers: {
          'X-Cybozu-API-Token': API_TOKEN,
        },
      }
    );

    if (recordResponse.ok) {
      const recordData = await recordResponse.json();
      if (recordData.records && recordData.records.length > 0) {
        console.log('\n最新レコードのフィールド値:');
        const record = recordData.records[0];
        Object.entries(record).forEach(([key, value]: [string, any]) => {
          if (value && typeof value === 'object' && 'value' in value) {
            console.log(`${key}: ${JSON.stringify(value.value)}`);
          }
        });
      }
    }

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

getOrderFields();