-- ============================================
-- RLSポリシー強化マイグレーション
-- 既存の USING(TRUE) ポリシーを適切な権限チェックに置き換え
-- ============================================
-- 方針:
--   - APIサーバーは service_role を使用するためRLSをバイパス
--   - クライアントサイド直接アクセスに対する防御の深層化
--   - カテゴリA: 全認証ユーザー読み取り、管理者のみ書き込み
--   - カテゴリB: 全認証ユーザー読み書き（業務データ）
--   - カテゴリC: ユーザー自身のデータのみ（既存維持）
--   - カテゴリD: 管理者のみ読み書き
-- ============================================

BEGIN;

-- ============================================
-- 1. ヘルパー関数
-- ============================================

-- 認証済みユーザーかチェック
CREATE OR REPLACE FUNCTION auth.is_authenticated()
RETURNS boolean AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 管理者かチェック（system_admin または administrator ロール）
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role_key IN ('system_admin', 'administrator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. カテゴリA: 全認証ユーザー読み取り、管理者のみ書き込み
-- ============================================

-- ---- roles ----
DROP POLICY IF EXISTS "Authenticated users can view roles" ON roles;
DROP POLICY IF EXISTS "Authenticated users can manage roles" ON roles;

CREATE POLICY "rls_roles_select" ON roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rls_roles_insert" ON roles
  FOR INSERT TO authenticated WITH CHECK (auth.is_admin());

CREATE POLICY "rls_roles_update" ON roles
  FOR UPDATE TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin());

CREATE POLICY "rls_roles_delete" ON roles
  FOR DELETE TO authenticated USING (auth.is_admin());

-- ---- apps ----
DROP POLICY IF EXISTS "Authenticated users can view apps" ON apps;
DROP POLICY IF EXISTS "Authenticated users can manage apps" ON apps;

CREATE POLICY "rls_apps_select" ON apps
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rls_apps_insert" ON apps
  FOR INSERT TO authenticated WITH CHECK (auth.is_admin());

CREATE POLICY "rls_apps_update" ON apps
  FOR UPDATE TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin());

CREATE POLICY "rls_apps_delete" ON apps
  FOR DELETE TO authenticated USING (auth.is_admin());

-- ---- app_permissions ----
DROP POLICY IF EXISTS "Authenticated users can view app_permissions" ON app_permissions;
DROP POLICY IF EXISTS "Authenticated users can manage app_permissions" ON app_permissions;

CREATE POLICY "rls_app_permissions_select" ON app_permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rls_app_permissions_insert" ON app_permissions
  FOR INSERT TO authenticated WITH CHECK (auth.is_admin());

CREATE POLICY "rls_app_permissions_update" ON app_permissions
  FOR UPDATE TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin());

CREATE POLICY "rls_app_permissions_delete" ON app_permissions
  FOR DELETE TO authenticated USING (auth.is_admin());

-- ---- record_permission_rules ----
DROP POLICY IF EXISTS "Authenticated users can view record_permission_rules" ON record_permission_rules;
DROP POLICY IF EXISTS "Authenticated users can manage record_permission_rules" ON record_permission_rules;

CREATE POLICY "rls_record_permission_rules_select" ON record_permission_rules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rls_record_permission_rules_insert" ON record_permission_rules
  FOR INSERT TO authenticated WITH CHECK (auth.is_admin());

CREATE POLICY "rls_record_permission_rules_update" ON record_permission_rules
  FOR UPDATE TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin());

CREATE POLICY "rls_record_permission_rules_delete" ON record_permission_rules
  FOR DELETE TO authenticated USING (auth.is_admin());

-- ---- field_permissions ----
DROP POLICY IF EXISTS "Authenticated users can view field_permissions" ON field_permissions;
DROP POLICY IF EXISTS "Authenticated users can manage field_permissions" ON field_permissions;

CREATE POLICY "rls_field_permissions_select" ON field_permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rls_field_permissions_insert" ON field_permissions
  FOR INSERT TO authenticated WITH CHECK (auth.is_admin());

CREATE POLICY "rls_field_permissions_update" ON field_permissions
  FOR UPDATE TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin());

CREATE POLICY "rls_field_permissions_delete" ON field_permissions
  FOR DELETE TO authenticated USING (auth.is_admin());

-- ---- project_statuses ----
DROP POLICY IF EXISTS "project_statuses_select" ON project_statuses;

