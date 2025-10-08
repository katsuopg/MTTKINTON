# MTT KINTON 開発コマンド

## 開発サーバー
```bash
npm run dev    # ポート3000で開発サーバー起動（必須）
```

## ビルド・品質チェック
```bash
npm run build  # プロダクションビルド
npm run lint   # ESLintでコード品質チェック
npm run start  # プロダクションサーバー起動
```

## テスト
```bash
npx playwright test  # E2Eテスト実行
```

## 開発確認必須項目
1. サーバーがポート3000で起動していること
2. 全ページアクセス可能であること
3. コンソールエラーなし
4. TypeScriptコンパイルエラーなし

## Git操作
```bash
git status           # 変更状況確認
git add .           # 変更をステージング
git commit -m "..."  # コミット
git push            # リモートにプッシュ
```

## システムコマンド（Darwin）
```bash
ls -la              # ファイル一覧
find . -name "*.tsx" # ファイル検索
grep -r "pattern" . # 文字列検索（rg推奨）
cd /path/to/dir     # ディレクトリ移動
```