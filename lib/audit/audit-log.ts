import { createClient } from '@/lib/supabase/server';

export type AuditAction =
  | 'login' | 'logout'
  | 'record_create' | 'record_update' | 'record_delete'
  | 'app_create' | 'app_update' | 'app_delete'
  | 'permission_change' | 'process_action'
  | 'user_create' | 'user_update'
  | 'settings_change' | 'import' | 'export';

interface AuditLogParams {
  userId?: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  appCode?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * 監査ログを記録（非同期、失敗してもメイン処理をブロックしない）
 */
export async function writeAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('audit_logs' as any) as any).insert({
      user_id: params.userId || null,
      action: params.action,
      resource_type: params.resourceType || null,
      resource_id: params.resourceId || null,
      app_code: params.appCode || null,
      details: params.details || {},
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

/**
 * リクエストヘッダーからIP/UAを取得するヘルパー
 */
export function getRequestContext(request: Request): { ipAddress: string; userAgent: string } {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || '';
  const userAgent = request.headers.get('user-agent') || '';
  return { ipAddress, userAgent };
}
