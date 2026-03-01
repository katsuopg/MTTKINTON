# Kintone エキスパート ナレッジベース

## プロジェクトビジョン

**MTT Kinton = Kintone完全再現 + 独自拡張**

Kintoneの全機能（アプリ作成〜設計〜設定〜運用〜管理）を自作し、
Kintoneに足りない機能を補って独自のプラットフォームとする。
技術スタック: Next.js + Supabase + Tailwind CSS。

---

## 0. Kintone アプリ ライフサイクル全体像

Kintoneのアプリは5つのフェーズで構成される。
MTT Kintonはこの全フェーズを再現する。

### 0.1 ライフサイクル

```
作成(Create) → 設計(Design) → 設定(Configure) → 運用(Operate) → 管理(Manage)
```

### 0.2 フェーズ別機能一覧と実装状況

#### 作成（Create）

| 機能 | Kintone | MTT Kinton | 状態 |
|------|---------|-----------|------|
| はじめから作成 | D&Dでフォーム設計 | — | 🔜 将来 |
| Excelから作成 | CSV→アプリ変換 | — | 🔜 将来 |
| サンプルアプリ | 100+テンプレート | — | 🔜 将来 |
| テンプレートから作成 | 保存済みテンプレート | — | 🔜 将来 |
| アプリコピー | 既存アプリ複製 | — | 🔜 将来 |

#### 設計（Design）

| 機能 | Kintone | MTT Kinton | 状態 |
|------|---------|-----------|------|
| フォーム設計 | 30+フィールドD&D | コードで定義 | 🔜 将来 |
| 一覧設定 | 表/カレンダー/カスタマイズ | コードで定義 | 🔜 将来 |
| グラフ設定 | 棒/折れ線/円/クロス集計 | ダッシュボードのみ | 🔜 将来 |
| ルックアップ | 他アプリ参照フィールド | SQLリレーション | 🔜 将来 |
| 関連レコード | 関連アプリ一覧表示 | 詳細ページタブ | ⚠️ 部分 |

#### 設定（Configure）

| 機能 | Kintone | MTT Kinton | 状態 |
|------|---------|-----------|------|
| アプリのアクセス権 | 7権限設定 | `AppPermissionSettings` | ✅ 済 |
| レコードのアクセス権 | 条件ベース権限 | DB設計済み | ⚠️ UIなし |
| フィールドのアクセス権 | フィールド単位権限 | `FieldPermissionSettings` | ✅ 済 |
| プロセス管理 | ステータス/アクション/作業者 | DB設計済み | ⚠️ UIなし |
| アプリの条件通知 | 操作トリガー通知 | — | ❌ 未着手 |
| レコードの条件通知 | 値条件通知 | — | ❌ 未着手 |
| リマインダー通知 | 日時ベース通知 | — | ❌ 未着手 |
| Webhook | 外部URL呼び出し | — | ❌ 未着手 |
| 高度な設定（9項目） | 一括削除/履歴/コメント等 | `apps.code`のみ | ❌ ほぼ未着手 |

#### 運用（Operate）

| 機能 | Kintone | MTT Kinton | 状態 |
|------|---------|-----------|------|
| レコード追加 | フォームから登録 | 各ページ対応 | ✅ 済 |
| レコード編集 | フォームから修正 | 各ページ対応 | ✅ 済 |
| レコード削除 | 個別/一括削除 | 一部対応 | ⚠️ 部分 |
| 検索・絞り込み | キーワード/条件 | 各一覧ページ | ✅ 済 |
| ソート | 列クリック並び替え | 一部対応 | ⚠️ 部分 |
| コメント | レコード内コメント | — | ❌ 未着手 |
| 変更履歴 | 編集ログ | — | ❌ 未着手 |
| インライン編集 | 一覧で直接編集 | — | ❌ 未着手 |
| 印刷 | レコード印刷 | — | ❌ 未着手 |
| ファイル読み込み | CSVインポート | ImportData | ✅ 済 |
| ファイル書き出し | CSVエクスポート | — | ❌ 未着手 |
| レコード再利用 | コピーして新規作成 | — | ❌ 未着手 |

