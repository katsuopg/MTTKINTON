# 作業履歴

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
