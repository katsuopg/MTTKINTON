# 見積もり依頼アプリ 設計構想

## 背景

MTTkintonというKintoneスタイルの社内システムを開発中。
- **技術スタック**: Next.js + Supabase + TailwindCSS
- **既存アプリ**: quotation（顧客向け見積もり発行）は別途存在

## 概要

社内依頼者が購買部へ見積もり依頼を出し、購買部が仕入先から見積もりを取得。
依頼者が手配を希望すればPO発行、コスト管理APPへデータ転送する。

---

## ワークフロー

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  依頼者     │ ──→ │  購買部     │ ──→ │  依頼者     │ ──→ │  購買部     │
│  見積依頼   │     │  見積取得   │     │  手配依頼   │     │  PO発行     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ↓
                                                          ┌─────────────┐
                                                          │ コスト管理  │
                                                          │ APP連携     │
                                                          └─────────────┘
```

### ステータス遷移

1. **依頼中** - 依頼者が見積もり依頼を作成
2. **見積取得中** - 購買部が仕入先へ見積もり依頼
3. **見積完了** - 購買部が価格・納期を入力、依頼者へ通知
4. **手配依頼** - 依頼者が手配を希望（工事番号必須）
5. **PO発行済** - 購買部がPO発行 → コスト管理APPへ転送
6. **完了** / **キャンセル**

---

## 入口は2つ

```
┌─────────────────────┐          ┌─────────────────────┐
│  直接作成           │          │  部品表から作成     │
│  見積依頼アプリ     │          │  プロジェクト管理   │
│  から新規作成       │          │  部品表→チェック→   │
│                     │          │  見積依頼へ転送     │
└─────────┬───────────┘          └──────────┬──────────┘
          │                                  │
          └──────────┬───────────────────────┘
                     ↓
            ┌─────────────────┐
            │   見積依頼      │
            │   （明細複数）  │
            └────────┬────────┘
                     ↓
              ワークフロー続行...
```

---

## 見積もり依頼 データ項目

### 依頼者入力

| 項目 | 必須 | 備考 |
|------|------|------|
| 依頼者 | ○ | ログインユーザー自動設定 |
| 工事番号 | - | あれば |
| プロジェクト番号 | - | あれば |
| 希望納期 | - | |
| 備考 | - | |

### 明細（複数）

| 項目 | 必須 | 備考 |
|------|------|------|
| 型式 | ○ | |
| メーカー | ○ | |
| 個数 | ○ | |
| 備考 | - | |
| 写真 | - | 添付ファイル |
| 図面 | - | 添付ファイル |

### 購買部入力（見積取得後）

| 項目 | 必須 | 備考 |
|------|------|------|
| 仕入先 | ○ | 仕入先マスタから選択 |
| 見積価格 | ○ | |
| 回答納期 | ○ | |
| 購買備考 | - | |
| 見積書ファイル | - | 添付ファイル |

### 手配時（PO発行）

| 項目 | 必須 | 備考 |
|------|------|------|
| PO番号 | ○ | |
| 発注日 | ○ | |
| 発注金額 | ○ | |

---

## 権限

| ロール | 閲覧範囲 | 編集権限 |
|--------|----------|----------|
| 依頼者 | 自分の依頼のみ | 依頼作成、手配依頼 |
| 購買部 | 全件 | 見積入力、PO発行 |

---

## 通知

- **アプリ内通知**（NotificationBell）
- **メール通知**

### 通知タイミング

| タイミング | 通知先 |
|------------|--------|
| 見積依頼作成 | 購買部 |
| 見積完了 | 依頼者 |
| 手配依頼 | 購買部 |
| PO発行完了 | 依頼者 |

---

## 連携先アプリ

| アプリ | 連携内容 |
|--------|----------|
| 仕入先マスタ (suppliers) | 仕入先選択 |
| 工事番号マスタ (workno) | 工事番号紐付け |
| プロジェクト管理 (project-management) | プロジェクト紐付け・部品表連携 |
| コスト管理 (cost-management) | PO発行後データ転送 |
| PO管理 (po-management) | PO発行連携 |

---

# 部品表（BOM）設計

## 概要

プロジェクト管理の詳細画面に部品表タブを追加。
部品表からチェックボックスで選択して見積もり依頼へ転送可能。

---

## カテゴリ構造

```
プロジェクト詳細画面
└── 部品表タブ
    ├── メカ製作部品
    │   ├── セクション1 (S1)
    │   ├── セクション2 (S2)
    │   └── + セクション追加（ユーザー任意）
    ├── メカ購入品
    ├── 電気製作品
    └── 電気購入品
```

---

## 機能

| 機能 | 説明 |
|------|------|
| エクセルライク表示 | 行追加・編集・削除をその場で |
| セクション追加 | メカ製作部品のみ、S1, S2...を追加 |
| CSVインポート | カテゴリ指定してCSV読み込み |
| CSVエクスポート | カテゴリ別または全体で出力 |
| 見積依頼 | チェックボックス選択 → 見積依頼アプリへ転送 |

---

# テーブル設計

## 部品表関連

```sql
-- 部品表カテゴリ（固定4種）
CREATE TABLE part_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,  -- mech_make, mech_buy, elec_make, elec_buy
  name VARCHAR(100) NOT NULL,         -- メカ製作部品, メカ購入品, 電気製作品, 電気購入品
  has_sections BOOLEAN DEFAULT FALSE, -- セクション分け可能か（メカ製作部品のみtrue）
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- セクション（メカ製作部品用、ユーザー追加可能）
CREATE TABLE part_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  category_id UUID NOT NULL REFERENCES part_categories(id),
  section_code VARCHAR(20) NOT NULL,  -- S1, S2...
  section_name VARCHAR(100),
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, category_id, section_code)
);

