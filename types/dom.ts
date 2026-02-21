// ============================================
// DOM (Document of Material) 型定義
// ============================================

// ============================================
// マスタ型
// ============================================

export interface MasterMaterial {
  id: string;
  code: string;
  name_ja: string;
  name_en: string | null;
  category: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface MasterHeatTreatment {
  id: string;
  code: string;
  name: string;
  name_en: string | null;
  method: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface MasterSurfaceTreatment {
  id: string;
  code: string;
  name: string;
  name_en: string | null;
  category: string | null;
  sort_order: number;
  is_active: boolean;
}

// ============================================
// ステータス定義
// ============================================

export const DOM_HEADER_STATUSES = ['draft', 'in_review', 'approved', 'released'] as const;
export type DomHeaderStatus = typeof DOM_HEADER_STATUSES[number];

export const DOM_HEADER_STATUS_LABELS: Record<DomHeaderStatus, { ja: string; en: string; th: string }> = {
  draft: { ja: '作成中', en: 'Draft', th: 'ร่าง' },
  in_review: { ja: '確認中', en: 'In Review', th: 'กำลังตรวจสอบ' },
  approved: { ja: '承認済', en: 'Approved', th: 'อนุมัติแล้ว' },
  released: { ja: '発行済', en: 'Released', th: 'ออกแล้ว' },
};

export const DOM_ITEM_STATUSES = [
  'designing',
  'on_hold',
  'quote_requesting',
  'quote_done',
  'order_requesting',
  'ordering',
  'delivered',
] as const;
export type DomItemStatus = typeof DOM_ITEM_STATUSES[number];

export const DOM_ITEM_STATUS_LABELS: Record<DomItemStatus, { ja: string; en: string; th: string }> = {
  designing: { ja: '設計中', en: 'Designing', th: 'กำลังออกแบบ' },
  on_hold: { ja: '保留', en: 'On Hold', th: 'ระงับ' },
  quote_requesting: { ja: '見積依頼中', en: 'Quote Requesting', th: 'ขอใบเสนอราคา' },
  quote_done: { ja: '見積完了', en: 'Quote Done', th: 'เสนอราคาเสร็จ' },
  order_requesting: { ja: '手配依頼', en: 'Order Requesting', th: 'ขอสั่งซื้อ' },
  ordering: { ja: '手配中', en: 'Ordering', th: 'กำลังสั่งซื้อ' },
  delivered: { ja: '入荷済', en: 'Delivered', th: 'ได้รับแล้ว' },
};

export const DOM_ITEM_STATUS_COLORS: Record<DomItemStatus, string> = {
  designing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  on_hold: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  quote_requesting: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  quote_done: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  order_requesting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ordering: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export type DomItemCategory = 'make' | 'buy';
export type DomItemType = 'assembly' | 'part';
export type DomDiscipline = 'mech' | 'elec';
export type DomWorkType = 'design' | 'construction' | 'other';

export const DOM_CATEGORY_LABELS: Record<DomItemCategory, { ja: string; en: string; th: string }> = {
  make: { ja: '製作品', en: 'Make', th: 'ผลิต' },
  buy: { ja: '購入品', en: 'Buy', th: 'ซื้อ' },
};

export const DOM_DISCIPLINE_LABELS: Record<DomDiscipline, { ja: string; en: string; th: string }> = {
  mech: { ja: 'メカ', en: 'Mechanical', th: 'เครื่องกล' },
  elec: { ja: '電気', en: 'Electrical', th: 'ไฟฟ้า' },
};

export const DOM_WORK_TYPE_LABELS: Record<DomWorkType, { ja: string; en: string; th: string }> = {
  design: { ja: '設計', en: 'Design', th: 'ออกแบบ' },
  construction: { ja: '施工', en: 'Construction', th: 'ก่อสร้าง' },
  other: { ja: 'その他', en: 'Other', th: 'อื่นๆ' },
};

// ============================================
// コア型
// ============================================

export interface DomHeader {
  id: string;
  project_id: string;
  customer_name: string | null;
  machine_name: string | null;
  machine_model: string | null;
  project_deadline: string | null;
  version: number;
  status: DomHeaderStatus;
  total_cost: number;
  designed_by: string | null;
  checked_by: string | null;
  approved_by: string | null;
  designed_at: string | null;
  checked_at: string | null;
  approved_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DomSection {
  id: string;
  dom_header_id: string;
  section_number: number;
  section_code: string;
  section_name: string | null;
  subtotal: number;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DomMechItem {
  id: string;
  dom_section_id: string;
  parent_id: string | null;
  item_number: number;
  category: DomItemCategory;
  item_type: DomItemType | null;
  status: DomItemStatus;
  part_code: string | null;
  revision: number;
  part_name: string | null;
  model_number: string | null;
  material_id: string | null;
  heat_treatment_id: string | null;
  surface_treatment_id: string | null;
  manufacturer: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  desired_delivery_date: string | null;
  lead_time_days: number | null;
  supplier_delivery_date: string | null;
  order_deadline: string | null;
  actual_delivery_date: string | null;
  notes: string | null;
  sort_order: number;
  is_deleted: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DomElecItem {
  id: string;
  dom_header_id: string;
  item_number: number;
  category: DomItemCategory;
  status: DomItemStatus;
  mark: string | null;
  part_name: string | null;
  model_number: string | null;
  manufacturer: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  desired_delivery_date: string | null;
  lead_time_days: number | null;
  supplier_delivery_date: string | null;
  order_deadline: string | null;
  actual_delivery_date: string | null;
  notes: string | null;
  sort_order: number;
  is_deleted: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DomLabor {
  id: string;
  dom_header_id: string;
  discipline: DomDiscipline;
  work_type: DomWorkType;
  description: string | null;
  hours: number;
  hourly_rate: number;
  amount: number;
  assigned_to: string | null;
  notes: string | null;
  sort_order: number;
  is_deleted: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DomItemFile {
  id: string;
  item_type: 'mech' | 'elec';
  item_id: string;
  file_name: string;
  file_type: 'pdf' | 'dwg' | 'jpeg' | 'png' | 'other';
  file_path: string;
  file_size: number | null;
  revision: number;
  description: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

// ============================================
// リレーション付き型
// ============================================

export interface DomHeaderWithRelations extends DomHeader {
  sections?: DomSectionWithItems[];
  elec_items?: DomElecItem[];
  labor?: DomLabor[];
}

export interface DomSectionWithItems extends DomSection {
  mech_items?: DomMechItemWithRelations[];
}

export interface DomMechItemWithRelations extends DomMechItem {
  material?: MasterMaterial | null;
  heat_treatment?: MasterHeatTreatment | null;
  surface_treatment?: MasterSurfaceTreatment | null;
  children?: DomMechItemWithRelations[];
  files?: DomItemFile[];
}

export interface DomElecItemWithRelations extends DomElecItem {
  files?: DomItemFile[];
}

// ============================================
// 作成・更新用型
// ============================================

export interface DomHeaderCreate {
  project_id: string;
  customer_name?: string | null;
  machine_name?: string | null;
  machine_model?: string | null;
  project_deadline?: string | null;
  notes?: string | null;
}

export interface DomHeaderUpdate {
  customer_name?: string | null;
  machine_name?: string | null;
  machine_model?: string | null;
  project_deadline?: string | null;
  version?: number;
  status?: DomHeaderStatus;
  total_cost?: number;
  designed_by?: string | null;
  checked_by?: string | null;
  approved_by?: string | null;
  designed_at?: string | null;
  checked_at?: string | null;
  approved_at?: string | null;
  notes?: string | null;
}

export interface DomSectionCreate {
  dom_header_id: string;
  section_number: number;
  section_code: string;
  section_name?: string | null;
}

export interface DomMechItemCreate {
  dom_section_id: string;
  parent_id?: string | null;
  item_number?: number;
  category: DomItemCategory;
  item_type?: DomItemType | null;
  part_code?: string | null;
  revision?: number;
  part_name?: string | null;
  model_number?: string | null;
  material_id?: string | null;
  heat_treatment_id?: string | null;
  surface_treatment_id?: string | null;
  manufacturer?: string | null;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  notes?: string | null;
  sort_order?: number;
}

export interface DomElecItemCreate {
  dom_header_id: string;
  item_number?: number;
  category?: DomItemCategory;
  mark?: string | null;
  part_name?: string | null;
  model_number?: string | null;
  manufacturer?: string | null;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  notes?: string | null;
  sort_order?: number;
}

export interface DomLaborCreate {
  dom_header_id: string;
  discipline: DomDiscipline;
  work_type: DomWorkType;
  description?: string | null;
  hours?: number;
  hourly_rate?: number;
  assigned_to?: string | null;
  notes?: string | null;
  sort_order?: number;
}

// ============================================
// 集計型
// ============================================

export interface DomSummary {
  mech_make_total: number;
  mech_buy_total: number;
  elec_make_total: number;
  elec_buy_total: number;
  mech_labor_total: number;
  elec_labor_total: number;
  grand_total: number;
  mech_make_count: number;
  mech_buy_count: number;
  elec_make_count: number;
  elec_buy_count: number;
  mech_labor_count: number;
  elec_labor_count: number;
}

// ============================================
// マスタデータ一括取得用
// ============================================

export interface DomMasters {
  materials: MasterMaterial[];
  heat_treatments: MasterHeatTreatment[];
  surface_treatments: MasterSurfaceTreatment[];
}
