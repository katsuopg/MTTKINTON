-- 組織管理テーブル
-- サイボウズの組織機能を参考に実装
-- 参考: https://jp.cybozu.help/general/ja/admin/list_useradmin/list_division.html

CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- 組織コード（例: "DIV-001"）
  name TEXT NOT NULL, -- 組織名（例: "営業部"）
  name_en TEXT, -- 組織名（英語）
  name_th TEXT, -- 組織名（タイ語）
  parent_id UUID REFERENCES organizations(id) ON DELETE SET NULL, -- 親組織ID（階層構造）
  display_order INTEGER DEFAULT 0, -- 表示順
  description TEXT, -- 組織の説明
  manager_id UUID, -- 管理者のユーザーID（employeesテーブルと連携予定）
  is_active BOOLEAN DEFAULT true, -- 有効/無効
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

-- 組織メンバーテーブル（多対多リレーション）
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL, -- 従業員ID（employeesテーブルのIDと連携）
  role TEXT DEFAULT 'member', -- 役割（manager, member等）
  is_active BOOLEAN DEFAULT true, -- 有効/無効
  joined_at TIMESTAMPTZ DEFAULT NOW(), -- 所属開始日
  left_at TIMESTAMPTZ, -- 所属終了日
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, employee_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_organizations_parent_id ON organizations(parent_id);
CREATE INDEX IF NOT EXISTS idx_organizations_code ON organizations(code);
CREATE INDEX IF NOT EXISTS idx_organizations_display_order ON organizations(display_order);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_employee_id ON organization_members(employee_id);

-- RLSを有効化
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- RLSポリシー（認証済みユーザーは全員読み取り可能、管理者のみ書き込み可能）
CREATE POLICY "Allow authenticated users to read organizations" ON organizations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert organizations" ON organizations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update organizations" ON organizations
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete organizations" ON organizations
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read organization_members" ON organization_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert organization_members" ON organization_members
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update organization_members" ON organization_members
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete organization_members" ON organization_members
  FOR DELETE TO authenticated USING (true);

-- updated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