CREATE POLICY "rls_project_statuses_select" ON project_statuses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rls_project_statuses_insert" ON project_statuses
  FOR INSERT TO authenticated WITH CHECK (auth.is_admin());

CREATE POLICY "rls_project_statuses_update" ON project_statuses
  FOR UPDATE TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin());

CREATE POLICY "rls_project_statuses_delete" ON project_statuses
  FOR DELETE TO authenticated USING (auth.is_admin());

-- ---- quote_request_statuses ----
DROP POLICY IF EXISTS "Authenticated users can view statuses" ON quote_request_statuses;

CREATE POLICY "rls_quote_request_statuses_select" ON quote_request_statuses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rls_quote_request_statuses_insert" ON quote_request_statuses
  FOR INSERT TO authenticated WITH CHECK (auth.is_admin());

CREATE POLICY "rls_quote_request_statuses_update" ON quote_request_statuses
  FOR UPDATE TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin());

CREATE POLICY "rls_quote_request_statuses_delete" ON quote_request_statuses
  FOR DELETE TO authenticated USING (auth.is_admin());

-- ---- master_materials ----
DROP POLICY IF EXISTS "master_materials_select" ON master_materials;

CREATE POLICY "rls_master_materials_select" ON master_materials
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rls_master_materials_insert" ON master_materials
  FOR INSERT TO authenticated WITH CHECK (auth.is_admin());

CREATE POLICY "rls_master_materials_update" ON master_materials
  FOR UPDATE TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin());

CREATE POLICY "rls_master_materials_delete" ON master_materials
  FOR DELETE TO authenticated USING (auth.is_admin());

-- ---- master_heat_treatments ----
DROP POLICY IF EXISTS "master_heat_treatments_select" ON master_heat_treatments;

CREATE POLICY "rls_master_heat_treatments_select" ON master_heat_treatments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rls_master_heat_treatments_insert" ON master_heat_treatments
  FOR INSERT TO authenticated WITH CHECK (auth.is_admin());

CREATE POLICY "rls_master_heat_treatments_update" ON master_heat_treatments
  FOR UPDATE TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin());

CREATE POLICY "rls_master_heat_treatments_delete" ON master_heat_treatments
  FOR DELETE TO authenticated USING (auth.is_admin());

-- ---- master_surface_treatments ----
DROP POLICY IF EXISTS "master_surface_treatments_select" ON master_surface_treatments;

CREATE POLICY "rls_master_surface_treatments_select" ON master_surface_treatments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rls_master_surface_treatments_insert" ON master_surface_treatments
  FOR INSERT TO authenticated WITH CHECK (auth.is_admin());

CREATE POLICY "rls_master_surface_treatments_update" ON master_surface_treatments
  FOR UPDATE TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin());

CREATE POLICY "rls_master_surface_treatments_delete" ON master_surface_treatments
  FOR DELETE TO authenticated USING (auth.is_admin());

-- ---- part_categories ----
DROP POLICY IF EXISTS "Authenticated users can view part_categories" ON part_categories;

CREATE POLICY "rls_part_categories_select" ON part_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rls_part_categories_insert" ON part_categories
  FOR INSERT TO authenticated WITH CHECK (auth.is_admin());

CREATE POLICY "rls_part_categories_update" ON part_categories
  FOR UPDATE TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin());

CREATE POLICY "rls_part_categories_delete" ON part_categories
  FOR DELETE TO authenticated USING (auth.is_admin());

-- ============================================
-- 3. カテゴリB: 全認証ユーザーが読み書き可能（業務データ）
-- ============================================

-- ---- customers ----
DROP POLICY IF EXISTS "Allow authenticated users to read customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to insert customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON customers;

CREATE POLICY "rls_customers_select" ON customers
  FOR SELECT TO authenticated USING (auth.is_authenticated());

CREATE POLICY "rls_customers_insert" ON customers
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_customers_update" ON customers
  FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_customers_delete" ON customers
  FOR DELETE TO authenticated USING (auth.is_authenticated());

-- ---- invoices ----
DROP POLICY IF EXISTS "Allow authenticated users to read invoices" ON invoices;
DROP POLICY IF EXISTS "Allow authenticated users to insert invoices" ON invoices;
DROP POLICY IF EXISTS "Allow authenticated users to update invoices" ON invoices;

CREATE POLICY "rls_invoices_select" ON invoices
  FOR SELECT TO authenticated USING (auth.is_authenticated());

