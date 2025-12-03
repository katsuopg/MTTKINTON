# Kintone → Supabase 完全移行計画

## 基本方針

### 目的
- Kintoneサービスを自社開発APPへ完全移行
- 追加プラグインを自社開発APP内で開発し経費削減
- 数ヶ月以内に完全移行を完了

### 移行戦略
1. **段階的移行**: アプリごとに順次移行
2. **データ移行**: 現時点のKintoneデータをSupabaseに移行
3. **機能実装**: Kintoneと同じ動作でDBに保存するように実装
4. **並行運用**: 移行期間中はKintoneとSupabaseの両方から読み取り可能
5. **完全移行**: 全機能移行後、Kintoneへの依存を完全に削除

## 現状の移行状況

### ✅ 移行完了（4個）

| # | アプリ名 | Kintone App ID | 移行状況 | 備考 |
|---|---------|----------------|---------|------|
| 1 | **customers** | 7 | ✅ completed | 顧客マスタ |
| 2 | **invoice-management** | 26 | ✅ completed | 請求書管理 |
| 3 | **machines** | - | ✅ completed | 機械マスタ |
| 4 | **suppliers** | 36 | ✅ completed | 仕入業者マスタ |

### ⚠️ 移行中（2個）

| # | アプリ名 | Kintone App ID | 移行状況 | 備考 |
|---|---------|----------------|---------|------|
| 5 | **workno** | 21 | ⚠️ in-progress | 工事番号管理 |
| 6 | **quotation** | 8 | ⚠️ in-progress | 見積管理 |

### 📋 移行予定（8個）

| # | アプリ名 | Kintone App ID | 優先度 | 備考 |
|---|---------|----------------|--------|------|
| 7 | **project-management** | 114 | 🔴 高 | プロジェクト管理（受注前） |
| 8 | **po-management** | 22 | 🔴 高 | 発注管理 |
| 9 | **order-management** | - | 🟡 中 | 注文書管理 |
| 10 | **cost-management** | 88 | 🟡 中 | コスト管理 |
| 11 | **employees** | 106 | 🟡 中 | 従業員管理 |
| 12 | **staff** | 11 | 🟡 中 | 顧客担当者管理 |
| 13 | **parts-list** | 122 | 🟢 低 | パーツリスト管理（新規） |
| 14 | **purchase-request** | 123 | 🟢 低 | 購買依頼管理（新規） |

## 移行スケジュール（3ヶ月計画）

### Phase 1: 基盤整備（1週間）
- [x] Supabaseプロジェクト設定
- [x] 認証システム構築
- [x] 基本テーブル設計
- [ ] 移行スクリプトの標準化
- [ ] テスト環境の構築

### Phase 2: 高優先度アプリ移行（4週間）

#### Week 1-2: project-management（プロジェクト管理）
- [ ] Supabaseテーブル設計・作成
- [ ] データ移行スクリプト作成
- [ ] Kintoneデータ移行実行
- [ ] 一覧ページをSupabase対応に変更
- [ ] 詳細ページをSupabase対応に変更
- [ ] 編集・作成機能をSupabase対応に変更
- [ ] テスト・検証

#### Week 3-4: po-management（発注管理）
- [ ] Supabaseテーブル設計・作成
- [ ] データ移行スクリプト作成
- [ ] Kintoneデータ移行実行
- [ ] 一覧ページをSupabase対応に変更
- [ ] 詳細ページをSupabase対応に変更
- [ ] ステータス更新機能をSupabase対応に変更
- [ ] テスト・検証

### Phase 3: 中優先度アプリ移行（4週間）

#### Week 5-6: order-management, cost-management
- [ ] order-management移行
- [ ] cost-management移行

#### Week 7-8: employees, staff
- [ ] employees移行
- [ ] staff移行

### Phase 4: 低優先度・新規アプリ（2週間）

#### Week 9-10: parts-list, purchase-request
- [ ] parts-list実装・移行
- [ ] purchase-request実装・移行

### Phase 5: 完全移行・最適化（2週間）

#### Week 11-12: 最終確認・最適化
- [ ] 全アプリの動作確認
- [ ] パフォーマンス最適化
- [ ] Kintone API依存の削除
- [ ] ドキュメント整備
- [ ] 本番環境へのデプロイ

## 移行手順（各アプリ共通）

