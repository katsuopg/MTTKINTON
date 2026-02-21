// TailAdmin統一詳細画面スタイルの定義
export const detailStyles = {
  // ページコンテナ
  pageWrapper: "p-4 md:p-6 space-y-6",

  // カード（TailAdmin統一）
  card: "rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]",
  cardHeader: "px-5 py-4 border-b border-gray-100 dark:border-gray-800",
  cardHeaderWithBg: "px-5 py-4 border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50",
  cardTitle: "text-lg font-semibold text-gray-800 dark:text-white",
  cardContent: "p-5 lg:p-6",

  // フィールド表示
  fieldLabel: "text-sm font-medium text-gray-500 dark:text-gray-400",
  fieldValue: "text-sm text-gray-800 dark:text-white/90",
  fieldValueLarge: "text-lg text-gray-800 dark:text-white/90",

  // グリッドレイアウト
  grid2: "grid grid-cols-1 md:grid-cols-2 gap-4",
  grid3: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
  grid4: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",

  // Description List（フィールド一覧）
  dl: "divide-y divide-gray-100 dark:divide-gray-800",
  dlRow: "px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6",
  dlLabel: "text-sm font-medium text-gray-500 dark:text-gray-400",
  dlValue: "mt-1 text-sm text-gray-800 dark:text-white/90 sm:col-span-2 sm:mt-0",

  // セクションスペーサー
  sectionSpace: "mt-6",
  sectionSpaceLarge: "mt-8",

  // ステータスバッジ
  badge: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
  badgeSuccess: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  badgeWarning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  badgeInfo: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  badgeDanger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  badgeDefault: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",

  // ボタン
  primaryButton: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-900",
  secondaryButton: "inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:border-gray-600 dark:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900",
  dangerButton: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900",

  // リンク
  link: "text-brand-500 hover:text-brand-600 font-medium dark:text-brand-400 dark:hover:text-brand-300",

  // テーブル（カード内）
  table: "min-w-full divide-y divide-gray-200 dark:divide-gray-800",
  tableHead: "bg-gray-50 dark:bg-gray-900/50",
  tableHeadCell: "px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400",
  tableBody: "bg-white divide-y divide-gray-200 dark:bg-transparent dark:divide-gray-800",
  tableRow: "hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors",
  tableCell: "px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400",
  tableCellPrimary: "px-3 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-white/90 font-medium",

  // ヘッダー
  pageHeader: "mb-6",
  pageTitle: "text-2xl font-bold text-gray-900 dark:text-white",
  pageSubtitle: "mt-1 text-sm text-gray-500 dark:text-gray-400",

  // 金額表示
  amountLarge: "text-2xl font-semibold text-gray-900 dark:text-white",
  amountHighlight: "text-3xl font-bold text-brand-600 dark:text-brand-400",
  amountRed: "text-lg text-red-600 dark:text-red-400",

  // 空状態
  emptyState: "text-center py-8 text-gray-500 dark:text-gray-400",

  // サマリーカード（4カラム用）
  summaryCard: "bg-white rounded-lg border border-gray-200 p-4 dark:bg-white/[0.03] dark:border-gray-800",
  summaryCardTitle: "text-sm font-semibold text-gray-900 dark:text-white mb-3",
  summaryTable: "w-full text-sm",
  summaryRow: "py-1",
  summaryLabel: "text-gray-600 dark:text-gray-400",
  summaryValue: "text-right text-gray-900 dark:text-white/90",

  // タブ関連（カスタムタブ用）
  tabList: "border-b border-gray-200 dark:border-gray-700",
  tabButton: "inline-flex items-center justify-center px-4 py-3 border-b-2 font-medium text-sm",
  tabButtonActive: "text-brand-600 border-brand-600 bg-brand-50 dark:text-brand-400 dark:border-brand-400 dark:bg-brand-900/20",
  tabButtonInactive: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800/50",
  tabIcon: "mr-2 h-5 w-5",
  tabIconActive: "text-brand-600 dark:text-brand-400",
  tabIconInactive: "text-gray-400 group-hover:text-gray-500 dark:text-gray-500",
  tabBadge: "ml-2 px-2 py-0.5 text-xs font-medium rounded-full",
  tabBadgeActive: "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400",
  tabBadgeInactive: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

// ステータスに応じたバッジカラーを取得
export function getStatusBadgeClass(status: string): string {
  const normalizedStatus = status?.toLowerCase() || '';

  if (normalizedStatus.includes('finish') || normalizedStatus.includes('complete') || normalizedStatus.includes('arrived')) {
    return detailStyles.badge + ' ' + detailStyles.badgeSuccess;
  }
  if (normalizedStatus.includes('working') || normalizedStatus.includes('progress') || normalizedStatus.includes('ordered')) {
    return detailStyles.badge + ' ' + detailStyles.badgeInfo;
  }
  if (normalizedStatus.includes('waiting') || normalizedStatus.includes('pending')) {
    return detailStyles.badge + ' ' + detailStyles.badgeWarning;
  }
  if (normalizedStatus.includes('cancel') || normalizedStatus.includes('error') || normalizedStatus.includes('fail')) {
    return detailStyles.badge + ' ' + detailStyles.badgeDanger;
  }

  return detailStyles.badge + ' ' + detailStyles.badgeDefault;
}
