// TailAdmin統一テーブルスタイルの定義
export const tableStyles = {
  // ページレイアウト
  contentWrapper: "p-4 md:p-6",

  // テーブルコンテナ - TailAdminスタイル
  tableContainer: "overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]",

  // テーブル要素 - TailAdminスタイル
  table: "min-w-full",
  thead: "border-b border-gray-100 dark:border-white/[0.05]",
  th: "px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400",
  tbody: "divide-y divide-gray-100 dark:divide-white/[0.05]",
  tr: "hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors duration-150",
  trClickable: "hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors duration-150 cursor-pointer",
  td: "px-4 py-3 whitespace-nowrap text-theme-sm text-gray-500 dark:text-gray-400",
  tdPrimary: "text-gray-800 dark:text-white/90 font-medium",
  tdLink: "text-gray-800 dark:text-white/90 hover:text-brand-500 dark:hover:text-brand-400 font-medium",
  emptyRow: "px-4 py-6 text-center text-theme-sm text-gray-500 dark:text-gray-400",

  // 検索バー - TailAdminスタイル
  searchWrapper: "mb-4",
  searchForm: "flex items-center gap-3",
  searchInput: "flex-1 max-w-md px-4 py-2.5 text-theme-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300",
  searchButton: "px-4 py-2.5 border border-transparent text-theme-sm font-medium rounded-lg shadow-theme-xs text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500",
  clearButton: "px-3 py-2 text-theme-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",

  // フィルターバー
  filterBar: "mb-4",

  // レコード数表示
  recordCount: "text-theme-sm text-gray-500 dark:text-gray-400",

  // ステータスバッジ - TailAdminスタイル
  statusBadge: "inline-flex items-center px-2.5 py-0.5 rounded-full text-theme-xs font-medium",

  // アバタースタイル
  avatar: "w-8 h-8 rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-200 flex items-center justify-center text-sm font-medium",

  // タグスタイル
  tag: "inline-flex items-center px-2 py-0.5 rounded text-theme-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",

  // ボタンスタイル
  addButton: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500",
  editButton: "text-brand-500 hover:text-brand-600 text-sm font-medium",
  deleteButton: "text-rose-500 hover:text-rose-600 text-sm font-medium",

  // タッチターゲット統一（44px）
  touchTarget: "min-w-[44px] min-h-[44px] flex items-center justify-center",
  iconButton: "min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-white/[0.05] transition-colors",

  // モバイルカードビュー
  mobileOnly: "md:hidden",
  desktopOnly: "hidden md:block",
  mobileCardList: "md:hidden divide-y divide-gray-100 dark:divide-white/[0.05]",
  mobileCard: "px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] active:bg-gray-100 dark:active:bg-white/[0.04] transition-colors cursor-pointer",
  mobileCardHeader: "flex items-center justify-between gap-2",
  mobileCardTitle: "text-sm font-medium text-gray-800 dark:text-white/90 truncate",
  mobileCardSubtitle: "text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate",
  mobileCardMeta: "text-xs text-gray-400 dark:text-gray-500",
  mobileCardFields: "mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5",
  mobileCardFieldLabel: "text-xs text-gray-400 dark:text-gray-500",
  mobileCardFieldValue: "text-xs text-gray-600 dark:text-gray-300",
  mobileCardBadges: "mt-1.5 flex items-center gap-1.5",
  mobileCardChevron: "flex-shrink-0 w-4 h-4 text-gray-300 dark:text-gray-600",

  // 旧スタイル（後方互換性のため）
  wrapper: "overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]",
  header: "px-5 py-4 flex justify-between items-center border-b border-gray-100 dark:border-white/[0.05]",
  title: "text-lg font-semibold text-gray-800 dark:text-white"
};