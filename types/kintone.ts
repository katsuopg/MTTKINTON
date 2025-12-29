// kintone APIアプリID定義（環境変数から取得）
export const KINTONE_APPS = {
  PROJECT_MANAGEMENT: { 
    appId: 114, 
    name: 'Project management' 
  },
  WORK_NO: { 
    appId: 21, 
    name: 'Work No.' 
  },
  QUOTATION: { 
    appId: 8, 
    name: 'Quotation' 
  },
  PO_MANAGEMENT: { 
    appId: 22, 
    name: 'MTT PO' 
  },
  COST_MANAGEMENT: { 
    appId: 88, 
    name: 'Cost' 
  },
  CUSTOMER_LIST: { 
    appId: 7, 
    name: 'Customer List' 
  },
  CUSTOMER_STAFF: { 
    appId: 11, 
    name: 'Customer staff' 
  },
  SUPPLIER_LIST: { 
    appId: 36, 
    name: 'Supplier List' 
  },
  PARTS_LIST: { 
    appId: 122, 
    name: 'Parts List Management' 
  },
  PURCHASE_REQUEST: { 
    appId: 123, 
    name: 'Purchase Request Management' 
  },
  EMPLOYEE_MANAGEMENT: { 
    appId: 106, 
    name: 'Employee Management' 
  },
  INVOICE_MANAGEMENT: { 
    appId: 26, 
    name: 'Invoice Management' 
  }
} as const;

// Kintoneファイル情報の型
export interface KintoneFileInfo {
  contentType: string;
  fileKey: string;
  name: string;
  size: string;
}

// kintoneレコードの基本型
export interface KintoneRecord {
  $id: { type: "__ID__"; value: string };
  $revision: { type: "__REVISION__"; value: string };
  レコード番号: { type: "RECORD_NUMBER"; value: string };
  作成者: { type: "CREATOR"; value: { code: string; name: string } };
  作成日時: { type: "CREATED_TIME"; value: string };
  更新者: { type: "MODIFIER"; value: { code: string; name: string } };
  更新日時: { type: "UPDATED_TIME"; value: string };
}

// Work No.アプリのレコード型
export interface WorkNoRecord extends KintoneRecord {
  WorkNo: { type: "SINGLE_LINE_TEXT"; value: string };
  Status: { type: "DROP_DOWN"; value: string };
  日付_6: { type: "DATE"; value: string }; // Start Date
  日付_5: { type: "DATE"; value: string }; // Finish date
  Salesdate: { type: "DATE"; value: string }; // Scheduled sales date
  Salesstaff: { type: "USER_SELECT"; value: Array<{ code: string; name: string }> }; // Sales staff
  文字列__1行__8: { type: "SINGLE_LINE_TEXT"; value: string }; // CS ID
  文字列__1行__0: { type: "SINGLE_LINE_TEXT"; value: string }; // Customer name
  文字列__1行__1: { type: "SINGLE_LINE_TEXT"; value: string }; // Category
  文字列__1行__2: { type: "SINGLE_LINE_TEXT"; value: string }; // Description
  Type: { type: "SINGLE_LINE_TEXT"; value: string };
  文字列__1行__5: { type: "SINGLE_LINE_TEXT"; value: string }; // Vender
  文字列__1行__9: { type: "SINGLE_LINE_TEXT"; value: string }; // Model
  文字列__1行__10: { type: "SINGLE_LINE_TEXT"; value: string }; // Serial No.
  文字列__1行__11: { type: "SINGLE_LINE_TEXT"; value: string }; // M/C No.
  McItem: { type: "SINGLE_LINE_TEXT"; value: string }; // M/C Item
  文字列__1行__3: { type: "SINGLE_LINE_TEXT"; value: string }; // Invoice No. 1
  文字列__1行__4: { type: "SINGLE_LINE_TEXT"; value: string }; // Invoice No. 2
  文字列__1行__6: { type: "SINGLE_LINE_TEXT"; value: string }; // Invoice No. 3
  文字列__1行__7: { type: "SINGLE_LINE_TEXT"; value: string }; // Invoice No. 4
  日付_7: { type: "DATE"; value: string }; // Invoice Date 1
  日付_8: { type: "DATE"; value: string }; // Invoice Date 2
  日付_9: { type: "DATE"; value: string }; // Invoice Date 3
  Sub_total: { type: "NUMBER"; value: string };
  Discount: { type: "NUMBER"; value: string };
  grand_total: { type: "NUMBER"; value: string }; // Grand total
  cost: { type: "NUMBER"; value: string }; // Purchase cost
  Labor_cost: { type: "NUMBER"; value: string };
  Cost_Total: { type: "NUMBER"; value: string };
  profit: { type: "CALC"; value: string };
  OverHead: { type: "CALC"; value: string }; // Over Head Fee
  OverRate: { type: "NUMBER"; value: string }; // Over Head Fee Rate
  OperationProfit: { type: "CALC"; value: string }; // Operation Profit
  ComRate: { type: "NUMBER"; value: string }; // Commition Rate
  計算: { type: "CALC"; value: string }; // Commition
  Parson_in_charge: { type: "SINGLE_LINE_TEXT"; value: string };
  // サブテーブル
  cost_Table: { type: "SUBTABLE"; value: any }; // Cost Sheet
  ルックアップ: { type: "SINGLE_LINE_TEXT"; value: string }; // PO LIST
  ルックアップ_0: { type: "SINGLE_LINE_TEXT"; value: string }; // INV LIST
  ルックアップ_1: { type: "SINGLE_LINE_TEXT"; value: string }; // CS QT&PO
  ManHour: { type: "SUBTABLE"; value: any }; // Man-Hour List
  // 他のフィールドは実際のレコードデータに基づいて追加
}

