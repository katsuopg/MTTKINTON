---
name: dev
description: "開発サーバーの管理"
---

# /dev - 開発サーバー管理

## 使用方法
```
/dev [action]
```

## アクション
- `start`: サーバー起動（ポート3000）
- `stop`: サーバー停止
- `restart`: 再起動（stop → start）
- `status`: サーバー状態確認
- `logs`: 最新ログ表示

## 起動コマンド
```bash
npm run dev  # next dev -H 0.0.0.0
```

## ポート確認
```bash
lsof -i :3000
```

## 強制停止
```bash
kill -9 $(lsof -t -i:3000)
```

## ルール
- 常にポート3000を使用
- サーバーは1つのみ
- 軽微な修正では再起動不要
- 大きな変更時のみ再起動
