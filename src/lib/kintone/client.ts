import { 
  WorkNoRecord, 
  ProjectRecord, 
  PartsListRecord,
  KintoneRecordsResponse,
  KintoneRecordResponse,
  KintoneErrorResponse,
  KINTONE_APPS
} from '@/types/kintone';

export class KintoneClient {
  private domain: string;
  private appId: string;
  private apiToken: string;

  constructor(appId: string, apiToken: string) {
    this.domain = process.env.KINTONE_DOMAIN || '';
    if (!this.domain) {
      throw new Error('KINTONE_DOMAIN environment variable is not set');
    }
    this.appId = appId;
    this.apiToken = apiToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `https://${this.domain}${endpoint}`;
    
    // デバッグ情報
    console.log('Kintone API Request:', {
      url,
      appId: this.appId,
      hasApiToken: !!this.apiToken,
      apiTokenLength: this.apiToken?.length || 0,
      method: options.method || 'GET'
    });
    
    // GETリクエストの場合はContent-Typeを送らない
    const headers: Record<string, string> = {
      'X-Cybozu-API-Token': this.apiToken,
      ...(options.headers as Record<string, string> || {}),
    };
    
    if (options.method && options.method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      console.error('kintone API Error:', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      // エラーの詳細を表示
      if (errorData.errors) {
        console.error('Error details:', JSON.stringify(errorData.errors, null, 2));
      }
      throw new Error(`kintone API Error: ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  // 汎用的なレコード取得メソッド
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getRecords<T extends Record<string, any>>(query?: string, fields?: string[]): Promise<T[]> {
    let endpoint = `/k/v1/records.json?app=${this.appId}`;

    if (query) {
      endpoint += `&query=${encodeURIComponent(query)}`;
    }

    if (fields && fields.length > 0) {
      fields.forEach((field, index) => {
        endpoint += `&fields[${index}]=${encodeURIComponent(field)}`;
      });
    }

    const response = await this.request<{ records: T[]; totalCount?: string }>(endpoint);

    return response.records;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getRecord<T extends Record<string, any>>(recordId: string): Promise<T> {
    const endpoint = `/k/v1/record.json?app=${this.appId}&id=${recordId}`;

    const response = await this.request<{ record: T }>(endpoint);

    return response.record;
  }

  async createRecord<T extends Record<string, any>>(record: Partial<T>): Promise<string> {
    const endpoint = `/k/v1/record.json`;
    
    const response = await this.request<{ id: string; revision: string }>(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify({
          app: this.appId,
          record,
        }),
      }
    );
    
    return response.id;
  }

  async updateRecord<T extends Record<string, any>>(
    recordId: string,
    record: Partial<T>
  ): Promise<void> {
    const endpoint = `/k/v1/record.json`;
    
    await this.request(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify({
          app: this.appId,
          id: recordId,
          record,
        }),
      }
    );
  }


  async downloadFile(fileKey: string): Promise<Buffer> {
    const url = `https://${this.domain}/k/v1/file.json?fileKey=${fileKey}`;
    
    const response = await fetch(url, {
      headers: {
        'X-Cybozu-API-Token': this.apiToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

}