#### 管理（Manage）

| 機能 | Kintone | MTT Kinton | 状態 |
|------|---------|-----------|------|
| アプリ削除/復旧 | 削除・30日以内復元 | — | ❌ 未着手 |
| アプリコピー | 設定複製 | — | ❌ 未着手 |
| テンプレート化 | 再利用雛形 | — | ❌ 未着手 |
| 動作テスト | 設定の事前確認 | — | ❌ 未着手 |
| 設定変更履歴 | 誰が何を変更 | — | ❌ 未着手 |
| 言語設定 | アプリ名多言語 | `apps.name_en/th` | ✅ 済 |
| メンテナンスモード | 一時アクセス制限 | — | ❌ 未着手 |

### 0.3 Kintone フォームフィールドタイプ（30種+）

MTT Kintonのフォームビルダーで再現すべきフィールド一覧:

| カテゴリ | フィールド |
|---------|----------|
| テキスト | 文字列（1行）、文字列（複数行）、リッチエディター、数値、計算 |
| 選択 | ラジオボタン、チェックボックス、複数選択、ドロップダウン |
| ユーザー・組織 | ユーザー選択、組織選択、グループ選択 |
| 日時 | 日付、時刻、日時 |
| ファイル | 添付ファイル |
| リンク | リンク（URL/電話/メール） |
| 参照 | ルックアップ、関連レコード一覧 |
| 自動 | レコード番号、作成者、作成日時、更新者、更新日時 |
| テーブル | テーブル（サブテーブル）— 行の動的追加 |
| 装飾 | ラベル、スペース、罫線、グループ |

### 0.4 Kintone 一覧の種類

| 種類 | 説明 |
|------|------|
| 表形式 | 標準テーブル表示。列選択、ソート、絞り込み |
| カレンダー形式 | 日付フィールドベースのカレンダー表示 |
| カスタマイズ | HTML/JS/CSSで自由にレイアウト |

### 0.5 Kintone グラフの種類

| 種類 | 説明 |
|------|------|
| 棒グラフ | 縦棒/横棒、積み上げ |
| 折れ線グラフ | 時系列推移 |
| 円グラフ | 構成比 |
| クロス集計表 | ピボットテーブル |
| 面グラフ | 時系列推移（面） |

---

## 1. Kintone 権限体系の全体像

### 1.1 権限の階層構造（上位が優先）

```
レイヤー1: cybozu.com共通管理者（最上位・全権限バイパス）
    ↓
レイヤー2: kintoneシステム管理アクセス権（システム全体の権限）
    ↓
レイヤー3: アプリグループのアクセス権（複数アプリの一括権限）
    ↓
レイヤー4: アプリのアクセス権（アプリ単位の権限）
    ↓
レイヤー5: レコードのアクセス権（条件ベースのレコード単位権限）
    ↓
レイヤー6: フィールドのアクセス権（フィールド単位の閲覧/編集権限）
```

**共通ルール:**
- 全ての階層で「上の行の設定が優先される」
- Everyone行は常に最下部に固定
- 組織には「下位組織への継承」オプションがある
- 上位レイヤーで権限がない場合、下位レイヤーの権限は無意味

### 1.2 MTT Kinton での対応マッピング

| Kintone レイヤー | MTT Kinton 実装 | DB テーブル |
|-----------------|----------------|------------|
| 共通管理者 | system_admin ロール | `roles`, `user_roles` |
| システム管理アクセス権 | ロール権限フラグ | `roles` (can_manage_*) |
| アプリグループ | （将来実装） | - |
| アプリのアクセス権 | レベル1権限 | `app_permissions` |
| レコードのアクセス権 | レベル2権限 | `record_permission_rules` |
| フィールドのアクセス権 | レベル3権限 | `field_permissions` |

---

## 2. 管理者の種類と権限

### 2.1 Kintone の6種の管理者

