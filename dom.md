# MTT KINTON — DOM（Document of Material）要件定義書

**Version 5.1 | 2026年2月20日**
**15テーブル / 4タブUI / 4フェーズ開発**

---

## 1. 概要

### 1.1 背景と目的

MTT KINTONは、現在Kintoneアプリと個人のExcelファイルで管理されている業務プロセスを、Next.js + Supabaseで完全自社製のポータルに置き換えるプロジェクトである。

DOM（Document of Material）は、案件ごとの部品構成表であり、コスト算出から発注・実績管理まで全業務の土台となるデータである。営業・購買・経理が同じ情報を部門別ビューで参照できるようにする。

### 1.2 現状の課題

- コスト算出が個人のExcelでバラバラ、部門間で情報が共有されていない
- 納期・金額・支払時期を営業・購買・経理が把握できていない
- 製作品の図面が各PCに散在、一元管理されていない
- 相見積もりの管理が困難

### 1.3 システム概要

| 項目 | 内容 |
|------|------|
| 技術スタック | Next.js + Supabase |
| GitHub | katsuopg/MTTKINTON |
| 開発ポート | 3000 |
| 言語対応 | 日本語・タイ語・英語（3言語） |
| 製造形態 | 外注（工程管理不要、設計→発注→納品の追跡） |
| 通知 | システム内通知 + メール通知（将来LINE通知追加） |
| 権限管理 | 新システムで初めて導入（部門別） |

---

## 2. 採番ルール

### 2.1 プロジェクト番号

```
形式: P{YY}{NNN}
例:   P26001

P   = 固定プレフィックス
26  = 西暦下2桁
001 = 3桁連番（年ごとに自動採番）
```

### 2.2 製作品部品番号

```
形式: {PJ}-S{N}-{NNN}-{R}
例:   P26001-S1-001-0

P26001 = プロジェクト番号
S1     = セクション番号
001    = 部品連番
0      = 図面改訂番号（0→1→2…）
```

- **000番**は必ず**組図（assembly）**として存在
- **001以降**が子部品（part）
- 改訂時は末尾の履歴番号のみ変更: `P26001-S1-002-0` → `P26001-S1-002-1`

### 2.3 購入品

- 番号体系なし。型式 + メーカー + 備考で識別
- 電気部品は**MARK（電気記号）**あり（案件固有、共通化不可、電気担当が手動入力）
- 将来的によく使う購入品は `master_parts` で共通部品コードを付与する可能性あり

### 2.4 ツリー構造（製作品）

```
P26001-S1-000-0  組図（parent_id = null）
├── P26001-S1-001-0  Shaft      material: SDK11, heat: 58-60 HRC
├── P26001-S1-002-0  Housing
├── P26001-S1-003-0  Rod        material: SS400, surface: BLACK OXIDE
│   └── P26001-S1-003-1  Rod 改訂1（revision: 1）
└── P26001-S1-004-0  Rod end
```

DBレコードの関係:
```
id: aaa  P26001-S1-000-0 (組図)    parent_id: null
id: bbb  P26001-S1-001-0 (Shaft)   parent_id: aaa
id: ccc  P26001-S1-002-0 (Housing) parent_id: aaa
id: ddd  P26001-S1-003-0 (Rod)     parent_id: aaa
id: eee  P26001-S1-003-1 (Rod改訂) parent_id: aaa  revision: 1
```

---

## 3. 画面設計（4タブ構成）

### 3.1 メカ部品タブ ⚙️

- **構造**: セクション（S1がデフォルト、S2以降は手動追加）ごとに折りたたみ表示
- **内容**: 購入品と製作品が混在（フィルタ可能）
- **入力者**: メカ担当
- **カラム**: No / 区分 / 部品番号 / 品名 / 型式 / メーカー / 材質 / 熱処理 / 表面処理 / 数量 / 単位 / 単価 / 金額 / 納期 / 図面 / 備考

### 3.2 電気部品タブ ⚡

- **構造**: セクション分けなし（フラット一覧）
- **内容**: MARK列あり（電気図面との対応番号）
- **入力者**: 電気担当
- **カラム**: No / 区分 / MARK / 品名 / 型式 / メーカー / 数量 / 単位 / 単価 / 金額 / 納期 / 備考

