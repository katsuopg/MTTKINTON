// 動的アプリのフィールドタイプ（28種）
export type FieldType =
  | 'single_line_text'
  | 'multi_line_text'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'checkbox'
  | 'radio_button'
  | 'multi_select'
  | 'time'
  | 'datetime'
  | 'link'
  | 'file_upload'
  | 'rich_editor'
  | 'lookup'
  | 'related_records'
  | 'calculated'
  | 'subtable'
  | 'user_select'
  | 'org_select'
  | 'group_select'
  | 'record_number'
  | 'creator'
  | 'created_time'
  | 'modifier'
  | 'modified_time'
  | 'label'
  | 'space'
  | 'hr';

// フィールドタイプの表示情報
export const FIELD_TYPE_INFO: Record<FieldType, { label: { ja: string; en: string; th: string }; icon: string }> = {
  single_line_text: {
    label: { ja: '文字列（1行）', en: 'Single Line Text', th: 'ข้อความบรรทัดเดียว' },
    icon: 'Type',
  },
  multi_line_text: {
    label: { ja: '文字列（複数行）', en: 'Multi Line Text', th: 'ข้อความหลายบรรทัด' },
    icon: 'AlignLeft',
  },
  number: {
    label: { ja: '数値', en: 'Number', th: 'ตัวเลข' },
    icon: 'Hash',
  },
  date: {
    label: { ja: '日付', en: 'Date', th: 'วันที่' },
    icon: 'Calendar',
  },
  dropdown: {
    label: { ja: 'ドロップダウン', en: 'Dropdown', th: 'ดรอปดาวน์' },
    icon: 'ChevronDown',
  },
  checkbox: {
    label: { ja: 'チェックボックス', en: 'Checkbox', th: 'ช่องทำเครื่องหมาย' },
    icon: 'CheckSquare',
  },
  radio_button: {
    label: { ja: 'ラジオボタン', en: 'Radio Button', th: 'ปุ่มตัวเลือก' },
    icon: 'Circle',
  },
  multi_select: {
    label: { ja: '複数選択', en: 'Multi Select', th: 'เลือกหลายรายการ' },
    icon: 'ListChecks',
  },
  time: {
    label: { ja: '時刻', en: 'Time', th: 'เวลา' },
    icon: 'Clock',
  },
  datetime: {
    label: { ja: '日時', en: 'Date & Time', th: 'วันที่และเวลา' },
    icon: 'CalendarClock',
  },
  link: {
    label: { ja: 'リンク', en: 'Link', th: 'ลิงก์' },
    icon: 'Link',
  },
  file_upload: {
    label: { ja: 'ファイル', en: 'File Upload', th: 'อัปโหลดไฟล์' },
    icon: 'Paperclip',
  },
  rich_editor: {
    label: { ja: 'リッチエディター', en: 'Rich Editor', th: 'ตัวแก้ไขแบบ Rich' },
    icon: 'FileText',
  },
  lookup: {
    label: { ja: 'ルックアップ', en: 'Lookup', th: 'ค้นหาอ้างอิง' },
    icon: 'Search',
  },
  related_records: {
    label: { ja: '関連レコード', en: 'Related Records', th: 'ระเบียนที่เกี่ยวข้อง' },
    icon: 'GitBranch',
  },
  calculated: {
    label: { ja: '計算', en: 'Calculated', th: 'คำนวณ' },
    icon: 'Calculator',
  },
  subtable: {
    label: { ja: 'テーブル', en: 'Table', th: 'ตาราง' },
    icon: 'TableProperties',
  },
  user_select: {
    label: { ja: 'ユーザー選択', en: 'User Select', th: 'เลือกผู้ใช้' },
    icon: 'User',
  },
  org_select: {
    label: { ja: '組織選択', en: 'Organization Select', th: 'เลือกองค์กร' },
    icon: 'Building2',
  },
  group_select: {
    label: { ja: 'グループ選択', en: 'Group Select', th: 'เลือกกลุ่ม' },
    icon: 'Shield',
  },
  record_number: {
    label: { ja: 'レコード番号', en: 'Record Number', th: 'หมายเลขระเบียน' },
    icon: 'Hash',
  },
  creator: {
    label: { ja: '作成者', en: 'Creator', th: 'ผู้สร้าง' },
    icon: 'UserPlus',
  },
  created_time: {
    label: { ja: '作成日時', en: 'Created Time', th: 'เวลาที่สร้าง' },
    icon: 'CalendarPlus',
  },
  modifier: {
    label: { ja: '更新者', en: 'Modifier', th: 'ผู้แก้ไข' },
    icon: 'UserPen',
  },
  modified_time: {
    label: { ja: '更新日時', en: 'Modified Time', th: 'เวลาที่แก้ไข' },
    icon: 'CalendarCog',
  },
  label: {
    label: { ja: 'ラベル', en: 'Label', th: 'ป้ายกำกับ' },
    icon: 'Tag',
  },
  space: {
    label: { ja: 'スペース', en: 'Space', th: 'ช่องว่าง' },
    icon: 'Square',
  },
  hr: {
    label: { ja: '罫線', en: 'Divider', th: 'เส้นแบ่ง' },
    icon: 'Minus',
  },
};

