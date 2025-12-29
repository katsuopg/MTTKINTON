-- ロールテーブル（権限管理用）
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    name_th VARCHAR(100),
    description TEXT,
    -- 権限フラグ
    can_manage_users BOOLEAN DEFAULT FALSE,        -- ユーザー管理権限
    can_manage_organizations BOOLEAN DEFAULT FALSE, -- 組織管理権限
    can_manage_employees BOOLEAN DEFAULT FALSE,    -- 従業員管理権限
    can_manage_quotations BOOLEAN DEFAULT FALSE,   -- 見積管理権限
    can_view_all_records BOOLEAN DEFAULT FALSE,    -- 全レコード閲覧権限
    can_edit_all_records BOOLEAN DEFAULT FALSE,    -- 全レコード編集権限
    can_delete_records BOOLEAN DEFAULT FALSE,      -- レコード削除権限
    can_export_data BOOLEAN DEFAULT FALSE,         -- データエクスポート権限
    can_import_data BOOLEAN DEFAULT FALSE,         -- データインポート権限
    can_manage_settings BOOLEAN DEFAULT FALSE,     -- 設定管理権限
    is_system_role BOOLEAN DEFAULT FALSE,          -- システム定義ロール（削除不可）
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- デフォルトロールを挿入
INSERT INTO roles (code, name, name_en, name_th, description, can_manage_users, can_manage_organizations, can_manage_employees, can_manage_quotations, can_view_all_records, can_edit_all_records, can_delete_records, can_export_data, can_import_data, can_manage_settings, is_system_role, display_order)
VALUES
    ('administrator', '管理者', 'Administrator', 'ผู้ดูแลระบบ', 'フルアクセス権限を持つ管理者', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 1),
    ('manager', 'マネージャー', 'Manager', 'ผู้จัดการ', '部署管理と承認権限を持つ', FALSE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, TRUE, 2),
    ('editor', '編集者', 'Editor', 'ผู้แก้ไข', 'レコードの作成と編集が可能', FALSE, FALSE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, 3),
    ('viewer', '閲覧者', 'Viewer', 'ผู้ชม', '閲覧のみ可能', FALSE, FALSE, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE, 4)
ON CONFLICT (code) DO NOTHING;

-- ユーザーロール紐付けテーブル
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULLの場合はグローバル権限
    granted_by UUID REFERENCES employees(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- NULLの場合は無期限
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, role_id, organization_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_employee_id ON user_roles(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON user_roles(organization_id);

-- RLSポリシー
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーはロールを閲覧可能
CREATE POLICY "Authenticated users can view roles" ON roles
    FOR SELECT TO authenticated USING (TRUE);

-- 認証済みユーザーはユーザーロールを閲覧可能
CREATE POLICY "Authenticated users can view user_roles" ON user_roles
    FOR SELECT TO authenticated USING (TRUE);

-- 管理者のみロールを管理可能（後で細かく設定）
CREATE POLICY "Authenticated users can manage roles" ON roles
    FOR ALL TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can manage user_roles" ON user_roles
    FOR ALL TO authenticated USING (TRUE);
