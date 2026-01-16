---
name: supabase-migrate
description: "Supabaseマイグレーション管理"
---

# /supabase-migrate - マイグレーション管理

## 使用方法
```
/supabase-migrate [action] [name]
```

## アクション
- `create [name]`: 新規マイグレーションファイル作成
- `apply`: 未適用マイグレーションを実行
- `status`: マイグレーション状態確認
- `repair`: マイグレーション履歴の修復

## マイグレーションファイル
- 場所: `supabase/migrations/`
- 命名: `YYYYMMDD_description.sql`
- 例: `20251229_add_roles_table.sql`

## テンプレート
```sql
-- Migration: [説明]
-- Date: YYYY-MM-DD

-- Up
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_name" ON table_name
  FOR ALL USING (auth.role() = 'authenticated');
```

## 注意事項
- RLSポリシーは必ず設定
- 既存データのバックアップを推奨
- MCPツールで直接実行も可能