// 多言語ラベル
export interface MultiLangText {
  ja?: string;
  en?: string;
  th?: string;
}

// 自動入力フィールド（レコードメタデータから値を取得、ユーザー入力不可）
export const AUTO_FIELD_TYPES: Set<FieldType> = new Set([
  'record_number', 'creator', 'created_time', 'modifier', 'modified_time',
]);

// 装飾フィールド（データを保持しない、レイアウト用）
export const DECORATIVE_FIELD_TYPES: Set<FieldType> = new Set([
  'label', 'space', 'hr',
]);

// ユーザー入力不要な全フィールド（自動 + 装飾 + related_records + calculated）
export const NON_INPUT_FIELD_TYPES: Set<FieldType> = new Set([
  ...AUTO_FIELD_TYPES, ...DECORATIVE_FIELD_TYPES, 'related_records', 'calculated',
]);

// バリデーション設定
export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
  link_type?: 'url' | 'tel' | 'email';
  max_file_size?: number; // MB単位
  max_files?: number;
  // ルックアップ設定
  lookup_app_code?: string;        // 参照先アプリコード
  lookup_key_field?: string;       // 参照先のキーフィールド（検索対象）
  lookup_copy_fields?: LookupCopyField[]; // コピーするフィールドのマッピング
  // 関連レコード設定
  related_app_code?: string;       // 関連先アプリコード
  related_key_field?: string;      // 関連先のフィールド
  related_this_field?: string;     // 自アプリの対応フィールド
  related_display_fields?: string[]; // 表示するフィールドコード一覧
  // 計算フィールド設定
  formula?: string;                // 計算式（例: "field_1 + field_2 * 0.1"）
  formula_format?: 'number' | 'currency' | 'percent'; // 表示フォーマット
  formula_decimals?: number;       // 小数点桁数
  // サブテーブル設定
  subtable_fields?: SubtableFieldDef[]; // サブテーブル内のフィールド定義
  subtable_config?: SubtableConfig;
  // エンティティ選択設定（user_select / org_select / group_select）
  allow_multiple?: boolean;   // 複数選択可否
}

// サブテーブル内フィールド定義（軽量版FieldDefinition）
export interface SubtableFieldDef {
  field_code: string;
  field_type: FieldType;
  label: MultiLangText;
  required?: boolean;
  options?: FieldOption[] | null;
  validation?: FieldValidation | null;
  col_span?: number;
}

// サブテーブル行設定
export interface SubtableConfig {
  allow_add?: boolean;
  allow_delete?: boolean;
  min_rows?: number;
  max_rows?: number;
}

// サブテーブル行データ
export interface SubtableRow {
  subtable_row_id: string;
  [fieldCode: string]: unknown;
}

// ルックアップコピーフィールド定義
export interface LookupCopyField {
  source_field: string;  // 参照先のフィールドコード
  target_field: string;  // 自アプリのフィールドコード
}

// 参照系フィールド（入力方式が特殊）
export const REFERENCE_FIELD_TYPES: Set<FieldType> = new Set([
  'lookup', 'related_records', 'calculated',
]);

// 一覧テーブルで非表示にするフィールド
export const HIDDEN_IN_LIST_TYPES: Set<FieldType> = new Set([
  'file_upload', 'rich_editor', 'related_records', 'subtable',
]);

// サブテーブル内で利用可能なフィールドタイプ
export const SUBTABLE_ALLOWED_TYPES: Set<FieldType> = new Set([
  'single_line_text', 'multi_line_text', 'number', 'date', 'time', 'datetime',
  'dropdown', 'checkbox', 'radio_button', 'multi_select', 'link', 'lookup', 'calculated',
  'user_select', 'org_select', 'group_select',
]);

// エンティティ選択フィールド（ユーザー/組織/グループ）
export const ENTITY_SELECT_TYPES: Set<FieldType> = new Set([
  'user_select', 'org_select', 'group_select',
]);

