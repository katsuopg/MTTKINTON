import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendNotificationEmail } from '@/lib/mail/send-mail';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any;

/**
 * 定期レポート実行（Cron Job用）
 * GET /api/cron/reports
 *
 * Vercel Cron: 毎時実行
 * vercel.json: { "crons": [{ "path": "/api/cron/reports", "schedule": "0 * * * *" }] }
 */
export async function GET(request: NextRequest) {
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
    const currentHour = now.getUTCHours();
    const currentDay = now.getUTCDay(); // 0=日~6=土
    const currentDate = now.getUTCDate(); // 1~31

    // 今の時間に実行すべきレポートを取得
    const { data: reports } = await (supabase.from('scheduled_reports' as SA) as SA)
      .select('*, app:apps(id, code, name)')
      .eq('is_active', true)
      .eq('schedule_hour', currentHour);

    if (!reports || reports.length === 0) {
      return NextResponse.json({ message: 'No reports to run', hour: currentHour });
    }

    let executedCount = 0;

    for (const report of reports as SA[]) {
      // スケジュールチェック
      if (report.schedule_type === 'weekly' && report.schedule_day !== currentDay) continue;
      if (report.schedule_type === 'monthly' && report.schedule_day !== currentDate) continue;
      // daily は毎日実行

      try {
        // レポートデータ取得
        const config = report.config || {};
        const filterConditions = config.filters || [];

        const { data: records } = await (supabase.rpc as SA)('filter_app_records', {
          p_app_id: report.app.id,
          p_search: '',
          p_filter_conditions: JSON.stringify(filterConditions),
          p_filter_match_type: 'and',
          p_sort_field: 'record_number',
          p_sort_order: 'desc',
          p_page: 1,
          p_page_size: 500,
        });

        const rows = (records || []) as SA[];
        const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;

        // 集計結果生成
        let summary: Record<string, unknown> = { total_records: totalCount };

        if (report.report_type === 'summary' && config.group_by) {
          const groups: Record<string, number> = {};
          for (const row of rows) {
            const key = String(row.data?.[config.group_by] ?? '(empty)');
            groups[key] = (groups[key] || 0) + 1;
          }
          summary = { ...summary, groups };
        }

        const result = {
          total_records: totalCount,
          summary,
          generated_at: now.toISOString(),
        };

        // 実行履歴保存
        await (supabase.from('report_executions' as SA) as SA).insert({
          report_id: report.id,
          result,
          notified_users: 0,
        });

        // レポートのlast_run更新
        await (supabase.from('scheduled_reports' as SA) as SA)
          .update({ last_run_at: now.toISOString(), last_result: result })
          .eq('id', report.id);

        // 通知送信
        const targetUserIds = await resolveReportTargets(supabase, report);
        if (targetUserIds.length > 0) {
          const title = `定期レポート: ${report.name}`;
          const message = `${report.app.name} のレポートが生成されました。レコード数: ${totalCount}`;

          const notifications = targetUserIds.map((userId: string) => ({
            user_id: userId,
            type: 'report',
            title,
            message,
            link: `/apps/${report.app.code}`,
            metadata: { report_id: report.id },
          }));

          await supabase.from('notifications').insert(notifications);

          // メール通知
          if (process.env.MAIL_PROVIDER) {
            for (const userId of targetUserIds) {
              const { data: emp } = await (supabase.from('employees') as SA)
                .select('company_email')
                .eq('employee_uuid', userId)
                .single();
              if (emp?.company_email) {
                sendNotificationEmail({
                  recipientEmail: emp.company_email,
                  title,
                  message,
                  link: `/apps/${report.app.code}`,
                }).catch(() => {});
              }
            }
          }
        }

        executedCount++;
      } catch (err) {
        console.error(`Report ${report.id} execution error:`, err);
        await (supabase.from('report_executions' as SA) as SA).insert({
          report_id: report.id,
          error: String(err),
        });
      }
    }

    return NextResponse.json({
      success: true,
      hour: currentHour,
      reports_checked: reports.length,
      reports_executed: executedCount,
    });
  } catch (error) {
    console.error('Report cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function resolveReportTargets(supabase: SA, report: SA): Promise<string[]> {
  switch (report.notify_type) {
    case 'creator':
      return [report.created_by];
    case 'user':
      return report.notify_target_id ? [report.notify_target_id] : [];
    case 'role': {
      if (!report.notify_target_id) return [];
      const { data } = await (supabase.from('user_roles') as SA)
        .select('user_id')
        .eq('role_id', report.notify_target_id);
      return (data || []).map((r: SA) => r.user_id);
    }
    case 'organization': {
      if (!report.notify_target_id) return [];
      const { data: members } = await (supabase.from('organization_members') as SA)
        .select('employee_id')
        .eq('organization_id', report.notify_target_id);
      if (!members || members.length === 0) return [];
      const empIds = members.map((m: SA) => m.employee_id);
      const { data: emps } = await (supabase.from('employees') as SA)
        .select('user_id')
        .in('id', empIds)
        .not('user_id', 'is', null);
      return (emps || []).map((e: SA) => e.user_id).filter(Boolean);
    }
    default:
      return [];
  }
}
