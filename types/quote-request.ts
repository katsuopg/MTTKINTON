// ============================================
// 見積依頼アプリ関連の型定義
// ============================================

/**
 * 見積依頼ステータス
 */
export interface QuoteRequestStatus {
  id: string;
  code: 'requested' | 'quoting' | 'quoted' | 'order_requested' | 'po_issued' | 'completed' | 'cancelled';
  name: string;
  name_en: string | null;
  name_th: string | null;
  sort_order: number;
  is_terminal: boolean;
  created_at: string;
}

export type QuoteRequestStatusCode = QuoteRequestStatus['code'];

/**
 * ステータスコードと表示色のマッピング
 */
export const QUOTE_REQUEST_STATUS_COLORS: Record<QuoteRequestStatusCode, string> = {
  requested: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  quoting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  quoted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  order_requested: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  po_issued: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

/**
 * 見積依頼ヘッダー
 */
export interface QuoteRequest {
  id: string;
  request_no: string;

  // 依頼者情報
  requester_id: string;
  requester_name: string | null;

  // 紐付け情報
  work_no: string | null;
  project_code: string | null;

  // ステータス
  status_id: string;

  // 依頼情報
  desired_delivery_date: string | null;
  remarks: string | null;

  // 購買部担当
  purchaser_id: string | null;
  purchaser_name: string | null;

  // キャンセル情報
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;

  // メタ情報
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * 見積依頼（リレーション付き）
 */
export interface QuoteRequestWithRelations extends QuoteRequest {
  status?: QuoteRequestStatus;
  items?: QuoteRequestItem[];
  items_count?: number;
}

/**
 * 見積依頼明細
 */
export interface QuoteRequestItem {
  id: string;
  quote_request_id: string;
  part_list_item_id: string | null;

  // 依頼情報
  model_number: string;
  manufacturer: string;
  quantity: number;
  unit: string;
  item_remarks: string | null;

  // ステータス
  status_id: string | null;

  // キャンセル情報
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;

  // メタ情報
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * 見積依頼明細（リレーション付き）
 */
export interface QuoteRequestItemWithRelations extends QuoteRequestItem {
  status?: QuoteRequestStatus | null;
  offers?: QuoteRequestItemOffer[];
  orders?: QuoteRequestItemOrder[];
  awarded_offer?: QuoteRequestItemOffer | null;
}

/**
 * 見積オファー
 */
export interface QuoteRequestItemOffer {
  id: string;
  quote_request_item_id: string;

  // 仕入先情報
  supplier_code: string | null;
  supplier_name: string | null;

  // 見積情報
  quoted_price: number | null;
  quoted_unit_price: number | null;
  quoted_delivery_date: string | null;
  lead_time_days: number | null;
  purchaser_remarks: string | null;

  // 採用フラグ
  is_awarded: boolean;
  awarded_at: string | null;
  awarded_by: string | null;

  // メタ情報
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/**
 * 発注情報
 */
export interface QuoteRequestItemOrder {
  id: string;
  quote_request_item_id: string;
  offer_id: string | null;

  // 発注情報
  po_number: string | null;
  order_quantity: number;
  order_amount: number | null;
  order_date: string | null;

  // ステータス
  order_status: 'ordered' | 'delivered' | 'completed';

  // メタ情報
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/**
 * 添付ファイル
 */
export interface QuoteRequestFile {
  id: string;
  quote_request_id: string | null;
  quote_request_item_id: string | null;
  offer_id: string | null;

  file_type: 'photo' | 'drawing' | 'quotation' | 'po';
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;

  created_at: string;
  created_by: string | null;
}

/**
 * ステータス変更履歴
 */
export interface QuoteRequestStatusLog {
  id: string;
  quote_request_id: string | null;
  quote_request_item_id: string | null;

  from_status_id: string | null;
  to_status_id: string;
  reason: string | null;

  changed_at: string;
  changed_by: string | null;
}

/**
 * 通知履歴
 */
export interface QuoteRequestNotification {
  id: string;
  quote_request_id: string;
  notification_type: 'created' | 'quoted' | 'order_requested' | 'po_issued';
  recipient_id: string;

  app_notification_sent: boolean;
  email_sent: boolean;

  sent_at: string;
  read_at: string | null;
  error_message: string | null;
}

// ============================================
// 作成・更新用の型
// ============================================

/**
 * 見積依頼作成用
 */
export interface QuoteRequestCreate {
  work_no?: string | null;
  project_code?: string | null;
  desired_delivery_date?: string | null;
  remarks?: string | null;
  items: QuoteRequestItemCreate[];
}

/**
 * 見積依頼明細作成用
 */
export interface QuoteRequestItemCreate {
  part_list_item_id?: string | null;
  model_number: string;
  manufacturer: string;
  quantity: number;
  unit?: string;
  item_remarks?: string | null;
}

/**
 * 見積オファー作成用
 */
export interface QuoteRequestItemOfferCreate {
  quote_request_item_id: string;
  supplier_code?: string | null;
  supplier_name?: string | null;
  quoted_price?: number | null;
  quoted_unit_price?: number | null;
  quoted_delivery_date?: string | null;
  lead_time_days?: number | null;
  purchaser_remarks?: string | null;
}

/**
 * 発注情報作成用
 */
export interface QuoteRequestItemOrderCreate {
  quote_request_item_id: string;
  offer_id?: string | null;
  po_number?: string | null;
  order_quantity: number;
  order_amount?: number | null;
  order_date?: string | null;
}

// ============================================
// 一覧表示用
// ============================================

/**
 * 一覧表示用の見積依頼
 */
export interface QuoteRequestListItem {
  id: string;
  request_no: string;
  requester_name: string | null;
  work_no: string | null;
  project_code: string | null;
  status: QuoteRequestStatus;
  desired_delivery_date: string | null;
  items_count: number;
  total_amount: number | null;  // 採用オファーの合計
  created_at: string;
}

// ============================================
// フィルター・検索用
// ============================================

/**
 * 見積依頼検索パラメータ
 */
export interface QuoteRequestSearchParams {
  status_code?: QuoteRequestStatusCode;
  requester_id?: string;
  purchaser_id?: string;
  work_no?: string;
  project_code?: string;
  from_date?: string;
  to_date?: string;
  search?: string;  // 依頼番号、依頼者名で検索
}