CREATE POLICY "rls_invoices_insert" ON invoices
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_invoices_update" ON invoices
  FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_invoices_delete" ON invoices
  FOR DELETE TO authenticated USING (auth.is_authenticated());

-- ---- employees ----
DROP POLICY IF EXISTS "Authenticated users can view all employees" ON employees;
DROP POLICY IF EXISTS "Authenticated users can insert employees" ON employees;
DROP POLICY IF EXISTS "Authenticated users can update employees" ON employees;

CREATE POLICY "rls_employees_select" ON employees
  FOR SELECT TO authenticated USING (auth.is_authenticated());

CREATE POLICY "rls_employees_insert" ON employees
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_employees_update" ON employees
  FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated());

-- ---- projects ----
DROP POLICY IF EXISTS "projects_select" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "projects_delete" ON projects;

CREATE POLICY "rls_projects_select" ON projects
  FOR SELECT TO authenticated USING (auth.is_authenticated());

CREATE POLICY "rls_projects_insert" ON projects
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_projects_update" ON projects
  FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_projects_delete" ON projects
  FOR DELETE TO authenticated USING (auth.is_authenticated());

-- ---- project_files ----
DROP POLICY IF EXISTS "Authenticated users can read project files" ON project_files;
DROP POLICY IF EXISTS "Authenticated users can insert project files" ON project_files;
DROP POLICY IF EXISTS "Authenticated users can delete project files" ON project_files;

CREATE POLICY "rls_project_files_select" ON project_files
  FOR SELECT TO authenticated USING (auth.is_authenticated());

CREATE POLICY "rls_project_files_insert" ON project_files
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_project_files_delete" ON project_files
  FOR DELETE TO authenticated USING (auth.is_authenticated());

-- ---- dom_headers ----
DROP POLICY IF EXISTS "dom_headers_select" ON dom_headers;
DROP POLICY IF EXISTS "dom_headers_insert" ON dom_headers;
DROP POLICY IF EXISTS "dom_headers_update" ON dom_headers;
DROP POLICY IF EXISTS "dom_headers_delete" ON dom_headers;

CREATE POLICY "rls_dom_headers_select" ON dom_headers
  FOR SELECT TO authenticated USING (auth.is_authenticated());

CREATE POLICY "rls_dom_headers_insert" ON dom_headers
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_dom_headers_update" ON dom_headers
  FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_dom_headers_delete" ON dom_headers
  FOR DELETE TO authenticated USING (auth.is_authenticated());

-- ---- dom_sections ----
DROP POLICY IF EXISTS "dom_sections_select" ON dom_sections;
DROP POLICY IF EXISTS "dom_sections_insert" ON dom_sections;
DROP POLICY IF EXISTS "dom_sections_update" ON dom_sections;
DROP POLICY IF EXISTS "dom_sections_delete" ON dom_sections;

CREATE POLICY "rls_dom_sections_select" ON dom_sections
  FOR SELECT TO authenticated USING (auth.is_authenticated());

CREATE POLICY "rls_dom_sections_insert" ON dom_sections
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_dom_sections_update" ON dom_sections
  FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_dom_sections_delete" ON dom_sections
  FOR DELETE TO authenticated USING (auth.is_authenticated());

-- ---- dom_mech_items ----
DROP POLICY IF EXISTS "dom_mech_items_select" ON dom_mech_items;
DROP POLICY IF EXISTS "dom_mech_items_insert" ON dom_mech_items;
DROP POLICY IF EXISTS "dom_mech_items_update" ON dom_mech_items;
DROP POLICY IF EXISTS "dom_mech_items_delete" ON dom_mech_items;

CREATE POLICY "rls_dom_mech_items_select" ON dom_mech_items
  FOR SELECT TO authenticated USING (auth.is_authenticated());

CREATE POLICY "rls_dom_mech_items_insert" ON dom_mech_items
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_dom_mech_items_update" ON dom_mech_items
  FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_dom_mech_items_delete" ON dom_mech_items
  FOR DELETE TO authenticated USING (auth.is_authenticated());

-- ---- dom_elec_items ----
DROP POLICY IF EXISTS "dom_elec_items_select" ON dom_elec_items;
DROP POLICY IF EXISTS "dom_elec_items_insert" ON dom_elec_items;
DROP POLICY IF EXISTS "dom_elec_items_update" ON dom_elec_items;
DROP POLICY IF EXISTS "dom_elec_items_delete" ON dom_elec_items;

