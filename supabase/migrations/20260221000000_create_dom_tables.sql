-- ============================================
-- DOM (Document of Material) Phase 1 テーブル作成
-- マスタ3テーブル + コア6テーブル
-- ============================================

-- ============================================
-- 1. マスタテーブル
-- ============================================

-- 材質マスタ
CREATE TABLE master_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name_ja VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  category VARCHAR(50),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 熱処理マスタ
CREATE TABLE master_heat_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  method VARCHAR(100),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 表面処理マスタ
CREATE TABLE master_surface_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- マスタ初期データ
-- ============================================

INSERT INTO master_materials (code, name_ja, name_en, category, sort_order) VALUES
  ('SDK11', 'SDK11', 'SDK11', '工具鋼', 1),
  ('SKD61', 'SKD61', 'SKD61', '工具鋼', 2),
  ('SS400', 'SS400', 'SS400', '炭素鋼', 3),
  ('S45C', 'S45C', 'S45C', '炭素鋼', 4),
  ('S50C', 'S50C', 'S50C', '炭素鋼', 5),
  ('SCM440', 'SCM440', 'SCM440', '合金鋼', 6),
  ('SUS304', 'SUS304', 'SUS304', 'ステンレス', 7),
  ('SUS316', 'SUS316', 'SUS316', 'ステンレス', 8),
  ('SUS303', 'SUS303', 'SUS303', 'ステンレス', 9),
  ('A5052', 'A5052', 'A5052', 'アルミニウム', 10),
  ('A6063', 'A6063', 'A6063', 'アルミニウム', 11),
  ('A7075', 'A7075', 'A7075', 'アルミニウム', 12),
  ('C3604', 'C3604', 'C3604', '銅合金', 13),
  ('MCナイロン', 'MCナイロン', 'MC Nylon', '樹脂', 14),
  ('POM', 'POM', 'POM', '樹脂', 15),
  ('PEEK', 'PEEK', 'PEEK', '樹脂', 16),
  ('FC250', 'FC250', 'FC250', '鋳鉄', 17),
  ('FCD450', 'FCD450', 'FCD450', '鋳鉄', 18),
  ('SUJ2', 'SUJ2', 'SUJ2', '軸受鋼', 19);

INSERT INTO master_heat_treatments (code, name, method, sort_order) VALUES
  ('HRC58-60', '58-60 HRC', '焼入れ焼戻し', 1),
  ('HRC55-58', '55-58 HRC', '焼入れ焼戻し', 2),
  ('HRC40-45', '40-45 HRC', '焼入れ焼戻し', 3),
  ('CARBURIZING', '浸炭焼入', '浸炭', 4),
  ('INDUCTION', '高周波焼入', '高周波', 5),
  ('NITRIDING', '窒化処理', '窒化', 6),
  ('ANNEALING', '焼きなまし', '焼きなまし', 7),
  ('TEMPERING', '調質', '調質', 8);

INSERT INTO master_surface_treatments (code, name, category, sort_order) VALUES
  ('BLACK_OXIDE', '黒染め', '化成処理', 1),
  ('ZINC', 'ユニクロメッキ', 'メッキ', 2),
  ('CHROME', 'クロムメッキ', 'メッキ', 3),
  ('ELECTROLESS_NI', '無電解ニッケル', 'メッキ', 4),
  ('HARD_CHROME', '硬質クロム', 'メッキ', 5),
  ('ANODIZE', 'アルマイト', '陽極酸化', 6),
  ('POWDER_COAT', '粉体塗装', '塗装', 7),
  ('TRIVALENT_CHROMATE', '三価クロメート', '化成処理', 8),
  ('PASSIVATION', '不動態化処理', '化成処理', 9);

-- ============================================
-- 2. コアテーブル
-- ============================================

-- DOMヘッダー
CREATE TABLE dom_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  customer_name VARCHAR(500),
  machine_name VARCHAR(500),
  machine_model VARCHAR(500),
  project_deadline DATE,
  version INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_review', 'approved', 'released')),
  total_cost DECIMAL(15, 2) DEFAULT 0,
  designed_by UUID REFERENCES auth.users(id),
  checked_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  designed_at DATE,
  checked_at DATE,
  approved_at DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOMセクション
CREATE TABLE dom_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dom_header_id UUID NOT NULL REFERENCES dom_headers(id) ON DELETE CASCADE,
  section_number INTEGER NOT NULL,
  section_code VARCHAR(10) NOT NULL,
  section_name VARCHAR(200),
  subtotal DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- メカ部品明細