| 管理者タイプ | MTT Kinton対応 | 権限範囲 |
|-------------|---------------|---------|
| cybozu.com共通管理者 | `system_admin` ロール | 全権限バイパス。ユーザー/組織の管理、監査ログ、セキュリティ設定 |
| 組織の管理者 | `manager` ロール（組織スコープ） | 特定組織の情報変更、子組織追加、メンバー管理 |
| kintoneシステム管理者 | `administrator` ロール | アプリ/スペース作成権、テンプレート管理、プラグイン登録 |
| アプリ管理者 | `app_permissions.can_manage=true` | フォーム/プロセス管理、通知設定、アクセス権設定 |
| スペース管理者 | （将来実装） | スペースの設定変更 |
| ストア管理者 | 対象外 | 契約・ドメイン管理 |

### 2.2 権限階層の判定ロジック

```
1. system_admin ロール → 全権限バイパス（RLSを超越）
2. administrator ロール → システム設定へのアクセス可能
3. user_roles で割り当てられたロールの権限フラグをOR集約
4. app_permissions で対象アプリの権限を優先順位順に評価
5. record_permission_rules で条件マッチするルールを評価
6. field_permissions でフィールド単位の権限を評価
```

---

## 3. アプリのアクセス権（レベル1）

### 3.1 設定可能な7つの権限

| 権限項目 | DB カラム | 説明 |
|---------|----------|------|
| レコード閲覧 | `can_view` | レコードの一覧表示・詳細表示 |
| レコード追加 | `can_add` | 新規レコードの作成 |
| レコード編集 | `can_edit` | 既存レコードの変更（閲覧も必須） |
| レコード削除 | `can_delete` | レコードの削除（閲覧も必須） |
| アプリ管理 | `can_manage` | アプリの設定変更 |
| ファイル読み込み | `can_import` | CSVインポート（追加も必須） |
| ファイル書き出し | `can_export` | CSVエクスポート（閲覧も必須） |

### 3.2 権限の連動ルール（自動付与）

| 付与する権限 | 自動的に必須になる権限 |
|-------------|---------------------|
| レコード編集 | レコード閲覧 |
| レコード削除 | レコード閲覧 |
| ファイル読み込み | レコード追加 |
| ファイル書き出し | レコード閲覧 |

### 3.3 設定対象（target_type）

| 対象 | target_type | target_id | 説明 |
|------|------------|-----------|------|
| 個別ユーザー | `user` | employee_id | 特定ユーザーに直接指定 |
| 組織 | `organization` | organization_id | 組織単位（下位組織継承オプション） |
| ロール/グループ | `role` | role_id | ロール単位 |
| 全員 | `everyone` | NULL | 認証済み全ユーザー |

### 3.4 優先順位ルール

- `priority` カラムの値が**大きいほど優先**
- 同一ユーザーに複数の権限が該当する場合、最も優先度の高い設定が適用
- `everyone` は最低優先度（priority=1）
- 複数ロールに所属する場合は**OR集約**（いずれかのロールで許可されていれば許可）

### 3.5 権限なし時の挙動

- アプリはポータルから完全に非表示
- URLでの直接アクセスもエラー
- レコード追加のみの権限の場合、追加後に「権限がありません」エラー表示（データ自体は登録される）

---

## 4. レコードのアクセス権（レベル2）

### 4.1 設定可能な権限

- 閲覧（can_view）
- 編集（can_edit）
- 削除（can_delete）

### 4.2 条件設定

```json
// 条件の構造
{
  "logic": "AND" | "OR",  // 複数条件の論理演算
  "conditions": [
    {
      "field": "status",          // フィールド名
      "operator": "eq",           // 演算子
      "value": "retired"          // 比較値
    },
    {
      "field": "department",
      "operator": "in",
      "values": ["HR", "Admin"]
    }
  ]
}
```

### 4.3 条件に利用可能なフィールドタイプ