### 3.3 社内工数タブ 👷

- **構造**: メカ工数 / 電気工数に分けて表示
- **内容**: 設計・施工・その他の工数
- **入力者**: 各担当 or 管理者
- **カラム**: 区分 / 作業種別 / 作業内容 / 工数(h) / 単価 / 金額 / 担当者 / 備考

### 3.4 全体集計タブ 📊

- **構造**: メカ + 電気 + 工数の合計
- **部門別ビュー切替**:
  - **営業**: 全体コスト概要、見積金額との比較、案件ステータス、利益率
  - **購買**: 発注対象一覧、納期一覧、仕入先別集計、見積回答状況
  - **経理**: 支払予定一覧、金額集計、見積vs実績、月別コスト推移

---

## 4. テーブル定義（15テーブル）

> ★ = 本設計で追加された重要フィールド

### 4.1 コアテーブル（5テーブル）

#### dom_headers（DOMヘッダー）

| フィールド | 型 | 説明 |
|-----------|------|------|
| id | UUID / PK | 主キー |
| project_id | FK | → projects（P26001） |
| work_order_id | FK? | → work_orders（受注後に紐づけ） |
| customer_name | VARCHAR | 客先名 |
| machine_name | VARCHAR | 機械名 |
| machine_model | VARCHAR | 機械型式 |
| project_deadline | DATE ★ | 案件全体の希望納期（客先納期） |
| version | INT | DOM版数 |
| status | ENUM | 作成中 / 確定 / 発注済 |
| total_cost | DECIMAL | 合計金額（自動計算） |
| designed_by | FK | → employees（設計者） |
| approved_by | FK? | → employees（承認者） |
| checked_by | FK? | → employees（確認者） |
| designed_at | DATE? | 設計日 |
| approved_at | DATE? | 承認日 |
| checked_at | DATE? | 確認日 |
| notes | TEXT | 備考 |
| created_by | FK | → employees |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### dom_sections（セクション）

| フィールド | 型 | 説明 |
|-----------|------|------|
| id | UUID / PK | 主キー |
| dom_header_id | FK | → dom_headers |
| section_number | INT | 1, 2, 3…（S1がデフォルト） |
| section_code | VARCHAR | 自動生成: S1, S2… |
| section_name | VARCHAR | 例: 配管ユニット |
| subtotal | DECIMAL | セクション小計（自動計算） |
| notes | TEXT | 備考 |

#### dom_mech_items（メカ部品明細）

| フィールド | 型 | 説明 |
|-----------|------|------|
| id | UUID / PK | 主キー |
| dom_section_id | FK | → dom_sections |
| parent_id | FK? ★ | → dom_mech_items（親部品。組図はnull） |
| item_number | INT | 部品連番（000, 001…） |
| category | ENUM | 購入品 / 製作品 |
| item_type | ENUM? ★ | 製作品のみ: assembly / part |
| status | ENUM | 設計中/保留/見積依頼中/見積完了/手配依頼/手配中/入荷済 |
| part_code | VARCHAR | 製作品: P26001-S1-001-0（自動生成） |
| revision | INT | 図面改訂番号（0→1→2） |
| part_name | VARCHAR | 名称 |
| model_number | VARCHAR? | 型式（購入品の場合） |
| material_id | FK? ★ | → master_materials（リスト選択） |
| heat_treatment_id | FK? ★ | → master_heat_treatments（リスト選択） |
| surface_treatment_id | FK? ★ | → master_surface_treatments（リスト選択） |
| manufacturer | VARCHAR? | メーカー（購入品） |
| quantity | DECIMAL | 個数 |
| unit | VARCHAR | 単位 |
| unit_price | DECIMAL | 単価 |
| amount | DECIMAL | 合計金額（自動計算） |
| desired_delivery_date | DATE? ★ | 希望納期 |
| lead_time_days | INT? ★ | リードタイム（営業日数） |
| supplier_delivery_date | DATE? ★ | 仕入先回答納期 |
| order_deadline | DATE? ★ | 発注期限（自動計算: 希望納期 - リードタイム） |
| actual_delivery_date | DATE? ★ | 実納品日 |
| master_part_id | FK? | → master_parts（将来） |
| notes | TEXT | 備考 |

