# Supabase セットアップガイド（Claude Code用）

## 1. Supabaseアカウントの作成

1. [Supabase](https://supabase.com) にアクセス
2. 「Start your project」をクリックしてアカウントを作成

## 2. プロジェクトの作成

1. ダッシュボードで「New project」をクリック
2. 以下の情報を入力：
   - **Project name**: `kintone-integration`
   - **Database Password**: 強力なパスワードを設定（保存しておく）
   - **Region**: `Northeast Asia (Tokyo)`を選択

## 3. 必要な情報の取得

### Project Reference ID
- Settings → General → Reference ID をコピー

### Access Token（個人アクセストークン）
1. [Supabase Dashboard](https://app.supabase.com/account/tokens) にアクセス
2. 「Generate new token」をクリック
3. トークン名を入力（例: `claude-code-mcp`）
4. 生成されたトークンをコピー（一度しか表示されません！）

### API Keys（アプリケーション用）
- Settings → API から以下を取得：
  - **Project URL**: `https://xxxxx.supabase.co`
  - **anon public**: 公開用のAPIキー
  - **service_role**: サーバー側で使用（秘密！）

## 4. MCP設定の更新

`.mcp.json`ファイルを編集：

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase",
        "--read-only",
        "--project-ref=あなたのproject-ref"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "あなたのaccess-token"
      }
    }
  }
}
```

## 5. 環境変数の設定

`.env.local`ファイルを更新：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのanon-key
```

## 6. データベースの初期設定

Supabase Dashboard → SQL Editor で以下を実行：

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

-- 自動更新トリガー
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
```

## 7. テストユーザーの作成

Authentication → Users → Invite user から：
- Email: `admin@example.com`
- Password: 任意のパスワードを設定
- Send invitation email: オフ

## 8. Claude Codeの再起動

MCPサーバーを認識させるため、Claude Codeを再起動します。

## 9. 動作確認

開発サーバーを起動して、作成したユーザーでログインできることを確認：

```bash
npm run dev
```

http://localhost:3000/ja/auth/login にアクセス

## セキュリティ注意事項

⚠️ **重要**：
- `.mcp.json`ファイルはGitにコミットしないでください（`.gitignore`に追加済み）
- Access Tokenは個人用です。他人と共有しないでください
- Service Role Keyは本番環境では使用しないでください