### 1. テーブル設計
```sql
-- supabase/migrations/YYYYMMDD_create_[app_name]_table.sql
-- Kintoneのフィールド構造を分析し、Supabaseテーブルを設計
```

### 2. データ移行スクリプト作成
```typescript
// scripts/import-[app-name]-to-supabase.ts
// Kintone APIからデータ取得 → Supabaseに挿入
```

### 3. データ移行実行
```bash
# 移行スクリプト実行
npm run migrate:[app-name]
```

### 4. アプリケーションコード修正
- [ ] データ取得: Kintone API → Supabaseクエリ
- [ ] データ保存: Kintone API → Supabase INSERT/UPDATE
- [ ] 検索・フィルタ: Kintoneクエリ → Supabaseクエリ
- [ ] ページネーション: Supabase対応

### 5. テスト・検証
- [ ] データ整合性確認
- [ ] 機能動作確認
- [ ] パフォーマンス確認

## 技術的な考慮事項

### データ整合性
- **外部キー制約**: 関連テーブル間の整合性を保つ
- **トランザクション**: 複数テーブル更新時の整合性
- **バリデーション**: データ品質の確保

### パフォーマンス
- **インデックス**: 検索・フィルタ用のインデックス設定
- **キャッシュ**: 頻繁にアクセスするデータのキャッシュ
- **ページネーション**: 大量データの効率的な取得

### セキュリティ
- **RLS (Row Level Security)**: SupabaseのRLSポリシー設定
- **認証**: Supabase Authとの統合
- **権限管理**: ユーザー権限に応じたアクセス制御

### 移行中の運用
- **並行運用**: KintoneとSupabaseの両方から読み取り可能
- **データ同期**: 移行期間中のデータ同期（必要に応じて）
- **ロールバック**: 問題発生時のロールバック手順

## 移行チェックリスト（各アプリ）

### データ移行
- [ ] Kintoneから全データ取得
- [ ] データ変換・マッピング
- [ ] Supabaseへの挿入
- [ ] データ件数の確認
- [ ] サンプルデータの整合性確認

### 機能実装
- [ ] 一覧表示
- [ ] 詳細表示
- [ ] 検索・フィルタ
- [ ] 作成・編集・削除
- [ ] ページネーション
- [ ] ソート機能
- [ ] エクスポート機能（必要に応じて）

### テスト
- [ ] 単体テスト
- [ ] 統合テスト
- [ ] E2Eテスト
- [ ] パフォーマンステスト

### ドキュメント
- [ ] テーブル設計書
- [ ] API仕様書
- [ ] 運用マニュアル

## リスク管理

### 主要リスク
1. **データ損失**: 移行中のデータ損失リスク
2. **ダウンタイム**: 移行中のサービス停止リスク
3. **パフォーマンス**: 移行後のパフォーマンス低下リスク
4. **データ整合性**: 関連データ間の整合性リスク

### 対策
1. **バックアップ**: 移行前の完全バックアップ
2. **段階的移行**: アプリごとの段階的移行
3. **並行運用**: 移行期間中の並行運用
4. **テスト環境**: 本番移行前の十分なテスト

## 次のアクション

### 即座に開始すべき作業
1. **project-managementの移行準備**
   - テーブル設計
   - データ移行スクリプト作成

2. **移行スクリプトの標準化**
   - 共通処理のライブラリ化
   - エラーハンドリングの統一

3. **テスト環境の構築**
   - テスト用Supabaseプロジェクト
   - テストデータの準備

### 短期（1週間以内）
- project-managementのテーブル設計完了
- データ移行スクリプト作成
- 移行テスト実行

### 中期（1ヶ月以内）
- project-management移行完了
- po-management移行開始

## 進捗管理

### 週次レビュー
- 移行進捗の確認
- 課題の洗い出し
- スケジュール調整

### 月次レビュー
- 全体進捗の確認
- リスク評価
- 計画の見直し

## 参考資料

### 既存の移行実績
- `scripts/import-customers-to-supabase.ts`
- `scripts/import-invoices-to-supabase.ts`
- `scripts/import-machines-to-supabase.ts`
- `scripts/migrate-suppliers-to-supabase.ts`

### Supabaseマイグレーション
- `supabase/migrations/20250108_create_customer_and_invoice_tables.sql`
- `supabase/migrations/20250109_create_machines_table.sql`
- `supabase/migrations/20251016_create_suppliers_table.sql`


