# MTT KINTON コードスタイル・規約

## 言語・コミュニケーション
- **日本語のみ使用**: 全てのやり取りは日本語で行う
- コメント、変数名、関数名は英語
- UI表示テキストは多言語対応（日本語/英語/タイ語）

## ファイル構成パターン
- `src/app/[locale]/(auth)/` - 認証が必要なページ
- `components/` - 再利用可能コンポーネント  
- `lib/` - ユーティリティライブラリ
- `types/` - TypeScript型定義

## 命名規則
- **React Components**: PascalCase (`CustomerListContent`)
- **Functions**: camelCase (`formatDate`)
- **Files**: kebab-case for pages, PascalCase for components
- **CSS Classes**: TailwindCSS utility classes

## コンポーネント構造
```tsx
// 1. Import順序
import React from 'react'
import { NextComponent } from 'next/...'
import { CustomComponent } from '@/components/...'
import { UtilFunction } from '@/lib/...'

// 2. Interface定義
interface ComponentProps {
  prop1: string;
  prop2: number;
}

// 3. Component定義
export function Component({ prop1, prop2 }: ComponentProps) {
  // 実装
}
```

## レイアウト統一ルール
- 全ページで`TableStyles`を使用
- 工事番号管理ページの構造に統一
```tsx
<DashboardLayout>
  <div className={tableStyles.contentWrapper}>
    <div className={tableStyles.searchWrapper}>...</div>
    <div className={tableStyles.filterBar}>...</div>
    <div className={tableStyles.tableContainer}>...</div>
  </div>
</DashboardLayout>
```