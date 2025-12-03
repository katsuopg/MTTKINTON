# 機能面の対応状況

## 要件書（project_overview.md）に基づく機能一覧

### ✅ 既存実装済みアプリ（12個）

| # | アプリ名 | パス | 実装状況 | 備考 |
|---|---------|------|---------|------|
| 1 | **dashboard** | `/dashboard` | ✅ 実装済み | ダッシュボード（メイン画面） |
| 2 | **project-management** | `/project-management` | ✅ 実装済み | プロジェクト管理（受注前） |
| 3 | **quotation** | `/quotation` | ✅ 実装済み | 見積もり管理 |
| 4 | **workno** | `/workno` | ✅ 実装済み | 工事番号管理（受注後） |
| 5 | **po-management** | `/po-management` | ✅ 実装済み | 注文書管理 |
| 6 | **order-management** | `/order-management` | ✅ 実装済み | オーダー管理 |
| 7 | **customers** | `/customers` | ✅ 実装済み | 顧客マスタ |
| 8 | **staff** | `/staff` | ✅ 実装済み | 顧客担当者管理 |
| 9 | **suppliers** | `/suppliers` | ✅ 実装済み | サプライヤーマスタ |
| 10 | **employees** | `/employees` | ✅ 実装済み | 従業員管理 |
| 11 | **projects** | `/projects` | ✅ 実装済み | プロジェクト（詳細） |
| 12 | **test-fields** | `/test-fields` | ✅ 実装済み | テストフィールド |

### ⚠️ 新規開発予定（2個）

| # | アプリ名 | Kintone App ID | 実装状況 | 備考 |
|---|---------|----------------|---------|------|
| 1 | **Parts List Management** | 122 | ⚠️ 部分実装 | パーツリスト管理 |
| 2 | **Purchase Request Management** | 123 | ❌ 未実装 | 購買依頼管理 |

## 詳細確認

### Parts List Management（パーツリスト管理）

**実装状況**: ⚠️ 部分実装

**確認結果**:
- ✅ 型定義あり: `types/kintone.ts`に`PartsListRecord`が定義されている
- ✅ ページ存在: `workno/[workNo]/parts-list/page.tsx`が存在（工事番号ごとの詳細ページ）
- ✅ メニュー: DashboardLayoutのサイドバーに「パーツリスト」が追加済み（`/parts-list`）
- ✅ ダッシュボード: クイックアクセスリンクが存在
- ⚠️ 機能: サンプルデータのみで、Kintone連携が未実装の可能性
- ❌ 一覧ページ: `/parts-list`のページが存在しない可能性

**必要な作業**:
1. `/parts-list`一覧ページの作成（存在確認が必要）
2. Kintone API連携の実装
3. データ取得・保存機能の実装
4. 工事番号ごとの詳細ページのKintone連携

### Purchase Request Management（購買依頼管理）

**実装状況**: ❌ 未実装

**確認結果**:
- ✅ 型定義あり: `types/kintone.ts`に`PURCHASE_REQUEST`（App ID: 123）が定義されている
- ✅ メニュー: DashboardLayoutのサイドバーに「購買依頼」が追加済み（`/purchase-request`）
- ✅ ダッシュボード: クイックアクセスリンクが存在
- ❌ ページ: `/purchase-request`のページが実装されていない

**必要な作業**:
1. `/purchase-request`一覧ページの作成
2. 詳細・編集ページの作成
3. Kintone API連携の実装
4. データ取得・保存機能の実装

## その他の機能

### ✅ 実装済みの追加機能

1. **import-data** - データ同期ステータスページ
   - Kintone/Supabaseの移行状況を管理
   - 各アプリのデータソースを確認

2. **invoice-management** - 請求書管理
   - Supabaseに移行済み
   - 期別フィルタなど実装済み

3. **cost-management** - コスト管理
   - ページ存在確認済み

4. **machines** - 機械管理
   - 一覧・詳細ページ実装済み

## 機能実装の優先度

### 高優先度（必須）
1. **Purchase Request Management** - 完全実装
   - 要件書に記載されている新規開発予定機能
   - 現在未実装

### 中優先度（推奨）
2. **Parts List Management** - 完全実装
   - 部分実装されているが、Kintone連携が必要
   - メニューへの追加が必要

### 低優先度（改善）
3. 既存機能の改善・最適化
   - パフォーマンス改善
   - UI/UX改善
   - テストカバレッジの拡充

## まとめ

### 実装状況サマリー

| カテゴリ | 実装済み | 部分実装 | 未実装 | 合計 |
|---------|---------|---------|--------|------|
| **既存アプリ** | 12 | 0 | 0 | 12 |
| **新規開発予定** | 0 | 1 | 1 | 2 |
| **合計** | 12 | 1 | 1 | 14 |

### 次のアクション

1. **Purchase Request Management**の実装
   - 一覧ページの作成
   - 詳細・編集ページの作成
   - Kintone API連携
   - サイドバーメニューへの追加

2. **Parts List Management**の完成
   - Kintone API連携の実装
   - データ取得・保存機能の実装
   - サイドバーメニューへの追加