// ドロップダウン/チェックボックス選択肢
export interface FieldOption {
  label: MultiLangText;
  value: string;
}

// フィールド定義
export interface FieldDefinition {
  id: string;
  app_id: string;
  field_code: string;
  field_type: FieldType;
  label: MultiLangText;
  description: MultiLangText;
  required: boolean;
  unique_field: boolean;
  default_value: unknown;
  options: FieldOption[] | null;
  validation: FieldValidation | null;
  display_order: number;
  row_index: number;
  col_index: number;
  col_span: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// レコードデータ
export interface AppRecord {
  id: string;
  app_id: string;
  record_number: number;
  data: Record<string, unknown>;
  status: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// アプリ詳細（フィールド付き）
export interface DynamicApp {
  id: string;
  code: string;
  name: string;
  name_en: string | null;
  name_th: string | null;
  description: string | null;
  app_type: 'static' | 'dynamic';
  icon: string | null;
  color: string | null;
  display_order: number;
  is_active: boolean;
  fields?: FieldDefinition[];
}

// フィールド作成/更新用
export interface FieldInput {
  field_code: string;
  field_type: FieldType;
  label: MultiLangText;
  description?: MultiLangText;
  required?: boolean;
  unique_field?: boolean;
  default_value?: unknown;
  options?: FieldOption[] | null;
  validation?: FieldValidation | null;
  display_order?: number;
  row_index?: number;
  col_index?: number;
  col_span?: number;
}

// レコード一覧のレスポンス
export interface RecordListResponse {
  records: AppRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// バリデーション結果
export interface ValidationError {
  field_code: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ========== プロセス管理 ==========

export type AssigneeType = 'ONE' | 'ALL' | 'ANY';
export type EntityType = 'USER' | 'GROUP' | 'ORGANIZATION' | 'FIELD_ENTITY' | 'CREATOR';
export type ActionType = 'NORMAL' | 'NON_ASSIGNEE';
export type RequirementType = 'REQUIRED' | 'OPTIONAL';

// ステータス定義
export interface ProcessStatus {
  id: string;
  process_definition_id: string;
  name: string;
  display_order: number;
  is_initial: boolean;
  is_final: boolean;
  assignee_type: AssigneeType | null;
  created_at: string;
}

// ステータス作業者定義
export interface ProcessStatusAssignee {
  id: string;
  process_status_id: string;
  entity_type: EntityType;
  entity_code: string | null;
  include_subs: boolean;
}

// アクション定義
export interface ProcessAction {
  id: string;
  process_definition_id: string;
  name: string;
  from_status_id: string;
  to_status_id: string;
  filter_condition: string | null;
  action_type: ActionType;
  requirement_type: RequirementType | null;
  display_order: number;
}

// プロセス定義（全体）
export interface ProcessDefinition {
  id: string;
  app_id: string;
  enabled: boolean;
  revision: number;
  created_at: string;
  updated_at: string;
  statuses: ProcessStatus[];
  actions: ProcessAction[];
}

// レコードのプロセス状態
export interface RecordProcessState {
  id: string;
  record_id: string;
  record_table: string;
  current_status_id: string;
  current_status_name?: string;
  updated_at: string;
}

// アクション実行ログ
export interface ProcessActionLog {
  id: string;
  record_id: string;
  action_id: string;
  action_name?: string;
  from_status_id: string;
  from_status_name?: string;
  to_status_id: string;
  to_status_name?: string;
  executed_by: string;
  executed_by_name?: string;
  executed_at: string;
  comment: string | null;
}

// ビュー定義
export type ViewType = 'table' | 'calendar' | 'chart';
export type ChartType = 'bar' | 'line' | 'pie' | 'area';
export type AggregationType = 'count' | 'sum' | 'avg' | 'max' | 'min';

export interface TableViewConfig {
  columns: string[]; // フィールドコードの配列
  sort_field?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CalendarViewConfig {
  date_field: string; // 日付フィールドのfield_code
  title_field?: string; // カレンダーイベントのタイトルに使うfield_code
}

export interface ChartViewConfig {
  chart_type: ChartType;
  x_field: string; // X軸フィールド（グループ化キー）
  y_field?: string; // Y軸フィールド（集計対象の数値フィールド）
  group_field?: string; // 凡例グループ化フィールド
  aggregation: AggregationType;
}

export type ViewConfig = TableViewConfig | CalendarViewConfig | ChartViewConfig;

export interface ViewDefinition {
  id: string;
  app_id: string;
  name: string;
  view_type: ViewType;
  config: ViewConfig;
  display_order: number;
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