CREATE POLICY "rls_dom_elec_items_select" ON dom_elec_items
  FOR SELECT TO authenticated USING (auth.is_authenticated());

CREATE POLICY "rls_dom_elec_items_insert" ON dom_elec_items
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_dom_elec_items_update" ON dom_elec_items
  FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_dom_elec_items_delete" ON dom_elec_items
  FOR DELETE TO authenticated USING (auth.is_authenticated());

-- ---- dom_labor ----
DROP POLICY IF EXISTS "dom_labor_select" ON dom_labor;
DROP POLICY IF EXISTS "dom_labor_insert" ON dom_labor;
DROP POLICY IF EXISTS "dom_labor_update" ON dom_labor;
DROP POLICY IF EXISTS "dom_labor_delete" ON dom_labor;

CREATE POLICY "rls_dom_labor_select" ON dom_labor
  FOR SELECT TO authenticated USING (auth.is_authenticated());

CREATE POLICY "rls_dom_labor_insert" ON dom_labor
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_dom_labor_update" ON dom_labor
  FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_dom_labor_delete" ON dom_labor
  FOR DELETE TO authenticated USING (auth.is_authenticated());

-- ---- dom_item_files ----
DROP POLICY IF EXISTS "dom_item_files_select" ON dom_item_files;
DROP POLICY IF EXISTS "dom_item_files_insert" ON dom_item_files;
DROP POLICY IF EXISTS "dom_item_files_delete" ON dom_item_files;

CREATE POLICY "rls_dom_item_files_select" ON dom_item_files
  FOR SELECT TO authenticated USING (auth.is_authenticated());

CREATE POLICY "rls_dom_item_files_insert" ON dom_item_files
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_dom_item_files_delete" ON dom_item_files
  FOR DELETE TO authenticated USING (auth.is_authenticated());

-- ---- part_sections ----
DROP POLICY IF EXISTS "Authenticated users can view part_sections" ON part_sections;
DROP POLICY IF EXISTS "Authenticated users can manage part_sections" ON part_sections;

CREATE POLICY "rls_part_sections_select" ON part_sections
  FOR SELECT TO authenticated USING (auth.is_authenticated());

CREATE POLICY "rls_part_sections_insert" ON part_sections
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_part_sections_update" ON part_sections
  FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_part_sections_delete" ON part_sections
  FOR DELETE TO authenticated USING (auth.is_authenticated());

-- ---- part_list_items ----
DROP POLICY IF EXISTS "Authenticated users can view part_list_items" ON part_list_items;
DROP POLICY IF EXISTS "Authenticated users can manage part_list_items" ON part_list_items;

CREATE POLICY "rls_part_list_items_select" ON part_list_items
  FOR SELECT TO authenticated USING (auth.is_authenticated());

CREATE POLICY "rls_part_list_items_insert" ON part_list_items
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_part_list_items_update" ON part_list_items
  FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_part_list_items_delete" ON part_list_items
  FOR DELETE TO authenticated USING (auth.is_authenticated());

-- ---- quote_requests ----
DROP POLICY IF EXISTS "Authenticated users can view quote_requests" ON quote_requests;
DROP POLICY IF EXISTS "Authenticated users can manage quote_requests" ON quote_requests;

CREATE POLICY "rls_quote_requests_select" ON quote_requests
  FOR SELECT TO authenticated USING (auth.is_authenticated());

CREATE POLICY "rls_quote_requests_insert" ON quote_requests
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_quote_requests_update" ON quote_requests
  FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_quote_requests_delete" ON quote_requests
  FOR DELETE TO authenticated USING (auth.is_authenticated());

-- ---- quote_request_items ----
DROP POLICY IF EXISTS "Authenticated users can view quote_request_items" ON quote_request_items;
DROP POLICY IF EXISTS "Authenticated users can manage quote_request_items" ON quote_request_items;

CREATE POLICY "rls_quote_request_items_select" ON quote_request_items
  FOR SELECT TO authenticated USING (auth.is_authenticated());

CREATE POLICY "rls_quote_request_items_insert" ON quote_request_items
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_quote_request_items_update" ON quote_request_items
  FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_quote_request_items_delete" ON quote_request_items
  FOR DELETE TO authenticated USING (auth.is_authenticated());

