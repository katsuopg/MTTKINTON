# スマホUI設計ガイド

MTT Kinton のモバイルUI最適化に関するベストプラクティスと実装計画。

---

## 現状分析

### 対応済み

| 項目 | 実装状況 |
|------|----------|
| ブレークポイント | `2xsm(375px)` 〜 `3xl(2000px)` の7段階定義済み |
| サイドバー | ハンバーガーメニュー + スライドアニメーション完備 |
| 詳細ページ | `grid3` → `grid1` レスポンシブ対応済み |
| グラフ | `ResponsiveContainer` で自動リサイズ |
| モーダル | `max-w-md` + `p-4` でモバイル配慮済み |
| ダークモード | 全スタイルで `dark:` 対応 |

### 要改善

| 項目 | 現状の問題 |
|------|-----------|
| テーブル一覧 | 横スクロール（`overflow-x-auto`）のみ。カード型未実装 |
| タップターゲット | `w-10 h-10`（40px）。推奨44px未満 |
| viewport設定 | `export const viewport` 未定義（Next.jsデフォルト依存） |
| モバイル検索 | ヘッダー検索バーが `hidden md:flex` で非表示 |
| ページネーション | 数字ボタンが多くスマホで溢れやすい |
| PWA | manifest / service worker 未実装 |

---

## ブレークポイント方針

```
2xsm (375px)  → iPhone SE / 小型スマホ
xsm  (425px)  → 大型スマホ
sm   (640px)  → スマホ横向き / 小型タブレット
md   (768px)  → タブレット ← ★ PC/モバイル切替の基準線
lg   (1024px) → ノートPC / サイドバー表示切替
xl   (1280px) → デスクトップ
```

**原則**: モバイルファースト（base → sm → md → lg で段階的に拡張）

---

## Phase 1: 基盤整備

### 1-1. Viewport 明示設定

`src/app/layout.tsx` に追加:

```tsx
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",       // ノッチ端末対応
  maximumScale: 5,             // ピンチズーム許可（アクセシビリティ）
};
```

### 1-2. safe-area 対応

`globals.css` にユーティリティ追加:

```css
/* ノッチ端末のsafe-area対応 */
.safe-top    { padding-top: env(safe-area-inset-top); }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
.safe-left   { padding-left: env(safe-area-inset-left); }
.safe-right  { padding-right: env(safe-area-inset-right); }
```

適用箇所:
- `DashboardLayout` ヘッダー → `safe-top`
- サイドバー → `safe-left`
- ボトムナビゲーション（Phase 4） → `safe-bottom`

### 1-3. タップターゲット 44px 統一

Apple/Google 推奨の最小タップサイズ **44×44px** に統一する。

**変更対象と修正方法:**

| 対象 | 現状 | 修正後 |
|------|------|--------|
| ハンバーガーボタン | `w-10 h-10` (40px) | `w-11 h-11` (44px) |
| ページネーションボタン | `w-10 h-10` (40px) | `w-11 h-11` (44px) |
| 戻るボタン (DetailPageHeader) | `p-1.5` (~30px) | `p-2.5` (44px) |
| アイコンボタン全般 | 不統一 | `min-w-[44px] min-h-[44px]` |
| フォームinput | `py-2` (~36px) | `py-2.5` (~40px) |

**スタイル定数として定義（推奨）:**

`TableStyles.tsx` / `DetailStyles.tsx` に追加:

```ts
// タッチターゲット統一
touchTarget: "min-w-[44px] min-h-[44px] flex items-center justify-center",
iconButton: "min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-white/[0.05] transition-colors",
```

### 1-4. inputmode 属性の適用

フォーム入力でスマホキーボードを最適化:

```tsx
// 数値入力（金額、数量）
<input inputMode="decimal" pattern="[0-9]*" />

// メールアドレス
<input inputMode="email" type="email" />

// 電話番号
<input inputMode="tel" type="tel" />

// URL
<input inputMode="url" type="url" />

// 検索
<input inputMode="search" enterKeyHint="search" />
```

---

## Phase 2: テーブルのモバイルカード化（最重要）

### 2-1. 設計方針

`md:` 未満ではテーブルをカード型レイアウトに切り替える。

```
┌─────────────────────────────┐
│ [ステータス]    2024/01/15   │
│ WK-001 - 顧客A - PJ名      │  ← 主要情報を1行目に
│ 担当: 田中  金額: ¥1,200,000│  ← 副次情報を2行目に
│                          → │  ← 詳細へのリンク暗示
└─────────────────────────────┘
```

### 2-2. MobileCardView コンポーネント

```tsx
// components/ui/MobileCardView.tsx
interface MobileCardField {
  label: string;
  value: ReactNode;
}

interface MobileCardProps {
  /** カードのメインタイトル */
  title: string;
  /** サブタイトル（任意） */
  subtitle?: string;
  /** ステータスバッジ（任意） */
  statusBadge?: ReactNode;
  /** 右上に表示する情報（日付など） */
  meta?: string;
  /** フィールド一覧（2列グリッド表示） */
  fields?: MobileCardField[];
  /** カードクリック時の動作 */
  onClick?: () => void;
}
```