// Project managementアプリのレコード型
export interface ProjectRecord extends KintoneRecord {
  PJ_code: { type: "SINGLE_LINE_TEXT"; value: string };
  PjName: { type: "SINGLE_LINE_TEXT"; value: string };
  WorkNo: { type: "SINGLE_LINE_TEXT"; value: string };
  Status: { type: "DROP_DOWN"; value: string };
  Start_date: { type: "DATE"; value: string };
  Due_date: { type: "DATE"; value: string };
  Customer: { type: "SINGLE_LINE_TEXT"; value: string };
  Cs_ID: { type: "SINGLE_LINE_TEXT"; value: string }; // CS ID field (注意: Cs_ID)
  Description: { type: "MULTI_LINE_TEXT"; value: string };
  [key: string]: any; // 一時的に任意のフィールドを許可
}

// Parts List Management（Phase 2）のレコード型
export interface PartsListRecord extends KintoneRecord {
  work_no: { type: "SINGLE_LINE_TEXT"; value: string };
  project_name: { type: "SINGLE_LINE_TEXT"; value: string };
  machine_name: { type: "SINGLE_LINE_TEXT"; value: string };
  model: { type: "SINGLE_LINE_TEXT"; value: string };
  parts_category: { type: "DROP_DOWN"; value: string };
  parts_details: {
    type: "SUBTABLE";
    value: Array<{
      id: string;
      value: {
        no: { type: "NUMBER"; value: string };
        part_name: { type: "SINGLE_LINE_TEXT"; value: string };
        model_part_number: { type: "SINGLE_LINE_TEXT"; value: string };
        brand: { type: "SINGLE_LINE_TEXT"; value: string };
        supplier: { type: "DROP_DOWN"; value: string };
        qty: { type: "NUMBER"; value: string };
        unit_price: { type: "NUMBER"; value: string };
        total_amount: { type: "CALC"; value: string };
        delivery_period: { type: "SINGLE_LINE_TEXT"; value: string };
        note: { type: "MULTI_LINE_TEXT"; value: string };
        status: { type: "DROP_DOWN"; value: string };
        drawing_status: { type: "DROP_DOWN"; value: string };
        cost_status: { type: "DROP_DOWN"; value: string };
        purchase_type: { type: "DROP_DOWN"; value: string };
      };
    }>;
  };
}

