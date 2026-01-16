---
name: architecture
description: "MTTkintonシステム設計・アーキテクチャ"
---

# /architecture - システム設計

## 認証設計

### ログイン方式
```
┌─────────────────────────────────────────────┐
│              ログイン画面                    │
├─────────────────────────────────────────────┤
│  ID: [従業員番号 or 社内メール]              │
│  PW: [パスワード]                           │
└─────────────────────────────────────────────┘
```

| 方式 | 対象 | 形式 |
|------|------|------|
| **従業員番号**（基本） | 全従業員 | `EMP001` → `EMP001@mtt.internal` |
| **社内メール**（任意） | メール保持者 | `tanaka@megatech.co.th` |

### 認証フロー
```
1. ユーザー入力（従業員番号 or メール）
   ↓
2. 形式判定
   - @含む → メールとして認証
   - @なし → 従業員番号@mtt.internal で認証
   ↓
3. Supabase Auth認証
   ↓
4. employeesテーブルと紐付け
   - user_id (FK)
   - company_email (社内メール一致)
   - employee_number (従業員番号一致)
```

### Supabase Auth設定
```sql
-- 従業員とユーザーの紐付け
ALTER TABLE employees ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE employees ADD COLUMN company_email VARCHAR(255);

-- インデックス
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_company_email ON employees(company_email);
```

---

## 通知設計

### 通知チャネル（3種類）
```
┌──────────────────────────────────────────────────────────┐
│                    通知システム                          │
├──────────────┬──────────────┬────────────────────────────┤
│ プラットフォーム │  社内メール   │      LINE BOT            │
│    内通知      │              │                          │
├──────────────┼──────────────┼────────────────────────────┤
│ ベルアイコン   │ SMTP送信     │ 公式アカウント→個人LINE   │
│ リアルタイム   │ 非同期       │ 非同期                    │
│ 全員         │ メール保持者  │ LINE連携済み従業員        │
└──────────────┴──────────────┴────────────────────────────┘
```

### 通知タイプ
| イベント | プラットフォーム | メール | LINE |
|----------|:---------------:|:------:|:----:|
| 見積承認依頼 | ✅ | ✅ | ✅ |
| 見積承認完了 | ✅ | ✅ | ✅ |
| 発注承認依頼 | ✅ | ✅ | ✅ |
| タスク割当 | ✅ | ○ | ○ |
| コメント追加 | ✅ | ○ | - |
| システム通知 | ✅ | - | - |

✅=必須 ○=設定可 -=対象外

### データベース設計

#### notificationsテーブル
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  -- 通知内容
  type VARCHAR(50) NOT NULL,        -- 'approval_request', 'approval_done', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link VARCHAR(500),                -- クリック時の遷移先

  -- 関連データ
  related_table VARCHAR(100),       -- 'quotations', 'purchase_orders', etc.
  related_id UUID,

  -- ステータス
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- 送信状態
  sent_email BOOLEAN DEFAULT FALSE,
  sent_email_at TIMESTAMPTZ,
  sent_line BOOLEAN DEFAULT FALSE,
  sent_line_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
```

#### notification_settingsテーブル
```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,

  -- チャネル有効/無効
  enable_platform BOOLEAN DEFAULT TRUE,
  enable_email BOOLEAN DEFAULT TRUE,
  enable_line BOOLEAN DEFAULT FALSE,

  -- LINE連携
  line_user_id VARCHAR(100),        -- LINE User ID
  line_linked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### LINE BOT連携

#### 連携フロー
```
1. 設定画面で「LINE連携」ボタン
   ↓
2. 公式LINE BOTのQRコード表示
   ↓
3. ユーザーが友だち追加
   ↓
4. BOTがユーザーに認証コード送信依頼
   ↓
5. ユーザーがアプリ画面で認証コード入力
   ↓
6. line_user_idを保存 → 連携完了
```

#### LINE Messaging API
```typescript
// 通知送信
async function sendLineNotification(lineUserId: string, message: string) {
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text: message }]
    })
  });
}
```

#### 環境変数
```bash
# LINE BOT
LINE_CHANNEL_ID=xxx
LINE_CHANNEL_SECRET=xxx
LINE_CHANNEL_ACCESS_TOKEN=xxx

# メール送信（SMTP）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@megatech.co.th
SMTP_PASS=xxx
```

---

## 画面構成

### プラットフォーム内通知UI
```
┌──────────────────────────────────────┐
│ ヘッダー                    🔔(3)    │ ← 未読バッジ
├──────────────────────────────────────┤
│ 通知ドロップダウン                    │
│ ┌────────────────────────────────┐  │
│ │ ● 見積#Q001の承認依頼     2分前 │  │
│ │ ○ 発注#PO023が承認されました    │  │
│ │ ○ タスクが割り当てられました     │  │
│ └────────────────────────────────┘  │
│              すべて見る →            │
└──────────────────────────────────────┘
```

### 通知設定画面（Settings内）
```
┌──────────────────────────────────────┐
│ 通知設定                             │
├──────────────────────────────────────┤
│ プラットフォーム通知  [✓]            │
│ メール通知          [✓]             │
│ LINE通知           [ ] → 連携する   │
│                                      │
│ [LINE連携済み: @tanaka]              │
└──────────────────────────────────────┘
```
