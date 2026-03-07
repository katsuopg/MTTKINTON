# 作業履歴

## 2026-03-07

### グループフィールド実装

**型定義 (`types/dynamic-app.ts`):**
- FieldType に `'group'` 追加（29種目）
- DECORATIVE_FIELD_TYPES, HIDDEN_IN_LIST_TYPES に `'group'` 追加
- FIELD_TYPE_INFO に group 追加（icon: FolderOpen）
- FieldValidation に `group_fields?: string[]`, `group_open_default?: boolean` 追加

**フォームビルダー:**
- FieldPalette.tsx: 装飾カテゴリに「グループ」追加
- FormCanvas.tsx: グループフィールドを枠線付きコンテナで表示（含まれるフィールド数と開閉状態を表示）
- FieldSettings.tsx: グループ設定UI（含めるフィールドのチェックボックスリスト + デフォルト開閉トグル）

**レコード表示:**
- DynamicDetailContent.tsx: グループフィールドを検出し、group_fieldsに含まれるフィールドを枠線付きセクションでラップ、クリックで開閉可能
- DynamicFormContent.tsx: 入力フォームでもグループセクションとして表示、開閉可能
- DynamicField.tsx: グループフィールドは入力不要のため null 返却

### カラム幅ドラッグ変更 + 条件付き書式

**型定義拡張 (`types/dynamic-app.ts`):**
- `TableViewConfig` に `column_widths` (Record<string, number>) と `conditional_format_rules` (ConditionalFormatRule[]) を追加
- `ConditionalFormatRule` インターフェース追加（id, field_code, operator, value, row_bg_color, cell_text_color）

**カラム幅ドラッグ (`DynamicListContent.tsx`):**
- 各thの右端にリサイズハンドル（hover時のみ表示、ドラッグでcol-resize）
- onMouseDown → document mousemove/mouseup で追跡
- 最小80px / 最大500px
- table-layout: fixed（カラム幅設定がある場合のみ）
- 変更後500msのデバウンスでビュー設定APIに自動保存

**条件付き書式 (`DynamicListContent.tsx`):**
- ビュー設定に conditional_format_rules がある場合、各行の描画時にルールを評価
- 演算子: eq, neq, gt, gte, lt, lte, contains, not_contains, empty, not_empty
- マッチした最初のルールの行背景色を適用
- ツールバーに「条件付き書式」ボタン追加（Paintbrushアイコン）
- 設定パネル: フィールド選択、条件選択、値入力、カラーピッカー、プレビュー
- ルール追加/削除、3言語対応（ja/en/th）
- ビュー設定APIに自動保存

## 2026-03-06

### プロセス管理 作業者候補設定UI + アプリアクション（転記）UI

**プロセス管理 作業者候補:**
- `ProcessManagementSettings.tsx` - 各ステータス行に作業者候補セクション（折りたたみ）を追加
  - assignee_typeがnull以外の場合、展開ボタン表示
  - ユーザー/組織/ロールのタイプ選択 + ターゲット選択で候補追加
  - タグ形式で表示（名前 + Xボタンで削除）
  - マスターデータ: `/api/employees`, `/api/organizations`, `/api/roles`
- `api/apps/[appCode]/process/route.ts` - GET/PUTでassignees情報を返却・保存
  - `process_status_assignees` テーブルを利用（entity_type, entity_code）

**アプリアクション設定:**
- `settings/apps/[appCode]/AppActionSettings.tsx` - 新規作成
  - アクション一覧カード、新規作成/編集フォーム
  - 転記先アプリ選択、フィールドマッピング（src→dest対応表）
  - 既存API `/api/apps/[appCode]/actions` (GET/PUT) を利用
- `AppSettingsContent.tsx` に「アクション」タブ追加

**レコード詳細の転記ボタン:**
- `DynamicDetailContent.tsx` - ヘッダーに「転記」ドロップダウンメニュー追加
  - `/api/apps/${appCode}/actions` からアクション一覧取得
  - アクション選択時に確認ダイアログ → POST実行
  - 成功後: 作成されたレコードへのリンクをトースト的に表示

### アプリグループUI + 定期レポートUI 追加

**アプリグループ管理:**
- `settings/AppGroupManagement.tsx` - グループ一覧テーブル + 作成/編集/削除フォーム
- `SettingsClient.tsx` に「アプリグループ」タブ追加
- `DashboardContent.tsx` にグループ別アプリカード表示を追加（KPIカードとテーブルの間）
- 既存API `/api/app-groups` を利用（GET/POST/DELETE）