| 利用可能 | 利用不可 |
|---------|---------|
| ユーザー選択 | ラベル |
| 組織選択 | リッチエディター |
| グループ選択 | 複数行文字列 |
| 作成者 / 更新者 | 添付ファイル |
| プロセス管理の作業者 | 関連レコード一覧 |
| 数値 / 文字列 | スペース / 罫線 |
| ドロップダウン / ラジオボタン | |

### 4.4 動的な権限指定

レコード内のユーザー選択フィールドの値を権限対象として使用可能。
例: 「担当者」フィールドに入っているユーザーのみ編集可能。

### 4.5 制約事項

- プロセス管理作業者には必ず閲覧権限が必要
- 組織変更時、権限は自動反映されない（アプリ更新で反映）
- アクセス権変更は分割処理で実行（処理中は新旧が混在する可能性）

---

## 5. フィールドのアクセス権（レベル3）

### 5.1 アクセスレベル

| レベル | access_level | 説明 |
|-------|-------------|------|
| 編集可能 | `edit` | 閲覧・編集可能 |
| 閲覧のみ | `view` | 閲覧可能（編集不可） |
| 非表示 | `hidden` | フィールド自体が非表示 |

### 5.2 アクセス権設定不可フィールド

- ラベル
- スペース
- 罫線
- レコード番号
- テーブル内のフィールド

### 5.3 優先順位

- ユーザー直接指定 > 組織指定 > ロール指定 > everyone
- 同一カテゴリ内では priority カラムの値が大きい方が優先

---

## 6. アプリグループ

### 6.1 概要

複数アプリのアクセス権を一括管理する機能。

### 6.2 デフォルトグループ

| グループ名 | 説明 |
|-----------|------|
| Public | デフォルト。全ユーザーに公開 |
| Private | 作成者のみアクセス可能 |

### 6.3 設定可能な権限

| 権限 | 説明 |
|------|------|
| アプリの作成 | グループ内へのアプリ作成 |
| アプリの管理/使用/削除 | レコード操作 + アプリ設定 + ファイル操作 |

### 6.4 優先順位

- アプリグループの制限 > アプリ個別のアクセス権
- グループレベルで禁止されている場合、アプリ個別で許可しても無効

---

## 7. プロセス管理

### 7.1 基本概念

プロセス管理はレコードの処理状況（ワークフロー）を管理する機能。

| 要素 | 定義 | 例 |
|------|------|-----|
| ステータス | レコードの現在の処理段階 | 「未処理」「申請中」「承認済」「完了」 |
| アクション | ステータスを変更する操作（ボタン） | 「申請する」「承認する」「差し戻す」 |
| 作業者 | ステータスで作業を任されたユーザー | 申請者、承認者、管理者 |

### 7.2 ステータスの仕様

- ステータス名: 最大64文字
- 初期ステータス: レコード作成直後のステータス
- 最終ステータス: 作業者設定不可、プロセス終了
- デフォルト: 「未処理」「処理中」「完了」

### 7.3 アクションの3種類

#### (A) 通常アクション（作業者が実行）

| 種類 | 説明 | 条件 |
|------|------|------|
| 必須アクション | 作業者全員の実行が必要 | assignee_type=ALL の場合 |
| 任意アクション | 作業者のうち1人で十分 | assignee_type=ALL の場合の追加設定 |

#### (B) 作業者以外が実行できるアクション

- action_type = 'NON_ASSIGNEE'
- 代理承認、申請取り戻し、承認スキップに使用
- 実行可能ユーザー/組織/グループを個別指定

#### (C) 条件付きアクション

- filter_condition でフィールド値による条件を設定
- 条件に合致する場合のみアクションボタンが表示
- 金額による承認経路分岐などに使用

### 7.4 作業者指定の3パターン

| パターン | assignee_type | 説明 | 変更条件 |
|---------|--------------|------|---------|
| 選択 | `ONE` | 候補者から1人を選定 | 選定者がアクション実行 |
| 全員 | `ALL` | 全員が作業者 | 全員がアクション実行（必須）/ 1人（任意） |
| 1人 | `ANY` | 誰か1人で十分 | 誰か1人がアクション実行 |

