export interface MenuItemDef {
  key: string;
  path: string;
  name: { ja: string; en: string; th: string };
  icon: string;
  appCode?: string;
  requiredPermission?: 'manage_settings' | 'import_data';
  /** 共通項目の配置位置: 'top'=グループの上, 'bottom'=グループの下 */
  common?: 'top' | 'bottom';
}

export const MENU_ITEMS: MenuItemDef[] = [
  { key: 'dashboard', path: 'dashboard', name: { ja: 'TOP', en: 'TOP', th: 'TOP' }, icon: 'home', common: 'top' },
  { key: 'workno', path: 'workno', name: { ja: '工事管理', en: 'Work Management', th: 'จัดการงาน' }, icon: 'document', appCode: 'work_numbers' },
  { key: 'project-management', path: 'project-management', name: { ja: 'プロジェクト管理', en: 'Project Management', th: 'จัดการโครงการ' }, icon: 'clipboard', appCode: 'projects' },
  { key: 'customers', path: 'customers', name: { ja: '顧客管理', en: 'Customer List', th: 'จัดการลูกค้า' }, icon: 'users', appCode: 'customers' },
  { key: 'staff', path: 'staff', name: { ja: '担当者管理', en: 'Staff Management', th: 'จัดการผู้ติดต่อ' }, icon: 'userGroup' },
  { key: 'suppliers', path: 'suppliers', name: { ja: '仕入業者管理', en: 'Supplier Management', th: 'จัดการซัพพลายเออร์' }, icon: 'truck', appCode: 'suppliers' },
  { key: 'employees', path: 'employees', name: { ja: '従業員管理', en: 'Employee Management', th: 'จัดการพนักงาน' }, icon: 'user', appCode: 'employees' },
  { key: 'parts-list', path: 'parts-list', name: { ja: 'パーツリスト', en: 'Parts List', th: 'รายการชิ้นส่วน' }, icon: 'list' },
  { key: 'quote-requests', path: 'quote-requests', name: { ja: '見積依頼', en: 'Quote Requests', th: 'ใบขอใบเสนอราคา' }, icon: 'fileQuestion' },
  { key: 'purchase-request', path: 'purchase-request', name: { ja: '購買依頼', en: 'Purchase Request', th: 'คำขอจัดซื้อ' }, icon: 'cart' },
  { key: 'quotation', path: 'quotation', name: { ja: '見積もり管理', en: 'Quotation Management', th: 'จัดการใบเสนอราคา' }, icon: 'calculator', appCode: 'quotations' },
  { key: 'order-management', path: 'order-management', name: { ja: '注文書管理', en: 'Order Management', th: 'จัดการใบสั่งซื้อ' }, icon: 'clipboardDoc', appCode: 'orders' },
  { key: 'po-management', path: 'po-management', name: { ja: '発注管理', en: 'PO Management', th: 'การจัดการใบสั่งซื้อ' }, icon: 'documentText', appCode: 'purchase_orders' },
  { key: 'cost-management', path: 'cost-management', name: { ja: 'コスト管理', en: 'Cost Management', th: 'การจัดการต้นทุน' }, icon: 'chart' },
  { key: 'invoice-management', path: 'invoice-management', name: { ja: '請求書管理', en: 'Invoice Management', th: 'จัดการใบแจ้งหนี้' }, icon: 'dollar', appCode: 'invoices' },
  { key: 'machines', path: 'machines', name: { ja: '機械管理', en: 'Machine Management', th: 'การจัดการเครื่องจักร' }, icon: 'cog', appCode: 'machines' },
  { key: 'settings', path: 'settings', name: { ja: 'システム管理', en: 'System Management', th: 'การจัดการระบบ' }, icon: 'settings', requiredPermission: 'manage_settings', common: 'bottom' },
  { key: 'import-data', path: 'import-data', name: { ja: 'データ同期', en: 'Data Sync', th: 'ซิงก์ข้อมูล' }, icon: 'database', requiredPermission: 'import_data', common: 'bottom' },
];

/** 共通項目のキー一覧（全て） */
export const COMMON_MENU_KEYS = MENU_ITEMS.filter((item) => item.common).map((item) => item.key);
/** 上部共通項目のキー */
export const COMMON_TOP_KEYS = MENU_ITEMS.filter((item) => item.common === 'top').map((item) => item.key);
/** 下部共通項目のキー */
export const COMMON_BOTTOM_KEYS = MENU_ITEMS.filter((item) => item.common === 'bottom').map((item) => item.key);