CREATE TABLE dom_mech_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dom_section_id UUID NOT NULL REFERENCES dom_sections(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES dom_mech_items(id) ON DELETE SET NULL,
  item_number INTEGER NOT NULL DEFAULT 0,
  category VARCHAR(10) NOT NULL DEFAULT 'make'
    CHECK (category IN ('make', 'buy')),
  item_type VARCHAR(10)
    CHECK (item_type IS NULL OR item_type IN ('assembly', 'part')),
  status VARCHAR(20) NOT NULL DEFAULT 'designing'
    CHECK (status IN ('designing', 'on_hold', 'quote_requesting', 'quote_done', 'order_requesting', 'ordering', 'delivered')),
  part_code VARCHAR(100),
  revision INTEGER NOT NULL DEFAULT 0,
  part_name VARCHAR(500),
  model_number VARCHAR(500),
  material_id UUID REFERENCES master_materials(id),
  heat_treatment_id UUID REFERENCES master_heat_treatments(id),
  surface_treatment_id UUID REFERENCES master_surface_treatments(id),
  manufacturer VARCHAR(500),
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit VARCHAR(20) NOT NULL DEFAULT '個',
  unit_price DECIMAL(15, 2) DEFAULT 0,
  amount DECIMAL(15, 2) DEFAULT 0,
  desired_delivery_date DATE,
  lead_time_days INTEGER,
  supplier_delivery_date DATE,
  order_deadline DATE,
  actual_delivery_date DATE,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 電気部品明細
CREATE TABLE dom_elec_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dom_header_id UUID NOT NULL REFERENCES dom_headers(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL DEFAULT 0,
  category VARCHAR(10) NOT NULL DEFAULT 'buy'
    CHECK (category IN ('make', 'buy')),
  status VARCHAR(20) NOT NULL DEFAULT 'designing'
    CHECK (status IN ('designing', 'on_hold', 'quote_requesting', 'quote_done', 'order_requesting', 'ordering', 'delivered')),
  mark VARCHAR(100),
  part_name VARCHAR(500),
  model_number VARCHAR(500),
  manufacturer VARCHAR(500),
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit VARCHAR(20) NOT NULL DEFAULT '個',
  unit_price DECIMAL(15, 2) DEFAULT 0,
  amount DECIMAL(15, 2) DEFAULT 0,
  desired_delivery_date DATE,
  lead_time_days INTEGER,
  supplier_delivery_date DATE,
  order_deadline DATE,
  actual_delivery_date DATE,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 社内工数
CREATE TABLE dom_labor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dom_header_id UUID NOT NULL REFERENCES dom_headers(id) ON DELETE CASCADE,
  discipline VARCHAR(10) NOT NULL
    CHECK (discipline IN ('mech', 'elec')),
  work_type VARCHAR(20) NOT NULL
    CHECK (work_type IN ('design', 'construction', 'other')),
  description VARCHAR(500),
  hours DECIMAL(10, 2) NOT NULL DEFAULT 0,
  hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  amount DECIMAL(15, 2) DEFAULT 0,
  assigned_to UUID REFERENCES auth.users(id),
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 部品添付ファイル
CREATE TABLE dom_item_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type VARCHAR(10) NOT NULL
    CHECK (item_type IN ('mech', 'elec')),
  item_id UUID NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_type VARCHAR(20) NOT NULL DEFAULT 'other'
    CHECK (file_type IN ('pdf', 'dwg', 'jpeg', 'png', 'other')),
  file_path VARCHAR(1000) NOT NULL,
  file_size INTEGER,
  revision INTEGER DEFAULT 0,
  description VARCHAR(500),
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. updated_at 自動更新トリガー
-- ============================================

CREATE OR REPLACE FUNCTION update_dom_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dom_headers_updated_at
  BEFORE UPDATE ON dom_headers
  FOR EACH ROW EXECUTE FUNCTION update_dom_updated_at();

CREATE TRIGGER trigger_dom_sections_updated_at
  BEFORE UPDATE ON dom_sections
  FOR EACH ROW EXECUTE FUNCTION update_dom_updated_at();

CREATE TRIGGER trigger_dom_mech_items_updated_at
  BEFORE UPDATE ON dom_mech_items
  FOR EACH ROW EXECUTE FUNCTION update_dom_updated_at();

CREATE TRIGGER trigger_dom_elec_items_updated_at
  BEFORE UPDATE ON dom_elec_items
  FOR EACH ROW EXECUTE FUNCTION update_dom_updated_at();

CREATE TRIGGER trigger_dom_labor_updated_at
  BEFORE UPDATE ON dom_labor
  FOR EACH ROW EXECUTE FUNCTION update_dom_updated_at();

-- ============================================
-- 4. インデックス
-- ============================================

-- dom_headers
CREATE INDEX idx_dom_headers_project_id ON dom_headers(project_id);
CREATE INDEX idx_dom_headers_status ON dom_headers(status);

-- dom_sections
CREATE INDEX idx_dom_sections_header_id ON dom_sections(dom_header_id);
CREATE INDEX idx_dom_sections_sort ON dom_sections(dom_header_id, sort_order);

-- dom_mech_items
CREATE INDEX idx_dom_mech_items_section_id ON dom_mech_items(dom_section_id);
CREATE INDEX idx_dom_mech_items_parent_id ON dom_mech_items(parent_id);
CREATE INDEX idx_dom_mech_items_category ON dom_mech_items(category);
CREATE INDEX idx_dom_mech_items_status ON dom_mech_items(status);
CREATE INDEX idx_dom_mech_items_sort ON dom_mech_items(dom_section_id, sort_order);

-- dom_elec_items
CREATE INDEX idx_dom_elec_items_header_id ON dom_elec_items(dom_header_id);
CREATE INDEX idx_dom_elec_items_sort ON dom_elec_items(dom_header_id, sort_order);

-- dom_labor
CREATE INDEX idx_dom_labor_header_id ON dom_labor(dom_header_id);
CREATE INDEX idx_dom_labor_discipline ON dom_labor(discipline);

-- dom_item_files
CREATE INDEX idx_dom_item_files_item ON dom_item_files(item_type, item_id);

-- ============================================
-- 5. RLS (Row Level Security)
-- ============================================

ALTER TABLE master_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_heat_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_surface_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dom_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dom_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE dom_mech_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dom_elec_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dom_labor ENABLE ROW LEVEL SECURITY;
ALTER TABLE dom_item_files ENABLE ROW LEVEL SECURITY;

-- マスタテーブル: 認証済みユーザーは読み取り可能
CREATE POLICY "master_materials_select" ON master_materials
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "master_heat_treatments_select" ON master_heat_treatments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "master_surface_treatments_select" ON master_surface_treatments
  FOR SELECT TO authenticated USING (true);

-- DOMテーブル: 認証済みユーザーはCRUD可能
CREATE POLICY "dom_headers_select" ON dom_headers FOR SELECT TO authenticated USING (true);
CREATE POLICY "dom_headers_insert" ON dom_headers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "dom_headers_update" ON dom_headers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "dom_headers_delete" ON dom_headers FOR DELETE TO authenticated USING (true);

CREATE POLICY "dom_sections_select" ON dom_sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "dom_sections_insert" ON dom_sections FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "dom_sections_update" ON dom_sections FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "dom_sections_delete" ON dom_sections FOR DELETE TO authenticated USING (true);

CREATE POLICY "dom_mech_items_select" ON dom_mech_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "dom_mech_items_insert" ON dom_mech_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "dom_mech_items_update" ON dom_mech_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "dom_mech_items_delete" ON dom_mech_items FOR DELETE TO authenticated USING (true);

CREATE POLICY "dom_elec_items_select" ON dom_elec_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "dom_elec_items_insert" ON dom_elec_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "dom_elec_items_update" ON dom_elec_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "dom_elec_items_delete" ON dom_elec_items FOR DELETE TO authenticated USING (true);

CREATE POLICY "dom_labor_select" ON dom_labor FOR SELECT TO authenticated USING (true);
CREATE POLICY "dom_labor_insert" ON dom_labor FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "dom_labor_update" ON dom_labor FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "dom_labor_delete" ON dom_labor FOR DELETE TO authenticated USING (true);

CREATE POLICY "dom_item_files_select" ON dom_item_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "dom_item_files_insert" ON dom_item_files FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "dom_item_files_delete" ON dom_item_files FOR DELETE TO authenticated USING (true);

-- ============================================
-- 6. ストレージバケット
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('dom-files', 'dom-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "dom_files_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'dom-files');

CREATE POLICY "dom_files_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dom-files');

CREATE POLICY "dom_files_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'dom-files');

-- ============================================
-- 7. quote_request_items にDOM参照カラム追加
-- ============================================

ALTER TABLE quote_request_items
  ADD COLUMN IF NOT EXISTS dom_mech_item_id UUID REFERENCES dom_mech_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dom_elec_item_id UUID REFERENCES dom_elec_items(id) ON DELETE SET NULL;
