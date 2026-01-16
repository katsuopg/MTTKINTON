---
name: kintone-sync
description: "KintoneデータをSupabaseに同期する"
---

# /kintone-sync - Kintone→Supabase同期

## 使用方法
```
/kintone-sync [アプリ名] [--full] [--check]
```

## オプション
- `--full`: 全件同期（差分ではなく）
- `--check`: 同期前の差分確認のみ

## 対象アプリ
- customers: 顧客マスタ
- employees: 従業員マスタ
- suppliers: 仕入先マスタ
- quotations: 見積データ
- orders: 受注データ
- invoices: 請求書データ

## 実行フロー
1. Kintone APIからデータ取得
2. Supabaseの既存データと比較
3. UPSERT（INSERT ON CONFLICT）で同期
4. 結果レポート出力

## 注意事項
- `kintone_record_id` をキーとして重複管理
- 環境変数 `KINTONE_API_TOKEN_*` が必要
- 大量データは分割して実行推奨
