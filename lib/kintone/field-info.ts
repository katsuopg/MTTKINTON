// フィールドタイプの定義
export interface KintoneFieldInfo {
  code: string;
  label: string;
  type: string;
  required: boolean;
  unique?: boolean;
  options?: string[]; // ドロップダウンの選択肢
  defaultValue?: unknown;
  referenceTable?: {
    appId: string;
    condition: {
      field: string;
      relatedField: string;
    };
  }; // ルックアップフィールドの参照情報
}

// フィールド情報のレスポンス型
export interface KintoneFieldsResponse {
  properties: {
    [fieldCode: string]: {
      code: string;
      label: string;
      type: string;
      required: boolean;
      unique?: boolean;
      options?: { [key: string]: { label: string; index: string } };
      defaultValue?: unknown;
      lookup?: {
        relatedApp: {
          app: string;
        };
        relatedKeyField: string;
        fieldMappings: Array<{
          field: string;
          relatedField: string;
        }>;
        filterCond: string;
        sort: string;
      };
    };
  };
}

/**
 * アプリのフィールド情報を取得
 */
export async function getAppFields(appId: number, apiToken: string): Promise<KintoneFieldInfo[]> {
  try {
    
    // フィールド情報を取得するAPIエンドポイント
    const response = await fetch(`https://${process.env.KINTONE_DOMAIN}/k/v1/app/form/fields.json?app=${appId}`, {
      method: 'GET',
      headers: {
        'X-Cybozu-API-Token': apiToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch field info: ${response.statusText}`);
    }

    const data: KintoneFieldsResponse = await response.json();
    
    // フィールド情報を整形
    const fields: KintoneFieldInfo[] = [];
    
    for (const [fieldCode, fieldInfo] of Object.entries(data.properties)) {
      // システムフィールドをスキップ
      if (fieldCode.startsWith('$') || ['レコード番号', '作成者', '更新者', '作成日時', '更新日時'].includes(fieldCode)) {
        continue;
      }
      
      const field: KintoneFieldInfo = {
        code: fieldInfo.code,
        label: fieldInfo.label,
        type: fieldInfo.type,
        required: fieldInfo.required || false,
        unique: fieldInfo.unique
      };
      
      // ドロップダウンの選択肢を取得
      if (fieldInfo.type === 'DROP_DOWN' && fieldInfo.options) {
        field.options = Object.values(fieldInfo.options)
          .sort((a, b) => parseInt(a.index) - parseInt(b.index))
          .map(option => option.label);
      }
      
      // ルックアップフィールドの情報を取得
      if (fieldInfo.type === 'SINGLE_LINE_TEXT' && fieldInfo.lookup) {
        field.referenceTable = {
          appId: fieldInfo.lookup.relatedApp.app,
          condition: {
            field: fieldInfo.lookup.fieldMappings[0]?.field || '',
            relatedField: fieldInfo.lookup.fieldMappings[0]?.relatedField || ''
          }
        };
      }
      
      // デフォルト値
      if (fieldInfo.defaultValue !== undefined) {
        field.defaultValue = fieldInfo.defaultValue;
      }
      
      fields.push(field);
    }
    
    return fields;
  } catch (error) {
    console.error('Error fetching app fields:', error);
    throw error;
  }
}

/**
 * 見積もり管理アプリのフィールド情報を取得
 */
export async function getQuotationFields(): Promise<KintoneFieldInfo[]> {
  const apiToken = process.env.KINTONE_API_TOKEN_QUOTATION;
  const appId = parseInt(process.env.KINTONE_APP_QUOTATION || '8');
  
  if (!apiToken) {
    throw new Error('KINTONE_API_TOKEN_QUOTATION is not set');
  }
  
  return getAppFields(appId, apiToken);
}

/**
 * フィールド情報をTypeScript型定義として出力
 */
export function generateTypeDefinition(appName: string, fields: KintoneFieldInfo[]): string {
  const typeMap: { [key: string]: string } = {
    'SINGLE_LINE_TEXT': 'string',
    'MULTI_LINE_TEXT': 'string',
    'NUMBER': 'string',
    'CALC': 'string',
    'DROP_DOWN': 'string',
    'RADIO_BUTTON': 'string',
    'CHECK_BOX': 'string[]',
    'MULTI_SELECT': 'string[]',
    'DATE': 'string',
    'TIME': 'string',
    'DATETIME': 'string',
    'USER_SELECT': 'Array<{ code: string; name: string }>',
    'ORGANIZATION_SELECT': 'Array<{ code: string; name: string }>',
    'GROUP_SELECT': 'Array<{ code: string; name: string }>',
    'FILE': 'Array<{ name: string; size: string; contentType: string }>',
    'LINK': 'string',
    'RICH_TEXT': 'string'
  };

  let typeDef = `// ${appName} Record Type\nexport interface ${appName}Record extends KintoneRecord {\n`;
  
  fields.forEach(field => {
    const fieldType = typeMap[field.type] || 'any';
    const optional = field.required ? '' : '?';
    const comment = field.label !== field.code ? ` // ${field.label}` : '';
    
    typeDef += `  ${field.code}${optional}: { type: "${field.type}"; value: ${fieldType} };${comment}\n`;
    
    // ドロップダウンの選択肢をコメントに追加
    if (field.options && field.options.length > 0) {
      typeDef += `  // Options: ${field.options.join(', ')}\n`;
    }
  });
  
  typeDef += '}\n';
  
  return typeDef;
}