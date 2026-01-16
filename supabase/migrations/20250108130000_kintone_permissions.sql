-- ==============================================
-- Kintone互換 3レベル権限システム
-- レベル1: アプリ権限（テーブル単位）
-- レベル2: レコード権限（条件付きアクセス）
-- レベル3: フィールド権限（フィールド単位）
-- ==============================================

-- ==============================================
-- 1. アプリ定義テーブル
-- ==============================================
CREATE TABLE IF NOT EXISTS apps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,           -- employees, customers, quotations等
    name VARCHAR(100) NOT NULL,                  -- 従業員マスタ, 顧客マスタ等
    name_en VARCHAR(100),
    name_th VARCHAR(100),
    description TEXT,
    table_name VARCHAR(100) NOT NULL,            -- 対応するDBテーブル名
    icon VARCHAR(50),                            -- アイコン名
    color VARCHAR(20),                           -- テーマカラー
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- デフォルトアプリを登録
INSERT INTO apps (code, name, name_en, name_th, table_name, display_order)
VALUES
    ('employees', '従業員マスタ', 'Employee Master', 'ข้อมูลพนักงาน', 'employees', 1),
    ('customers', '顧客マスタ', 'Customer Master', 'ข้อมูลลูกค้า', 'customers', 2),
    ('suppliers', '仕入先マスタ', 'Supplier Master', 'ข้อมูลผู้จำหน่าย', 'suppliers', 3),
    ('quotations', '見積管理', 'Quotation Management', 'การจัดการใบเสนอราคา', 'quotations', 4),
    ('orders', '受注管理', 'Order Management', 'การจัดการคำสั่งซื้อ', 'orders', 5),
    ('purchase_orders', '発注管理', 'Purchase Order Management', 'การจัดการใบสั่งซื้อ', 'purchase_orders', 6),
    ('invoices', '請求書管理', 'Invoice Management', 'การจัดการใบแจ้งหนี้', 'invoices', 7),
    ('projects', 'プロジェクト管理', 'Project Management', 'การจัดการโครงการ', 'projects', 8),
    ('work_numbers', '工事番号', 'Work Numbers', 'หมายเลขงาน', 'work_numbers', 9),
    ('machines', '機械管理', 'Machine Management', 'การจัดการเครื่องจักร', 'machines', 10)
ON CONFLICT (code) DO NOTHING;

-- ==============================================
-- 2. アプリ権限テーブル（レベル1）
-- Kintone: アプリ > アクセス権
-- ==============================================
CREATE TABLE IF NOT EXISTS app_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,

    -- 権限付与対象
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('user', 'organization', 'role', 'everyone')),
    target_id UUID,                              -- user/org/roleの場合はそのID, everyoneの場合はNULL

    -- 権限フラグ（Kintone準拠）
    can_view BOOLEAN DEFAULT FALSE,              -- レコード閲覧
    can_add BOOLEAN DEFAULT FALSE,               -- レコード追加
    can_edit BOOLEAN DEFAULT FALSE,              -- レコード編集
    can_delete BOOLEAN DEFAULT FALSE,            -- レコード削除
    can_manage BOOLEAN DEFAULT FALSE,            -- アプリ管理（設定変更）
    can_export BOOLEAN DEFAULT FALSE,            -- ファイル書き出し
    can_import BOOLEAN DEFAULT FALSE,            -- ファイル読み込み

    -- サブ組織への継承
    include_sub_organizations BOOLEAN DEFAULT TRUE,

    -- 優先順位（上位が優先）
    priority INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,

    -- 一意制約
    UNIQUE(app_id, target_type, target_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_app_permissions_app_id ON app_permissions(app_id);
CREATE INDEX IF NOT EXISTS idx_app_permissions_target ON app_permissions(target_type, target_id);

-- ==============================================
-- 3. レコード権限ルールテーブル（レベル2）
-- Kintone: アプリ > レコードのアクセス権
-- ==============================================
CREATE TABLE IF NOT EXISTS record_permission_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,                  -- ルール名
    description TEXT,

    -- 条件（JSONB形式）
    -- 例: {"field": "status", "operator": "eq", "value": "retired"}
    -- 例: {"field": "department", "operator": "in", "values": ["HR", "Admin"]}
    condition JSONB NOT NULL,

    -- 権限付与対象
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('user', 'organization', 'role', 'creator', 'field_value')),
    target_id UUID,                              -- creator/field_valueの場合はNULL
    target_field VARCHAR(100),                   -- field_valueの場合: どのフィールドの値を使うか

    -- 権限フラグ
    can_view BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,

    -- サブ組織への継承
    include_sub_organizations BOOLEAN DEFAULT TRUE,

    -- 優先順位
    priority INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_record_permission_rules_app_id ON record_permission_rules(app_id);