#### dom_elec_items（電気部品明細）

| フィールド | 型 | 説明 |
|-----------|------|------|
| id | UUID / PK | 主キー |
| dom_header_id | FK | → dom_headers（直接紐づけ） |
| item_number | INT | 部品連番 |
| category | ENUM | 購入品 / 製作品 |
| status | ENUM | 設計中/保留/見積依頼中/見積完了/手配依頼/手配中/入荷済 |
| mark | VARCHAR? | 電気記号 MARK（案件固有） |
| part_name | VARCHAR | 名称 |
| model_number | VARCHAR | 型式 |
| manufacturer | VARCHAR | メーカー |
| quantity | DECIMAL | 個数 |
| unit | VARCHAR | 単位 |
| unit_price | DECIMAL | 単価 |
| amount | DECIMAL | 合計金額（自動計算） |
| desired_delivery_date | DATE? ★ | 希望納期 |
| lead_time_days | INT? ★ | リードタイム（営業日数） |
| supplier_delivery_date | DATE? ★ | 仕入先回答納期 |
| order_deadline | DATE? ★ | 発注期限（自動計算） |
| actual_delivery_date | DATE? ★ | 実納品日 |
| master_part_id | FK? | → master_parts（将来） |
| notes | TEXT | 備考 |

#### dom_labor（社内工数）

| フィールド | 型 | 説明 |
|-----------|------|------|
| id | UUID / PK | 主キー |
| dom_header_id | FK | → dom_headers |
| discipline | ENUM | メカ / 電気 |
| work_type | ENUM | 設計 / 施工 / その他 |
| description | VARCHAR | 作業内容 |
| hours | DECIMAL | 工数（時間） |
| hourly_rate | DECIMAL | 時間単価 |
| amount | DECIMAL | 金額（自動計算） |
| assigned_to | FK? | → employees |
| notes | TEXT | 備考 |

### 4.2 ファイル管理（1テーブル）

#### dom_item_files（部品添付ファイル）

製作品の図面（PDF/DWG）等を1部品に対して複数保管可能。

| フィールド | 型 | 説明 |
|-----------|------|------|
| id | UUID / PK | 主キー |
| item_type | ENUM | mech / elec |
| item_id | UUID / FK | → dom_mech_items or dom_elec_items |
| file_name | VARCHAR | ファイル名 |
| file_type | ENUM | pdf / dwg / jpeg / other |
| file_path | VARCHAR | ストレージパス |
| file_size | INT | ファイルサイズ（bytes） |
| revision | INT | 図面リビジョンとの対応 |
| description | VARCHAR | 説明（組立図、部品図等） |
| uploaded_by | FK | → employees |
| uploaded_at | TIMESTAMP | |

### 4.3 見積依頼（3テーブル）

#### dom_quote_requests（見積依頼）

複数部品を柔軟にまとめた見積依頼単位。

| フィールド | 型 | 説明 |
|-----------|------|------|
| id | UUID / PK | 主キー |
| dom_header_id | FK | → dom_headers |
| request_number | VARCHAR | 見積依頼番号（自動採番） |
| supplier_id | FK | → suppliers |
| request_date | DATE | 依頼日 |
| due_date | DATE? | 回答期限 |
| response_date | DATE? | 回答日 |
| status | ENUM | 作成中 / 依頼済 / 回答済 / 採用 / 不採用 |
| total_quoted | DECIMAL? | 見積合計金額 |
| quoted_lead_time | VARCHAR? | 回答納期 |
| notes | TEXT | 補足 |
| created_by | FK | → employees |
| created_at | TIMESTAMP | |

#### dom_quote_request_items（見積依頼明細）

見積依頼と部品の多対多の中間テーブル。

| フィールド | 型 | 説明 |
|-----------|------|------|
| id | UUID / PK | 主キー |
| quote_request_id | FK | → dom_quote_requests |
| item_type | ENUM | mech / elec |
| item_id | UUID / FK | → dom_mech_items or dom_elec_items |
| quoted_unit_price | DECIMAL? | 回答単価（部品別） |
| quoted_amount | DECIMAL? | 回答金額（部品別） |
| is_selected | BOOLEAN | 採用フラグ |
| notes | TEXT | 部品別の回答備考 |

