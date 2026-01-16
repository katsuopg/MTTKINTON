# MTTkinton 開発ルール

## コミュニケーション
- **日本語のみ使用**: 全てのやり取りは日本語で行う

## 開発サーバー運用
- **ポート**: 必ず3000番ポートで起動
- **単一サーバー**: 開発サーバーは常に1つのみ
- **軽微な修正**: サーバー再起動不要
- **大きな変更**: kill → 修正 → 再起動

## 動作確認チェックリスト
コード変更後、必ず確認:
- [ ] サーバーがポート3000で正常起動
- [ ] 全ページにアクセス可能
- [ ] コンソールエラーなし
- [ ] TypeScriptコンパイルエラーなし

## コードスタイル

### ページ構成パターン
```
page.tsx (サーバーコンポーネント)
├── データ取得 (Supabase/Kintone)
├── userInfo取得 (getCurrentUserInfo)
└── ClientContent.tsx (クライアントコンポーネント)
    └── DashboardLayout + UI
```

### 多言語対応
- `messages/` に ja.json / en.json / th.json
- コンポーネント内で `translations` オブジェクトを定義
- 新しいテキストは必ず3言語分追加

### Supabase
- テーブル操作はMCPツールを活用
- マイグレーションは `supabase/migrations/` に日付プレフィックス
- RLSポリシーは必ず設定

### Kintone API
- 環境変数は**関数内**で読み込む（Next.js 15対応）
- limit制限: 500件まで
- トークンは `KINTONE_API_TOKEN_{APP_NAME}` 形式

## ファイル命名規則
- コンポーネント: PascalCase (`EmployeeDetailContent.tsx`)
- ユーティリティ: camelCase (`user-info.ts`)
- API Routes: `route.ts`
- マイグレーション: `YYYYMMDD_description.sql`

## 禁止事項
- ハードコードされた認証情報
- console.log の本番残し
- 未使用のimport
- any型の多用
