# Supabase MCP Server セットアップガイド

## 1. Claude Desktop設定ファイルの編集

Claude Desktopの設定ファイルに以下を追加してください：

**Mac/Linux**: `~/.claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    // ... 既存の設定 ...
    
    "supabase": {
      "command": "npx",
      "args": ["@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

## 2. Supabaseプロジェクトの作成

1. [Supabase Dashboard](https://app.supabase.com) にアクセス
2. 新しいプロジェクトを作成
3. プロジェクトURLとService Role Keyを取得

### 必要な情報の取得方法：
- **Project URL**: Settings → API → Project URL
- **Service Role Key**: Settings → API → Service Role Key (secret)

## 3. 環境変数の設定

開発用の`.env.local`ファイルに以下を設定：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 4. データベーススキーマの作成

Supabase SQLエディタで以下を実行：

```sql
-- ユーザープロファイルテーブル
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  department TEXT,
  language TEXT NOT NULL CHECK (language IN ('ja', 'th')) DEFAULT 'ja',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLSを有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ポリシーの作成
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- トリガーの作成（更新時刻の自動更新）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 新規ユーザー作成時のプロファイル自動作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, language)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'employee'),
    COALESCE(new.raw_user_meta_data->>'language', 'ja')
  );
  RETURN new;
END;
$$ language plpgsql security definer;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 5. 初期管理者ユーザーの作成

Supabase Authentication → Users → Invite userから管理者ユーザーを作成します。

または、以下のSQLで直接作成：

```sql
-- テスト用管理者ユーザーの作成（開発環境のみ）
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);
```

## 6. Claude Desktopを再起動

設定ファイルを保存後、Claude Desktopを完全に終了して再起動してください。

## 7. 動作確認

Claude Desktopで以下のコマンドを使って動作確認：

```
MCPでSupabaseのテーブル一覧を取得して
```

## トラブルシューティング

- **接続エラー**: URLとキーが正しいことを確認
- **権限エラー**: Service Role Keyを使用していることを確認
- **MCPが認識されない**: Claude Desktopを完全に再起動

## 注意事項

- Service Role Keyは秘密情報です。GitHubにコミットしないでください
- 本番環境では適切なRow Level Security (RLS)ポリシーを設定してください
- 開発環境と本番環境で異なるプロジェクトを使用することを推奨します