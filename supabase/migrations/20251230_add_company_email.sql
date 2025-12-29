-- 社内メールアドレスカラムを追加
ALTER TABLE employees ADD COLUMN IF NOT EXISTS company_email VARCHAR(255);

-- コメント追加
COMMENT ON COLUMN employees.company_email IS '社内メールアドレス（@megatech.co.th等）';