### 2-3. tableStyles への追加

```ts
// TableStyles.tsx に追加
export const tableStyles = {
  // ... 既存スタイル

  // モバイルカードビュー
  mobileOnly: "md:hidden",
  desktopOnly: "hidden md:block",
  mobileCardList: "md:hidden divide-y divide-gray-100 dark:divide-white/[0.05]",
  mobileCard: "px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] active:bg-gray-100 dark:active:bg-white/[0.04] transition-colors cursor-pointer",
  mobileCardTitle: "text-sm font-medium text-gray-800 dark:text-white/90 truncate",
  mobileCardSubtitle: "text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate",
  mobileCardMeta: "text-xs text-gray-400 dark:text-gray-500",
  mobileCardFields: "mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5",
  mobileCardFieldLabel: "text-xs text-gray-400 dark:text-gray-500",
  mobileCardFieldValue: "text-xs text-gray-600 dark:text-gray-300",
};
```

### 2-4. 一覧ページでの使用パターン

```tsx
// 例: WorkNoClient.tsx
return (
  <div className={tableStyles.tableContainer}>
    <AppListToolbar ... />

    {/* デスクトップ: テーブル表示 */}
    <div className={tableStyles.desktopOnly}>
      <div className="overflow-x-auto">
        <table className={tableStyles.table}>
          ...
        </table>
      </div>
    </div>

    {/* モバイル: カード表示 */}
    <div className={tableStyles.mobileCardList}>
      {items.map(item => (
        <div key={item.id} className={tableStyles.mobileCard} onClick={() => ...}>
          <div className="flex items-center justify-between">
            <span className={tableStyles.mobileCardTitle}>{item.name}</span>
            {statusBadge}
          </div>
          <div className={tableStyles.mobileCardFields}>
            <span className={tableStyles.mobileCardFieldValue}>担当: {item.manager}</span>
            <span className={tableStyles.mobileCardFieldValue}>¥{item.amount}</span>
          </div>
        </div>
      ))}
    </div>

    <Pagination ... />
  </div>
);
```

### 2-5. 優先適用ページ（使用頻度順）

1. **WorkNo一覧** — 最も使用頻度が高い
2. **案件一覧** — 外出先での確認ニーズ
3. **顧客一覧** — 営業先での参照
4. **見積依頼一覧** — 承認フロー
5. **発注管理一覧** — 発注状況確認
6. **請求管理一覧** — 請求状況確認

---

## Phase 3: AppListToolbar のモバイル最適化（実装済み）

### 3-1. 現状

`AppListToolbar` は既にデスクトップ1行 / モバイル2段構成で実装済み:
```
[検索] [フィルター] [件数] [追加ボタン]  ← 横スクロール発生
```

### 3-2. モバイルレイアウト案

`sm:` 未満で2段構成に変更:

```
┌─────────────────────────────┐
│ [🔍 検索..................] [＋]│  ← 1段目: 検索 + 追加
│ [フィルター▼] [並び順▼]  12件 │  ← 2段目: フィルター + 件数
└─────────────────────────────┘
```

### 3-3. 修正方針

```tsx
<div className="px-4 py-3 border-b border-gray-200 dark:border-white/[0.05]">
  {/* 1段目: 検索 + 追加ボタン */}
  <div className="flex items-center gap-2">
    <div className="relative flex-1 min-w-0">
      <input ... className="w-full ..." />
    </div>
    {addButton && (
      <button className="flex-shrink-0 min-w-[44px] min-h-[44px] ..." >
        {/* モバイル: アイコンのみ / デスクトップ: アイコン+テキスト */}
        <span className="md:hidden">{addButton.icon || <Plus />}</span>
        <span className="hidden md:inline-flex items-center gap-1">
          {addButton.icon}{addButton.label}
        </span>
      </button>
    )}
  </div>

  {/* 2段目: フィルター + 件数（要素がある場合のみ） */}
  {(filters || totalCount !== undefined) && (
    <div className="flex items-center gap-2 mt-2 overflow-x-auto">
      {filters}
      {totalCount !== undefined && (
        <span className="ml-auto text-xs ...">{totalCount}{countLabel}</span>
      )}
    </div>
  )}
</div>
```

---

## Phase 4: モバイル専用 UX

### 4-1. ボトムナビゲーション

スマホで最も重要な4画面への固定ナビ。`lg:hidden` でモバイルのみ表示。

```
┌─────────────────────────────┐
│                             │
│         （メイン画面）         │
│                             │
├─────────────────────────────┤
│  🏠    📋    👥    ⚙️   │  ← 固定ボトムナビ
│ ホーム  案件  顧客  設定     │
└─────────────────────────────┘
```

**実装:**

