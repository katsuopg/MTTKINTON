import { createClient } from '@/lib/supabase/server';
import { checkRecordRuleCondition } from '@/lib/auth/app-permissions';

export type NotificationTrigger =
  | 'record_added'
  | 'record_edited'
  | 'record_deleted'
  | 'comment_added'
  | 'status_changed';

interface NotificationRule {
  id: string;
  name: string;
  trigger_type: string;
  condition: Record<string, unknown> | null;
  notify_type: string;
  notify_target_id: string | null;
  notify_target_field: string | null;
  title_template: string | null;
  message_template: string | null;
}

/**
 * 条件通知を評価・発火するエンジン
 * レコードCRUD/コメント/ステータス変更時に呼び出す
 */
export async function fireNotifications(params: {
  appId: string;
  appCode: string;
  appName: string;
  trigger: NotificationTrigger;
  record: Record<string, unknown>;
  actorUserId: string;
  extraContext?: Record<string, string>;
}): Promise<void> {
  const { appId, appCode, appName, trigger, record, actorUserId, extraContext } = params;

  try {
    const supabase = await createClient();

    // 通知ルール取得
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rules } = await supabase.from('app_notification_rules')
      .select('*')
      .eq('app_id', appId)
      .eq('trigger_type', trigger)
      .eq('is_active', true);

    if (!rules || rules.length === 0) return;

    for (const rule of rules as NotificationRule[]) {
      // 条件チェック
      if (rule.condition) {
        const conditionMatch = checkRecordRuleCondition(
          record,
          rule.condition as Parameters<typeof checkRecordRuleCondition>[1]
        );
        if (!conditionMatch) continue;
      }

      // 通知先ユーザーを特定
      const targetUserIds = await resolveNotifyTargets(supabase, rule, record, actorUserId);

      if (targetUserIds.length === 0) continue;

      // 自分自身への通知は除外
      const filteredTargets = targetUserIds.filter((uid) => uid !== actorUserId);
      if (filteredTargets.length === 0) continue;

      // 通知テンプレートを展開
      const title = expandTemplate(
        rule.title_template || getDefaultTitle(trigger, appName),
        record,
        extraContext
      );
      const message = expandTemplate(
        rule.message_template || getDefaultMessage(trigger),
        record,
        extraContext
      );

      // 通知レコード作成
      const notificationRows = filteredTargets.map((userId) => ({
        user_id: userId,
        type: 'system' as const,
        title,
        message,
        link: `/apps/${appCode}/records/${record.id}`,
        related_table: 'app_records',
        related_id: record.id as string,
        metadata: { trigger, app_id: appId, rule_id: rule.id },
      }));

      const { error } = await supabase.from('notifications').insert(notificationRows);
      if (error) {
        console.error('Failed to create notifications:', error);
      }
    }
  } catch (err) {
    // 通知失敗はメイン処理をブロックしない
    console.error('Notification engine error:', err);
  }
}

/**
 * 通知先ユーザーIDを解決
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveNotifyTargets(
  supabase: any,
  rule: NotificationRule,
  record: Record<string, unknown>,
  actorUserId: string
): Promise<string[]> {
  switch (rule.notify_type) {
    case 'creator':
      return record.created_by ? [record.created_by as string] : [];

    case 'user':
      return rule.notify_target_id ? [rule.notify_target_id] : [];

    case 'field_value': {
      if (!rule.notify_target_field) return [];
      const data = record.data as Record<string, unknown> | undefined;
      const fieldVal = data ? data[rule.notify_target_field] : record[rule.notify_target_field];
      return fieldVal && typeof fieldVal === 'string' ? [fieldVal] : [];
    }

    case 'role': {
      if (!rule.notify_target_id) return [];
      const { data: roleUsers } = await (supabase.from('user_roles') as any)
        .select('user_id')
        .eq('role_id', rule.notify_target_id);
      return (roleUsers || []).map((r: { user_id: string }) => r.user_id);
    }

    case 'organization': {
      if (!rule.notify_target_id) return [];
      // 組織のメンバーを取得
      const { data: orgMembers } = await (supabase.from('organization_members') as any)
        .select('employee_id')
        .eq('organization_id', rule.notify_target_id);

      if (!orgMembers || orgMembers.length === 0) return [];

      const empIds = orgMembers.map((m: { employee_id: string }) => m.employee_id);
      const { data: employees } = await (supabase.from('employees') as any)
        .select('user_id')
        .in('kintone_record_id', empIds)
        .not('user_id', 'is', null);

      return (employees || []).map((e: { user_id: string }) => e.user_id).filter(Boolean);
    }

    default:
      return [actorUserId]; // フォールバック
  }
}

/**
 * テンプレート内のプレースホルダーを展開
 */
function expandTemplate(
  template: string,
  record: Record<string, unknown>,
  extraContext?: Record<string, string>
): string {
  let result = template;
  // record直属フィールド
  result = result.replace(/\{\{record_number\}\}/g, String(record.record_number || ''));
  result = result.replace(/\{\{id\}\}/g, String(record.id || ''));
  result = result.replace(/\{\{status\}\}/g, String(record.status || ''));

  // data内フィールド
  const data = record.data as Record<string, unknown> | undefined;
  if (data) {
    result = result.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      if (key in data) return String(data[key] ?? '');
      return `{{${key}}}`;
    });
  }

  // 追加コンテキスト
  if (extraContext) {
    for (const [key, value] of Object.entries(extraContext)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
  }

  return result;
}

function getDefaultTitle(trigger: NotificationTrigger, appName: string): string {
  switch (trigger) {
    case 'record_added': return `${appName}: レコードが追加されました`;
    case 'record_edited': return `${appName}: レコードが更新されました`;
    case 'record_deleted': return `${appName}: レコードが削除されました`;
    case 'comment_added': return `${appName}: コメントが追加されました`;
    case 'status_changed': return `${appName}: ステータスが変更されました`;
    default: return `${appName}: 通知`;
  }
}

function getDefaultMessage(trigger: NotificationTrigger): string {
  switch (trigger) {
    case 'record_added': return 'レコード #{{record_number}} が追加されました';
    case 'record_edited': return 'レコード #{{record_number}} が更新されました';
    case 'record_deleted': return 'レコードが削除されました';
    case 'comment_added': return 'レコード #{{record_number}} にコメントが追加されました';
    case 'status_changed': return 'レコード #{{record_number}} のステータスが {{status}} に変更されました';
    default: return '';
  }
}