#### 初期ステータスの作業者

- 「作業者を設定しない」
- 「作成者」（レコードを作成したユーザー）

#### 作業者に指定可能なエンティティ

| entity_type | 説明 |
|------------|------|
| `USER` | 個別ユーザー |
| `GROUP` | グループ |
| `ORGANIZATION` | 組織 |
| `FIELD_ENTITY` | フォーム内のユーザー/組織/グループ選択フィールド |
| `CREATOR` | レコード作成者 |

### 7.5 条件分岐の設定

同じステータスから複数のアクションを定義し、各アクションに異なる条件を設定する。

```
ステータス: 申請中
├─ 「課長承認」(条件: 金額 <= 100000) → 課長承認済
├─ 「部長確認へ」(条件: 金額 > 100000) → 部長確認中
└─ 「差し戻す」(条件なし) → 差戻し
```

### 7.6 申請ワークフロー設定例

#### 基本的な承認フロー

```
[申請前] --申請する--> [申請中] --承認する--> [承認済]
                            |
                            +--差し戻す--> [差戻し] --再申請--> [申請中]
```

#### 多段階承認フロー

```
[申請前] → [課長承認中] → [部長承認中] → [承認済]
              ↓                  ↓
           [差戻し]           [差戻し]
```

#### 代理承認付きフロー

```
[申請中]
  ├─ 作業者: 課長  → 「承認する」 → [承認済]
  ├─ 作業者: 課長  → 「差し戻す」 → [差戻し]
  └─ 作業者以外: 副課長  → 「代理承認する」 → [承認済]
```

### 7.7 プロセス管理とアクセス権の関係

- 作業者にはレコード閲覧権限が**必須**
- 作業者設定時、アクションボタンは作業者のみに表示
- 作業者未設定時、全ユーザーにアクションボタンが表示
- フィールドのアクセス権でステータスごとの編集制御が可能

---

## 8. DB設計（プロセス管理テーブル）

### 8.1 プロセス定義テーブル

```sql
-- プロセス管理定義
CREATE TABLE process_definitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT FALSE,
    revision INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(app_id)
);

-- ステータス定義
CREATE TABLE process_statuses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    process_definition_id UUID NOT NULL REFERENCES process_definitions(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_initial BOOLEAN DEFAULT FALSE,
    is_final BOOLEAN DEFAULT FALSE,
    assignee_type VARCHAR(10) CHECK (assignee_type IN ('ONE', 'ALL', 'ANY')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ステータス作業者定義
CREATE TABLE process_status_assignees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    process_status_id UUID NOT NULL REFERENCES process_statuses(id) ON DELETE CASCADE,
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN (
        'USER', 'GROUP', 'ORGANIZATION', 'FIELD_ENTITY', 'CREATOR'
    )),
    entity_code VARCHAR(100),
    include_subs BOOLEAN DEFAULT FALSE
);

-- アクション定義
CREATE TABLE process_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    process_definition_id UUID NOT NULL REFERENCES process_definitions(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,
    from_status_id UUID NOT NULL REFERENCES process_statuses(id),
    to_status_id UUID NOT NULL REFERENCES process_statuses(id),
    filter_condition TEXT,
    action_type VARCHAR(20) DEFAULT 'NORMAL' CHECK (action_type IN ('NORMAL', 'NON_ASSIGNEE')),
    requirement_type VARCHAR(10) CHECK (requirement_type IN ('REQUIRED', 'OPTIONAL')),
    display_order INTEGER DEFAULT 0
);

-- アクション実行者（作業者以外のアクション用）
CREATE TABLE process_action_executors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    process_action_id UUID NOT NULL REFERENCES process_actions(id) ON DELETE CASCADE,
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN (
        'USER', 'GROUP', 'ORGANIZATION', 'FIELD_ENTITY'
    )),
    entity_code VARCHAR(100),
    include_subs BOOLEAN DEFAULT FALSE
);
```

