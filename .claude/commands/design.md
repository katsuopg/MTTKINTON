---
name: design
description: "TailAdminベースのUI/UXデザイン"
---

# /design - UIデザイン（TailAdmin準拠）

## デザインシステム
**ベース**: [TailAdmin](https://tailadmin.com/) - Tailwind CSS Admin Dashboard

## 使用方法
```
/design [component] [--variant dark|light]
```

## コンポーネント
- `table`: データテーブル
- `form`: フォーム・入力
- `card`: カード・パネル
- `modal`: モーダル・ダイアログ
- `chart`: グラフ・チャート
- `sidebar`: サイドバー
- `header`: ヘッダー
- `button`: ボタン
- `badge`: バッジ・ステータス

## TailAdminカラーパレット
```css
/* Primary */
--primary: #3C50E0;
--primary-dark: #1C2434;

/* Status */
--success: #10B981;
--warning: #F59E0B;
--danger: #EF4444;
--info: #3B82F6;

/* Neutral */
--body: #64748B;
--stroke: #E2E8F0;
--gray-dark: #1C2434;
```

## デザイン原則
1. **一貫性**: TailAdminのスタイルを維持
2. **レスポンシブ**: モバイル対応必須
3. **ダークモード**: 対応を考慮
4. **アクセシビリティ**: フォーカス状態・コントラスト確保

## テーブルスタイル
```tsx
<table className="w-full table-auto">
  <thead>
    <tr className="bg-gray-2 text-left dark:bg-meta-4">
      <th className="px-4 py-4 font-medium text-black dark:text-white">
        ヘッダー
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-stroke dark:border-strokedark">
      <td className="px-4 py-5">データ</td>
    </tr>
  </tbody>
</table>
```

## ボタンスタイル
```tsx
// Primary
<button className="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90">

// Secondary
<button className="bg-gray text-black px-4 py-2 rounded border border-stroke">

// Danger
<button className="bg-danger text-white px-4 py-2 rounded hover:bg-opacity-90">
```

## フォームスタイル
```tsx
<input
  className="w-full rounded border border-stroke bg-transparent px-4 py-2
             outline-none focus:border-primary dark:border-strokedark
             dark:bg-meta-4 dark:focus:border-primary"
/>
```

## 参照リンク
- [TailAdmin Demo](https://tailadmin.com/demo)
- [TailAdmin Components](https://tailadmin.com/components)
- [TailAdmin GitHub](https://github.com/TailAdmin/free-nextjs-admin-dashboard)