CREATE INDEX IF NOT EXISTS idx_record_permission_rules_target ON record_permission_rules(target_type, target_id);

-- ==============================================
-- 4. フィールド権限テーブル（レベル3）
-- Kintone: アプリ > フィールドのアクセス権
-- ==============================================
CREATE TABLE IF NOT EXISTS field_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,            -- DBカラム名
    field_label VARCHAR(200),                    -- 表示名

    -- 権限付与対象
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('user', 'organization', 'role', 'everyone')),
    target_id UUID,

    -- 権限レベル（Kintone準拠）
    access_level VARCHAR(20) NOT NULL CHECK (access_level IN ('view', 'edit', 'hidden')),
    -- view: 閲覧可能（編集不可）
    -- edit: 閲覧・編集可能
    -- hidden: 非表示

    -- サブ組織への継承
    include_sub_organizations BOOLEAN DEFAULT TRUE,

    -- 優先順位
    priority INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,

    -- 一意制約
    UNIQUE(app_id, field_name, target_type, target_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_field_permissions_app_id ON field_permissions(app_id);
CREATE INDEX IF NOT EXISTS idx_field_permissions_field ON field_permissions(app_id, field_name);
CREATE INDEX IF NOT EXISTS idx_field_permissions_target ON field_permissions(target_type, target_id);

-- ==============================================
-- 5. 権限チェック用ヘルパー関数
-- ==============================================

-- ユーザーのアプリ権限を取得する関数
CREATE OR REPLACE FUNCTION get_user_app_permissions(
    p_user_id UUID,
    p_app_code VARCHAR
)
RETURNS TABLE (
    can_view BOOLEAN,
    can_add BOOLEAN,
    can_edit BOOLEAN,
    can_delete BOOLEAN,
    can_manage BOOLEAN,
    can_export BOOLEAN,
    can_import BOOLEAN
) AS $$
DECLARE
    v_app_id UUID;
    v_employee_id UUID;
    v_org_ids UUID[];
    v_role_ids UUID[];
BEGIN
    -- アプリIDを取得
    SELECT id INTO v_app_id FROM apps WHERE code = p_app_code AND is_active = TRUE;
    IF v_app_id IS NULL THEN
        RETURN QUERY SELECT FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE;
        RETURN;
    END IF;

    -- ユーザーの従業員IDを取得
    SELECT id INTO v_employee_id FROM employees WHERE user_id = p_user_id;

    -- ユーザーの所属組織IDリストを取得
    SELECT ARRAY_AGG(organization_id) INTO v_org_ids
    FROM organization_members
    WHERE employee_id = v_employee_id AND is_active = TRUE;

    -- ユーザーのロールIDリストを取得
    SELECT ARRAY_AGG(role_id) INTO v_role_ids
    FROM user_roles
    WHERE employee_id = v_employee_id AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW());

    -- 権限を集約して返す（優先順位順）
    RETURN QUERY
    SELECT
        COALESCE(bool_or(ap.can_view), FALSE),
        COALESCE(bool_or(ap.can_add), FALSE),
        COALESCE(bool_or(ap.can_edit), FALSE),
        COALESCE(bool_or(ap.can_delete), FALSE),
        COALESCE(bool_or(ap.can_manage), FALSE),
        COALESCE(bool_or(ap.can_export), FALSE),
        COALESCE(bool_or(ap.can_import), FALSE)
    FROM app_permissions ap
    WHERE ap.app_id = v_app_id
    AND ap.is_active = TRUE
    AND (
        -- ユーザー直接指定
        (ap.target_type = 'user' AND ap.target_id = v_employee_id)
        -- 組織指定
        OR (ap.target_type = 'organization' AND ap.target_id = ANY(v_org_ids))
        -- ロール指定
        OR (ap.target_type = 'role' AND ap.target_id = ANY(v_role_ids))
        -- 全員
        OR (ap.target_type = 'everyone')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザーのフィールド権限を取得する関数
CREATE OR REPLACE FUNCTION get_user_field_permissions(
    p_user_id UUID,
    p_app_code VARCHAR
)
RETURNS TABLE (
    field_name VARCHAR,
    access_level VARCHAR
) AS $$
DECLARE
    v_app_id UUID;
    v_employee_id UUID;
    v_org_ids UUID[];
    v_role_ids UUID[];
BEGIN
    -- アプリIDを取得
    SELECT id INTO v_app_id FROM apps WHERE code = p_app_code AND is_active = TRUE;
    IF v_app_id IS NULL THEN
        RETURN;
    END IF;

    -- ユーザー情報を取得
    SELECT id INTO v_employee_id FROM employees WHERE user_id = p_user_id;

    SELECT ARRAY_AGG(organization_id) INTO v_org_ids
    FROM organization_members
    WHERE employee_id = v_employee_id AND is_active = TRUE;

    SELECT ARRAY_AGG(role_id) INTO v_role_ids
    FROM user_roles
    WHERE employee_id = v_employee_id AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW());

    -- 各フィールドの最も制限的な権限を返す（優先順位考慮）
    RETURN QUERY
    SELECT DISTINCT ON (fp.field_name)
        fp.field_name,
        fp.access_level
    FROM field_permissions fp
    WHERE fp.app_id = v_app_id
    AND fp.is_active = TRUE
    AND (
        (fp.target_type = 'user' AND fp.target_id = v_employee_id)
        OR (fp.target_type = 'organization' AND fp.target_id = ANY(v_org_ids))
        OR (fp.target_type = 'role' AND fp.target_id = ANY(v_role_ids))
        OR (fp.target_type = 'everyone')
    )
    ORDER BY fp.field_name, fp.priority DESC,
        CASE fp.target_type
            WHEN 'user' THEN 1
            WHEN 'organization' THEN 2
            WHEN 'role' THEN 3
            ELSE 4
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 6. RLSポリシー
-- ==============================================
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_permission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_permissions ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは閲覧可能
CREATE POLICY "Authenticated users can view apps" ON apps
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can view app_permissions" ON app_permissions
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can view record_permission_rules" ON record_permission_rules
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can view field_permissions" ON field_permissions
    FOR SELECT TO authenticated USING (TRUE);

