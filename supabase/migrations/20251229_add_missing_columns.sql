-- 不足しているカラムを追加

-- 基本情報
ALTER TABLE employees ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address TEXT;

-- ID関連
ALTER TABLE employees ADD COLUMN IF NOT EXISTS id_number VARCHAR(50);

-- パスポート関連
ALTER TABLE employees ADD COLUMN IF NOT EXISTS passport_number VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS passport_expiry_date DATE;

-- 運転免許関連
ALTER TABLE employees ADD COLUMN IF NOT EXISTS driver_license_number VARCHAR(50);

-- 緊急連絡先
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_address TEXT;

-- 銀行口座
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account VARCHAR(100);