// Customer Listアプリのレコード型
export interface CustomerRecord extends KintoneRecord {
  文字列__1行_: { type: "SINGLE_LINE_TEXT"; value: string }; // CSID
  会社名: { type: "SINGLE_LINE_TEXT"; value: string };
  住所: { type: "SINGLE_LINE_TEXT"; value: string };
  郵便番号: { type: "SINGLE_LINE_TEXT"; value: string };
  文字列__1行__4: { type: "SINGLE_LINE_TEXT"; value: string }; // Country
  文字列__1行__6: { type: "SINGLE_LINE_TEXT"; value: string }; // TAX ID
  TEL: { type: "SINGLE_LINE_TEXT"; value: string };
  FAX: { type: "SINGLE_LINE_TEXT"; value: string };
  顧客ランク: { type: "DROP_DOWN"; value: string };
  備考: { type: "MULTI_LINE_TEXT"; value: string };
}

// Customer Staff (顧客担当者) - 定義は下部に移動
// Legacy fields (日本語フィールド): 担当者名, Divison, Position, メールアドレス, 文字列__1行__7, ルックアップ, Text

// Employee Management (従業員管理)
export interface EmployeeRecord extends KintoneRecord {
  氏名: { type: "SINGLE_LINE_TEXT"; value: string }; // 従業員名
  氏名_タイ語?: { type: "SINGLE_LINE_TEXT"; value: string }; // 氏名（タイ語）
  氏名タイ語?: { type: "SINGLE_LINE_TEXT"; value: string }; // 氏名タイ語（別名）
  従業員番号?: { type: "SINGLE_LINE_TEXT"; value: string }; // 従業員番号 (MTT68067形式)
  IdNo?: { type: "SINGLE_LINE_TEXT"; value: string }; // タイID番号
  ID_No?: { type: "SINGLE_LINE_TEXT"; value: string }; // ID No. (別名)
  パスポート番号?: { type: "SINGLE_LINE_TEXT"; value: string }; // パスポート番号
  パスポート有効期限: { type: "DATE"; value: string }; // パスポート有効期限
  役職: { type: "SINGLE_LINE_TEXT"; value: string }; // 役職
  TEL: { type: "SINGLE_LINE_TEXT"; value: string }; // TEL
  メールアドレス: { type: "LINK"; value: string }; // メールアドレス
  生年月日: { type: "DATE"; value: string }; // 生年月日
  身分証明書: { type: "SINGLE_LINE_TEXT"; value: string }; // 身分証明書
  免許書番号: { type: "SINGLE_LINE_TEXT"; value: string }; // 免許書・番号
  社員証番号: { type: "SINGLE_LINE_TEXT"; value: string }; // 社員証番号
  緊急時連絡先氏名: { type: "SINGLE_LINE_TEXT"; value: string }; // 緊急時連絡先氏名
  緊急時連絡先TEL: { type: "SINGLE_LINE_TEXT"; value: string }; // 緊急時連絡先TEL
  緊急時連絡先住所: { type: "SINGLE_LINE_TEXT"; value: string }; // 緊急時連絡先住所
  "履歴書・資格証記録": { type: "FILE"; value: any[] }; // 履歴書・資格証記録
  ID?: { type: "FILE"; value: KintoneFileInfo[] }; // ID画像
  パスポート?: { type: "FILE"; value: KintoneFileInfo[] }; // パスポート画像
  在籍状況: { type: "DROP_DOWN"; value: string }; // 在籍状況
  入社日: { type: "DATE"; value: string }; // 入社日
  退社日: { type: "DATE"; value: string }; // 退社日
  "配属": { type: "MULTI_LINE_TEXT"; value: string }; // 配属・異動の記録
  給与: { type: "SINGLE_LINE_TEXT"; value: string }; // 給与
  BBBL給与額込口座: { type: "SINGLE_LINE_TEXT"; value: string }; // BBBL給与額込口座
  通帳: { type: "FILE"; value: any[] }; // 通帳
  [key: string]: any; // 一時的に任意のフィールドを許可
}