```tsx
// components/layout/BottomNavigation.tsx
const navItems = [
  { icon: Home, label: "ホーム", href: "/dashboard" },
  { icon: FolderKanban, label: "案件", href: "/projects" },
  { icon: Users, label: "顧客", href: "/customers" },
  { icon: Settings, label: "設定", href: "/settings" },
];
```

**配置:**
- `DashboardLayout` のメインコンテンツ末尾
- `fixed bottom-0 left-0 right-0` + `safe-bottom`
- メインコンテンツに `pb-16 lg:pb-0` で余白確保

### 4-2. モバイル検索の改善

ヘッダーの検索バーは `hidden md:flex` で非表示。
モバイルでは検索アイコンタップ → フルスクリーン検索 に変更:

```
┌─────────────────────────────┐
│ ← 🔍 検索.................│  ← フルスクリーン検索
│                             │
│ 最近の検索:                  │
│  WorkNo-001                 │
│  顧客A                      │
│  PJ-2024-001                │
└─────────────────────────────┘
```

現在の `CommandPalette` コンポーネントを流用し、モバイル時は検索アイコンから起動できるようにする。

### 4-3. ページネーション簡略化

モバイルではページ番号ボタンを省略し、前後ナビのみに:

```
デスクトップ: [<] [1] [2] [3] ... [10] [>]
モバイル:     [< 前へ]  3/10  [次へ >]
```

**Pagination.tsx 修正方針:**

```tsx
{/* デスクトップ: 数字ボタン */}
<div className="hidden sm:flex items-center gap-2">
  {pageNumbers.map(...)}
</div>

{/* モバイル: 前へ / ページ番号 / 次へ */}
<div className="flex sm:hidden items-center gap-3">
  <button ...>前へ</button>
  <span className="text-sm">{currentPage} / {totalPages}</span>
  <button ...>次へ</button>
</div>
```

---

## Phase 5: PWA 対応

### 5-1. Web App Manifest

```json
// public/manifest.json
{
  "name": "MTT KINTON",
  "short_name": "KINTON",
  "start_url": "/ja/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#465fff",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 5-2. Service Worker（検討段階）

- ライブラリ: `serwist`（next-pwa 後継）
- キャッシュ戦略:
  - 静的資産 → CacheFirst
  - API → NetworkFirst（オフラインフォールバック）
  - ページ → StaleWhileRevalidate

---

## スマホ向けインタラクション規約

### タッチ操作

| 操作 | 用途 | 実装 |
|------|------|------|
| タップ | 選択・遷移 | `onClick` + `cursor-pointer` |
| 長押し | なし（混乱防止） | 未実装 |
| スワイプ | サイドバー展開のみ | Phase 5以降で検討 |
| プルトゥリフレッシュ | なし（ブラウザデフォルト） | |
| ピンチズーム | 許可 | `maximumScale: 5` |

### アクティブ状態

タップ時のフィードバックを明確に:

```css
/* hover はデスクトップのみ、active はモバイルで即座に反応 */
.interactive {
  @apply hover:bg-gray-50 active:bg-gray-100
         dark:hover:bg-white/[0.02] dark:active:bg-white/[0.04]
         transition-colors;
}
```

### フォーム入力

- 入力フィールドにフォーカス時、自動スクロールでキーボードに隠れないようにする
- `autocomplete` 属性を適切に設定
- `enterKeyHint` で確定ボタンのラベルを制御:
  - 検索フォーム: `enterKeyHint="search"`
  - ログイン: `enterKeyHint="go"`
  - 複数フィールド: `enterKeyHint="next"`

---

## 実装優先度マトリクス

| # | 施策 | 効果 | 工数 | 優先度 |
|---|------|------|------|--------|
| 1 | viewport 明示設定 | 中 | 極小 | ★★★ |
| 2 | タップターゲット 44px | 高 | 小 | ★★★ |
| 3 | safe-area 対応 | 中 | 小 | ★★★ |
| 4 | inputmode 属性 | 中 | 小 | ★★★ |
| 5 | テーブルカードビュー | 高 | 中 | ★★★ |
| 6 | AppListToolbar 2段化 | 高 | 小 | ★★☆（実装済み） |
| 7 | ページネーション簡略化 | 中 | 小 | ★★☆ |
| 8 | モバイル検索改善 | 中 | 中 | ★★☆ |
| 9 | ボトムナビゲーション | 高 | 中 | ★★☆ |
| 10 | PWA 対応 | 中 | 大 | ★☆☆ |

---

## 推奨実装順序

```
Phase 1（基盤） ─── viewport / 44px / safe-area / inputmode
    │
Phase 2（テーブル）── MobileCardView + 主要6ページ適用
    │
Phase 3（ヘッダー）── AppListToolbar 2段化 + ページネーション（実装済み）
    │
Phase 4（UX）──── ボトムナビ + モバイル検索
    │
Phase 5（PWA）─── manifest + service worker
```
