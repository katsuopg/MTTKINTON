---
name: page-create
description: "新しいページを作成する"
---

# /page-create - ページ作成

## 使用方法
```
/page-create [ページ名] [--type list|detail|form]
```

## ページタイプ
- `list`: 一覧ページ（テーブル表示）
- `detail`: 詳細ページ（[id]ルート）
- `form`: フォームページ（新規/編集）

## 作成されるファイル
```
src/app/[locale]/(auth)/[page-name]/
├── page.tsx              # サーバーコンポーネント
├── [page-name]Client.tsx # クライアントコンポーネント
├── actions.ts            # Server Actions（必要時）
└── [id]/                 # 詳細ページ（--type detail時）
    └── page.tsx
```

## テンプレート構成
1. **page.tsx**: データ取得 + userInfo取得
2. **Client.tsx**: DashboardLayout + UI + 翻訳

## 必須対応
- [ ] 3言語の翻訳を追加
- [ ] userInfoをpropsで渡す
- [ ] DashboardLayoutでラップ
- [ ] 適切なパンくずリスト設定
