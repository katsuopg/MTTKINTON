-- 通知システム
-- Date: 2025-01-08

-- ========================================
-- 通知テーブル
-- ========================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- 通知内容
    type VARCHAR(50) NOT NULL,              -- 'approval_request', 'approval_done', 'task_assigned', 'comment', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    link VARCHAR(500),                      -- クリック時の遷移先URL

    -- 関連データ
    related_table VARCHAR(100),             -- 'quotations', 'purchase_orders', 'orders', etc.
    related_id UUID,

    -- ステータス
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,

    -- 送信状態
    sent_platform BOOLEAN DEFAULT TRUE,     -- プラットフォーム内（常にtrue）
    sent_email BOOLEAN DEFAULT FALSE,
    sent_email_at TIMESTAMP WITH TIME ZONE,
    sent_line BOOLEAN DEFAULT FALSE,
    sent_line_at TIMESTAMP WITH TIME ZONE,

    -- メタデータ
    metadata JSONB DEFAULT '{}',            -- 追加データ（承認者名、金額など）

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ========================================
-- 通知設定テーブル
-- ========================================
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

    -- チャネル有効/無効
    enable_platform BOOLEAN DEFAULT TRUE,   -- プラットフォーム内通知
    enable_email BOOLEAN DEFAULT TRUE,      -- メール通知
    enable_line BOOLEAN DEFAULT FALSE,      -- LINE通知

    -- LINE連携情報
    line_user_id VARCHAR(100),              -- LINE User ID
    line_display_name VARCHAR(100),         -- LINE表示名
    line_linked_at TIMESTAMP WITH TIME ZONE,

    -- 通知種別ごとの設定（JSONB）
    type_settings JSONB DEFAULT '{
        "approval_request": {"platform": true, "email": true, "line": true},
        "approval_done": {"platform": true, "email": true, "line": true},
        "task_assigned": {"platform": true, "email": false, "line": false},
        "comment": {"platform": true, "email": false, "line": false},
        "system": {"platform": true, "email": false, "line": false}
    }',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- RLSポリシー
-- ========================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- 通知: 自分の通知のみ閲覧・更新可能
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- 通知作成: 認証済みユーザーのみ（システムから作成）
CREATE POLICY "Authenticated users can create notifications" ON notifications
    FOR INSERT TO authenticated
    WITH CHECK (TRUE);

-- 通知設定: 自分の設定のみ閲覧・更新可能
CREATE POLICY "Users can view own notification_settings" ON notification_settings
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification_settings" ON notification_settings
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification_settings" ON notification_settings
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 更新トリガー
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER notification_settings_updated_at
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ========================================
-- 便利な関数
-- ========================================

-- 未読通知数を取得
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM notifications
        WHERE user_id = p_user_id AND is_read = FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 通知を既読にする
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE id = p_notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 全通知を既読にする
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS VOID AS $$
BEGIN
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE user_id = auth.uid() AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
