# MTT KINTON プロジェクト概要

## プロジェクト目的
日本語のみでコミュニケーションを行うMulti-language (日本語/英語/タイ語) Webアプリケーション

## 既存実装済みアプリ（12個）
1. **dashboard** - ダッシュボード（メイン画面）
2. **project-management** - プロジェクト管理（受注前） 
3. **quotation** - 見積もり管理
4. **workno** - 工事番号管理（受注後）
5. **po-management** - 注文書管理
6. **order-management** - オーダー管理
7. **customers** - 顧客マスタ
8. **staff** - 顧客担当者管理
9. **suppliers** - サプライヤーマスタ
10. **employees** - 従業員管理
11. **projects** - プロジェクト（詳細）
12. **test-fields** - テストフィールド

## 新規開発予定（2個）
- **Parts List Management** - パーツリスト管理
- **Purchase Request Management** - 購買依頼管理

## 技術スタック
- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: TailwindCSS
- **Authentication**: Supabase Auth
- **Data Source**: Kintone (via REST API)
- **Icons**: Heroicons, Lucide React
- **Form**: React Hook Form + Zod validation
- **Testing**: Playwright

## 多言語対応
- 日本語 (ja)
- 英語 (en) 
- タイ語 (th)