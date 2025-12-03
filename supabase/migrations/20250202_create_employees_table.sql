-- 従業員管理テーブル
-- Kintoneからの移行用

CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 基本情報
  employee_number TEXT UNIQUE, -- 社員証番号
  name TEXT NOT NULL, -- 氏名
  nickname TEXT, -- ニックネーム（呼び名）
  email TEXT UNIQUE, -- メールアドレス（ログインと紐付け）
  tel TEXT, -- 電話番号
  date_of_birth DATE, -- 生年月日
  gender TEXT, -- 性別（Male/Female/Other）
  nationality TEXT, -- 国籍

  -- 雇用情報
  department TEXT, -- 部署
  position TEXT, -- 役職
  employment_type TEXT, -- 雇用形態（正社員/契約社員/パート等）
  hire_date DATE, -- 入社日
  resign_date DATE, -- 退社日
  status TEXT DEFAULT '在籍', -- 在籍状況（在籍/退職/休職等）

  -- 給与情報
  salary_type TEXT, -- 給与体系（月給/日給等）
  salary_amount NUMERIC, -- 給与額
  bank_account TEXT, -- 振込口座

  -- 身分証明書
  id_number TEXT, -- ID No.（身分証明書番号）
  id_expiry DATE, -- ID有効期限
  id_image_url TEXT, -- ID画像URL

  -- パスポート
  passport_number TEXT, -- パスポート番号
  passport_expiry DATE, -- パスポート有効期限
  passport_image_url TEXT, -- パスポート画像URL

  -- VISA
  visa_type TEXT, -- VISAタイプ
  visa_number TEXT, -- VISA番号
  visa_expiry DATE, -- VISA有効期限
  visa_image_url TEXT, -- VISA画像URL

  -- ワークパミット
  work_permit_number TEXT, -- ワークパミット番号
  work_permit_expiry DATE, -- ワークパミット有効期限
  work_permit_image_url TEXT, -- ワークパミット画像URL

  -- 運転免許
  license_number TEXT, -- 免許書番号
  license_expiry DATE, -- 免許有効期限

  -- 緊急連絡先
  emergency_contact_name TEXT, -- 緊急連絡先氏名
  emergency_contact_tel TEXT, -- 緊急連絡先電話番号
  emergency_contact_address TEXT, -- 緊急連絡先住所

  -- プロフィール画像
  profile_image_url TEXT, -- プロフィール画像URL

  -- 添付ファイル
  resume_files JSONB, -- 履歴書・資格証記録
  bank_book_files JSONB, -- 通帳

  -- Kintone連携（移行期間中）
  kintone_record_id TEXT, -- Kintoneレコード番号

  -- 監査情報
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_employee_number ON employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_id_expiry ON employees(id_expiry);
CREATE INDEX IF NOT EXISTS idx_employees_passport_expiry ON employees(passport_expiry);
CREATE INDEX IF NOT EXISTS idx_employees_visa_expiry ON employees(visa_expiry);
CREATE INDEX IF NOT EXISTS idx_employees_work_permit_expiry ON employees(work_permit_expiry);

-- RLSを有効化
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- RLSポリシー（認証済みユーザーは全員読み取り可能、管理者のみ書き込み可能）
CREATE POLICY "Allow authenticated users to read employees" ON employees
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert employees" ON employees
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update employees" ON employees
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete employees" ON employees
  FOR DELETE TO authenticated USING (true);

-- updated_atを自動更新するトリガー
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 有効期限アラート用ビュー（オプション）
CREATE OR REPLACE VIEW employee_expiry_alerts AS
SELECT
  id,
  employee_number,
  name,
  email,
  department,
  'ID' as document_type,
  id_expiry as expiry_date,
  CASE
    WHEN id_expiry < CURRENT_DATE THEN 'expired'
    WHEN id_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN '1month'
    WHEN id_expiry <= CURRENT_DATE + INTERVAL '60 days' THEN '2months'
    ELSE NULL
  END as alert_level
FROM employees
WHERE status = '在籍' AND id_expiry IS NOT NULL AND id_expiry <= CURRENT_DATE + INTERVAL '60 days'
UNION ALL
SELECT
  id,
  employee_number,
  name,
  email,
  department,
  'Passport' as document_type,
  passport_expiry as expiry_date,
  CASE
    WHEN passport_expiry < CURRENT_DATE THEN 'expired'
    WHEN passport_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN '1month'
    WHEN passport_expiry <= CURRENT_DATE + INTERVAL '60 days' THEN '2months'
    ELSE NULL
  END as alert_level
FROM employees
WHERE status = '在籍' AND passport_expiry IS NOT NULL AND passport_expiry <= CURRENT_DATE + INTERVAL '60 days'
UNION ALL
SELECT
  id,
  employee_number,
  name,
  email,
  department,
  'VISA' as document_type,
  visa_expiry as expiry_date,
  CASE
    WHEN visa_expiry < CURRENT_DATE THEN 'expired'
    WHEN visa_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN '1month'
    WHEN visa_expiry <= CURRENT_DATE + INTERVAL '60 days' THEN '2months'
    ELSE NULL
  END as alert_level
FROM employees
WHERE status = '在籍' AND visa_expiry IS NOT NULL AND visa_expiry <= CURRENT_DATE + INTERVAL '60 days'
UNION ALL
SELECT
  id,
  employee_number,
  name,
  email,
  department,
  'WorkPermit' as document_type,
  work_permit_expiry as expiry_date,
  CASE
    WHEN work_permit_expiry < CURRENT_DATE THEN 'expired'
    WHEN work_permit_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN '1month'
    WHEN work_permit_expiry <= CURRENT_DATE + INTERVAL '60 days' THEN '2months'
    ELSE NULL
  END as alert_level
FROM employees
WHERE status = '在籍' AND work_permit_expiry IS NOT NULL AND work_permit_expiry <= CURRENT_DATE + INTERVAL '60 days'
ORDER BY expiry_date;

COMMENT ON TABLE employees IS '従業員管理テーブル - MTT KINTON';
