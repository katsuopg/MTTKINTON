-- 既存のemployeesテーブルに不足しているカラムを追加

-- user_idカラムを追加（Supabase認証との紐付け用）
ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- kintone_idカラムを追加（Kintoneとの同期用）
ALTER TABLE employees ADD COLUMN IF NOT EXISTS kintone_id VARCHAR(20);

-- name_thaiカラムを追加
ALTER TABLE employees ADD COLUMN IF NOT EXISTS name_thai VARCHAR(255);

-- employment_typeカラムを追加
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50);

-- salary_typeカラムを追加
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_type VARCHAR(50);

-- postal_codeカラムを追加
ALTER TABLE employees ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- id_expiry_dateカラムを追加
ALTER TABLE employees ADD COLUMN IF NOT EXISTS id_expiry_date DATE;

-- passport_issue_dateカラムを追加
ALTER TABLE employees ADD COLUMN IF NOT EXISTS passport_issue_date DATE;

-- visa関連カラムを追加
ALTER TABLE employees ADD COLUMN IF NOT EXISTS visa_number VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS visa_expiry_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS visa_type VARCHAR(50);

-- 運転免許関連カラムを追加
ALTER TABLE employees ADD COLUMN IF NOT EXISTS driver_license_expiry_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS driver_license_type VARCHAR(50);

-- 緊急連絡先の続柄
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_relation VARCHAR(50);

-- 婚姻状況
ALTER TABLE employees ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50);

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_kintone_id ON employees(kintone_id);

-- kintone_idにUNIQUE制約を追加（既存の重複がなければ）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'employees_kintone_id_key' AND conrelid = 'employees'::regclass
    ) THEN
        ALTER TABLE employees ADD CONSTRAINT employees_kintone_id_key UNIQUE (kintone_id);
    END IF;
END
$$;

-- updated_at自動更新トリガー（存在しなければ作成）
CREATE OR REPLACE FUNCTION update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_employees_updated_at ON employees;
CREATE TRIGGER trigger_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_employees_updated_at();

-- RLSを有効化（既に有効な場合は無視される）
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- ポリシーを作成（存在しなければ）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'employees' AND policyname = 'Authenticated users can view all employees'
    ) THEN
        CREATE POLICY "Authenticated users can view all employees"
            ON employees FOR SELECT
            TO authenticated
            USING (true);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'employees' AND policyname = 'Authenticated users can insert employees'
    ) THEN
        CREATE POLICY "Authenticated users can insert employees"
            ON employees FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'employees' AND policyname = 'Authenticated users can update employees'
    ) THEN
        CREATE POLICY "Authenticated users can update employees"
            ON employees FOR UPDATE
            TO authenticated
            USING (true);
    END IF;
END
$$;

-- コメント
COMMENT ON TABLE employees IS '従業員マスタ（Kintoneから移行）';
COMMENT ON COLUMN employees.user_id IS 'Supabase認証ユーザーとの紐付け';
COMMENT ON COLUMN employees.kintone_id IS 'KintoneレコードID（同期用）';