-- ---- quote_request_item_offers ----
DROP POLICY IF EXISTS "Authenticated users can view offers" ON quote_request_item_offers;
DROP POLICY IF EXISTS "Authenticated users can manage offers" ON quote_request_item_offers;

CREATE POLICY "rls_quote_request_item_offers_select" ON quote_request_item_offers
  FOR SELECT TO authenticated USING (auth.is_authenticated());

CREATE POLICY "rls_quote_request_item_offers_insert" ON quote_request_item_offers
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_quote_request_item_offers_update" ON quote_request_item_offers
  FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_quote_request_item_offers_delete" ON quote_request_item_offers
  FOR DELETE TO authenticated USING (auth.is_authenticated());

-- ---- quote_request_item_orders ----
DROP POLICY IF EXISTS "Authenticated users can view orders" ON quote_request_item_orders;
DROP POLICY IF EXISTS "Authenticated users can manage orders" ON quote_request_item_orders;

CREATE POLICY "rls_quote_request_item_orders_select" ON quote_request_item_orders
  FOR SELECT TO authenticated USING (auth.is_authenticated());

CREATE POLICY "rls_quote_request_item_orders_insert" ON quote_request_item_orders
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_quote_request_item_orders_update" ON quote_request_item_orders
  FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_quote_request_item_orders_delete" ON quote_request_item_orders
  FOR DELETE TO authenticated USING (auth.is_authenticated());

-- ---- quote_request_files ----
DROP POLICY IF EXISTS "Authenticated users can view files" ON quote_request_files;
DROP POLICY IF EXISTS "Authenticated users can manage files" ON quote_request_files;

CREATE POLICY "rls_quote_request_files_select" ON quote_request_files
  FOR SELECT TO authenticated USING (auth.is_authenticated());

CREATE POLICY "rls_quote_request_files_insert" ON quote_request_files
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_quote_request_files_update" ON quote_request_files
  FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_quote_request_files_delete" ON quote_request_files
  FOR DELETE TO authenticated USING (auth.is_authenticated());

-- ---- quote_request_status_logs ----
DROP POLICY IF EXISTS "Authenticated users can view logs" ON quote_request_status_logs;
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON quote_request_status_logs;

CREATE POLICY "rls_quote_request_status_logs_select" ON quote_request_status_logs
  FOR SELECT TO authenticated USING (auth.is_authenticated());

CREATE POLICY "rls_quote_request_status_logs_insert" ON quote_request_status_logs
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

-- ============================================
-- 4. カテゴリC: ユーザー自身のデータのみ（既存維持、変更不要）
-- ============================================
-- notifications: "Users can view own notifications" (auth.uid() = user_id) -- 維持
-- notification_settings: "Users can view/update/insert own" (auth.uid() = user_id) -- 維持
-- quote_request_notifications: "Users can view own notifications" (recipient_id = auth.uid()) -- 維持

-- quote_request_notifications の管理ポリシーのみ管理者制限に変更
DROP POLICY IF EXISTS "System can manage notifications" ON quote_request_notifications;

CREATE POLICY "rls_quote_request_notifications_insert" ON quote_request_notifications
  FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated());

CREATE POLICY "rls_quote_request_notifications_update" ON quote_request_notifications
  FOR UPDATE TO authenticated USING (recipient_id = auth.uid());

CREATE POLICY "rls_quote_request_notifications_delete" ON quote_request_notifications
  FOR DELETE TO authenticated USING (recipient_id = auth.uid() OR auth.is_admin());

-- ============================================
-- 5. カテゴリD: 管理者のみ読み書き可能
-- ============================================

-- ---- user_roles ----
DROP POLICY IF EXISTS "Authenticated users can view user_roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can manage user_roles" ON user_roles;

-- 全認証ユーザーが読み取り可能（権限チェックで必要）、書き込みは管理者のみ
CREATE POLICY "rls_user_roles_select" ON user_roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rls_user_roles_insert" ON user_roles
  FOR INSERT TO authenticated WITH CHECK (auth.is_admin());

CREATE POLICY "rls_user_roles_update" ON user_roles
  FOR UPDATE TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin());

CREATE POLICY "rls_user_roles_delete" ON user_roles
  FOR DELETE TO authenticated USING (auth.is_admin());

