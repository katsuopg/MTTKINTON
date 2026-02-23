# MTT KINTON - アプリ構成図

## 開発ルール

### コミュニケーション
- **日本語のみ使用**: 全てのやり取りは日本語で行うこと。英語での説明は禁止。
- 日本語でのみコミュニケーションを取る

### 開発確認事項
- **サーバーポート**: 開発サーバーは必ずポート3000で起動すること
- **動作確認**: 開発作業が完了したら、必ず以下を確認すること：
  1. サーバーがポート3000で正常に起動していること
  2. 全ページにアクセスできること（ログイン画面へのリダイレクトも含む）
  3. コンソールエラーが発生していないこと
  4. TypeScriptのコンパイルエラーがないこと

### 作業フロー
- 実行する前にmemory.mdの作業履歴を確認、作業が完了したらmemory.mdを更新

### 開発サーバー運用ルール
- 開発サーバーは基本一つ、3000番ポートで開発
- 軽微な修正は、サーバーを再起動しない
- サーバー更新を伴う変更や修正は、以下の手順で行う：
  1. 3000番ポートのサーバーをkill
  2. 必要な修正や変更を実施
  3. 再度3000番ポートでサーバーを起動

### UI統一規約（必須）

新規ページ作成・既存ページ修正時は以下を厳守すること。

#### サーバー/クライアント分離
- **page.tsx（サーバー）**: データ取得 + `DashboardLayout`ラップ + Contentコンポーネント呼び出し
- **Content（クライアント）**: UI描画のみ。`DashboardLayout`を含めない
- **params/searchParams**: `Promise<>` + `await`（Next.js 15+スタイル）

#### 一覧ページ
- **ラッパー**: `tableStyles.contentWrapper` で最外層をラップ
- **テーブルコンテナ**: `tableStyles.tableContainer` で検索+テーブル+ページネーションを**1つのカード**に統合
- **ヘッダー**: `ListPageHeader` を `tableContainer` 内の先頭に配置
  - Props: `searchValue`, `onSearchChange`, `searchPlaceholder`, `totalCount`, `countLabel`, `filters`, `addButton`
  - フィルターは `<select>` を `filters` propに渡す
  - **検索・フィルター・件数を別カードにしない**
- **テーブル要素**: `tableStyles.table/thead/th/tbody/tr/td` を使用。手書きclassName禁止
- **行クリック**: `tableStyles.trClickable`
- **空状態**: `tableStyles.emptyRow`
- **ステータスバッジ**: `tableStyles.statusBadge`
- **ページネーション**: `usePagination`フック + `Pagination`コンポーネント（tableContainer内末尾）
- **参照実装**: `workno/WorkNoClient.tsx`, `po-management/POManagementContent.tsx`

#### 詳細ページ
- **ヘッダー**: `DetailPageHeader` — 完全1行構成
  - `[←戻る] [ステータスバッジ] [タイトル] ... [アクションボタン]`
  - **subtitle不使用** — `title`に `" - "` 区切りで結合（例: `WorkNo - 顧客名 - PJ名`）
  - アクション: `detailStyles.secondaryButton`（Pencilアイコン付き）
- **カード**: `detailStyles.card` + `cardHeaderWithBg` + `cardContent` + `grid3`（3カラム推奨）
- **フィールド**: `detailStyles.fieldLabel` + `detailStyles.fieldValue`
- **タブ**: `Tabs`（underline variant）+ `TabPanel`。手書きタブ禁止
- **参照実装**: `workno/[workNo]/WorkNoDetailContent.tsx`

#### 共通コンポーネント
- **ローディング**: `LoadingSpinner`（`components/ui/LoadingSpinner.tsx`）
- **空データ**: `EmptyState`（`components/ui/EmptyState.tsx`）
- **会計期間選択**: `FiscalPeriodSelect`（`components/ui/FiscalPeriodSelect.tsx`）

#### グラフ（Recharts）
- 外枠: `rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6`
- CartesianGrid: `stroke="currentColor" className="text-gray-200 dark:text-gray-700"`
- 軸: `tickLine={false} axisLine={false} className="text-gray-500 dark:text-gray-400"`
- ツールチップ: `dark:border-gray-700 dark:bg-gray-800` でダークモード対応
- 凡例: Tailwindカスタム凡例（Rechartsの`<Legend>`不使用）
- バー: `radius={[4, 4, 0, 0]}`（角丸）
- **参照実装**: `components/charts/MonthlySalesChart.tsx`

#### アイコン
- **lucide-react のみ使用**。インラインSVG禁止

### Kintone互換権限システム
- **リファレンス**: `docs/kintone-expert.md` にKintone権限・プロセス管理の全仕様を記載
- **権限の3レベル**: アプリ権限（app_permissions）→ レコード権限（record_permission_rules）→ フィールド権限（field_permissions）
- **ロール**: system_admin > administrator > manager > editor > viewer
- **優先順位**: priority値が大きいほど優先。everyoneは常に最低優先度
- **DB**: roles, user_roles, apps, app_permissions, record_permission_rules, field_permissions
- **ユーティリティ**: lib/auth/permissions.ts, lib/auth/app-permissions.ts
- **設定画面**: src/app/[locale]/(auth)/settings/ 配下の各タブ