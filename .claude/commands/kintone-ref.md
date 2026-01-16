---
name: kintone-ref
description: "Kintone機能・権限リファレンス"
---

# /kintone-ref - Kintone機能リファレンス

## 基本概念

### アプリ構成
- **アプリ**: データを管理する単位（テーブル相当）
- **レコード**: 1件のデータ（行相当）
- **フィールド**: データ項目（列相当）
- **ビュー**: レコードの表示形式
- **プロセス管理**: ワークフロー・承認機能

### フィールドタイプ
| タイプ | 説明 | Supabase対応 |
|--------|------|--------------|
| 文字列（1行） | テキスト | VARCHAR |
| 文字列（複数行） | 長文 | TEXT |
| 数値 | 数字 | NUMERIC/INTEGER |
| 計算 | 自動計算 | GENERATED COLUMN |
| 日付 | 年月日 | DATE |
| 日時 | 年月日時分 | TIMESTAMPTZ |
| 時刻 | 時分 | TIME |
| チェックボックス | 複数選択 | TEXT[] / JSONB |
| ラジオボタン | 単一選択 | VARCHAR |
| ドロップダウン | 単一選択 | VARCHAR |
| 複数選択 | 複数選択 | TEXT[] / JSONB |
| ユーザー選択 | ユーザー参照 | UUID (FK) |
| 組織選択 | 組織参照 | UUID (FK) |
| ルックアップ | 他アプリ参照 | FK + JOIN |
| 関連レコード | リレーション | FK |
| 添付ファイル | ファイル | Supabase Storage |
| リンク | URL | VARCHAR |

---

## 権限システム

### 権限レベル（階層）
```
スペース管理者
  └── アプリ管理者
        └── レコード権限
              └── フィールド権限
```

### アプリ権限
| 権限 | 説明 |
|------|------|
| アプリ管理 | 設定変更・フィールド追加 |
| レコード追加 | 新規作成 |
| レコード閲覧 | 一覧・詳細表示 |
| レコード編集 | 既存データ更新 |
| レコード削除 | データ削除 |
| ファイル書き出し | CSV/Excelエクスポート |
| ファイル読み込み | CSV/Excelインポート |

### レコード権限（条件付き）
```javascript
// 例: 作成者のみ編集可能
{
  "entities": [{ "type": "CREATOR" }],
  "appEditable": true,
  "recordViewable": true,
  "recordEditable": true,
  "recordDeletable": false
}
```

### フィールド権限
- **閲覧**: フィールド値を見れる
- **編集**: フィールド値を変更できる
- **非表示**: フィールド自体が見えない

---

## Supabaseでの権限実装

### rolesテーブル
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  -- 権限フラグ
  can_manage_users BOOLEAN DEFAULT FALSE,
  can_manage_organization BOOLEAN DEFAULT FALSE,
  can_manage_employees BOOLEAN DEFAULT FALSE,
  can_manage_quotations BOOLEAN DEFAULT FALSE,
  can_view_all_records BOOLEAN DEFAULT FALSE,
  can_edit_all_records BOOLEAN DEFAULT FALSE,
  can_delete_all_records BOOLEAN DEFAULT FALSE,
  can_export_data BOOLEAN DEFAULT FALSE,
  can_import_data BOOLEAN DEFAULT FALSE,
  can_manage_settings BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_rolesテーブル
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  role_id UUID REFERENCES roles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);
```

### RLSポリシー例
```sql
-- ロールベースのレコードアクセス
CREATE POLICY "role_based_access" ON employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.can_view_all_records = TRUE
    )
    OR created_by = auth.uid()
  );
```

---

## プロセス管理（ワークフロー）

### ステータス遷移
```
下書き → 申請中 → 承認待ち → 承認済み
                 ↓
              差し戻し → 修正中 → 再申請
```

### Supabaseでの実装
```sql
-- ステータス管理
ALTER TABLE quotations ADD COLUMN status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE quotations ADD COLUMN approved_by UUID REFERENCES auth.users(id);
ALTER TABLE quotations ADD COLUMN approved_at TIMESTAMPTZ;

-- ステータス履歴
CREATE TABLE status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100),
  record_id UUID,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  comment TEXT
);
```

---

## MTTkintonアプリ一覧

| アプリ | 用途 | Supabase移行 |
|--------|------|--------------|
| 顧客マスタ | 顧客情報管理 | ✅ customers |
| 従業員マスタ | 従業員情報 | ✅ employees |
| 仕入先マスタ | 仕入先情報 | ✅ suppliers |
| 見積管理 | 見積書作成 | 🔄 quotations |
| 受注管理 | 受注情報 | 🔄 orders |
| 発注管理 | 発注情報 | 🔄 purchase_orders |
| 請求書管理 | 請求書 | 🔄 invoices |
| プロジェクト管理 | 案件管理 | 🔄 projects |
| 工事番号 | 工番管理 | 🔄 work_numbers |

---

## API制限・注意事項

- **リクエスト制限**: 10,000件/日（スタンダード）
- **レコード取得上限**: 500件/リクエスト
- **ファイルサイズ**: 1ファイル1GBまで
- **添付ファイル合計**: 5GB/アプリ

## 環境変数
```bash
KINTONE_DOMAIN=megatech.cybozu.com
KINTONE_API_TOKEN_CUSTOMERS=xxx
KINTONE_API_TOKEN_EMPLOYEES=xxx
KINTONE_API_TOKEN_SUPPLIERS=xxx
KINTONE_API_TOKEN_QUOTATIONS=xxx
KINTONE_API_TOKEN_ORDERS=xxx
KINTONE_API_TOKEN_INVOICES=xxx
```