-- ---- audit_logs（テーブルが存在する場合のみ） ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = 'public') THEN
    -- RLS有効化
    EXECUTE 'ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY';

    -- 既存ポリシー削除
    EXECUTE 'DROP POLICY IF EXISTS "rls_audit_logs_select" ON audit_logs';
    EXECUTE 'DROP POLICY IF EXISTS "rls_audit_logs_insert" ON audit_logs';

    -- 管理者のみ読み取り可能、挿入は認証済みユーザー（ログ記録用）
    EXECUTE 'CREATE POLICY "rls_audit_logs_select" ON audit_logs FOR SELECT TO authenticated USING (auth.is_admin())';
    EXECUTE 'CREATE POLICY "rls_audit_logs_insert" ON audit_logs FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated())';
  END IF;
END $$;

-- ---- api_tokens（テーブルが存在する場合のみ） ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_tokens' AND table_schema = 'public') THEN
    -- RLS有効化
    EXECUTE 'ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY';

    -- 既存ポリシー削除
    EXECUTE 'DROP POLICY IF EXISTS "rls_api_tokens_select" ON api_tokens';
    EXECUTE 'DROP POLICY IF EXISTS "rls_api_tokens_insert" ON api_tokens';
    EXECUTE 'DROP POLICY IF EXISTS "rls_api_tokens_update" ON api_tokens';
    EXECUTE 'DROP POLICY IF EXISTS "rls_api_tokens_delete" ON api_tokens';

    -- 管理者のみ全操作可能
    EXECUTE 'CREATE POLICY "rls_api_tokens_select" ON api_tokens FOR SELECT TO authenticated USING (auth.is_admin())';
    EXECUTE 'CREATE POLICY "rls_api_tokens_insert" ON api_tokens FOR INSERT TO authenticated WITH CHECK (auth.is_admin())';
    EXECUTE 'CREATE POLICY "rls_api_tokens_update" ON api_tokens FOR UPDATE TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin())';
    EXECUTE 'CREATE POLICY "rls_api_tokens_delete" ON api_tokens FOR DELETE TO authenticated USING (auth.is_admin())';
  END IF;
END $$;

-- ============================================
-- 6. 追加テーブル（存在する場合のみRLS有効化+ポリシー設定）
-- ============================================

-- ---- app_actions ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_actions' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE app_actions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "rls_app_actions_select" ON app_actions';
    EXECUTE 'DROP POLICY IF EXISTS "rls_app_actions_insert" ON app_actions';
    EXECUTE 'DROP POLICY IF EXISTS "rls_app_actions_update" ON app_actions';
    EXECUTE 'DROP POLICY IF EXISTS "rls_app_actions_delete" ON app_actions';
    EXECUTE 'CREATE POLICY "rls_app_actions_select" ON app_actions FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "rls_app_actions_insert" ON app_actions FOR INSERT TO authenticated WITH CHECK (auth.is_admin())';
    EXECUTE 'CREATE POLICY "rls_app_actions_update" ON app_actions FOR UPDATE TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin())';
    EXECUTE 'CREATE POLICY "rls_app_actions_delete" ON app_actions FOR DELETE TO authenticated USING (auth.is_admin())';
  END IF;
END $$;

-- ---- app_categories ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_categories' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE app_categories ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "rls_app_categories_select" ON app_categories';
    EXECUTE 'DROP POLICY IF EXISTS "rls_app_categories_insert" ON app_categories';
    EXECUTE 'DROP POLICY IF EXISTS "rls_app_categories_update" ON app_categories';
    EXECUTE 'DROP POLICY IF EXISTS "rls_app_categories_delete" ON app_categories';
    EXECUTE 'CREATE POLICY "rls_app_categories_select" ON app_categories FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "rls_app_categories_insert" ON app_categories FOR INSERT TO authenticated WITH CHECK (auth.is_admin())';
    EXECUTE 'CREATE POLICY "rls_app_categories_update" ON app_categories FOR UPDATE TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin())';
    EXECUTE 'CREATE POLICY "rls_app_categories_delete" ON app_categories FOR DELETE TO authenticated USING (auth.is_admin())';
  END IF;
END $$;

