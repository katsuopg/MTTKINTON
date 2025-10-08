import { WorkNoFormData, ProjectFormData, WorkNoRecord, ProjectRecord } from '@/types/kintone';

// フォームデータをkintone APIフォーマットに変換
export function formatWorkNoForKintone(data: WorkNoFormData): Partial<WorkNoRecord> {
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

export function formatProjectForKintone(data: ProjectFormData): Partial<ProjectRecord> {
  const record: Partial<ProjectRecord> = {
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
export function parseWorkNoRecord(record: WorkNoRecord): WorkNoFormData {
  return {
    work_no: record.work_no.value,
    status: record.status.value,
    start_date: record.start_date.value,
    finish_date: record.finish_date.value,
    cs_id: record.cs_id.value,
    customer_name: record.customer_name.value,
    category: record.category.value,
    description: record.description.value,
    sales_staff: record.sales_staff.value,
    purchase_cost: Number(record.purchase_cost.value) || 0,
    labor_cost: Number(record.labor_cost.value) || 0,
    gross_profit: Number(record.gross_profit.value) || 0,
  };
}

export function parseProjectRecord(record: ProjectRecord): ProjectFormData {
  return {
    pj_code: record.pj_code.value,
    pj_name: record.pj_name.value,
    status: record.status.value,
    cs_id: record.cs_id.value,
    customer: record.customer.value,
    start_date: record.start_date.value,
    due_date: record.due_date.value,
    work_no: record.work_no?.value,
  };
}

// ステータスの色分け用ヘルパー
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Work No.のステータス（英語）
    'Working': 'bg-blue-100 text-blue-800',
    'WIP': 'bg-blue-100 text-blue-800',
    'Waiting PO': 'bg-blue-100 text-blue-800',
    'Finished': 'bg-green-100 text-green-800',
    'Stock': 'bg-purple-100 text-purple-800',
    'Cancelled': 'bg-gray-100 text-gray-800',
    
    // Project managementのステータス（英語）
    'On progress': 'bg-blue-100 text-blue-800',
    'Complete': 'bg-green-100 text-green-800',
    'Pending': 'bg-gray-50 text-gray-700 border border-gray-300',
    'Hold': 'bg-yellow-100 text-yellow-800',
    
    // 日本語のステータス
    '作業中': 'bg-blue-100 text-blue-800',
    '進行中': 'bg-blue-100 text-blue-800',
    '完了': 'bg-green-100 text-green-800',
    '受注': 'bg-green-100 text-green-800',
    '失注': 'bg-red-100 text-red-800',
    '見積中': 'bg-blue-100 text-blue-800',
    '保留': 'bg-gray-50 text-gray-700 border border-gray-300',
    'キャンセル': 'bg-gray-100 text-gray-800',
    
    // 見積もりのステータス（重複削除）
    '提出済': 'bg-blue-100 text-blue-800',
  };

  return statusColors[status] || 'bg-gray-100 text-gray-800';
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