### 8.2 実行時データテーブル

```sql
-- レコードごとのプロセス状態
CREATE TABLE record_process_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_id UUID NOT NULL,
    record_table VARCHAR(100) NOT NULL,
    current_status_id UUID NOT NULL REFERENCES process_statuses(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(record_id, record_table)
);

-- レコードごとの作業者
CREATE TABLE record_assignees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_process_state_id UUID NOT NULL REFERENCES record_process_states(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    has_executed BOOLEAN DEFAULT FALSE,
    executed_action_id UUID REFERENCES process_actions(id),
    executed_at TIMESTAMPTZ
);

-- アクション実行ログ
CREATE TABLE process_action_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_id UUID NOT NULL,
    record_table VARCHAR(100) NOT NULL,
    action_id UUID NOT NULL REFERENCES process_actions(id),
    from_status_id UUID NOT NULL REFERENCES process_statuses(id),
    to_status_id UUID NOT NULL REFERENCES process_statuses(id),
    executed_by UUID NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    comment TEXT
);
```

---

## 9. システム管理アクセス権

### 9.1 設定可能な権限

| 権限 | DB カラム | 説明 |
|------|----------|------|
| システムの管理 | `can_manage_settings` | システム管理画面へのアクセス |
| アプリの作成 | 自動: can_manage_employees等 | アプリ作成（アプリ管理も自動付与） |
| アプリの管理 | `can_manage_*` | アプリ設定操作 |
| アプリグループの管理 | `can_manage_settings` | アプリグループの作成・管理 |
| スペースの作成 | （将来実装） | 通常スペースの作成 |
| ゲストスペースの作成 | （将来実装） | ゲストスペースの作成 |

### 9.2 権限の連動

- アプリの作成 → アプリの管理（自動付与）
- アプリグループの管理 → システムの管理（前提条件）

---

## 10. MTT Kinton 現在のDB構造

### 10.1 権限関連テーブル一覧

| テーブル | 行数 | 用途 |
|---------|------|------|
| `roles` | 5 | ロール定義（system_admin, administrator, manager, editor, viewer） |
| `user_roles` | 0 | ユーザー↔ロール紐付け（organization_idでスコープ指定可能） |
| `apps` | 10 | アプリ定義（employees, customers, suppliers等） |
| `app_permissions` | 40 | アプリ権限設定（レベル1） |
| `record_permission_rules` | 0 | レコード権限ルール（レベル2） |
| `field_permissions` | 0 | フィールド権限（レベル3） |
| `app_features` | 15 | 旧権限システム（段階的に廃止予定） |
| `user_permissions` | 0 | 旧権限システム（段階的に廃止予定） |

### 10.2 旧システム（app_features / user_permissions）との関係

- `app_features`: アプリ機能のマスタ定義。`apps`テーブルと役割が重複
- `user_permissions`: employee_id → feature_code → can_view/edit/delete/manage のシンプルな権限
- **方針**: 新しい `roles` + `app_permissions` ベースのシステムに段階的に移行
- **互換性**: 移行中は両システムを並行運用し、新システムを優先

---

## 11. 実装ロードマップ

### Phase 1: 基本権限（現在）
- [x] ロール定義（roles テーブル）
- [x] ユーザー↔ロール紐付け（user_roles テーブル）
- [x] アプリ権限レベル1（app_permissions テーブル）
- [x] 権限チェックユーティリティ（permissions.ts, app-permissions.ts）
- [x] 設定画面UI（SettingsClient.tsx）
- [ ] ナビゲーション権限制御（DashboardLayout.tsx）
- [ ] ユーザーへのロール割り当て運用開始

### Phase 2: 詳細権限
- [ ] レコード権限ルール（record_permission_rules 運用）
- [ ] フィールド権限（field_permissions 運用）
- [ ] RLSポリシーを権限ベースに強化

