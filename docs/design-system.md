# MTT KINTON デザインシステム規約

## 概要

このドキュメントはMTT KINTONプロジェクトのデザイン規約を定義します。
新規ページ作成・既存ページ修正時は本規約に従ってください。

---

## 1. カラーパレット

### プライマリカラー（濃紺系）
| 用途 | CSS変数 | 値 | Tailwind |
|------|---------|-----|----------|
| メイン | `--color-primary` | #1A2359 | `bg-[#1A2359]` |
| ライト | `--color-primary-light` | #2E3A7B | `bg-[#2E3A7B]` |
| ダーク | `--color-primary-dark` | #0F1538 | `bg-[#0F1538]` |

### アクセントカラー（Indigo系）
| 用途 | CSS変数 | 値 | Tailwind |
|------|---------|-----|----------|
| メイン | `--color-accent` | #4F46E5 | `bg-indigo-600` |
| ライト | `--color-accent-light` | #6366F1 | `bg-indigo-500` |
| ダーク | `--color-accent-dark` | #4338CA | `bg-indigo-700` |

### 背景色
| 用途 | 値 | Tailwind |
|------|-----|----------|
| ページ背景 | #F1F5F9 | `bg-slate-100` |
| カード背景 | #FFFFFF | `bg-white` |
| サイドバー | #F8FAFC | `bg-slate-50` |

### ボーダー
| 用途 | 値 | Tailwind |
|------|-----|----------|
| 標準 | #E2E8F0 | `border-slate-200` |
| ライト | #F1F5F9 | `border-slate-100` |

### テキスト
| 用途 | 値 | Tailwind |
|------|-----|----------|
| 主テキスト | #0F172A | `text-slate-900` |
| 副テキスト | #475569 | `text-slate-600` |
| ミュート | #94A3B8 | `text-slate-400` |

### ステータスカラー（統一）
| 状態 | 値 | Tailwind | 用途 |
|------|-----|----------|------|
| 成功 | #10B981 | `text-emerald-500` / `bg-emerald-100` | 完了、アクティブ |
| 警告 | #F59E0B | `text-amber-500` / `bg-amber-100` | 保留、注意 |
| エラー | #EF4444 | `text-red-500` / `bg-red-100` | エラー、非アクティブ |
| 情報 | #3B82F6 | `text-blue-500` / `bg-blue-100` | 情報、進行中 |

### 禁止パターン
```tsx
// ❌ 禁止: 直接的な色指定
className="bg-blue-600"
className="bg-green-500"
className="text-gray-700"

// ✅ 推奨: 統一カラー
className="bg-indigo-600"
className="bg-emerald-500"
className="text-slate-700"
```

---

## 2. タイポグラフィ

### フォントファミリー
```css
font-family: 'Inter', 'Noto Sans Thai', 'Noto Sans JP', sans-serif;
```

### フォントサイズ（Web標準基準）
| 用途 | サイズ | Tailwind | 行間 |
|------|--------|----------|------|
| 本文 | 16px | `text-base` | 1.5 |
| 小テキスト | 14px | `text-sm` | 1.4 |
| 極小 | 12px | `text-xs` | 1.3 |
| 見出し1 | 24px | `text-2xl` | 1.2 |
| 見出し2 | 20px | `text-xl` | 1.3 |
| 見出し3 | 18px | `text-lg` | 1.4 |

### フォントウェイト
| 用途 | Tailwind |
|------|----------|
| 通常 | `font-normal` |
| 中間 | `font-medium` |
| 太字 | `font-semibold` |
| 極太 | `font-bold` |

### 多言語対応の注意点
```tsx
// 言語によって文字幅が異なるため、固定幅を避ける
// ❌ 禁止
className="w-[120px]" // 日本語で収まっても英語で溢れる可能性

// ✅ 推奨
className="min-w-[120px] max-w-[200px]" // 範囲指定
className="w-auto whitespace-nowrap"    // 自動幅
className="truncate"                     // 省略表示
```

---

## 3. レスポンシブデザイン

### ブレークポイント
| サイズ | Tailwind | 用途 |
|--------|----------|------|
| モバイル | デフォルト | ~639px |
| タブレット | `sm:` | 640px~ |
| 小デスクトップ | `md:` | 768px~ |
| デスクトップ | `lg:` | 1024px~ |
| 大画面 | `xl:` | 1280px~ |
| 超大画面 | `2xl:` | 1536px~ |

