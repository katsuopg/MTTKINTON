# MTT KINTON コードベース構造

## ディレクトリ構成
```
src/
├── app/[locale]/(auth)/          # 認証必須ページ
│   ├── dashboard/                # ダッシュボード
│   ├── project-management/       # プロジェクト管理
│   ├── quotation/               # 見積もり管理
│   ├── workno/                  # 工事番号管理（テンプレート）
│   ├── po-management/           # PO管理
│   ├── order-management/        # オーダー管理
│   ├── customers/               # 顧客管理
│   ├── staff/                   # 担当者管理
│   ├── suppliers/               # サプライヤー管理
│   ├── employees/               # 従業員管理
│   ├── projects/                # プロジェクト詳細
│   └── test-fields/             # テストフィールド
├── components/
│   ├── layout/                  # レイアウトコンポーネント
│   └── ui/                      # UIコンポーネント
├── lib/
│   ├── supabase/               # Supabase設定
│   └── kintone/                # Kintone API
└── types/                       # TypeScript型定義

components/
├── layout/
│   └── DashboardLayout.tsx      # 共通レイアウト
└── ui/
    └── TableStyles.tsx          # 統一テーブルスタイル
```

## 重要ファイル
- `components/ui/TableStyles.tsx` - 全ページレイアウト統一
- `src/app/[locale]/(auth)/workno/page.tsx` - レイアウトテンプレート
- `lib/kintone/client.ts` - Kintone API接続
- `lib/supabase/server.ts` - Supabase認証