### Phase 3: プロセス管理
- [ ] プロセス定義テーブル作成
- [ ] ステータス・アクション設定UI
- [ ] 作業者割り当て機能
- [ ] アクション実行・ステータス遷移ロジック
- [ ] 条件分岐
- [ ] アクション実行ログ

### Phase 4: 高度な機能
- [ ] アプリグループ
- [ ] 監査ログ
- [ ] 動的なレコード権限（フィールド値参照）
- [ ] 作業者以外のアクション（代理承認等）

---

## 12. Kintone 基本概念

### 12.1 Kintoneとは

Kintoneはサイボウズが提供するクラウド型業務アプリ開発プラットフォーム。
プログラミング不要で、ドラッグ&ドロップでフォームを作り、チーム内でデータを共有・管理できる。

### 12.2 基本要素

| 要素 | 説明 |
|------|------|
| **ポータル** | ログイン後の最初の画面。お知らせ、よく使うアプリ一覧を表示 |
| **アプリ** | 業務データを管理する単位（例: 顧客管理、案件管理、日報）。1アプリ = 1テーブル相当 |
| **レコード** | アプリ内の1行のデータ（例: 1件の顧客情報） |
| **フォーム** | レコードの入力画面レイアウト。フィールドをドラッグ&ドロップで配置 |
| **一覧** | レコードの一覧表示画面。表形式、カレンダー、カスタマイズ一覧を設定可能 |
| **グラフ** | レコードの集計・分析画面。棒・折れ線・円グラフ等を設定可能 |
| **スペース** | チーム用の仮想ワークスペース。掲示板、アプリ、メンバー管理を含む |
| **フィールド** | フォームを構成する入力項目（文字列、数値、日付、ドロップダウン、ユーザー選択等） |

### 12.3 アプリの構成タブ

Kintoneのアプリには4つのメインタブがある:

| タブ | 説明 |
|------|------|
| **フォーム** | レコード入力フォームのレイアウト設定 |
| **一覧** | レコード一覧画面の表示設定（テーブル/カレンダー等） |
| **グラフ** | 集計グラフの作成・設定 |
| **設定** | アプリのアクセス権、通知、プロセス管理等の全般設定 |

---

## 13. アプリの設定画面（「設定」タブ）

Kintoneの各アプリには「設定」タブがあり、5つのカテゴリに分類される。
**MTT Kintonのアプリ設定ページ（`/settings/apps/[appCode]`）はこの構成を参考にする。**

### 13.1 一般設定

| 項目 | 説明 | MTT Kinton対応 |
|------|------|---------------|
| アイコンと説明 | アプリのアイコン画像と説明文 | 🔜 将来実装 |
| デザインテーマ | アプリの配色テーマ | 対象外（共通テーマ） |
| プロセス管理 | ワークフロー（ステータス・アクション・作業者） | 🔜 Phase 3 |

### 13.2 通知

| 項目 | 説明 | MTT Kinton対応 |
|------|------|---------------|
| アプリの条件通知 | レコード操作（追加/編集/削除/コメント/ステータス変更）をトリガーとした通知 | 🔜 将来実装 |
| レコードの条件通知 | フィールド値の条件を満たしたレコードへの通知 | 🔜 将来実装 |
| リマインダーの条件通知 | 日時フィールドに基づく期限通知 | 🔜 将来実装 |

### 13.3 カスタマイズ／サービス連携

| 項目 | 説明 | MTT Kinton対応 |
|------|------|---------------|
| プラグイン | サードパーティプラグインの追加 | 対象外 |
| JavaScript / CSS | カスタムJS/CSSファイルの適用 | 対象外 |
| APIトークン | 外部連携用トークンの発行 | 対象外（Supabase API） |
| Webhook | 外部URL呼び出し設定 | 🔜 将来実装 |

### 13.4 アクセス権

