import { createClient } from '@/lib/supabase/server';

interface WebhookPayload {
  appId: string;
  appCode: string;
  trigger: 'record_added' | 'record_edited' | 'record_deleted' | 'comment_added' | 'status_changed';
  record?: Record<string, unknown>;
  recordId?: string;
  actorUserId?: string;
  extra?: Record<string, unknown>;
}

/**
 * Webhookを発火する
 * 対象アプリのアクティブなWebhook設定を取得し、マッチするトリガーのWebhookにHTTP POSTを送信
 * fire-and-forget方式で呼び出す
 */
export async function fireWebhooks(payload: WebhookPayload): Promise<void> {
  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: webhooks } = await (supabase as any).from('app_webhooks')
      .select('id, url, headers, trigger_type')
      .eq('app_id', payload.appId)
      .eq('trigger_type', payload.trigger)
      .eq('is_active', true);

    if (!webhooks || webhooks.length === 0) return;

    const webhookPayload = {
      event: payload.trigger,
      app: {
        id: payload.appId,
        code: payload.appCode,
      },
      record: payload.record || null,
      recordId: payload.recordId || null,
      actor: payload.actorUserId || null,
      extra: payload.extra || null,
      timestamp: new Date().toISOString(),
    };

    for (const webhook of webhooks) {
      executeWebhook(supabase, webhook, webhookPayload).catch(err => {
        console.error(`Webhook ${webhook.id} failed:`, err);
      });
    }
  } catch (error) {
    console.error('Error in fireWebhooks:', error);
  }
}

async function executeWebhook(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  webhook: { id: string; url: string; headers: Record<string, string>; trigger_type: string },
  payload: Record<string, unknown>
): Promise<void> {
  let responseStatus: number | null = null;
  let responseBody: string | null = null;
  let errorMessage: string | null = null;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...webhook.headers,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    responseStatus = response.status;

    try {
      responseBody = await response.text();
      if (responseBody.length > 1000) {
        responseBody = responseBody.substring(0, 1000) + '... (truncated)';
      }
    } catch {
      responseBody = null;
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  // ログ記録
  try {
    await supabase.from('webhook_logs').insert({
      webhook_id: webhook.id,
      trigger_type: webhook.trigger_type,
      payload,
      response_status: responseStatus,
      response_body: responseBody,
      error_message: errorMessage,
    });
  } catch (logErr) {
    console.error('Failed to log webhook execution:', logErr);
  }
}