// Quotation (見積もり管理)
export interface QuotationRecord extends KintoneRecord {
  sales_staff: { type: "SINGLE_LINE_TEXT"; value: string };
  日付: { type: "DATE"; value: string }; // QT date
  qtno2: { type: "SINGLE_LINE_TEXT"; value: string }; // QT No.
  ドロップダウン: { type: "DROP_DOWN"; value: string }; // QT Status
  文字列__1行__8?: { type: "SINGLE_LINE_TEXT"; value: string }; // Delivery date
  ドロップダウン_3?: { type: "DROP_DOWN"; value: string }; // Valid Until
  payment_1?: { type: "SINGLE_LINE_TEXT"; value: string }; // Payment tarm1
  ドロップダウン_4?: { type: "DROP_DOWN"; value: string }; // Payment tarm2
  ドロップダウン_5?: { type: "DROP_DOWN"; value: string }; // Payment tarm3
  日付_0?: { type: "DATE"; value: string }; // Scheduled order date
  sales_forecast?: { type: "SINGLE_LINE_TEXT"; value: string };
  Drop_down?: { type: "DROP_DOWN"; value: string }; // Probability
  文字列__1行__10?: { type: "SINGLE_LINE_TEXT"; value: string }; // CS ID
  name?: { type: "SINGLE_LINE_TEXT"; value: string }; // Customer name
  ルックアップ_1?: { type: "SINGLE_LINE_TEXT"; value: string }; // Person in charge
  ドロップダウン_0?: { type: "DROP_DOWN"; value: string }; // Project name
  文字列__1行__4?: { type: "SINGLE_LINE_TEXT"; value: string }; // Title
  Sub_total?: { type: "CALC"; value: string }; // Sub total
  Discount?: { type: "NUMBER"; value: string }; // Discount
  grand_total?: { type: "CALC"; value: string }; // Grand Total
  costtotal?: { type: "CALC"; value: string }; // Cost forecast (予想コスト)
  添付ファイル?: { type: "FILE"; value: any[] }; // QTファイル
  McItem?: { type: "SINGLE_LINE_TEXT"; value: string }; // M/C Item
  文字列__1行__9?: { type: "SINGLE_LINE_TEXT"; value: string }; // Model
  WorkNo?: { type: "SINGLE_LINE_TEXT"; value: string }; // Work Number (legacy)
  Text_0?: { type: "SINGLE_LINE_TEXT"; value: string }; // Work Number (actual field)
  [key: string]: any;
}