#### dom_quote_files（見積書ファイル）

見積書（PDF/JPEG）を依頼単位で保管。

| フィールド | 型 | 説明 |
|-----------|------|------|
| id | UUID / PK | 主キー |
| quote_request_id | FK | → dom_quote_requests |
| file_name | VARCHAR | ファイル名 |
| file_type | ENUM | pdf / jpeg / other |
| file_path | VARCHAR | ストレージパス |
| file_size | INT | ファイルサイズ |
| uploaded_by | FK | → employees |
| uploaded_at | TIMESTAMP | |

### 4.4 コミュニケーション（1テーブル）

#### dom_comments（コメント履歴）

部品ごとの部門間コメント（設計↔購買↔営業）。

| フィールド | 型 | 説明 |
|-----------|------|------|
| id | UUID / PK | 主キー |
| item_type | ENUM | mech / elec / labor / header |
| item_id | UUID / FK | → 対象テーブルのID |
| author_id | FK | → employees |
| department | ENUM | 設計部 / 購買部 / 営業部 |
| content | TEXT | コメント内容 |
| created_at | TIMESTAMP | |

**コメント例:**
```
設計部 田中 (2/15 10:30): 型番 KSB-ETA50 で見積依頼お願いします
購買部 佐藤 (2/16 14:20): KSB-ETA50は廃盤です。後継機種 ETA50-Nで見積取りました
設計部 田中 (2/16 16:45): 了解。寸法確認しました。ETA50-Nで問題なし
営業部 鈴木 (2/17 09:10): 客先に型番変更の説明が必要。納期は変わりますか？
購買部 佐藤 (2/17 10:00): 納期は同じ3週間で回答もらっています
```

### 4.5 承認（1テーブル）

#### dom_approvals（発注承認）

発注時のみの承認フロー。

| フィールド | 型 | 説明 |
|-----------|------|------|
| id | UUID / PK | 主キー |
| dom_header_id | FK | → dom_headers |
| requested_by | FK | → employees（申請者） |
| requested_at | TIMESTAMP | 申請日時 |
| status | ENUM | 申請中 / 承認済 / 差戻し |
| approved_by | FK? | → employees（承認者） |
| approved_at | TIMESTAMP? | 承認日時 |
| rejection_reason | TEXT? | 差戻し理由 |
| notes | TEXT | 備考 |

### 4.6 マスタテーブル（4テーブル）

#### master_materials（材質マスタ）

| フィールド | 型 | 説明 |
|-----------|------|------|
| id | UUID / PK | 主キー |
| code | VARCHAR / UQ | 材質コード（SDK11等） |
| name_ja | VARCHAR | 日本語名 |
| name_en | VARCHAR? | 英語名 |
| category | VARCHAR | 分類（工具鋼, 炭素鋼, ステンレス等） |
| sort_order | INT | 表示順 |
| is_active | BOOLEAN | 有効フラグ |

**初期データ例:** SDK11, SS400, SUS304, SUS316, S45C, S50C, SCM440, A5052, C3604, MCナイロン

#### master_heat_treatments（熱処理マスタ）

| フィールド | 型 | 説明 |
|-----------|------|------|
| id | UUID / PK | 主キー |
| code | VARCHAR / UQ | 熱処理コード |
| name | VARCHAR | 名称（58-60 HRC等） |
| method | VARCHAR? | 処理方法（焼入, 浸炭, 窒化等） |
| sort_order | INT | 表示順 |
| is_active | BOOLEAN | 有効フラグ |

**初期データ例:** 58-60 HRC, 55-58 HRC, 40-45 HRC, 浸炭焼入, 高周波焼入, 窒化処理, 焼きなまし, 調質

#### master_surface_treatments（表面処理マスタ）

| フィールド | 型 | 説明 |
|-----------|------|------|
| id | UUID / PK | 主キー |
| code | VARCHAR / UQ | 表面処理コード |
| name | VARCHAR | 名称（BLACK OXIDE等） |
| category | VARCHAR? | 分類（化成処理, メッキ, 塗装等） |
| sort_order | INT | 表示順 |
| is_active | BOOLEAN | 有効フラグ |