**定期レポート設定:**
- `settings/apps/[appCode]/ScheduledReportSettings.tsx` - レポート一覧 + 作成/削除
- `AppSettingsContent.tsx` に「定期レポート」タブ追加（Webhookの後）
- 既存API `/api/scheduled-reports` を利用

### UI改善: @メンション候補 + カテゴリツリーサイドバー

**DynamicDetailContent.tsx — @メンション機能:**
- `/api/employees?pageSize=100` からユーザー一覧を取得
- textarea内で `@` 入力時にドロップダウン候補表示
- 名前での部分一致フィルタリング
- Enter/クリックで `@[名前](user_id)` 形式を挿入
- Escape/ArrowUp/ArrowDownのキーボード操作対応
- コメント表示時に `@[名前](user_id)` を青字太字でハイライト

**DynamicListContent.tsx — カテゴリツリーサイドバー:**
- `/api/apps/${appCode}/categories` からカテゴリ取得
- テーブル左側に幅200pxのサイドバー表示（カテゴリがある場合のみ）
- 3階層対応、折りたたみ可能（ChevronRight/ChevronDown）
- 「すべて」選択肢 + カテゴリ選択でフィルタリング（categoryIdパラメータ）
- 選択中はbrand色でハイライト
- モバイルでは `hidden md:block` で非表示

## 2025-12-29

### 性別フィールド追加

**完了した作業:**

1. **EmployeeDetailContent.tsx** - 性別フィールドを追加
   - `formData`に`gender`を追加
   - 翻訳を3言語で追加（ja: 性別/男性/女性, en: Gender/Male/Female, th: เพศ/ชาย/หญิง）
   - 基本情報セクションに性別選択ドロップダウンを追加
   - `handleCancel`関数に`gender`フィールドを追加

2. **API: /api/employees/[employeeId]/route.ts**
   - `ALLOWED_FIELDS`に`gender`を追加（更新可能に）

3. **avatar_url → profile_image_url 修正**
   - EmployeeDetailContent.tsxで`avatar_url`を`profile_image_url`に修正（DB列名に合わせて）

### アバター優先順位修正

- `lib/auth/user-info.ts` - アバターURLの優先順位を変更
  - 変更前: `user_metadata.avatar_url` > `employees.profile_image_url`
  - 変更後: `employees.profile_image_url` > `user_metadata.avatar_url`
  - ヘッダーと従業員詳細で同じ写真が表示されるように統一

### ユーザー管理・権限管理機能実装（Kintoneスタイル）

**データベース:**
- `supabase/migrations/20251229_create_roles_table.sql` - 新規作成
  - `roles`テーブル: ロール定義（権限フラグ含む）
  - `user_roles`テーブル: ユーザー×ロール紐付け
  - デフォルトロール: 管理者, マネージャー, 編集者, 閲覧者

**型定義:**
- `types/supabase.ts` - roles, user_roles テーブルの型を追加

**API:**
- `/api/roles/route.ts` - ロール一覧取得・作成
- `/api/roles/[id]/route.ts` - ロール詳細・更新・削除
- `/api/user-roles/route.ts` - ユーザーロール一覧・割り当て・削除
- `/api/employees/route.ts` - 従業員一覧取得（UserManagement用に追加）

**UI:**
- `PermissionManagement.tsx` - 新規作成
  - ロール一覧表示（権限アイコン付き）
  - ユーザー別ロール割り当て一覧
  - ロール詳細モーダル
- `UserManagement.tsx` - 機能拡張
  - ロール列追加
  - ロール割り当てモーダル
  - ロール削除機能
- `SettingsClient.tsx` - PermissionManagement読み込み

**権限設定:**
- ユーザー管理権限
- 組織管理権限
- 従業員管理権限
- 見積管理権限
- 全レコード閲覧/編集/削除権限
- データエクスポート/インポート権限
- 設定管理権限

**次のステップ:**
- Supabaseでマイグレーション実行が必要
- 実際の権限チェックをアプリ全体に適用

### 過去の作業（前回セッション）

- ヘッダーのニックネーム・アバター表示修正（`lib/auth/user-info.ts`）
- 従業員一覧のアバター表示修正（`EmployeesClient.tsx`）
- `avatar_url`→`profile_image_url`フィールド名修正
- テーブル幅修正（max-w-7xl削除）
- テーブル表示修正（whitespace-nowrap）
