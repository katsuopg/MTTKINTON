import { KINTONE_APPS } from '@/types/kintone';

const KINTONE_DOMAIN = process.env.KINTONE_DOMAIN!;
const API_TOKEN = process.env.KINTONE_API_TOKEN_COST!;
const APP_ID = KINTONE_APPS.COST_MANAGEMENT.appId;

/**
 * アプリのフィールド情報を取得
 */
export async function getAppFields(appId: number = APP_ID, apiToken: string = API_TOKEN) {
  const url = `https://${KINTONE_DOMAIN}/k/v1/app/form/fields.json`;
  
  const params = new URLSearchParams({
    app: appId.toString(),
  });

  console.log(`Fetching fields for app ${appId} with token ${apiToken.substring(0, 10)}...`);

  const response = await fetch(`${url}?${params}`, {
    method: 'GET',
    headers: {
      'X-Cybozu-API-Token': apiToken,
      'Content-Type': 'application/json',
    },
  });

  console.log(`Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.log(`Error response: ${errorText}`);
    throw new Error(`Failed to fetch app fields: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * コスト管理アプリのフィールド情報を取得してコンソールに出力
 */
export async function debugCostFields() {
  try {
    console.log('=== Testing with WorkNo app first ===');
    // まず正常に動作するWorkNoアプリで試す
    const workNoToken = process.env.KINTONE_API_TOKEN_WORKNO!;
    const workNoAppId = 21; // WorkNo app ID
    
    const workNoFields = await getAppFields(workNoAppId, workNoToken);
    console.log('WorkNo app fields fetched successfully');
    
    console.log('=== Now trying Cost Management App ===');
    const fieldsData = await getAppFields();
    console.log('=== Cost Management App Fields ===');
    console.log(JSON.stringify(fieldsData, null, 2));
    
    // フィールドコードと名前の一覧を整理して出力
    const fieldList = Object.entries(fieldsData.properties).map(([code, field]: [string, any]) => ({
      code,
      label: field.label,
      type: field.type
    }));
    
    console.log('=== Field Code Mapping ===');
    fieldList.forEach(field => {
      console.log(`${field.code}: ${field.label} (${field.type})`);
    });
    
    return fieldList;
  } catch (error) {
    console.error('Error fetching cost fields:', error);
    return [];
  }
}