**初期データ例:** BLACK OXIDE, ユニクロメッキ, クロムメッキ, 無電解ニッケル, 硬質クロム, アルマイト, 粉体塗装, 三価クロメート

#### master_holidays（祝日マスタ）

タイの祝日を年ごとに登録。営業日計算で土日とともに除外する。

| フィールド | 型 | 説明 |
|-----------|------|------|
| id | UUID / PK | 主キー |
| holiday_date | DATE / UQ | 祝日の日付 |
| name_th | VARCHAR | タイ語名 |
| name_ja | VARCHAR? | 日本語名 |
| name_en | VARCHAR? | 英語名 |
| year | INT | 年（検索用） |
| is_substitute | BOOLEAN | 振替休日フラグ |

**2026年のタイ祝日（17件）:**

| 日付 | タイ語 | 日本語 |
|------|--------|--------|
| 2026-01-01 | วันขึ้นปีใหม่ | 元日 |
| 2026-02-26 | วันมาฆบูชา | 万仏節 |
| 2026-04-06 | วันจักรี | チャクリー記念日 |
| 2026-04-13〜15 | วันสงกรานต์ | ソンクラーン |
| 2026-05-01 | วันแรงงาน | メーデー |
| 2026-05-12 | วันวิสาขบูชา | 仏誕節 |
| 2026-06-03 | วันเฉลิมฯ ร.10 | 国王誕生日 |
| 2026-07-10 | วันอาสาฬหบูชา | 三宝節 |
| 2026-07-28 | วันเฉลิมฯ ร.10 | 国王即位記念日 |
| 2026-08-12 | วันแม่ | 王妃誕生日 |
| 2026-10-13 | ร.9 สวรรคต | ラーマ9世記念日 |
| 2026-10-23 | วันปิยมหาราช | チュラロンコーン大王記念日 |
| 2026-12-05 | วันพ่อ | ラーマ9世誕生日 |
| 2026-12-10 | วันรัฐธรรมนูญ | 憲法記念日 |
| 2026-12-31 | วันสิ้นปี | 大晦日 |

---

## 5. ステータス管理

### 5.1 部品ステータス（7段階）

`dom_mech_items`, `dom_elec_items` 共通。

```
設計中 → 保留 → 見積依頼中 → 見積完了 → 手配依頼 → 手配中 → 入荷済
```

- **保留**はどのステータスからでも遷移可能。保留解除時は元のステータスに戻る。

### 5.2 発注承認（3段階）

```
申請中 → 承認済 / 差戻し
```

- 承認は**発注時のみ**。見積依頼時には不要。

### 5.3 ステータスと承認の関係

```
部品: 手配依頼
  ↓ 購買が発注申請
承認: 申請中
  ↓ 上長が承認
承認: 承認済
  ↓ 発注書発行
部品: 手配中
  ↓ 納品確認
部品: 入荷済
```

---

## 6. 納期管理

### 6.1 設計思想

案件全体の希望納期（`project_deadline`）と部品個別の希望納期（`desired_delivery_date`）を持つ。リードタイム（営業日数）から発注期限を自動計算する。

営業日は**土曜・日曜 + タイの祝日**（`master_holidays`）を除外して計算する。

### 6.2 日付フィールド

**dom_headers:**
- `project_deadline` — 案件全体の希望納期（客先納期）

**dom_mech_items / dom_elec_items:**
- `desired_delivery_date` — 部品個別の希望納期
- `lead_time_days` — リードタイム（営業日数）
- `supplier_delivery_date` — 仕入先回答納期（日付）
- `order_deadline` — 発注期限（自動計算: 希望納期 - リードタイム）
- `actual_delivery_date` — 実納品日

### 6.3 計算ロジック

```javascript
// 発注期限の計算
order_deadline = subtractBusinessDays(
  desired_delivery_date,
  lead_time_days,
  holidays  // master_holidays + 土日
)

// 残り営業日数
remaining_biz_days = countBusinessDays(
  today,
  order_deadline,
  holidays
)

// ステータス判定
if (remaining_biz_days > 5)         → 🟢 余裕あり
if (1 <= remaining_biz_days <= 4)   → 🟡 発注間近
if (remaining_biz_days < 0)         → 🔴 期限超過
if (lead_time > bizDaysUntilDesired) → 🟣 納期遅延
```

