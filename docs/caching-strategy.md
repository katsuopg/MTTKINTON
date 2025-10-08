# MTT KINTONプロジェクト キャッシュ戦略

## 現状の課題
- 毎回Kintone APIを呼び出すため、レスポンスが遅い
- API制限に引っかかる可能性
- ネットワーク帯域の無駄遣い

## 推奨するキャッシュ戦略

### 1. **短期キャッシュ（5分）+ リアルタイム更新**（推奨）
```typescript
// 実装例
export const revalidate = 300; // 5分キャッシュ

// または invoice-cache.ts を使用
const { records, fromCache } = await invoiceCache.getInvoices();
```

**メリット:**
- ほぼリアルタイムのデータ
- APIコール削減
- パフォーマンス向上

**デメリット:**
- 最大5分の遅延

### 2. **オンデマンド再検証**
```typescript
// 更新時にキャッシュをクリア
import { revalidatePath } from 'next/cache';

// 請求書作成後
await createInvoice(data);
revalidatePath('/ja/workno');
```

### 3. **差分更新（将来的な実装）**
```typescript
// 最終更新日時を記録
const lastSync = localStorage.getItem('lastInvoiceSync');
const query = `更新日時 > "${lastSync}" order by 更新日時 desc`;
```

## プロジェクト別の推奨設定

| ページ | キャッシュ時間 | 理由 |
|--------|--------------|------|
| 工事番号一覧 | 5分 | 頻繁に見るが、即座の反映は不要 |
| 請求書詳細 | なし | 最新データが必要 |
| ダッシュボード | 10分 | 概要情報で十分 |
| 顧客マスタ | 30分 | 変更頻度が低い |

## 実装の優先順位

1. **第1段階**: `invoice-cache.ts`を使った請求書データのキャッシュ
2. **第2段階**: Next.jsのrevalidate設定
3. **第3段階**: 差分更新とWebSocket通知

## 使用例

### 工事番号ページでの実装
```typescript
// src/app/[locale]/(auth)/workno/page.tsx

// キャッシュ設定
export const revalidate = 300; // 5分

// またはキャッシュクラスを使用
import { invoiceCache } from '@/lib/kintone/invoice-cache';

// ページ内で
const { records: invoiceRecords, fromCache } = await invoiceCache.getInvoices();

if (fromCache) {
  console.log('Using cached invoice data');
}
```