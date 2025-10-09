-- 顧客管理テーブル
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kintone_record_id TEXT UNIQUE NOT NULL, -- Kintoneの$idフィールドを保存（重複防止用）
  customer_id TEXT UNIQUE NOT NULL, -- CS ID (文字列__1行_)
  company_name TEXT NOT NULL, -- 会社名
  customer_rank TEXT, -- 顧客ランク (A/B/C)
  country TEXT, -- 国 (文字列__1行__4)
  phone_number TEXT, -- TEL
  fax_number TEXT, -- FAX
  tax_id TEXT, -- TAX ID (文字列__1行__11)
  payment_terms TEXT, -- 支払条件 (ドロップダウン)
  address TEXT, -- Address (複数行__0)
  website_url TEXT, -- Web/URL (リンク_ウェブサイト)
  notes TEXT, -- メモ (文字列__複数行_)
  created_by TEXT, -- 作成者
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT, -- 更新者
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 請求書管理テーブル
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kintone_record_id TEXT UNIQUE NOT NULL, -- Kintoneの$idフィールドを保存（重複防止用）
  work_no TEXT NOT NULL, -- 工事番号 (文字列__1行_)
  invoice_no TEXT NOT NULL, -- 請求書番号 (文字列__1行__0)
  invoice_date DATE, -- 請求日付 (日付)
  customer_id TEXT, -- CS ID (文字列__1行__3)
  customer_name TEXT, -- 顧客名 (CS_name)
  sub_total NUMERIC(15, 2), -- Sub total (数値)
  discount NUMERIC(15, 2), -- Discount (数値_0)
  after_discount NUMERIC(15, 2), -- 割引後 (計算_0)
  vat NUMERIC(15, 2), -- VAT (計算_1)
  grand_total NUMERIC(15, 2), -- 総額 (計算)
  status TEXT, -- ステータス (ラジオボタン)
  created_by TEXT, -- 作成者
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT, -- 更新者
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- 顧客テーブルとの外部キー制約（customer_idベース）
  CONSTRAINT fk_invoice_customer FOREIGN KEY (customer_id) 
    REFERENCES customers(customer_id) ON UPDATE CASCADE
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON customers(company_name);
CREATE INDEX IF NOT EXISTS idx_customers_rank ON customers(customer_rank);
CREATE INDEX IF NOT EXISTS idx_invoices_work_no ON invoices(work_no);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_no ON invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_name ON invoices(customer_name);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);

-- Row Level Security (RLS) を有効化
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成（認証済みユーザーのみアクセス可能）
DROP POLICY IF EXISTS "Allow authenticated users to read customers" ON customers;
CREATE POLICY "Allow authenticated users to read customers" ON customers
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert customers" ON customers;
CREATE POLICY "Allow authenticated users to insert customers" ON customers
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON customers;
CREATE POLICY "Allow authenticated users to update customers" ON customers
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to read invoices" ON invoices;
CREATE POLICY "Allow authenticated users to read invoices" ON invoices
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert invoices" ON invoices;
CREATE POLICY "Allow authenticated users to insert invoices" ON invoices
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update invoices" ON invoices;
CREATE POLICY "Allow authenticated users to update invoices" ON invoices
  FOR UPDATE TO authenticated USING (true);