### 6.4 納期ステータス（自動判定）

| ステータス | 条件 | アクション |
|-----------|------|-----------|
| 🟢 余裕あり | 発注期限まで5営業日以上 | 通常対応 |
| 🟡 発注間近 | 発注期限まで1〜4営業日 | 今週中に発注判断 |
| 🔴 期限超過 | 発注期限を過ぎている | 即対応が必要 |
| 🟣 納期遅延 | 希望納期に間に合わない | 客先に納期調整の相談 |
| 🔵 発注済 | 発注済で入荷待ち | 進捗フォロー |
| ⚪ 入荷済 | 納品完了 | — |

### 6.5 具体例

```
本日: 2026-02-20（金）
案件納期: 2026-04-15（水）

部品名              希望納期    LT(営業日)  発注期限    残日数  ステータス
ポンプ KSB-ETA50    2026-04-10  15         2026-03-20  20     🟢 余裕あり
サーボモータ SGM7G  2026-04-10  40         2026-02-13  -5     🔴 期限超過
架台 P26001-S1-001  2026-03-31  20         2026-03-03  7      🟢 余裕あり
バルブ KITZ-10K     2026-04-01  5          2026-03-25  23     🟢 余裕あり
PLC FX5U-32MT       2026-04-10  10         2026-02-23  1      🟡 発注間近
```

### 6.6 購買ダッシュボード

期限超過・発注間近・納期遅延の件数をサマリ表示。即対応が必要な部品を一覧で把握できるようにする。

---

## 7. 見積依頼管理

### 7.1 運用フロー

1. DOM上で見積依頼する部品を選択（複数部品を柔軟にグルーピング）
2. 見積依頼を作成、仕入先を指定 → `dom_quote_requests` 1レコード
3. 選択した部品が `dom_quote_request_items` として紐づく
4. 仕入先から見積書受領 → `dom_quote_files` に PDF/JPEG 保管
5. 部品ごとの回答金額を `dom_quote_request_items` に入力
6. 将来: 別の仕入先にも同じ部品で見積依頼（相見積もり）

### 7.2 データの流れ

```
dom_mech_items (3部品を選択)
  ↓
dom_quote_requests × 1 (A社への依頼)
  ├─▶ dom_quote_request_items × 3 (部品ごとの明細)
  └─▶ dom_quote_files × 1 (見積書PDF)

-- 相見積もり時 --
dom_quote_requests × 1 (B社への依頼)
  ├─▶ dom_quote_request_items × 3
  └─▶ dom_quote_files × 1
```

### 7.3 コメント機能

部品ごとにコメント履歴を残せる。設計部↔購買部↔営業部間の連絡に使用。型番変更、廃盤情報、仕様確認、納期相談などを時系列で記録。

---

## 8. 権限設計

新システムで初めて権限管理を導入する。

### 8.1 部門別権限マトリクス

| 機能 | 設計部 | 購買部 | 営業部 | 経理部 | 管理者 |
|------|--------|--------|--------|--------|--------|
| DOM部品入力 | ✏️ 編集 | 👁 閲覧 | 👁 閲覧 | 👁 閲覧 | ✏️ 編集 |
| 図面アップロード | ✏️ 編集 | 👁 閲覧 | 👁 閲覧 | — | ✏️ 編集 |
| 見積依頼 | 👁 閲覧 | ✏️ 編集 | 👁 閲覧 | 👁 閲覧 | ✏️ 編集 |
| 発注申請 | — | ✏️ 編集 | — | 👁 閲覧 | ✏️ 編集 |
| 発注承認 | — | — | — | — | ✅ 承認 |
| コメント | ✏️ 編集 | ✏️ 編集 | ✏️ 編集 | 👁 閲覧 | ✏️ 編集 |
| 客先見積書 | 👁 閲覧 | 👁 閲覧 | ✏️ 編集 | 👁 閲覧 | ✏️ 編集 |
| マスタ編集 | — | — | — | — | ✏️ 編集 |

---

## 9. 開発フェーズ

