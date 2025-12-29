import { WorkNoFormData, ProjectFormData, WorkNoRecord, ProjectRecord } from '@/types/kintone';

// フォームデータをkintone APIフォーマットに変換
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatWorkNoForKintone(data: WorkNoFormData): any {
  return {
    work_no: { type: "SINGLE_LINE_TEXT", value: data.work_no },
    status: { type: "DROP_DOWN", value: data.status },
    start_date: { type: "DATE", value: data.start_date },
    finish_date: { type: "DATE", value: data.finish_date },
    cs_id: { type: "SINGLE_LINE_TEXT", value: data.cs_id },
    customer_name: { type: "SINGLE_LINE_TEXT", value: data.customer_name },
    category: { type: "DROP_DOWN", value: data.category },
    description: { type: "MULTI_LINE_TEXT", value: data.description },
    sales_staff: { type: "DROP_DOWN", value: data.sales_staff },
    purchase_cost: { type: "NUMBER", value: data.purchase_cost.toString() },
    labor_cost: { type: "NUMBER", value: data.labor_cost.toString() },
    gross_profit: { type: "NUMBER", value: data.gross_profit.toString() },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatProjectForKintone(data: ProjectFormData): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record: any = {
    pj_code: { type: "SINGLE_LINE_TEXT", value: data.pj_code },
    pj_name: { type: "SINGLE_LINE_TEXT", value: data.pj_name },
    status: { type: "DROP_DOWN", value: data.status },
    cs_id: { type: "SINGLE_LINE_TEXT", value: data.cs_id },
    customer: { type: "SINGLE_LINE_TEXT", value: data.customer },
    start_date: { type: "DATE", value: data.start_date },
    due_date: { type: "DATE", value: data.due_date },
  };

  if (data.work_no) {
    record.work_no = { type: "SINGLE_LINE_TEXT", value: data.work_no };
  }

  return record;
}

// kintone APIレスポンスをフォームデータ形式に変換
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseWorkNoRecord(record: any): WorkNoFormData {
  return {
    work_no: record.work_no?.value || '',
    status: record.status?.value || '',
    start_date: record.start_date?.value || '',
    finish_date: record.finish_date?.value || '',
    cs_id: record.cs_id?.value || '',
    customer_name: record.customer_name?.value || '',
    category: record.category?.value || '',
    description: record.description?.value || '',
    sales_staff: record.sales_staff?.value || '',
    purchase_cost: Number(record.purchase_cost?.value) || 0,
    labor_cost: Number(record.labor_cost?.value) || 0,
    gross_profit: Number(record.gross_profit?.value) || 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseProjectRecord(record: any): ProjectFormData {
  return {
    pj_code: record.pj_code?.value || '',
    pj_name: record.pj_name?.value || '',
    status: record.status?.value || '',
    cs_id: record.cs_id?.value || '',
    customer: record.customer?.value || '',
    start_date: record.start_date?.value || '',
    due_date: record.due_date?.value || '',
    work_no: record.work_no?.value,
  };
}

// ステータスの色分け用ヘルパー（TailAdmin color system）
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Work No.のステータス（英語）
    'Working': 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
    'WIP': 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
    'Waiting PO': 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500',
    'Finished': 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500',
    'Stock': 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
    'Cancelled': 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400',

    // Project managementのステータス（英語）
    'On progress': 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
    'Complete': 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500',
    'Pending': 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400',
    'Hold': 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500',

    // 日本語のステータス
    '作業中': 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
    '進行中': 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
    '完了': 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500',
    '受注': 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500',
    '失注': 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500',
    '見積中': 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500',
    '保留': 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400',
    'キャンセル': 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400',

    // 見積もりのステータス（重複削除）
    '提出済': 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
  };

  return statusColors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400';
}

// 日付フォーマット用ヘルパー
export function formatDate(dateString: string, locale: 'ja' | 'th' = 'ja'): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return date.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'th-TH', options);
}

// 数値フォーマット用ヘルパー
export function formatCurrency(amount: number, locale: 'ja' | 'th' = 'ja'): string {
  const currency = locale === 'ja' ? 'JPY' : 'THB';
  
  return new Intl.NumberFormat(locale === 'ja' ? 'ja-JP' : 'th-TH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}