### レイアウト方針

#### デスクトップ（lg以上）
- 1画面で概要が把握できるレイアウト
- サイドバー展開状態: 256px
- テーブルは横スクロールなしで主要列を表示
- ダッシュボードはグリッドレイアウト

```tsx
// デスクトップ: 3列グリッド
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

#### モバイル（sm以下）
- サイドバーは折りたたみ
- カードは縦積み
- テーブルは横スクロール許可またはカード表示に切替

```tsx
// モバイル対応テーブル
<div className="overflow-x-auto">
  <table className="min-w-[800px] lg:min-w-full">
```

### 高さ管理（1画面表示）
```tsx
// ❌ 禁止: 無限スクロール
<div className="h-auto">

// ✅ 推奨: ビューポート内に収める
<div className="h-[calc(100vh-200px)] overflow-y-auto">
```

---

## 4. コンポーネント規約

### ボタン

#### プライマリボタン
```tsx
<button className="
  px-4 py-2
  bg-indigo-600 hover:bg-indigo-700
  text-white text-sm font-medium
  rounded-lg
  transition-colors duration-150
  disabled:opacity-50 disabled:cursor-not-allowed
">
```

#### セカンダリボタン
```tsx
<button className="
  px-4 py-2
  bg-white hover:bg-slate-50
  text-slate-700 text-sm font-medium
  border border-slate-300
  rounded-lg
  transition-colors duration-150
">
```

#### 危険ボタン
```tsx
<button className="
  px-4 py-2
  bg-red-600 hover:bg-red-700
  text-white text-sm font-medium
  rounded-lg
  transition-colors duration-150
">
```

### カード
```tsx
<div className="
  bg-white
  border border-slate-200
  rounded-lg
  shadow-sm
  p-4 md:p-6
">
```

### テーブル
```tsx
// TableStyles.tsx のコンポーネントを使用すること
import {
  StyledTable,
  StyledTableHeader,
  StyledTableRow
} from '@/components/ui/TableStyles';
```

### テーブルヘッダー・セルのテキスト規約

**原則: テーブルのヘッダーやセル内のテキストは極力折り返さない**

```tsx
// ❌ 禁止: 折り返しを許可（読みにくい）
<th className="w-16">工事番号</th>  // 幅が狭すぎて折り返される

// ✅ 推奨: whitespace-nowrap で折り返し防止
<th className="whitespace-nowrap px-3 py-3">工事番号</th>
<th className="whitespace-nowrap px-3 py-3">CS ID</th>

// ✅ 長いテキストは truncate で省略
<td className="truncate max-w-[200px]" title={fullText}>{fullText}</td>
```

### テーブルカラム幅の目安

| データタイプ | 推奨幅 | クラス例 |
|-------------|--------|----------|
| ID/番号 | 80-100px | `w-20` ~ `w-24` |
| 工事番号/PO番号 | 120-140px | `w-28` ~ `w-32` |
| ステータス | 100-120px | `w-24` ~ `w-28` |
| 日付 | 100-120px | `w-24` ~ `w-28` |
| 名前/会社名 | 150-200px | `w-40` ~ `w-52` |
| 説明/備考 | 200-300px | `w-52` ~ `w-72` (truncate併用) |
| 金額 | 100-120px | `w-24` ~ `w-28` |

### テーブル実装パターン
```tsx
// 横スクロール対応テーブル
<div className="overflow-x-auto">
  <table className="min-w-full">
    <thead className="bg-slate-50">
      <tr>
        <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
          工事番号
        </th>
        <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
          CS ID
        </th>
        {/* 他のカラム */}
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="whitespace-nowrap px-4 py-3 text-sm">{workNo}</td>
        <td className="whitespace-nowrap px-4 py-3 text-sm">{csId}</td>
      </tr>
    </tbody>
  </table>
</div>
```

### バッジ（ステータス表示）
```tsx
// 成功/アクティブ
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">

// 警告/保留
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">

// エラー/非アクティブ
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">

