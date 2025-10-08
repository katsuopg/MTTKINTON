This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Claude Code MCP: Supabase 連携クイックスタート

Claude Code（またはClaude Desktop/Code）のMCP機能でSupabaseにアクセスできるようにする手順です。

### 1) 環境変数の準備（例）

`.env.local` に以下を設定してください（サンプル、値は各自のものに置換）：

```bash
# ==== Supabase (App) ====
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ==== Claude Code MCP (Supabase) ====
# Claude CodeのMCPサーバ設定で参照されます
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_ACCESS_TOKEN=your-personal-access-token
```

補足: `.env.local.example` ファイルはリポジトリポリシーにより同梱していません。上記を参考に手動で作成してください。

### 2) MCP設定ファイルの作成

プロジェクト直下に`.mcp.json`を作成し、以下を貼り付けます（`.mcp.json.example`も参照可能）：

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase",
        "--read-only",
        "--project-ref=${SUPABASE_PROJECT_REF}"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
      }
    }
  }
}
```

Claude Desktopをお使いの場合は、`~/.claude/claude_desktop_config.json` に同様の `mcpServers` 設定を追加しても動作します。

### 3) Supabaseプロジェクト情報の取得

- Project Ref: Supabase Dashboard → Settings → General → Reference ID
- Personal Access Token: Dashboard → Account → Tokens で生成

### 4) 動作確認

Claude Codeを再起動後、MCP経由でSupabaseにクエリできることを確認します。

例: 「MCPでSupabaseのテーブル一覧を取得して」

### 5) 注意

- 個人アクセストークンやService Role Keyは秘匿情報です。リポジトリにコミットしないでください。
- 本番ではRLSポリシーの設定を適切に行ってください。

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