-- ---- app_notification_rules ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_notification_rules' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE app_notification_rules ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "rls_app_notification_rules_select" ON app_notification_rules';
    EXECUTE 'DROP POLICY IF EXISTS "rls_app_notification_rules_insert" ON app_notification_rules';
    EXECUTE 'DROP POLICY IF EXISTS "rls_app_notification_rules_update" ON app_notification_rules';
    EXECUTE 'DROP POLICY IF EXISTS "rls_app_notification_rules_delete" ON app_notification_rules';
    EXECUTE 'CREATE POLICY "rls_app_notification_rules_select" ON app_notification_rules FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "rls_app_notification_rules_insert" ON app_notification_rules FOR INSERT TO authenticated WITH CHECK (auth.is_admin())';
    EXECUTE 'CREATE POLICY "rls_app_notification_rules_update" ON app_notification_rules FOR UPDATE TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin())';
    EXECUTE 'CREATE POLICY "rls_app_notification_rules_delete" ON app_notification_rules FOR DELETE TO authenticated USING (auth.is_admin())';
  END IF;
END $$;

-- ---- spaces（業務データ: 認証ユーザー読み書き） ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spaces' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE spaces ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "rls_spaces_select" ON spaces';
    EXECUTE 'DROP POLICY IF EXISTS "rls_spaces_insert" ON spaces';
    EXECUTE 'DROP POLICY IF EXISTS "rls_spaces_update" ON spaces';
    EXECUTE 'DROP POLICY IF EXISTS "rls_spaces_delete" ON spaces';
    EXECUTE 'CREATE POLICY "rls_spaces_select" ON spaces FOR SELECT TO authenticated USING (auth.is_authenticated())';
    EXECUTE 'CREATE POLICY "rls_spaces_insert" ON spaces FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated())';
    EXECUTE 'CREATE POLICY "rls_spaces_update" ON spaces FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated())';
    EXECUTE 'CREATE POLICY "rls_spaces_delete" ON spaces FOR DELETE TO authenticated USING (auth.is_admin())';
  END IF;
END $$;

-- ---- space_members ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'space_members' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE space_members ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "rls_space_members_select" ON space_members';
    EXECUTE 'DROP POLICY IF EXISTS "rls_space_members_insert" ON space_members';
    EXECUTE 'DROP POLICY IF EXISTS "rls_space_members_update" ON space_members';
    EXECUTE 'DROP POLICY IF EXISTS "rls_space_members_delete" ON space_members';
    EXECUTE 'CREATE POLICY "rls_space_members_select" ON space_members FOR SELECT TO authenticated USING (auth.is_authenticated())';
    EXECUTE 'CREATE POLICY "rls_space_members_insert" ON space_members FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated())';
    EXECUTE 'CREATE POLICY "rls_space_members_update" ON space_members FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated())';
    EXECUTE 'CREATE POLICY "rls_space_members_delete" ON space_members FOR DELETE TO authenticated USING (auth.is_authenticated())';
  END IF;
END $$;

-- ---- space_apps ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'space_apps' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE space_apps ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "rls_space_apps_select" ON space_apps';
    EXECUTE 'DROP POLICY IF EXISTS "rls_space_apps_insert" ON space_apps';
    EXECUTE 'DROP POLICY IF EXISTS "rls_space_apps_delete" ON space_apps';
    EXECUTE 'CREATE POLICY "rls_space_apps_select" ON space_apps FOR SELECT TO authenticated USING (auth.is_authenticated())';
    EXECUTE 'CREATE POLICY "rls_space_apps_insert" ON space_apps FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated())';
    EXECUTE 'CREATE POLICY "rls_space_apps_delete" ON space_apps FOR DELETE TO authenticated USING (auth.is_authenticated())';
  END IF;
END $$;

-- ---- space_threads ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'space_threads' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE space_threads ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "rls_space_threads_select" ON space_threads';
    EXECUTE 'DROP POLICY IF EXISTS "rls_space_threads_insert" ON space_threads';
    EXECUTE 'DROP POLICY IF EXISTS "rls_space_threads_update" ON space_threads';
    EXECUTE 'DROP POLICY IF EXISTS "rls_space_threads_delete" ON space_threads';
    EXECUTE 'CREATE POLICY "rls_space_threads_select" ON space_threads FOR SELECT TO authenticated USING (auth.is_authenticated())';
    EXECUTE 'CREATE POLICY "rls_space_threads_insert" ON space_threads FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated())';
    EXECUTE 'CREATE POLICY "rls_space_threads_update" ON space_threads FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated())';
    EXECUTE 'CREATE POLICY "rls_space_threads_delete" ON space_threads FOR DELETE TO authenticated USING (auth.is_authenticated())';
  END IF;
END $$;