-- 管理者のみ変更可能（一時的に全認証ユーザー許可、後で細かく設定）
CREATE POLICY "Authenticated users can manage apps" ON apps
    FOR ALL TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can manage app_permissions" ON app_permissions
    FOR ALL TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can manage record_permission_rules" ON record_permission_rules
    FOR ALL TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can manage field_permissions" ON field_permissions
    FOR ALL TO authenticated USING (TRUE);

-- ==============================================
-- 7. デフォルト権限設定（例）
-- ==============================================

-- 管理者ロールに全アプリの全権限を付与
DO $$
DECLARE
    v_admin_role_id UUID;
    v_app RECORD;
BEGIN
    SELECT id INTO v_admin_role_id FROM roles WHERE code = 'administrator';

    IF v_admin_role_id IS NOT NULL THEN
        FOR v_app IN SELECT id FROM apps WHERE is_active = TRUE LOOP
            INSERT INTO app_permissions (app_id, target_type, target_id, can_view, can_add, can_edit, can_delete, can_manage, can_export, can_import, priority)
            VALUES (v_app.id, 'role', v_admin_role_id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 100)
            ON CONFLICT (app_id, target_type, target_id) DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- 閲覧者ロールに全アプリの閲覧権限を付与
DO $$
DECLARE
    v_viewer_role_id UUID;
    v_app RECORD;
BEGIN
    SELECT id INTO v_viewer_role_id FROM roles WHERE code = 'viewer';

    IF v_viewer_role_id IS NOT NULL THEN
        FOR v_app IN SELECT id FROM apps WHERE is_active = TRUE LOOP
            INSERT INTO app_permissions (app_id, target_type, target_id, can_view, can_add, can_edit, can_delete, can_manage, can_export, can_import, priority)
            VALUES (v_app.id, 'role', v_viewer_role_id, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 10)
            ON CONFLICT (app_id, target_type, target_id) DO NOTHING;
        END LOOP;
    END IF;
END $$;
