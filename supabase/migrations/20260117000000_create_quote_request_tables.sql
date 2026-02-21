-- ============================================
-- 見積依頼アプリ関連テーブル作成
-- Phase 2: 見積依頼機能
-- Codexレビュー指摘を反映
-- ============================================

-- ステータスマスタ（ヘッダー用）
CREATE TABLE quote_request_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  name_th VARCHAR(100),
  sort_order INTEGER NOT NULL,
  is_terminal BOOLEAN DEFAULT FALSE,  -- 終端ステータス（完了/キャンセル）
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ステータス初期データ
INSERT INTO quote_request_statuses (code, name, name_en, name_th, sort_order, is_terminal) VALUES
  ('requested', '依頼中', 'Requested', 'รอดำเนินการ', 1, FALSE),
  ('quoting', '見積取得中', 'Quoting', 'กำลังขอใบเสนอราคา', 2, FALSE),
  ('quoted', '見積完了', 'Quoted', 'เสนอราคาแล้ว', 3, FALSE),
  ('order_requested', '手配依頼', 'Order Requested', 'ขอสั่งซื้อ', 4, FALSE),
  ('po_issued', 'PO発行済', 'PO Issued', 'ออก PO แล้ว', 5, FALSE),
  ('completed', '完了', 'Completed', 'เสร็จสิ้น', 6, TRUE),
  ('cancelled', 'キャンセル', 'Cancelled', 'ยกเลิก', 7, TRUE);

-- 採番用シーケンス
CREATE SEQUENCE quote_request_seq START WITH 1;

-- 見積依頼ヘッダー
CREATE TABLE quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_no VARCHAR(50) NOT NULL UNIQUE,  -- QR-YYYY-NNNNNN

  -- 依頼者情報
  requester_id UUID NOT NULL REFERENCES auth.users(id),
  requester_name VARCHAR(200),  -- 依頼時の名前を保存

  -- 紐付け情報
  work_no VARCHAR(50),          -- 工事番号（Kintone）
  project_code VARCHAR(50),     -- プロジェクトコード（Kintone）

  -- ステータス
  status_id UUID NOT NULL REFERENCES quote_request_statuses(id),

  -- 依頼情報
  desired_delivery_date DATE,   -- 希望納期
  remarks TEXT,                 -- 備考

  -- 購買部担当
  purchaser_id UUID REFERENCES auth.users(id),
  purchaser_name VARCHAR(200),

  -- キャンセル情報
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  cancel_reason TEXT,

  -- メタ情報
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 見積依頼明細
CREATE TABLE quote_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,

  -- 部品表からの参照（あれば）
  part_list_item_id UUID REFERENCES part_list_items(id) ON DELETE SET NULL,

  -- 依頼情報（依頼者入力）
  model_number VARCHAR(200) NOT NULL,   -- 型式
  manufacturer VARCHAR(200) NOT NULL,   -- メーカー
  quantity DECIMAL(10,2) NOT NULL,      -- 数量
  unit VARCHAR(20) DEFAULT '個',        -- 単位
  item_remarks TEXT,                    -- 備考

  -- 明細ステータス
  status_id UUID REFERENCES quote_request_statuses(id),

  -- キャンセル情報
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  cancel_reason TEXT,

  -- メタ情報
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 見積オファー（1明細に複数仕入先から見積可能）
CREATE TABLE quote_request_item_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_item_id UUID NOT NULL REFERENCES quote_request_items(id) ON DELETE CASCADE,

  -- 仕入先情報（Kintone連携）
  supplier_code VARCHAR(50),      -- 仕入先コード
  supplier_name VARCHAR(200),     -- 仕入先名

  -- 見積情報
  quoted_price DECIMAL(12,2),     -- 見積価格
  quoted_unit_price DECIMAL(12,2),-- 単価
  quoted_delivery_date DATE,      -- 回答納期
  lead_time_days INTEGER,         -- リードタイム（日数）
  purchaser_remarks TEXT,         -- 購買備考

  -- 採用フラグ
  is_awarded BOOLEAN DEFAULT FALSE,
  awarded_at TIMESTAMPTZ,
  awarded_by UUID REFERENCES auth.users(id),

  -- メタ情報
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 発注情報（部分発注対応）
CREATE TABLE quote_request_item_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_item_id UUID NOT NULL REFERENCES quote_request_items(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES quote_request_item_offers(id),  -- 採用したオファー

  -- 発注情報
  po_number VARCHAR(50),          -- PO番号
  order_quantity DECIMAL(10,2) NOT NULL,  -- 発注数量
  order_amount DECIMAL(12,2),     -- 発注金額
  order_date DATE,                -- 発注日

  -- ステータス
  order_status VARCHAR(50) DEFAULT 'ordered',  -- ordered, delivered, completed

  -- メタ情報
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 添付ファイル
CREATE TABLE quote_request_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID REFERENCES quote_requests(id) ON DELETE CASCADE,
  quote_request_item_id UUID REFERENCES quote_request_items(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES quote_request_item_offers(id) ON DELETE CASCADE,

  file_type VARCHAR(50) NOT NULL,   -- photo, drawing, quotation, po
  file_path TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- ヘッダー/明細/オファーのいずれかに紐付け必須
  CONSTRAINT file_must_have_parent CHECK (
    (quote_request_id IS NOT NULL) OR
    (quote_request_item_id IS NOT NULL) OR
    (offer_id IS NOT NULL)
  )
);

-- ステータス変更履歴
CREATE TABLE quote_request_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID REFERENCES quote_requests(id) ON DELETE CASCADE,
  quote_request_item_id UUID REFERENCES quote_request_items(id) ON DELETE CASCADE,

  from_status_id UUID REFERENCES quote_request_statuses(id),
  to_status_id UUID NOT NULL REFERENCES quote_request_statuses(id),
  reason TEXT,

  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id)
);

