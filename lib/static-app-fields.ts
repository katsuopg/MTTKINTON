/**
 * 静的アプリのフィールド定義
 * 静的アプリはapp_fieldsテーブルにフィールド情報がないため、
 * ビュー設定（カラム選択・ソート・フィルター）用にここで定義する
 */

export interface StaticFieldDef {
  field_code: string;
  field_type: 'text' | 'number' | 'date' | 'datetime';
  label: { ja: string; en: string; th: string };
}

// 静的アプリコード → DBテーブル名
export const STATIC_APP_TABLES: Record<string, string> = {
  work_numbers: 'work_orders',
  customers: 'customers',
  machines: 'machines',
  invoices: 'invoices',
  purchase_orders: 'po_records',
  quotations: 'quotations',
  orders: 'customer_orders',
  suppliers: 'suppliers',
  employees: 'employees',
};

// 各静的アプリのフィールド定義
export const STATIC_APP_FIELDS: Record<string, StaticFieldDef[]> = {
  work_numbers: [
    { field_code: 'work_no', field_type: 'text', label: { ja: '工事番号', en: 'Work No.', th: 'หมายเลขงาน' } },
    { field_code: 'status', field_type: 'text', label: { ja: 'ステータス', en: 'Status', th: 'สถานะ' } },
    { field_code: 'po_list', field_type: 'text', label: { ja: 'PO', en: 'PO', th: 'PO' } },
    { field_code: 'inv_list', field_type: 'text', label: { ja: 'INV', en: 'INV', th: 'INV' } },
    { field_code: 'customer_name', field_type: 'text', label: { ja: '顧客名', en: 'Customer', th: 'ลูกค้า' } },
    { field_code: 'customer_id', field_type: 'text', label: { ja: '顧客ID', en: 'Customer ID', th: 'รหัสลูกค้า' } },
    { field_code: 'category', field_type: 'text', label: { ja: 'Category', en: 'Category', th: 'หมวดหมู่' } },
    { field_code: 'description', field_type: 'text', label: { ja: 'Description', en: 'Description', th: 'รายละเอียด' } },
    { field_code: 'model', field_type: 'text', label: { ja: 'Model', en: 'Model', th: 'รุ่น' } },
    { field_code: 'vendor', field_type: 'text', label: { ja: 'Vendor', en: 'Vendor', th: 'ผู้จำหน่าย' } },
    { field_code: 'machine_type', field_type: 'text', label: { ja: 'Type', en: 'Type', th: 'ประเภท' } },
    { field_code: 'serial_number', field_type: 'text', label: { ja: 'Serial No.', en: 'Serial No.', th: 'เลขที่ซีเรียล' } },
    { field_code: 'machine_number', field_type: 'text', label: { ja: 'M/C No.', en: 'M/C No.', th: 'เลขที่เครื่อง' } },
    { field_code: 'machine_item', field_type: 'text', label: { ja: 'M/C Item', en: 'M/C Item', th: 'รายการเครื่อง' } },
    { field_code: 'sub_total', field_type: 'number', label: { ja: 'Sub Total', en: 'Sub Total', th: 'ยอดรวมย่อย' } },
    { field_code: 'discount', field_type: 'number', label: { ja: 'Discount', en: 'Discount', th: 'ส่วนลด' } },
    { field_code: 'grand_total', field_type: 'number', label: { ja: 'Grand Total', en: 'Grand Total', th: 'ยอดรวมทั้งหมด' } },
    { field_code: 'purchase_cost', field_type: 'number', label: { ja: 'Purchase Cost', en: 'Purchase Cost', th: 'ต้นทุนจัดซื้อ' } },
    { field_code: 'labor_cost', field_type: 'number', label: { ja: 'Labor Cost', en: 'Labor Cost', th: 'ค่าแรง' } },
    { field_code: 'cost_total', field_type: 'number', label: { ja: 'Cost Total', en: 'Cost Total', th: 'ต้นทุนรวม' } },
    { field_code: 'overhead_rate', field_type: 'number', label: { ja: 'Overhead Rate', en: 'Overhead Rate', th: 'อัตราค่าใช้จ่าย' } },
    { field_code: 'commission_rate', field_type: 'number', label: { ja: 'Commission Rate', en: 'Commission Rate', th: 'อัตราค่าคอมมิชชัน' } },
    { field_code: 'sales_staff', field_type: 'text', label: { ja: '営業担当', en: 'Sales Staff', th: 'พนักงานขาย' } },
    { field_code: 'person_in_charge', field_type: 'text', label: { ja: '担当者', en: 'Person in Charge', th: 'ผู้รับผิดชอบ' } },
    { field_code: 'start_date', field_type: 'date', label: { ja: '開始日', en: 'Start Date', th: 'วันที่เริ่มต้น' } },
    { field_code: 'finish_date', field_type: 'date', label: { ja: '完了日', en: 'Finish Date', th: 'วันที่เสร็จ' } },
    { field_code: 'sales_date', field_type: 'date', label: { ja: '売上予定日', en: 'Sales Date', th: 'วันที่ขาย' } },
    { field_code: 'created_at', field_type: 'datetime', label: { ja: '作成日時', en: 'Created At', th: 'วันที่สร้าง' } },
    { field_code: 'updated_at', field_type: 'datetime', label: { ja: '更新日時', en: 'Updated At', th: 'วันที่อัปเดต' } },
  ],
  customers: [
    { field_code: 'customer_id', field_type: 'text', label: { ja: '顧客ID', en: 'Customer ID', th: 'รหัสลูกค้า' } },
    { field_code: 'short_name', field_type: 'text', label: { ja: '略称', en: 'Short Name', th: 'ชื่อย่อ' } },
    { field_code: 'company_name', field_type: 'text', label: { ja: '会社名', en: 'Company Name', th: 'ชื่อบริษัท' } },
    { field_code: 'customer_rank', field_type: 'text', label: { ja: 'ランク', en: 'Rank', th: 'อันดับ' } },
    { field_code: 'country', field_type: 'text', label: { ja: '国', en: 'Country', th: 'ประเทศ' } },
    { field_code: 'phone_number', field_type: 'text', label: { ja: 'TEL', en: 'TEL', th: 'โทรศัพท์' } },
    { field_code: 'fax_number', field_type: 'text', label: { ja: 'FAX', en: 'FAX', th: 'แฟกซ์' } },
    { field_code: 'tax_id', field_type: 'text', label: { ja: 'Tax ID', en: 'Tax ID', th: 'เลขที่ภาษี' } },
    { field_code: 'payment_terms', field_type: 'text', label: { ja: '支払条件', en: 'Payment Terms', th: 'เงื่อนไขการชำระ' } },
    { field_code: 'address', field_type: 'text', label: { ja: '住所', en: 'Address', th: 'ที่อยู่' } },
    { field_code: 'website_url', field_type: 'text', label: { ja: 'Web', en: 'Website', th: 'เว็บไซต์' } },
    { field_code: 'notes', field_type: 'text', label: { ja: '備考', en: 'Notes', th: 'หมายเหตุ' } },
    { field_code: 'created_at', field_type: 'datetime', label: { ja: '作成日時', en: 'Created At', th: 'วันที่สร้าง' } },
  ],
  machines: [
    { field_code: 'customer_name', field_type: 'text', label: { ja: '顧客名', en: 'Customer', th: 'ลูกค้า' } },
    { field_code: 'customer_id', field_type: 'text', label: { ja: '顧客ID', en: 'Customer ID', th: 'รหัสลูกค้า' } },
    { field_code: 'machine_category', field_type: 'text', label: { ja: 'カテゴリ', en: 'Category', th: 'หมวดหมู่' } },
    { field_code: 'machine_type', field_type: 'text', label: { ja: 'タイプ', en: 'Type', th: 'ประเภท' } },
    { field_code: 'vendor', field_type: 'text', label: { ja: 'メーカー', en: 'Vendor', th: 'ผู้ผลิต' } },
    { field_code: 'model', field_type: 'text', label: { ja: 'モデル', en: 'Model', th: 'รุ่น' } },
    { field_code: 'serial_number', field_type: 'text', label: { ja: 'シリアル番号', en: 'Serial No.', th: 'เลขที่ซีเรียล' } },
    { field_code: 'machine_number', field_type: 'text', label: { ja: '機械番号', en: 'M/C No.', th: 'เลขที่เครื่อง' } },
    { field_code: 'machine_item', field_type: 'text', label: { ja: 'アイテム', en: 'Item', th: 'รายการ' } },
    { field_code: 'is_new_or_used', field_type: 'text', label: { ja: '新品/中古', en: 'New/Used', th: 'ใหม่/มือสอง' } },
    { field_code: 'install_date', field_type: 'date', label: { ja: '設置日', en: 'Install Date', th: 'วันที่ติดตั้ง' } },
    { field_code: 'quotation_count', field_type: 'number', label: { ja: 'QT数', en: 'QT', th: 'QT' } },
    { field_code: 'work_order_count', field_type: 'number', label: { ja: 'WN数', en: 'WN', th: 'WN' } },
    { field_code: 'remarks', field_type: 'text', label: { ja: '備考', en: 'Remarks', th: 'หมายเหตุ' } },
    { field_code: 'created_at', field_type: 'datetime', label: { ja: '作成日時', en: 'Created At', th: 'วันที่สร้าง' } },
  ],
  invoices: [
    { field_code: 'invoice_no', field_type: 'text', label: { ja: '請求書番号', en: 'Invoice No.', th: 'เลขที่ใบแจ้งหนี้' } },
    { field_code: 'work_no', field_type: 'text', label: { ja: '工事番号', en: 'Work No.', th: 'หมายเลขงาน' } },
    { field_code: 'invoice_date', field_type: 'date', label: { ja: '請求書日付', en: 'Invoice Date', th: 'วันที่ออกใบแจ้งหนี้' } },
    { field_code: 'customer_name', field_type: 'text', label: { ja: '顧客名', en: 'Customer', th: 'ลูกค้า' } },
    { field_code: 'customer_id', field_type: 'text', label: { ja: '顧客ID', en: 'Customer ID', th: 'รหัสลูกค้า' } },
    { field_code: 'sub_total', field_type: 'number', label: { ja: '小計', en: 'Sub Total', th: 'ยอดรวมย่อย' } },
    { field_code: 'discount', field_type: 'number', label: { ja: '値引き', en: 'Discount', th: 'ส่วนลด' } },
    { field_code: 'grand_total', field_type: 'number', label: { ja: '金額', en: 'Amount', th: 'จำนวนเงิน' } },
    { field_code: 'status', field_type: 'text', label: { ja: 'ステータス', en: 'Status', th: 'สถานะ' } },
    { field_code: 'po_no', field_type: 'text', label: { ja: 'PO番号', en: 'PO No.', th: 'เลขที่ PO' } },
    { field_code: 'due_date', field_type: 'date', label: { ja: '支払期限', en: 'Due Date', th: 'วันครบกำหนด' } },
    { field_code: 'payment_date', field_type: 'date', label: { ja: '支払日', en: 'Payment Date', th: 'วันที่ชำระเงิน' } },
    { field_code: 'payment_terms', field_type: 'text', label: { ja: '支払条件', en: 'Payment Terms', th: 'เงื่อนไขการชำระ' } },
    { field_code: 'period', field_type: 'text', label: { ja: '会計期間', en: 'Period', th: 'งวด' } },
    { field_code: 'description', field_type: 'text', label: { ja: '摘要', en: 'Description', th: 'รายละเอียด' } },
    { field_code: 'created_at', field_type: 'datetime', label: { ja: '作成日時', en: 'Created At', th: 'วันที่สร้าง' } },
  ],
  purchase_orders: [
    { field_code: 'po_no', field_type: 'text', label: { ja: 'PO番号', en: 'PO No.', th: 'เลขที่ PO' } },
    { field_code: 'work_no', field_type: 'text', label: { ja: '工事番号', en: 'Work No.', th: 'หมายเลขงาน' } },
    { field_code: 'approval_status', field_type: 'text', label: { ja: '承認', en: 'Approval', th: 'การอนุมัติ' } },
    { field_code: 'po_status', field_type: 'text', label: { ja: 'ステータス', en: 'Status', th: 'สถานะ' } },
    { field_code: 'supplier_name', field_type: 'text', label: { ja: 'サプライヤー', en: 'Supplier', th: 'ผู้จัดจำหน่าย' } },
    { field_code: 'po_date', field_type: 'date', label: { ja: '発注日', en: 'PO Date', th: 'วันที่สั่งซื้อ' } },
    { field_code: 'delivery_date', field_type: 'date', label: { ja: '納期', en: 'Delivery Date', th: 'วันที่ส่งมอบ' } },
    { field_code: 'subtotal', field_type: 'number', label: { ja: '小計', en: 'Sub Total', th: 'ยอดรวมย่อย' } },
    { field_code: 'discount', field_type: 'number', label: { ja: '値引き', en: 'Discount', th: 'ส่วนลด' } },
    { field_code: 'grand_total', field_type: 'number', label: { ja: '金額', en: 'Amount', th: 'จำนวนเงิน' } },
    { field_code: 'model', field_type: 'text', label: { ja: 'Model', en: 'Model', th: 'รุ่น' } },
    { field_code: 'subject', field_type: 'text', label: { ja: '件名', en: 'Subject', th: 'หัวข้อ' } },
    { field_code: 'requester', field_type: 'text', label: { ja: '依頼者', en: 'Requester', th: 'ผู้ร้องขอ' } },
    { field_code: 'payment_term', field_type: 'text', label: { ja: '支払条件', en: 'Payment Term', th: 'เงื่อนไขการชำระ' } },
    { field_code: 'created_at', field_type: 'datetime', label: { ja: '作成日時', en: 'Created At', th: 'วันที่สร้าง' } },
  ],
  quotations: [
    { field_code: 'quotation_no', field_type: 'text', label: { ja: '見積番号', en: 'Quotation No.', th: 'เลขที่ใบเสนอราคา' } },
    { field_code: 'quotation_date', field_type: 'date', label: { ja: '見積日', en: 'Date', th: 'วันที่' } },
    { field_code: 'customer_name', field_type: 'text', label: { ja: '顧客名', en: 'Customer', th: 'ลูกค้า' } },
    { field_code: 'customer_id', field_type: 'text', label: { ja: '顧客ID', en: 'Customer ID', th: 'รหัสลูกค้า' } },
    { field_code: 'title', field_type: 'text', label: { ja: 'タイトル', en: 'Title', th: 'หัวข้อ' } },
    { field_code: 'work_no', field_type: 'text', label: { ja: '工事番号', en: 'Work No.', th: 'หมายเลขงาน' } },
    { field_code: 'status', field_type: 'text', label: { ja: 'ステータス', en: 'Status', th: 'สถานะ' } },
    { field_code: 'probability', field_type: 'text', label: { ja: '確率', en: 'Probability', th: 'ความน่าจะเป็น' } },
    { field_code: 'sales_staff', field_type: 'text', label: { ja: '営業担当', en: 'Sales Staff', th: 'พนักงานขาย' } },
    { field_code: 'type', field_type: 'text', label: { ja: 'タイプ', en: 'Type', th: 'ประเภท' } },
    { field_code: 'vendor', field_type: 'text', label: { ja: 'メーカー', en: 'Vendor', th: 'ผู้ผลิต' } },
    { field_code: 'model', field_type: 'text', label: { ja: 'モデル', en: 'Model', th: 'รุ่น' } },
    { field_code: 'sub_total', field_type: 'number', label: { ja: '小計', en: 'Sub Total', th: 'ยอดรวมย่อย' } },
    { field_code: 'grand_total', field_type: 'number', label: { ja: '合計', en: 'Grand Total', th: 'ยอดรวมทั้งหมด' } },
    { field_code: 'gross_profit', field_type: 'number', label: { ja: '粗利', en: 'Gross Profit', th: 'กำไรขั้นต้น' } },
    { field_code: 'expected_order_date', field_type: 'date', label: { ja: '受注予定日', en: 'Expected Order Date', th: 'วันที่คาดว่าจะได้รับคำสั่งซื้อ' } },
    { field_code: 'created_at', field_type: 'datetime', label: { ja: '作成日時', en: 'Created At', th: 'วันที่สร้าง' } },
  ],
  orders: [
    { field_code: 'po_number', field_type: 'text', label: { ja: 'PO番号', en: 'PO No.', th: 'เลขที่ PO' } },
    { field_code: 'work_no', field_type: 'text', label: { ja: '工事番号', en: 'Work No.', th: 'หมายเลขงาน' } },
    { field_code: 'customer_name', field_type: 'text', label: { ja: '顧客名', en: 'Customer', th: 'ลูกค้า' } },
    { field_code: 'company_name', field_type: 'text', label: { ja: '会社名', en: 'Company Name', th: 'ชื่อบริษัท' } },
    { field_code: 'subject', field_type: 'text', label: { ja: '件名', en: 'Subject', th: 'หัวข้อ' } },
    { field_code: 'mc_item', field_type: 'text', label: { ja: 'M/C ITEM', en: 'M/C ITEM', th: 'M/C ITEM' } },
    { field_code: 'model', field_type: 'text', label: { ja: 'MODEL', en: 'MODEL', th: 'รุ่น' } },
    { field_code: 'vendor', field_type: 'text', label: { ja: 'Vendor', en: 'Vendor', th: 'ผู้จำหน่าย' } },
    { field_code: 'total_amount', field_type: 'number', label: { ja: '金額', en: 'Amount', th: 'จำนวนเงิน' } },
    { field_code: 'order_date', field_type: 'date', label: { ja: 'PO日', en: 'PO Date', th: 'วันที่ PO' } },
    { field_code: 'status', field_type: 'text', label: { ja: 'ステータス', en: 'Status', th: 'สถานะ' } },
    { field_code: 'quotation_no', field_type: 'text', label: { ja: '見積番号', en: 'Quotation No.', th: 'เลขที่ใบเสนอราคา' } },
    { field_code: 'created_at', field_type: 'datetime', label: { ja: '作成日時', en: 'Created At', th: 'วันที่สร้าง' } },
  ],
  suppliers: [
    { field_code: 'supplier_id', field_type: 'text', label: { ja: '仕入先ID', en: 'Supplier ID', th: 'รหัสซัพพลายเออร์' } },
    { field_code: 'company_name', field_type: 'text', label: { ja: '会社名', en: 'Company Name', th: 'ชื่อบริษัท' } },
    { field_code: 'company_name_en', field_type: 'text', label: { ja: '会社名(英)', en: 'Company Name (EN)', th: 'ชื่อบริษัท (EN)' } },
    { field_code: 'phone_number', field_type: 'text', label: { ja: 'TEL', en: 'TEL', th: 'โทรศัพท์' } },
    { field_code: 'fax_number', field_type: 'text', label: { ja: 'FAX', en: 'FAX', th: 'แฟกซ์' } },
    { field_code: 'email', field_type: 'text', label: { ja: 'メール', en: 'Email', th: 'อีเมล' } },
    { field_code: 'address', field_type: 'text', label: { ja: '住所', en: 'Address', th: 'ที่อยู่' } },
    { field_code: 'name_kana', field_type: 'text', label: { ja: 'カナ', en: 'Kana', th: 'คานะ' } },
    { field_code: 'created_at', field_type: 'datetime', label: { ja: '作成日時', en: 'Created At', th: 'วันที่สร้าง' } },
  ],
  employees: [
    { field_code: 'employee_number', field_type: 'text', label: { ja: '従業員ID', en: 'Employee ID', th: 'รหัสพนักงาน' } },
    { field_code: 'name', field_type: 'text', label: { ja: '氏名', en: 'Name', th: 'ชื่อ' } },
    { field_code: 'name_th', field_type: 'text', label: { ja: '氏名（タイ語）', en: 'Name (Thai)', th: 'ชื่อ (ไทย)' } },
    { field_code: 'nickname', field_type: 'text', label: { ja: 'ニックネーム', en: 'Nickname', th: 'ชื่อเล่น' } },
    { field_code: 'department', field_type: 'text', label: { ja: '部署', en: 'Department', th: 'แผนก' } },
    { field_code: 'position', field_type: 'text', label: { ja: '役職', en: 'Position', th: 'ตำแหน่ง' } },
    { field_code: 'company_email', field_type: 'text', label: { ja: '社内メール', en: 'Company Email', th: 'อีเมลบริษัท' } },
    { field_code: 'email', field_type: 'text', label: { ja: '個人メール', en: 'Personal Email', th: 'อีเมลส่วนตัว' } },
    { field_code: 'tel', field_type: 'text', label: { ja: 'TEL', en: 'TEL', th: 'โทรศัพท์' } },
    { field_code: 'status', field_type: 'text', label: { ja: 'ステータス', en: 'Status', th: 'สถานะ' } },
    { field_code: 'employment_type', field_type: 'text', label: { ja: '雇用形態', en: 'Employment Type', th: 'ประเภทการจ้างงาน' } },
    { field_code: 'hire_date', field_type: 'date', label: { ja: '入社日', en: 'Hire Date', th: 'วันที่เริ่มงาน' } },
    { field_code: 'nationality', field_type: 'text', label: { ja: '国籍', en: 'Nationality', th: 'สัญชาติ' } },
    { field_code: 'created_at', field_type: 'datetime', label: { ja: '作成日時', en: 'Created At', th: 'วันที่สร้าง' } },
  ],
};

/** 静的アプリかどうか判定 */
export function isStaticApp(appCode: string): boolean {
  return appCode in STATIC_APP_FIELDS;
}

/** 静的フィールドタイプ → 動的フィールドタイプ変換（FIELD_OPERATORS互換） */
const STATIC_TO_DYNAMIC_TYPE: Record<string, string> = {
  text: 'single_line_text',
  number: 'number',
  date: 'date',
  datetime: 'datetime',
};

/** 静的アプリのフィールド定義を取得（FieldInfo互換形式） */
export function getStaticFields(appCode: string) {
  const fields = STATIC_APP_FIELDS[appCode];
  if (!fields) return [];
  return fields.map(f => ({
    field_code: f.field_code,
    field_type: STATIC_TO_DYNAMIC_TYPE[f.field_type] || f.field_type,
    label: f.label,
    options: null as null,
    validation: null as null,
  }));
}