// PO Management (発注管理)
export interface PORecord extends KintoneRecord {
  ステータス: { type: "STATUS"; value: string }; // Status
  ルックアップ: { type: "SINGLE_LINE_TEXT"; value: string }; // Work No.
  文字列__1行__1: { type: "SINGLE_LINE_TEXT"; value: string }; // PO No.
  文字列__1行__2: { type: "SINGLE_LINE_TEXT"; value: string }; // CS ID
  ルックアップ_1: { type: "SINGLE_LINE_TEXT"; value: string }; // Supplier name
  日付: { type: "DATE"; value: string }; // PO date
  日付_0: { type: "DATE"; value: string }; // Delivery date
  subtotal: { type: "CALC"; value: string }; // Sub Total
  discount: { type: "NUMBER"; value: string }; // Discount
  grand_total: { type: "CALC"; value: string }; // Grand total
  ドロップダウン_0: { type: "DROP_DOWN"; value: string }; // Payment term
  ドロップダウン_1: { type: "DROP_DOWN"; value: string }; // PO Status (Ordered等)
  McItem?: { type: "SINGLE_LINE_TEXT"; value: string }; // M/C Item
  文字列__1行__9?: { type: "SINGLE_LINE_TEXT"; value: string }; // Model
  文字列__1行__4?: { type: "SINGLE_LINE_TEXT"; value: string }; // Subject/Title
  Table: {
    type: "SUBTABLE";
    value: Array<{
      id: string;
      value: {
        文字列__1行_: { type: "SINGLE_LINE_TEXT"; value: string }; // Item No.
        文字列__1行__0: { type: "SINGLE_LINE_TEXT"; value: string }; // Description
        QTY: { type: "NUMBER"; value: string }; // Quantity
        ドロップダウン: { type: "DROP_DOWN"; value: string }; // Unit
        unit_price: { type: "NUMBER"; value: string }; // Unit Price
        total: { type: "CALC"; value: string }; // Amount
        ドロップダウン_2: { type: "DROP_DOWN"; value: string }; // Status
        ドロップダウン_3: { type: "DROP_DOWN"; value: string }; // Payment
        日付_3: { type: "DATE"; value: string | null }; // Date
        日付_4: { type: "DATE"; value: string | null }; // Date
        文字列__1行__4: { type: "SINGLE_LINE_TEXT"; value: string }; // Notes
      };
    }>;
  };
  [key: string]: any;
}

// Cost Management (コスト管理)
export interface CostRecord extends KintoneRecord {
  // 実際のkintoneアプリから取得したフィールドコードを使用
  数値_0: { type: "NUMBER"; value: string }; // ID
  文字列__1行__15: { type: "SINGLE_LINE_TEXT"; value: string }; // Work No.
  ドロップダウン: { type: "DROP_DOWN"; value: string }; // WN Status (Working/etc)
  日付: { type: "DATE"; value: string }; // Start date
  日付_0: { type: "DATE"; value: string }; // Finish date
  文字列__1行__1: { type: "SINGLE_LINE_TEXT"; value: string }; // PO No.
  日付_1: { type: "DATE"; value: string }; // PO date
  文字列__1行__2: { type: "SINGLE_LINE_TEXT"; value: string }; // CS ID
  ドロップダウン_5: { type: "DROP_DOWN"; value: string }; // Status (Arrived/etc)
  日付_2: { type: "DATE"; value: string }; // Arrival date
  日付_3: { type: "DATE"; value: string }; // INV DATE
  日付_4: { type: "DATE"; value: string }; // Payment date
  ドロップダウン_0: { type: "DROP_DOWN"; value: string }; // Payment term
  文字列__1行__3: { type: "SINGLE_LINE_TEXT"; value: string }; // ITEM
  文字列__1行__7: { type: "SINGLE_LINE_TEXT"; value: string }; // Description(EN)
  ルックアップ_1: { type: "SINGLE_LINE_TEXT"; value: string }; // Supplier name
  文字列__1行__9: { type: "SINGLE_LINE_TEXT"; value: string }; // Model/Type
  unit_price_0: { type: "NUMBER"; value: string }; // unit price
  ドロップダウン_3: { type: "DROP_DOWN"; value: string }; // UNIT
  数値: { type: "NUMBER"; value: string }; // QTY
  total_0: { type: "CALC"; value: string }; // Total
  文字列__1行__8: { type: "SINGLE_LINE_TEXT"; value: string }; // 登録者
  // 追加のフィールド
  日付_5: { type: "DATE"; value: string }; // 追加日付フィールド
  文字列__1行__5: { type: "SINGLE_LINE_TEXT"; value: string }; // 追加文字列フィールド
  文字列__1行__6: { type: "SINGLE_LINE_TEXT"; value: string }; // 追加文字列フィールド
  文字列__1行__12: { type: "SINGLE_LINE_TEXT"; value: string }; // 追加文字列フィールド
  文字列__1行__13: { type: "SINGLE_LINE_TEXT"; value: string }; // 追加文字列フィールド
  ユーザー選択: { type: "USER_SELECT"; value: string }; // ユーザー選択
  // 後方互換のため、元のフィールド名も保持
  ID?: { type: "NUMBER"; value: string }; // ID (alias)
  Work_No?: { type: "SINGLE_LINE_TEXT"; value: string }; // Work No. (alias)
  [key: string]: any;
}