-- 部品表明細
CREATE TABLE part_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  category_id UUID NOT NULL REFERENCES part_categories(id),
  section_id UUID REFERENCES part_sections(id),  -- NULLable（メカ製作以外はNULL）

  -- 部品情報
  part_number VARCHAR(100),           -- 品番
  part_name VARCHAR(200),             -- 品名
  model_number VARCHAR(200),          -- 型式
  manufacturer VARCHAR(200),          -- メーカー
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit VARCHAR(20) DEFAULT '個',      -- 単位
  unit_price DECIMAL(12,2),           -- 単価
  drawing_no VARCHAR(100),            -- 図面番号
  remarks TEXT,                       -- 備考

  -- 見積・発注状況
  quote_status VARCHAR(50) DEFAULT '未依頼',  -- 未依頼/依頼中/見積済/発注済
  quote_request_item_id UUID,         -- 見積依頼明細へのFK（後で追加）

  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 見積依頼関連

```sql
-- 見積依頼ヘッダー
CREATE TABLE quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_no VARCHAR(50) NOT NULL UNIQUE,  -- 依頼番号（自動採番）

  -- 依頼者情報
  requester_id UUID NOT NULL REFERENCES auth.users(id),

  -- 紐付け情報
  work_no_id UUID REFERENCES work_numbers(id),
  project_id UUID REFERENCES projects(id),

  -- ステータス
  status VARCHAR(50) NOT NULL DEFAULT '依頼中',
  -- 依頼中 → 見積取得中 → 見積完了 → 手配依頼 → PO発行済 → 完了 / キャンセル

  -- 依頼情報
  desired_delivery_date DATE,         -- 希望納期
  remarks TEXT,                       -- 備考

  -- 購買部担当
  purchaser_id UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 見積依頼明細
CREATE TABLE quote_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,

  -- 部品表からの参照（あれば）
  part_list_item_id UUID REFERENCES part_list_items(id),

  -- 依頼情報（依頼者入力）
  model_number VARCHAR(200) NOT NULL, -- 型式
  manufacturer VARCHAR(200) NOT NULL, -- メーカー
  quantity DECIMAL(10,2) NOT NULL,    -- 個数
  item_remarks TEXT,                  -- 備考

  -- 明細ステータス
  item_status VARCHAR(50) NOT NULL DEFAULT '依頼中',
  -- 依頼中 → 見積完了 → 手配依頼 → PO発行済 → 完了 / キャンセル

  -- 見積情報（購買部入力）
  supplier_id UUID REFERENCES suppliers(id),
  quoted_price DECIMAL(12,2),         -- 見積価格
  quoted_delivery_date DATE,          -- 回答納期
  purchaser_remarks TEXT,             -- 購買備考

  -- 発注情報
  po_number VARCHAR(50),              -- PO番号
  order_date DATE,                    -- 発注日
  order_amount DECIMAL(12,2),         -- 発注金額

  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添付ファイル
CREATE TABLE quote_request_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  quote_request_item_id UUID REFERENCES quote_request_items(id) ON DELETE CASCADE,

  file_type VARCHAR(50) NOT NULL,     -- photo, drawing, quotation
  file_path TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 見積依頼通知履歴
CREATE TABLE quote_request_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,  -- created, quoted, order_requested, po_issued
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT FALSE
);
```

---

# 開発順序

## Phase 1: 部品表

1. 部品表テーブル作成（マイグレーション）
2. プロジェクト詳細に部品表タブ追加
3. エクセルライクUI実装
4. CSVインポート/エクスポート

## Phase 2: 見積依頼アプリ

1. 見積依頼テーブル作成（マイグレーション）
2. 見積依頼一覧・詳細画面
3. 見積依頼作成（直接入力）
4. 購買部の見積入力画面
5. ステータス遷移・通知機能

## Phase 3: 連携

1. 部品表 → 見積依頼への転送機能
2. 見積依頼 → PO管理連携
3. PO発行 → コスト管理APP連携
4. プロジェクト管理での部品表表示（見積・発注状況付き）

---

# 検討事項・質問

1. **採番ルール**: 依頼番号（request_no）の採番ルールは？
   - 例: `QR-2025-0001`

2. **仕入先の複数見積もり**: 1つの明細に対して複数仕入先から見積もりを取る場合は？
   - 現状: 1明細 = 1仕入先
   - 要拡張: 比較表機能が必要？

3. **部分発注**: 見積もった数量の一部だけ発注する場合は？

4. **キャンセル処理**: 依頼・明細のキャンセルフロー

5. **履歴管理**: ステータス変更履歴は必要？

---

# 参考：既存アプリ一覧

| ディレクトリ | アプリ名 |
|--------------|----------|
| cost-management | コスト管理 |
| project-management | プロジェクト管理 |
| po-management | PO管理 |
| suppliers | 仕入先 |
| workno | 工事番号 |
| quotation | 見積もり（顧客向け発行） |
| customers | 顧客管理 |
| employees | 従業員管理 |
| machines | 機械管理 |
| order-management | 受注管理 |
| invoice-management | 請求管理 |
