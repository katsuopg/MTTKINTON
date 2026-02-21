-- ============================================
-- 部品表（BOM）関連テーブル作成
-- Phase 1: 部品表基本機能
-- ============================================

-- 部品表カテゴリ（固定4種）
CREATE TABLE part_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  name_th VARCHAR(100),
  has_sections BOOLEAN DEFAULT FALSE,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- カテゴリ初期データ
INSERT INTO part_categories (code, name, name_en, name_th, has_sections, sort_order) VALUES
  ('mech_make', 'メカ製作部品', 'Mechanical Fabrication Parts', 'ชิ้นส่วนผลิตเครื่องกล', TRUE, 1),
  ('mech_buy', 'メカ購入品', 'Mechanical Purchased Parts', 'ชิ้นส่วนซื้อเครื่องกล', FALSE, 2),
  ('elec_make', '電気製作品', 'Electrical Fabrication Parts', 'ชิ้นส่วนผลิตไฟฟ้า', FALSE, 3),
  ('elec_buy', '電気購入品', 'Electrical Purchased Parts', 'ชิ้นส่วนซื้อไฟฟ้า', FALSE, 4);

-- セクション（メカ製作部品用、ユーザー追加可能）
CREATE TABLE part_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code VARCHAR(50) NOT NULL,
  category_id UUID NOT NULL REFERENCES part_categories(id) ON DELETE CASCADE,
  section_code VARCHAR(20) NOT NULL,
  section_name VARCHAR(100),
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(project_code, category_id, section_code)
);

-- 部品表明細
CREATE TABLE part_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code VARCHAR(50) NOT NULL,
  category_id UUID NOT NULL REFERENCES part_categories(id),
  section_id UUID REFERENCES part_sections(id) ON DELETE SET NULL,

  -- 部品情報
  part_number VARCHAR(100),
  part_name VARCHAR(200),
  model_number VARCHAR(200),
  manufacturer VARCHAR(200),
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit VARCHAR(20) DEFAULT '個',
  unit_price DECIMAL(12,2),
  drawing_no VARCHAR(100),
  remarks TEXT,

  -- メタ情報
  sort_order INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- インデックス
CREATE INDEX idx_part_sections_project ON part_sections(project_code);
CREATE INDEX idx_part_sections_category ON part_sections(category_id);
CREATE INDEX idx_part_list_items_project ON part_list_items(project_code);
CREATE INDEX idx_part_list_items_category ON part_list_items(category_id);
CREATE INDEX idx_part_list_items_section ON part_list_items(section_id);
CREATE INDEX idx_part_list_items_not_deleted ON part_list_items(project_code) WHERE is_deleted = FALSE;

-- RLSを有効化
ALTER TABLE part_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_list_items ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 認証済みユーザーは閲覧可能
CREATE POLICY "Authenticated users can view part_categories" ON part_categories
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can view part_sections" ON part_sections
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can manage part_sections" ON part_sections
    FOR ALL TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can view part_list_items" ON part_list_items
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can manage part_list_items" ON part_list_items
    FOR ALL TO authenticated USING (TRUE);

-- 更新日時自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_part_sections_updated_at
    BEFORE UPDATE ON part_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_part_list_items_updated_at
    BEFORE UPDATE ON part_list_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- コメント
COMMENT ON TABLE part_categories IS '部品表カテゴリマスタ（固定4種）';
COMMENT ON TABLE part_sections IS '部品表セクション（メカ製作部品用）';
COMMENT ON TABLE part_list_items IS '部品表明細';
COMMENT ON COLUMN part_list_items.project_code IS 'Kintoneプロジェクトコード（PJ_code）';
COMMENT ON COLUMN part_list_items.is_deleted IS '論理削除フラグ';
