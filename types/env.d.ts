declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      KINTONE_API_TOKEN_WORKNO: string;
      KINTONE_API_TOKEN_PROJECT: string;
      // 他の環境変数をここに追加
    }
  }
}