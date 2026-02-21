-- ============================================
-- プロジェクト管理テーブル作成
-- Kintone App 114 → Supabase 移行
-- ============================================

-- ステータスマスタ
CREATE TABLE project_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  name_th VARCHAR(100),
  sort_order INTEGER NOT NULL,
  is_terminal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ステータス初期データ
INSERT INTO project_statuses (code, name, name_en, name_th, sort_order, is_terminal) VALUES
  ('estimating', '見積中', 'Estimating', 'กำลังประเมินราคา', 1, FALSE),
  ('ordered', '受注', 'Ordered', 'ได้รับคำสั่งซื้อ', 2, FALSE),
  ('in_progress', '進行中', 'In Progress', 'กำลังดำเนินการ', 3, FALSE),
  ('completed', '完了', 'Completed', 'เสร็จสิ้น', 4, TRUE),
  ('on_hold', '保留', 'On Hold', 'ระงับ', 5, FALSE),
  ('lost', '失注', 'Lost', 'สูญเสีย', 6, TRUE),
  ('cancelled', 'キャンセル', 'Cancelled', 'ยกเลิก', 7, TRUE);

-- 採番用シーケンス
CREATE SEQUENCE project_seq START WITH 1;

-- プロジェクトテーブル
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code VARCHAR(50) NOT NULL UNIQUE,  -- PJ-YYYY-NNNNNN

  -- 基本情報
  project_name VARCHAR(500) NOT NULL,
  description TEXT,

  -- ステータス
  status_id UUID NOT NULL REFERENCES project_statuses(id),

  -- 顧客情報
  customer_code VARCHAR(100),    -- 顧客コード (Cs_ID)
  customer_name VARCHAR(500),    -- 会社名

  -- 工事番号
  work_no VARCHAR(100),

  -- 日程
  start_date DATE,
  due_date DATE,

  -- メタ情報
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 自動採番関数・トリガー
-- ============================================

CREATE OR REPLACE FUNCTION generate_project_code()
RETURNS TRIGGER AS $$
DECLARE
  seq_val INTEGER;
  year_str VARCHAR(4);
BEGIN
  IF NEW.project_code IS NULL OR NEW.project_code = '' THEN
    seq_val := nextval('project_seq');
    year_str := to_char(NOW(), 'YYYY');
    NEW.project_code := 'PJ-' || year_str || '-' || lpad(seq_val::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_project_code
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION generate_project_code();

-- ============================================
-- updated_at 自動更新トリガー
-- ============================================

CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- ============================================
-- インデックス
-- ============================================

CREATE INDEX idx_projects_project_code ON projects(project_code);
CREATE INDEX idx_projects_status_id ON projects(status_id);
CREATE INDEX idx_projects_customer_code ON projects(customer_code);
CREATE INDEX idx_projects_work_no ON projects(work_no);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE project_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ステータスマスタ: 認証済みユーザーは読み取り可能
CREATE POLICY "project_statuses_select" ON project_statuses
  FOR SELECT TO authenticated USING (true);

-- プロジェクト: 認証済みユーザーはCRUD可能
CREATE POLICY "projects_select" ON projects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "projects_insert" ON projects
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "projects_update" ON projects
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "projects_delete" ON projects
  FOR DELETE TO authenticated USING (true);