### Phase 1: コア

**対象テーブル:** dom_headers, dom_sections, dom_mech_items, dom_elec_items, dom_labor, dom_item_files, master_materials, master_heat_treatments, master_surface_treatments

**目的:** まずExcel置き換えとして使える状態にする。部品の登録・閲覧・図面管理が可能に。

### Phase 2: 納期管理

**対象:** 納期関連フィールド（5つのDATE項目）、master_holidays、営業日計算ロジック、購買ダッシュボード

**目的:** 発注期限の自動計算と可視化。納期リスクの早期発見。

### Phase 3: 見積依頼

**対象テーブル:** dom_quote_requests, dom_quote_request_items, dom_quote_files, dom_comments

**目的:** 見積依頼のグルーピング、見積書保管、部門間コメント機能。将来の相見積もり対応。

### Phase 4: 統合

**対象テーブル:** dom_approvals + 既存モジュール接続

**目的:** 発注承認フロー、客先見積書PDF生成、注文書発行、コスト実績管理との連携。通知機能（システム内 + メール）の実装。将来LINE通知追加。

---

## 10. 業務フロー

```
引合い → PJ番号発行（P26001）
  ↓
DOM作成（メカ・電気・工数を各タブで入力）
  ↓
仕入先へ見積依頼（dom_quote_requestsに記録、相見積もり対応）
  ↓
回答取得（金額・納期反映、見積書PDF保管）
  ↓
客先見積書作成（全体集計の金額 + 利益率 = 見積金額）
  ↓
受注 → 工事番号発行（dom_headerにwork_order_id紐づけ）
  ↓
発注申請 → 承認 → 注文書発行（採用見積から自動生成）
  ↓
納品確認 → コスト実績管理（DOM見積 vs 実発注額の差異管理）
```

---

## 11. ER関連図

```
dom_headers
  ├─1:N─▶ dom_sections ─1:N─▶ dom_mech_items（自己参照: parent_id）
  │                              ├─1:N─▶ dom_item_files
  │                              ├─N:M─▶ dom_quote_request_items
  │                              └─1:N─▶ dom_comments
  ├─1:N─▶ dom_elec_items
  │         ├─1:N─▶ dom_item_files
  │         ├─N:M─▶ dom_quote_request_items
  │         └─1:N─▶ dom_comments
  ├─1:N─▶ dom_labor
  ├─1:N─▶ dom_quote_requests
  │         ├─1:N─▶ dom_quote_request_items
  │         └─1:N─▶ dom_quote_files
  └─1:N─▶ dom_approvals

外部テーブル:
  projects     ──1:N──▶ dom_headers
  work_orders  ──1:1──▶ dom_headers
  suppliers    ──1:N──▶ dom_quote_requests
  employees    ──1:N──▶ dom_headers, dom_comments, dom_approvals
  master_parts ──1:N──▶ dom_mech_items, dom_elec_items（将来）
```

---

## Excelとの項目対応

### メカ部品表

| Excel項目 | 新システム |
|-----------|-----------|
| 図番/型式 (DWG.NO./MODEL) | part_code |
| 改定 (Rev) | revision |
| 名称 (NAME) | part_name |
| 個数 (QTY) | quantity |
| 材質/メーカー (MAT/VENDER) | material_id + manufacturer |
| 熱処理 (HEAT TREATMENT) | heat_treatment_id |
| 表面処理 (SURFACE TREATMENT) | surface_treatment_id |
| 備考 (NOTE) | notes |
| 手配 (Order) | status（7段階に置換） |
| 納期 (Delivery) | desired_delivery_date + lead_time_days |
| 旧図番 (Old DWG No.) | **廃止** |
| 単価 / 合計 | unit_price / amount |

### 電気部品表

| Excel項目 | 新システム |
|-----------|-----------|
| 記号 (MARK) | mark |
| 名称 (NAME) | part_name |
| 型式 (TYPE) | model_number |
| 個数 (QTY) | quantity |
| メーカー (MAKER) | manufacturer |
| 手配 (Order) | status（7段階に置換） |
| 納期 (Delivery) | desired_delivery_date + lead_time_days |
| 備考 (NOTE) | notes |
| 単価 (Unit Price) | unit_price |