| 項目 | 説明 | MTT Kinton対応 |
|------|------|---------------|
| アプリのアクセス権 | 7権限（レコード閲覧/追加/編集/削除、アプリ管理、ファイル読み込み/書き出し） | ✅ `AppPermissionSettings` |
| レコードのアクセス権 | 条件ベースのレコード単位権限（閲覧/編集/削除） | ✅ DB設計済み（`record_permission_rules`） |
| フィールドのアクセス権 | フィールド単位の閲覧/編集/非表示 | ✅ `FieldPermissionSettings` |

### 13.5 その他の設定

| 項目 | 説明 | MTT Kinton対応 |
|------|------|---------------|
| カテゴリー | レコードのグループ分け | 対象外 |
| 言語ごとの名称 | アプリ名の多言語設定 | ✅ `apps.name_en`, `apps.name_th` |
| レコードタイトル | レコードを一意に識別する表示名の設定 | 🔜 将来実装 |
| 高度な設定 | 以下9項目 | 部分対応 |
| アプリアクション | 他アプリへのデータ転記設定 | 対象外 |

### 13.6 高度な設定（9項目）

| 項目 | 説明 | MTT Kinton対応 |
|------|------|---------------|
| 画像のサムネイル表示 | 添付ファイルの画像縮小表示 | 対象外 |
| アプリコード | アプリ識別コード | ✅ `apps.code` |
| レコード一括削除 | 複数レコードの一括削除機能ON/OFF | 🔜 将来実装 |
| 変更履歴の記録 | レコード編集履歴の記録ON/OFF | 🔜 将来実装 |
| コメント機能 | レコード内コメント機能ON/OFF | 🔜 将来実装 |
| レコード再利用機能 | 既存レコードのコピー作成ON/OFF | 対象外 |
| インライン編集 | 一覧画面上でのレコード直接編集ON/OFF | 対象外 |
| 数値の有効桁数と丸めかた | 計算結果の精度設定 | 対象外 |
| 四半期の開始月 | グラフ集計の四半期基準月 | 対象外 |

### 13.7 アプリ設定のUI操作フロー

```
1. アプリ一覧画面 → ⚙アイコン（アプリ管理権限を持つユーザーのみ表示）
2. アプリの設定画面が開く（フォーム/一覧/グラフ/設定タブ）
3. 「設定」タブ → カテゴリごとに設定項目が展開
4. 設定変更 → [保存] → [アプリを更新] で運用環境に反映
```

**重要**: Kintoneでは設定変更後に「アプリを更新」しないと運用環境に反映されない（2段階確定）。
MTT Kintonでは保存ボタン押下で即時反映する方式を採用。

---

## 14. 参考リンク

### 基本
- [Kintone ヘルプ トップ](https://jp.kintone.help/k/ja/)
- [アプリの設定画面](https://jp.kintone.help/k/ja/app/app_changesettings)
- [アプリの設定項目](https://jp.kintone.help/k/ja/app/setting_items)

### 権限管理
- [権限の管理](https://jp.kintone.help/k/ja/admin/permission_admin)
- [管理者の種類と権限](https://jp.kintone.help/k/ja/admin/permission_admin/admin_type)
- [アプリのアクセス権](https://jp.kintone.help/k/ja/app/rights/app_rights)
- [レコードのアクセス権](https://jp.kintone.help/k/ja/app/rights/record_rights)
- [フィールドのアクセス権](https://jp.kintone.help/k/ja/app/rights/field_rights)
- [アプリグループ](https://jp.kintone.help/k/ja/admin/appgroup/whats_appgroup)
- [アプリグループのアクセス権](https://jp.kintone.help/k/ja/admin/appgroup/appgroup_rights)

### プロセス管理
- [基本的なプロセス管理の設定](https://jp.kintone.help/k/ja/app/process/set_process)
- [作業者の設定](https://jp.kintone.help/k/ja/app/process/set_assignee)
- [申請ワークフローの設定例](https://jp.kintone.help/k/ja/app/process/sample_flow)

### 通知
- [アプリの条件通知](https://jp.kintone.help/k/ja/app/notifications/)
- [高度な設定](https://fastsystem.funaisoken.co.jp/digital/advanced_setting/)（外部参考）
