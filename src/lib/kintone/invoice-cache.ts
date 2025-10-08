import { InvoiceRecord } from '@/types/kintone';
import { getInvoiceRecords } from './invoice';

interface CacheEntry {
  data: InvoiceRecord[];
  timestamp: number;
  workNoMap: Map<string, InvoiceRecord[]>;
}

class InvoiceCache {
  private cache: CacheEntry | null = null;
  private readonly TTL = 5 * 60 * 1000; // 5分間のキャッシュ
  private isRefreshing = false;

  async getInvoices(forceRefresh = false): Promise<{
    records: InvoiceRecord[];
    workNoMap: Map<string, InvoiceRecord[]>;
    fromCache: boolean;
  }> {
    const now = Date.now();

    // キャッシュが有効かチェック
    if (!forceRefresh && this.cache && (now - this.cache.timestamp) < this.TTL) {
      console.log('Using cached invoice data');
      return {
        records: this.cache.data,
        workNoMap: this.cache.workNoMap,
        fromCache: true
      };
    }

    // 別のリクエストが更新中の場合は既存のキャッシュを返す
    if (this.isRefreshing && this.cache) {
      console.log('Another request is refreshing, returning stale cache');
      return {
        records: this.cache.data,
        workNoMap: this.cache.workNoMap,
        fromCache: true
      };
    }

    // キャッシュを更新
    try {
      this.isRefreshing = true;
      console.log('Fetching fresh invoice data from Kintone');
      
      const records = await getInvoiceRecords(500, 0);
      
      // 工事番号ごとのマップを作成
      const workNoMap = new Map<string, InvoiceRecord[]>();
      records.forEach(record => {
        const workNo = record.文字列__1行_?.value || '';
        if (workNo) {
          if (!workNoMap.has(workNo)) {
            workNoMap.set(workNo, []);
          }
          workNoMap.get(workNo)!.push(record);
        }
      });

      this.cache = {
        data: records,
        timestamp: now,
        workNoMap
      };

      return {
        records,
        workNoMap,
        fromCache: false
      };
    } finally {
      this.isRefreshing = false;
    }
  }

  // 特定の工事番号の請求書データを取得
  async getInvoicesByWorkNo(workNo: string): Promise<InvoiceRecord[]> {
    const { workNoMap } = await this.getInvoices();
    return workNoMap.get(workNo) || [];
  }

  // キャッシュをクリア
  clearCache(): void {
    this.cache = null;
    console.log('Invoice cache cleared');
  }

  // 差分更新用（将来の実装用）
  async updateInvoice(workNo: string, invoice: InvoiceRecord): void {
    if (!this.cache) return;

    // キャッシュ内の該当データを更新
    const index = this.cache.data.findIndex(inv => 
      inv.$id?.value === invoice.$id?.value
    );

    if (index >= 0) {
      this.cache.data[index] = invoice;
    } else {
      this.cache.data.push(invoice);
    }

    // workNoMapも更新
    if (!this.cache.workNoMap.has(workNo)) {
      this.cache.workNoMap.set(workNo, []);
    }
    
    const workNoInvoices = this.cache.workNoMap.get(workNo)!;
    const workNoIndex = workNoInvoices.findIndex(inv => 
      inv.$id?.value === invoice.$id?.value
    );
    
    if (workNoIndex >= 0) {
      workNoInvoices[workNoIndex] = invoice;
    } else {
      workNoInvoices.push(invoice);
    }
  }
}

// シングルトンインスタンス
export const invoiceCache = new InvoiceCache();