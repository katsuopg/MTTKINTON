// ============================================
// プロジェクト管理関連の型定義
// ============================================

/**
 * プロジェクトステータス
 */
export interface ProjectStatus {
  id: string;
  code: 'estimating' | 'ordered' | 'in_progress' | 'completed' | 'on_hold' | 'lost' | 'cancelled';
  name: string;
  name_en: string | null;
  name_th: string | null;
  sort_order: number;
  is_terminal: boolean;
  created_at: string;
}

export type ProjectStatusCode = ProjectStatus['code'];

/**
 * ステータスコードと表示色のマッピング
 */
export const PROJECT_STATUS_COLORS: Record<ProjectStatusCode, string> = {
  estimating: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ordered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  on_hold: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

/**
 * プロジェクト
 */
export interface Project {
  id: string;
  project_code: string;

  // 基本情報
  project_name: string;
  description: string | null;

  // ステータス
  status_id: string;

  // 顧客情報
  customer_code: string | null;
  customer_name: string | null;

  // 工事番号
  work_no: string | null;

  // 担当営業
  sales_person_id: string | null;

  // 日程
  start_date: string | null;
  due_date: string | null;

  // メタ情報
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * 従業員（担当営業セレクト用）
 */
export interface EmployeeSummary {
  id: string;
  name: string;
  nickname: string | null;
}

/**
 * リレーション付きプロジェクト
 */
export interface ProjectWithRelations extends Project {
  status?: ProjectStatus;
  sales_person?: EmployeeSummary | null;
}

/**
 * プロジェクト作成用
 */
export interface ProjectCreate {
  project_code?: string | null;  // 空欄なら自動採番 (P + 西暦下2桁 + 3桁連番)
  project_name: string;
  description?: string | null;
  status_code?: ProjectStatusCode;
  customer_code?: string | null;
  customer_name?: string | null;
  work_no?: string | null;
  sales_person_id?: string | null;
  start_date?: string | null;
  due_date?: string | null;
}

/**
 * プロジェクト検索パラメータ
 */
export interface ProjectSearchParams {
  status_code?: ProjectStatusCode;
  search?: string;
  work_no?: string;
}