export interface MenuConfigItem {
  menu_key: string;
  display_order: number;
  is_visible: boolean;
}

/** グループ化メニュー設定の型 */
export interface GroupedMenuConfig {
  commonItems: MenuConfigItem[];
  groups: {
    organizationId: string;
    organizationName: string;
    organizationNameEn: string | null;
    organizationNameTh: string | null;
    displayOrder: number;
    items: MenuConfigItem[];
  }[];
}

/**
 * メニュー設定を適用して並び替え + 非表示除外
 * 設定なし → 全項目をデフォルト順で返却
 * 設定あり → 設定順に並び替え、is_visible=false を除外。設定に無い新規項目は末尾にappend
 */
export function applyMenuConfig<T extends { key: string }>(
  items: T[],
  menuConfig: MenuConfigItem[] | null
): T[] {
  if (!menuConfig || menuConfig.length === 0) {
    return items;
  }

  const configMap = new Map(menuConfig.map((c) => [c.menu_key, c]));
  const configured: T[] = [];
  const unconfigured: T[] = [];

  for (const item of items) {
    const config = configMap.get(item.key);
    if (config) {
      if (config.is_visible) {
        configured.push(item);
      }
    } else {
      unconfigured.push(item);
    }
  }

  configured.sort((a, b) => {
    const orderA = configMap.get(a.key)!.display_order;
    const orderB = configMap.get(b.key)!.display_order;
    return orderA - orderB;
  });

  return [...configured, ...unconfigured];
}

/**
 * グループ化メニュー設定を適用
 * 上部共通項目 → 組織グループ → 下部共通項目 の順で配置
 * 重複項目は最初のグループにのみ表示
 */
export function applyGroupedMenuConfig<T extends { key: string }>(
  allItems: T[],
  groupedConfig: GroupedMenuConfig,
  commonKeys: string[],
  topKeys: string[] = [],
  bottomKeys: string[] = []
): {
  commonTop: T[];
  commonBottom: T[];
  groups: {
    orgId: string;
    orgName: string;
    orgNameEn: string | null;
    orgNameTh: string | null;
    items: T[];
  }[];
} {
  const itemMap = new Map(allItems.map((item) => [item.key, item]));
  const commonConfigMap = new Map(groupedConfig.commonItems.map((c) => [c.menu_key, c]));

  // 共通項目をtop/bottomに振り分け
  const buildCommonList = (keys: string[]): T[] => {
    const configured: { item: T; order: number }[] = [];
    const unconfigured: T[] = [];
    for (const key of keys) {
      const item = itemMap.get(key);
      if (!item) continue;
      const config = commonConfigMap.get(key);
      if (config) {
        if (config.is_visible) configured.push({ item, order: config.display_order });
      } else {
        unconfigured.push(item);
      }
    }
    configured.sort((a, b) => a.order - b.order);
    return [...configured.map((c) => c.item), ...unconfigured];
  };

  const commonTop = buildCommonList(topKeys.length > 0 ? topKeys : commonKeys);
  const commonBottom = buildCommonList(bottomKeys);

  // グループ: displayOrder順にソート → 重複排除
  const usedKeys = new Set(commonKeys);
  const sortedGroups = [...groupedConfig.groups].sort((a, b) => a.displayOrder - b.displayOrder);

  const groups: {
    orgId: string;
    orgName: string;
    orgNameEn: string | null;
    orgNameTh: string | null;
    items: T[];
  }[] = [];

  for (const group of sortedGroups) {
    const configured: { item: T; order: number }[] = [];
    const configItems = group.items || [];

    for (const configItem of configItems) {
      if (usedKeys.has(configItem.menu_key)) continue;
      if (!configItem.is_visible) continue;
      const item = itemMap.get(configItem.menu_key);
      if (!item) continue;
      configured.push({ item, order: configItem.display_order });
    }

    configured.sort((a, b) => a.order - b.order);
    const groupItems = configured.map((c) => c.item);

    // 空グループは除外
    if (groupItems.length === 0) continue;

    // 使用済みキーに追加
    for (const item of groupItems) {
      usedKeys.add(item.key);
    }

    groups.push({
      orgId: group.organizationId,
      orgName: group.organizationName,
      orgNameEn: group.organizationNameEn,
      orgNameTh: group.organizationNameTh,
      items: groupItems,
    });
  }

  return { commonTop, commonBottom, groups };
}
