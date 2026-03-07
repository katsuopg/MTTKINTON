import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * リマインダー通知チェック（Cron Job用）
 * GET /api/cron/reminders
 *
 * Vercel Cronまたは外部cronで毎日実行:
 * vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 0 * * *" }] }
 *
 * 環境変数 CRON_SECRET で認証
 */
export async function GET(request: NextRequest) {
  // Cron認証
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const now = new Date();
    const today = now.toISOString().slice(0, 10); // YYYY-MM-DD

    // リマインダールール取得: app_notification_rules で trigger_type = 'reminder'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rules } = await (supabase.from('app_notification_rules') as any)
      .select('*, app:apps(id, code, name)')
      .eq('trigger_type', 'reminder')
      .eq('is_active', true);

    if (!rules || rules.length === 0) {
      return NextResponse.json({ message: 'No reminder rules', checked: 0 });
    }

    let notificationCount = 0;

    for (const rule of rules as any[]) {
      const app = rule.app;
      if (!app) continue;

      // リマインダー設定: condition に date_field, days_before, time を含む
      const config = rule.condition as {
        date_field?: string;
        days_before?: number;
        time?: string;
      } | null;

      if (!config?.date_field) continue;

      const daysBefore = config.days_before ?? 0;

      // 対象日を計算: 今日 + days_before = 対象日のフィールド値
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysBefore);
      const targetDateStr = targetDate.toISOString().slice(0, 10);

      // 対象レコードを検索: date_fieldの値がtargetDateと一致
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: records } = await (supabase.rpc as any)('filter_app_records', {
        p_app_id: app.id,
        p_search: '',
        p_filter_conditions: JSON.stringify([
          { field_code: config.date_field, operator: 'eq', value: targetDateStr },
        ]),
        p_filter_match_type: 'and',
        p_sort_field: 'record_number',
        p_sort_order: 'asc',
        p_page: 1,
        p_page_size: 500,
      });

      if (!records || records.length === 0) continue;

      // 通知先を解決
      const targetUserIds = await resolveReminderTargets(supabase, rule);
      if (targetUserIds.length === 0) continue;

      // 通知作成
      const notifications = [];
      for (const record of records as any[]) {
        const title = rule.title_template
          ? expandSimpleTemplate(rule.title_template, record, app.name)
          : `${app.name}: リマインダー`;
        const message = rule.message_template
          ? expandSimpleTemplate(rule.message_template, record, app.name)
          : `レコード #${record.record_number} の${config.date_field}が${daysBefore === 0 ? '今日' : `${daysBefore}日後`}です`;

        for (const userId of targetUserIds) {
          notifications.push({
            user_id: userId,
            type: 'reminder',
            title,
            message,
            link: `/apps/${app.code}/records/${record.id}`,
            related_table: 'app_records',
            related_id: record.id,
            metadata: { trigger: 'reminder', app_id: app.id, rule_id: rule.id, date: today },
          });
        }
      }

      if (notifications.length > 0) {
        // 重複チェック: 同じrule_id + record_id + dateで既に通知済みなら除外
        const existingKeys = new Set<string>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (supabase.from('notifications') as any)
          .select('related_id, metadata')
          .eq('type', 'reminder')
          .gte('created_at', `${today}T00:00:00Z`);

        if (existing) {
          for (const n of existing as any[]) {
            if (n.metadata?.rule_id === rule.id) {
              existingKeys.add(`${n.related_id}`);
            }
          }
        }

        const newNotifications = notifications.filter(
          n => !existingKeys.has(n.related_id)
        );

        if (newNotifications.length > 0) {
          await supabase.from('notifications').insert(newNotifications);
          notificationCount += newNotifications.length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      date: today,
      rules_checked: rules.length,
      notifications_created: notificationCount,
    });
  } catch (error) {
    console.error('Reminder cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveReminderTargets(supabase: any, rule: any): Promise<string[]> {
  switch (rule.notify_type) {
    case 'user':
      return rule.notify_target_id ? [rule.notify_target_id] : [];
    case 'role': {
      if (!rule.notify_target_id) return [];
      const { data } = await (supabase.from('user_roles') as any)
        .select('user_id')
        .eq('role_id', rule.notify_target_id);
      return (data || []).map((r: { user_id: string }) => r.user_id);
    }
    case 'organization': {
      if (!rule.notify_target_id) return [];
      const { data: members } = await (supabase.from('organization_members') as any)
        .select('employee_id')
        .eq('organization_id', rule.notify_target_id);
      if (!members || members.length === 0) return [];
      const empIds = members.map((m: { employee_id: string }) => m.employee_id);
      const { data: emps } = await (supabase.from('employees') as any)
        .select('user_id')
        .in('id', empIds)
        .not('user_id', 'is', null);
      return (emps || []).map((e: { user_id: string }) => e.user_id).filter(Boolean);
    }
    default:
      return [];
  }
}

function expandSimpleTemplate(template: string, record: any, appName: string): string {
  let result = template;
  result = result.replace(/\{\{app_name\}\}/g, appName);
  result = result.replace(/\{\{record_number\}\}/g, String(record.record_number || ''));
  if (record.data && typeof record.data === 'object') {
    result = result.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      if (key in record.data) return String(record.data[key] ?? '');
      return `{{${key}}}`;
    });
  }
  return result;
}