-- 通知履歴
CREATE TABLE quote_request_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,  -- created, quoted, order_requested, po_issued
  recipient_id UUID NOT NULL REFERENCES auth.users(id),

  -- 通知チャネル
  app_notification_sent BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,

  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  error_message TEXT,

  -- 重複防止
  UNIQUE(quote_request_id, notification_type, recipient_id)
);

-- インデックス
CREATE INDEX idx_quote_requests_requester ON quote_requests(requester_id);
CREATE INDEX idx_quote_requests_status ON quote_requests(status_id);
CREATE INDEX idx_quote_requests_work_no ON quote_requests(work_no);
CREATE INDEX idx_quote_requests_project ON quote_requests(project_code);
CREATE INDEX idx_quote_request_items_request ON quote_request_items(quote_request_id);
CREATE INDEX idx_quote_request_item_offers_item ON quote_request_item_offers(quote_request_item_id);
CREATE INDEX idx_quote_request_item_orders_item ON quote_request_item_orders(quote_request_item_id);
CREATE INDEX idx_quote_request_files_request ON quote_request_files(quote_request_id);
CREATE INDEX idx_quote_request_status_logs_request ON quote_request_status_logs(quote_request_id);
CREATE INDEX idx_quote_request_notifications_recipient ON quote_request_notifications(recipient_id, read_at);

-- RLSを有効化
ALTER TABLE quote_request_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_request_item_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_request_item_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_request_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_request_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_request_notifications ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Authenticated users can view statuses" ON quote_request_statuses
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can view quote_requests" ON quote_requests
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can manage quote_requests" ON quote_requests
    FOR ALL TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can view quote_request_items" ON quote_request_items
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can manage quote_request_items" ON quote_request_items
    FOR ALL TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can view offers" ON quote_request_item_offers
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can manage offers" ON quote_request_item_offers
    FOR ALL TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can view orders" ON quote_request_item_orders
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can manage orders" ON quote_request_item_orders
    FOR ALL TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can view files" ON quote_request_files
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can manage files" ON quote_request_files
    FOR ALL TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can view logs" ON quote_request_status_logs
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can insert logs" ON quote_request_status_logs
    FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Users can view own notifications" ON quote_request_notifications
    FOR SELECT TO authenticated USING (recipient_id = auth.uid());

CREATE POLICY "System can manage notifications" ON quote_request_notifications
    FOR ALL TO authenticated USING (TRUE);

-- 採番関数
CREATE OR REPLACE FUNCTION generate_quote_request_no()
RETURNS TEXT AS $$
DECLARE
  year_str TEXT;
  seq_num INTEGER;
BEGIN
  year_str := TO_CHAR(NOW(), 'YYYY');
  seq_num := NEXTVAL('quote_request_seq');
  RETURN 'QR-' || year_str || '-' || LPAD(seq_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- 自動採番トリガー
CREATE OR REPLACE FUNCTION set_quote_request_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_no IS NULL OR NEW.request_no = '' THEN
    NEW.request_no := generate_quote_request_no();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_quote_request_no
  BEFORE INSERT ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_quote_request_no();

-- 更新日時自動更新トリガー
CREATE TRIGGER update_quote_requests_updated_at
    BEFORE UPDATE ON quote_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_request_items_updated_at
    BEFORE UPDATE ON quote_request_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_request_item_offers_updated_at
    BEFORE UPDATE ON quote_request_item_offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_request_item_orders_updated_at
    BEFORE UPDATE ON quote_request_item_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- コメント
COMMENT ON TABLE quote_request_statuses IS '見積依頼ステータスマスタ';
COMMENT ON TABLE quote_requests IS '見積依頼ヘッダー';
COMMENT ON TABLE quote_request_items IS '見積依頼明細';
COMMENT ON TABLE quote_request_item_offers IS '見積オファー（複数仕入先対応）';
COMMENT ON TABLE quote_request_item_orders IS '発注情報（部分発注対応）';
COMMENT ON TABLE quote_request_files IS '添付ファイル';
COMMENT ON TABLE quote_request_status_logs IS 'ステータス変更履歴';
COMMENT ON TABLE quote_request_notifications IS '通知履歴';
COMMENT ON FUNCTION generate_quote_request_no() IS '見積依頼番号自動採番（QR-YYYY-NNNNNN）';