// Invoice Management (請求書管理)
export interface InvoiceRecord extends KintoneRecord {
  文字列__1行_: { type: "SINGLE_LINE_TEXT"; value: string }; // 工事番号 (Work No.)
  文字列__1行__0: { type: "SINGLE_LINE_TEXT"; value: string }; // 請求書番号 (Invoice No.)
  日付: { type: "DATE"; value: string }; // 請求書日付 (Invoice Date)
  文字列__1行__3: { type: "SINGLE_LINE_TEXT"; value: string }; // CS ID
  CS_name: { type: "SINGLE_LINE_TEXT"; value: string }; // 顧客名
  total: { type: "NUMBER"; value: string }; // 合計 (Subtotal)
  計算: { type: "CALC"; value: string }; // 総額 (VAT込み)
  ラジオボタン: { type: "RADIO_BUTTON"; value: string }; // ステータス
  PO_no: { type: "SINGLE_LINE_TEXT"; value: string }; // PO番号
  VAT: { type: "SINGLE_LINE_TEXT"; value: string }; // VAT表示
  Tax_rate: { type: "NUMBER"; value: string }; // 税率
  vatprice: { type: "NUMBER"; value: string }; // VAT金額
  discont: { type: "NUMBER"; value: string }; // 割引 (Discount)
  WHT: { type: "SINGLE_LINE_TEXT"; value: string }; // WHT
  WHT_rate: { type: "NUMBER"; value: string }; // WHTレート
  WHTprice: { type: "NUMBER"; value: string }; // WHT金額
  subtotal: { type: "NUMBER"; value: string }; // サブトータル
  Payment: { type: "SINGLE_LINE_TEXT"; value: string }; // 支払条件
  日付_0: { type: "DATE"; value: string }; // 支払予定日
  日付_1: { type: "DATE"; value: string }; // 支払日
  文字列__1行__5: { type: "SINGLE_LINE_TEXT"; value: string }; // 修理内容
  文字列__1行__6: { type: "SINGLE_LINE_TEXT"; value: string }; // 詳細
  添付ファイル_0: { type: "FILE"; value: any[] }; // 請求書ファイル
  添付ファイル_1: { type: "FILE"; value: any[] }; // その他ファイル
  Lookup: { type: "SINGLE_LINE_TEXT"; value: string }; // ルックアップ
  // 他のフィールドは実際のデータ構造に基づいて後で追加
  [key: string]: any;
}

// Customer List (顧客管理)
export interface CustomerRecord extends KintoneRecord {
  文字列__1行_: { type: "SINGLE_LINE_TEXT"; value: string }; // CS ID
  会社名: { type: "SINGLE_LINE_TEXT"; value: string }; // Company Name
  文字列__1行__4: { type: "SINGLE_LINE_TEXT"; value: string }; // Country
  ランク: { type: "DROP_DOWN"; value: string }; // Rank
  TEL: { type: "SINGLE_LINE_TEXT"; value: string }; // TEL
  FAX: { type: "SINGLE_LINE_TEXT"; value: string }; // FAX
  住所: { type: "SINGLE_LINE_TEXT"; value: string }; // Address
  郵便番号: { type: "SINGLE_LINE_TEXT"; value: string }; // Postal Code
  文字列__1行__0: { type: "SINGLE_LINE_TEXT"; value: string }; // TAX ID
  [key: string]: any;
}

