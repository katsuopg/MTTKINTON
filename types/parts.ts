// ============================================
// 部品表（BOM）関連の型定義
// ============================================

/**
 * 部品表カテゴリ
 */
export interface PartCategory {
  id: string;
  code: 'mech_make' | 'mech_buy' | 'elec_make' | 'elec_buy';
  name: string;
  name_en: string | null;
  name_th: string | null;
  has_sections: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * 部品表カテゴリコード
 */
export type PartCategoryCode = PartCategory['code'];

/**
 * カテゴリコードと表示名のマッピング
 */
export const PART_CATEGORY_LABELS: Record<PartCategoryCode, { ja: string; en: string; th: string }> = {
  mech_make: { ja: 'メカ製作部品', en: 'Mechanical Fabrication Parts', th: 'ชิ้นส่วนผลิตเครื่องกล' },
  mech_buy: { ja: 'メカ購入品', en: 'Mechanical Purchased Parts', th: 'ชิ้นส่วนซื้อเครื่องกล' },
  elec_make: { ja: '電気製作品', en: 'Electrical Fabrication Parts', th: 'ชิ้นส่วนผลิตไฟฟ้า' },
  elec_buy: { ja: '電気購入品', en: 'Electrical Purchased Parts', th: 'ชิ้นส่วนซื้อไฟฟ้า' },
};

/**
 * 部品表セクション（メカ製作部品用）
 */
export interface PartSection {
  id: string;
  project_code: string;
  category_id: string;
  section_code: string;
  section_name: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/**
 * 部品表明細
 */
export interface PartListItem {
  id: string;
  project_code: string;
  category_id: string;
  section_id: string | null;

  // 部品情報
  part_number: string | null;
  part_name: string | null;
  model_number: string | null;
  manufacturer: string | null;
  quantity: number;
  unit: string;
  unit_price: number | null;
  drawing_no: string | null;
  remarks: string | null;

  // メタ情報
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * 部品表明細（カテゴリ・セクション情報付き）
 */
export interface PartListItemWithRelations extends PartListItem {
  category?: PartCategory;
  section?: PartSection | null;
}

/**
 * 部品表明細の作成用
 */
export interface PartListItemCreate {
  project_code: string;
  category_id: string;
  section_id?: string | null;
  part_number?: string | null;
  part_name?: string | null;
  model_number?: string | null;
  manufacturer?: string | null;
  quantity?: number;
  unit?: string;
  unit_price?: number | null;
  drawing_no?: string | null;
  remarks?: string | null;
  sort_order?: number;
}

/**
 * 部品表明細の更新用
 */
export interface PartListItemUpdate {
  id: string;
  part_number?: string | null;
  part_name?: string | null;
  model_number?: string | null;
  manufacturer?: string | null;
  quantity?: number;
  unit?: string;
  unit_price?: number | null;
  drawing_no?: string | null;
  remarks?: string | null;
  sort_order?: number;
  section_id?: string | null;
}

/**
 * セクションの作成用
 */
export interface PartSectionCreate {
  project_code: string;
  category_id: string;
  section_code: string;
  section_name?: string | null;
  sort_order?: number;
}

/**
 * CSVインポート用の行データ
 */
export interface PartListCSVRow {
  part_number?: string;
  part_name?: string;
  model_number?: string;
  manufacturer?: string;
  quantity?: string | number;
  unit?: string;
  unit_price?: string | number;
  drawing_no?: string;
  remarks?: string;
  section_code?: string;
}

/**
 * 部品表のグループ化データ（カテゴリ→セクション→アイテム）
 */
export interface PartListGrouped {
  category: PartCategory;
  sections: {
    section: PartSection | null;
    items: PartListItem[];
  }[];
  totalItems: number;
}