-- ---- space_thread_replies ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'space_thread_replies' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE space_thread_replies ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "rls_space_thread_replies_select" ON space_thread_replies';
    EXECUTE 'DROP POLICY IF EXISTS "rls_space_thread_replies_insert" ON space_thread_replies';
    EXECUTE 'DROP POLICY IF EXISTS "rls_space_thread_replies_update" ON space_thread_replies';
    EXECUTE 'DROP POLICY IF EXISTS "rls_space_thread_replies_delete" ON space_thread_replies';
    EXECUTE 'CREATE POLICY "rls_space_thread_replies_select" ON space_thread_replies FOR SELECT TO authenticated USING (auth.is_authenticated())';
    EXECUTE 'CREATE POLICY "rls_space_thread_replies_insert" ON space_thread_replies FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated())';
    EXECUTE 'CREATE POLICY "rls_space_thread_replies_update" ON space_thread_replies FOR UPDATE TO authenticated USING (auth.is_authenticated()) WITH CHECK (auth.is_authenticated())';
    EXECUTE 'CREATE POLICY "rls_space_thread_replies_delete" ON space_thread_replies FOR DELETE TO authenticated USING (auth.is_authenticated())';
  END IF;
END $$;

-- ---- scheduled_reports（管理者のみ） ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scheduled_reports' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "rls_scheduled_reports_select" ON scheduled_reports';
    EXECUTE 'DROP POLICY IF EXISTS "rls_scheduled_reports_insert" ON scheduled_reports';
    EXECUTE 'DROP POLICY IF EXISTS "rls_scheduled_reports_update" ON scheduled_reports';
    EXECUTE 'DROP POLICY IF EXISTS "rls_scheduled_reports_delete" ON scheduled_reports';
    EXECUTE 'CREATE POLICY "rls_scheduled_reports_select" ON scheduled_reports FOR SELECT TO authenticated USING (auth.is_admin())';
    EXECUTE 'CREATE POLICY "rls_scheduled_reports_insert" ON scheduled_reports FOR INSERT TO authenticated WITH CHECK (auth.is_admin())';
    EXECUTE 'CREATE POLICY "rls_scheduled_reports_update" ON scheduled_reports FOR UPDATE TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin())';
    EXECUTE 'CREATE POLICY "rls_scheduled_reports_delete" ON scheduled_reports FOR DELETE TO authenticated USING (auth.is_admin())';
  END IF;
END $$;

-- ---- report_executions（管理者のみ） ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_executions' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "rls_report_executions_select" ON report_executions';
    EXECUTE 'DROP POLICY IF EXISTS "rls_report_executions_insert" ON report_executions';
    EXECUTE 'CREATE POLICY "rls_report_executions_select" ON report_executions FOR SELECT TO authenticated USING (auth.is_admin())';
    EXECUTE 'CREATE POLICY "rls_report_executions_insert" ON report_executions FOR INSERT TO authenticated WITH CHECK (auth.is_authenticated())';
  END IF;
END $$;

COMMIT;

-- ============================================
-- 変更サマリ:
-- ============================================
-- ヘルパー関数:
--   auth.is_authenticated() - 認証チェック
--   auth.is_admin() - 管理者チェック (system_admin/administrator)
--
-- カテゴリA (読み取り全員、書き込み管理者のみ): 10テーブル
--   roles, apps, app_permissions, record_permission_rules, field_permissions,
--   project_statuses, quote_request_statuses, master_materials,
--   master_heat_treatments, master_surface_treatments, part_categories
--
-- カテゴリB (認証ユーザー読み書き): 18テーブル
--   customers, invoices, employees, projects, project_files,
--   dom_headers, dom_sections, dom_mech_items, dom_elec_items, dom_labor, dom_item_files,
--   part_sections, part_list_items,
--   quote_requests, quote_request_items, quote_request_item_offers,
--   quote_request_item_orders, quote_request_files, quote_request_status_logs
--
-- カテゴリC (自身のデータのみ): 3テーブル（既存維持）
--   notifications, notification_settings, quote_request_notifications
--
-- カテゴリD (管理者のみ): 2テーブル + 条件付き
--   user_roles(読み取りは全員), audit_logs, api_tokens
--
-- 条件付きテーブル（存在する場合のみ）:
--   app_actions, app_categories, app_notification_rules (管理者書き込み)
--   spaces, space_members, space_apps, space_threads, space_thread_replies (業務データ)
--   scheduled_reports, report_executions (管理者のみ)