// Customer Staff (顧客担当者)
export interface CustomerStaffRecord extends KintoneRecord {
  CsId_db: { type: "SINGLE_LINE_TEXT"; value: string }; // Customer ID
  Name: { type: "SINGLE_LINE_TEXT"; value: string }; // Name
  Position: { type: "SINGLE_LINE_TEXT"; value: string }; // Position
  Department: { type: "SINGLE_LINE_TEXT"; value: string }; // Department
  Email: { type: "SINGLE_LINE_TEXT"; value: string }; // Email
  Telephone: { type: "SINGLE_LINE_TEXT"; value: string }; // Telephone
  [key: string]: any;
}

// Machine Management (機械管理)
export interface MachineRecord extends KintoneRecord {
  CsId_db: { type: "SINGLE_LINE_TEXT"; value: string }; // Customer ID
  CsName: { type: "SINGLE_LINE_TEXT"; value: string }; // Customer Name
  MachineCategory: { type: "DROP_DOWN"; value: string }; // Machine Category (Press, etc.)
  Drop_down_0: { type: "DROP_DOWN"; value: string }; // Machine Type (Mechanical Press, etc.)
  Vender: { type: "DROP_DOWN"; value: string }; // Vendor/Manufacturer
  Moldel: { type: "SINGLE_LINE_TEXT"; value: string }; // Model
  SrialNo: { type: "SINGLE_LINE_TEXT"; value: string }; // Serial Number
  MCNo: { type: "SINGLE_LINE_TEXT"; value: string }; // Machine Number
  McItem: { type: "SINGLE_LINE_TEXT"; value: string }; // Machine Item
  InstallDate: { type: "DATE"; value: string | null }; // Installation Date
  ManufactureDate: { type: "SINGLE_LINE_TEXT"; value: string }; // Manufacture Date
  Text_area: { type: "MULTI_LINE_TEXT"; value: string }; // Remarks
  Photo: { type: "FILE"; value: any[] }; // Machine Photos
  NamePlate: { type: "FILE"; value: any[] }; // Nameplate Photos
  Qt: { type: "SINGLE_LINE_TEXT"; value: string }; // Quotation Count
  Wn: { type: "SINGLE_LINE_TEXT"; value: string }; // Work No. Count
  RPT: { type: "SINGLE_LINE_TEXT"; value: string }; // Report Count
  QtHistory: { // Quotation History
    type: "SUBTABLE";
    value: Array<{
      id: string;
      value: {
        QtNo: { type: "SINGLE_LINE_TEXT"; value: string }; // Quotation Number
        QtDate: { type: "DATE"; value: string }; // Quotation Date
        QtTitle: { type: "SINGLE_LINE_TEXT"; value: string }; // Quotation Title
        QtProject: { type: "SINGLE_LINE_TEXT"; value: string }; // Project Type
        QtGrandTotal: { type: "NUMBER"; value: string }; // Grand Total
        QtWn: { type: "SINGLE_LINE_TEXT"; value: string }; // Work Number
        QtStatus: { type: "SINGLE_LINE_TEXT"; value: string }; // Status
        QtSales: { type: "SINGLE_LINE_TEXT"; value: string }; // Sales Person
        QtId: { type: "SINGLE_LINE_TEXT"; value: string }; // Quotation Link
      };
    }>;
  };
  [key: string]: any;
}

// APIレスポンスの型
export interface KintoneRecordsResponse<T extends KintoneRecord> {
  records: T[];
  totalCount?: string;
}

export interface KintoneRecordResponse<T extends KintoneRecord> {
  record: T;
}

export interface KintoneErrorResponse {
  id: string;
  code: string;
  message: string;
  errors?: Record<string, {
    messages: string[];
  }>;
}

// フォーム用の簡略化された型
export interface WorkNoFormData {
  work_no: string;
  status: string;
  start_date: string;
  finish_date: string;
  cs_id: string;
  customer_name: string;
  category: string;
  description: string;
  sales_staff: string;
  purchase_cost: number;
  labor_cost: number;
  gross_profit: number;
}

export interface ProjectFormData {
  pj_code: string;
  pj_name: string;
  status: string;
  cs_id: string;
  customer: string;
  start_date: string;
  due_date: string;
  work_no?: string;
}