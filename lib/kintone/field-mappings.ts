// kintoneフィールドの多言語マッピング
export const workNoFieldMappings = {
  // 基本情報
  WorkNo: {
    ja: '工事番号',
    en: 'Work No.',
    th: 'เลขที่งาน'
  },
  Status: {
    ja: 'ステータス',
    en: 'Status',
    th: 'สถานะ'
  },
  日付_6: {
    ja: '開始日',
    en: 'Start Date',
    th: 'วันที่เริ่มต้น'
  },
  日付_5: {
    ja: '完了日',
    en: 'Finish date',
    th: 'วันที่เสร็จสิ้น'
  },
  Salesdate: {
    ja: '予定納期',
    en: 'Scheduled sales date',
    th: 'กำหนดส่งมอบ'
  },
  Salesstaff: {
    ja: '営業担当',
    en: 'Sales staff',
    th: 'พนักงานขาย'
  },
  
  // 顧客情報
  文字列__1行__8: {
    ja: '顧客ID',
    en: 'CS ID',
    th: 'รหัสลูกค้า'
  },
  文字列__1行__0: {
    ja: '顧客名',
    en: 'Customer name',
    th: 'ชื่อลูกค้า'
  },
  文字列__1行__1: {
    ja: 'カテゴリ',
    en: 'Category',
    th: 'หมวดหมู่'
  },
  文字列__1行__2: {
    ja: '説明',
    en: 'Description',
    th: 'คำอธิบาย'
  },
  
  // 製品情報
  Type: {
    ja: 'タイプ',
    en: 'Type',
    th: 'ประเภท'
  },
  文字列__1行__5: {
    ja: 'ベンダー',
    en: 'Vender',
    th: 'ผู้จำหน่าย'
  },
  文字列__1行__9: {
    ja: 'モデル',
    en: 'Model',
    th: 'รุ่น'
  },
  文字列__1行__10: {
    ja: 'シリアル番号',
    en: 'Serial No.',
    th: 'หมายเลขซีเรียล'
  },
  文字列__1行__11: {
    ja: 'M/C番号',
    en: 'M/C No.',
    th: 'หมายเลข M/C'
  },
  McItem: {
    ja: 'M/C項目',
    en: 'M/C Item',
    th: 'รายการ M/C'
  },
  
  // 金額情報
  Sub_total: {
    ja: '小計',
    en: 'Sub total',
    th: 'ยอดรวมย่อย'
  },
  Discount: {
    ja: '値引き',
    en: 'Discount',
    th: 'ส่วนลด'
  },
  grand_total: {
    ja: '合計',
    en: 'Grand total',
    th: 'ยอดรวมทั้งหมด'
  },
  cost: {
    ja: '仕入原価',
    en: 'Purchase cost',
    th: 'ต้นทุนซื้อ'
  },
  計算_1: {
    ja: 'コスト合計',
    en: 'Cost Total',
    th: 'ต้นทุนรวม'
  },
  数値: {
    ja: 'コスト予測',
    en: 'Cost forecast',
    th: 'ประมาณการต้นทุน'
  },
  Labor_cost: {
    ja: '労務費',
    en: 'Labor cost',
    th: 'ค่าแรง'
  },
  Cost_Total: {
    ja: 'コスト合計',
    en: 'Cost Total',
    th: 'ต้นทุนรวม'
  },
  profit: {
    ja: '粗利益',
    en: 'Gross Profit',
    th: 'กำไรขั้นต้น'
  },
  OverHead: {
    ja: 'オーバーヘッド',
    en: 'Over Head Fee',
    th: 'ค่าใช้จ่ายทางอ้อม'
  },
  OverRate: {
    ja: 'オーバーヘッド率',
    en: 'Over Head Fee Rate',
    th: 'อัตราค่าใช้จ่ายทางอ้อม'
  },
  OperationProfit: {
    ja: '営業利益',
    en: 'Operation Profit',
    th: 'กำไรจากการดำเนินงาน'
  },
  ComRate: {
    ja: 'コミッション率',
    en: 'Commission Rate',
    th: 'อัตราค่าคอมมิชชั่น'
  },
  計算: {
    ja: 'コミッション',
    en: 'Commission',
    th: 'ค่าคอมมิชชั่น'
  }
} as const;

// 言語タイプ
export type Language = 'ja' | 'en' | 'th';

// フィールド名を取得するヘルパー関数
export function getFieldLabel(fieldId: string, language: Language): string {
  const mapping = workNoFieldMappings[fieldId as keyof typeof workNoFieldMappings];
  if (!mapping) {
    // マッピングがない場合はフィールドIDをそのまま返す
    return fieldId;
  }
  return mapping[language] || mapping['en'] || fieldId;
}

// ステータスの値も多言語対応
export const statusMappings = {
  Working: {
    ja: '進行中',
    en: 'Working',
    th: 'กำลังดำเนินการ'
  },
  Sent: {
    ja: '送付済',
    en: 'Sent',
    th: 'ส่งแล้ว'
  },
  Finished: {
    ja: '完了',
    en: 'Finished',
    th: 'เสร็จสิ้น'
  },
  'Wating PO': {
    ja: 'PO待ち',
    en: 'Wating PO',
    th: 'รอใบสั่งซื้อ'
  },
  Stock: {
    ja: '在庫',
    en: 'Stock',
    th: 'คลังสินค้า'
  },
  Pending: {
    ja: '保留',
    en: 'Pending',
    th: 'รอดำเนินการ'
  },
  Cancel: {
    ja: 'キャンセル',
    en: 'Cancel',
    th: 'ยกเลิก'
  },
  'キャンセル': {
    ja: 'キャンセル',
    en: 'Cancel',
    th: 'ยกเลิก'
  },
  Expenses: {
    ja: '経費',
    en: 'Expenses',
    th: 'ค่าใช้จ่าย'
  },
  WIP: {
    ja: '作業中',
    en: 'WIP',
    th: 'กำลังทำงาน'
  },
  '完了': {
    ja: '完了',
    en: 'Completed',
    th: 'เสร็จสมบูรณ์'
  },
  Completed: {
    ja: '完了',
    en: 'Completed',
    th: 'เสร็จสมบูรณ์'
  },
  Accepted: {
    ja: '承認済',
    en: 'Accepted',
    th: 'อนุมัติแล้ว'
  }
} as const;

export function getStatusLabel(status: string, language: Language): string {
  const mapping = statusMappings[status as keyof typeof statusMappings];
  if (!mapping) {
    return status;
  }
  return mapping[language] || mapping['en'] || status;
}

export function getStatusOptions(): string[] {
  return Object.keys(statusMappings);
}