// 情報/進行中
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
```

---

## 5. フォーム規約

### 入力フィールド幅（データに基づく）

| データタイプ | 推奨幅 | Tailwind |
|-------------|--------|----------|
| ID/コード | 80-120px | `w-24` ~ `w-32` |
| 電話番号 | 150px | `w-40` |
| メールアドレス | 250px | `w-64` |
| 名前（日本語） | 150-200px | `w-40` ~ `w-52` |
| 名前（タイ語/英語） | 200-250px | `w-52` ~ `w-64` |
| 住所 | 300-400px | `w-80` ~ `w-96` |
| 金額 | 120-150px | `w-32` ~ `w-40` |
| 日付 | 150px | `w-40` |
| テキストエリア | 100% | `w-full` (例外的に許可) |

### フォームレイアウト
```tsx
// ❌ 禁止: すべて100%幅
<input className="w-full" />

// ✅ 推奨: データに応じた幅
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>
    <label>社員コード</label>
    <input className="w-24" />
  </div>
  <div>
    <label>名前</label>
    <input className="w-52" />
  </div>
  <div>
    <label>メールアドレス</label>
    <input className="w-64" />
  </div>
</div>
```

### 入力フィールドスタイル
```tsx
<input className="
  px-3 py-2
  border border-slate-300
  rounded-lg
  text-sm
  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
  disabled:bg-slate-100 disabled:cursor-not-allowed
" />
```

### ラベル
```tsx
<label className="block text-sm font-medium text-slate-700 mb-1">
```

---

## 6. 間隔・余白

### ページレイアウト
| 要素 | サイズ | Tailwind |
|------|--------|----------|
| ページ余白 | 24px | `p-6` |
| セクション間 | 24px | `space-y-6` |
| カード内余白 | 16-24px | `p-4` ~ `p-6` |

### コンポーネント間
| 要素 | サイズ | Tailwind |
|------|--------|----------|
| 要素間（小） | 8px | `gap-2` |
| 要素間（中） | 16px | `gap-4` |
| 要素間（大） | 24px | `gap-6` |

---

## 7. 多言語対応

### 対応言語
1. **タイ語（th）** - メイン言語
2. **日本語（ja）** - ベース言語（翻訳元）
3. **英語（en）** - サブ言語

### 翻訳ファイル構成
```
messages/
├── ja.json  # 日本語（ベース）
├── th.json  # タイ語
└── en.json  # 英語
```

### 翻訳管理機能
- 管理者が `/settings/translations` で翻訳を編集可能
- 日本語キーに対応するタイ語・英語を個別管理
- 初期翻訳は自動生成、後でネイティブが修正

### 実装パターン
```tsx
import { useTranslations } from 'next-intl';

export function Component() {
  const t = useTranslations('common');

  return (
    <button>{t('save')}</button>
  );
}
```

### 文字幅対応
```tsx
// 言語による幅変動を考慮
<th className="min-w-[100px] max-w-[180px]">
  {t('column.name')}
</th>

// 長いテキストの省略
<span className="truncate max-w-[200px]" title={fullText}>
  {fullText}
</span>
```

---

## 8. アイコン

### 使用ライブラリ
- Heroicons（@heroicons/react）
- Lucide React（lucide-react）

### サイズ規約
| 用途 | サイズ | クラス |
|------|--------|--------|
| ボタン内 | 16px | `w-4 h-4` |
| リスト項目 | 20px | `w-5 h-5` |
| 見出し横 | 24px | `w-6 h-6` |

---

## 9. アニメーション・トランジション

### 標準トランジション
```tsx
className="transition-colors duration-150"  // 色変化
className="transition-all duration-200"     // 全体変化
className="transition-transform duration-300" // 変形
```

### ホバー効果
```tsx
// ボタン
className="hover:bg-indigo-700"

// 行
className="hover:bg-indigo-50"

// カード
className="hover:shadow-md"
```

---

## 10. 禁止パターンまとめ

| カテゴリ | ❌ 禁止 | ✅ 推奨 |
|---------|--------|--------|
| 色 | `blue-*`, `green-*`, `gray-*` | `indigo-*`, `emerald-*`, `slate-*` |
| フォーム幅 | `w-full`（全入力） | データに応じた幅 |
| 固定幅テキスト | `w-[100px]` | `min-w-* max-w-*` |
| テーブル | 独自スタイル | `TableStyles.tsx` 使用 |
| ローディング | 独自実装 | 共通コンポーネント使用 |

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2025-12-27 | 初版作成 |
