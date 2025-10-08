// 統一されたテーブルスタイルの定義（プロジェクト管理ページベース）
export const tableStyles = {
  // ページレイアウト - 工事番号管理と同じ構造
  contentWrapper: "py-4 px-4",
  
  // テーブルコンテナ
  tableContainer: "bg-white shadow-sm rounded-lg overflow-hidden",
  
  // テーブル要素
  table: "w-full divide-y divide-gray-200",
  thead: "bg-gray-50",
  th: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
  tbody: "bg-white divide-y divide-gray-200",
  tr: "hover:bg-gray-50 transition-colors duration-150",
  td: "px-4 py-2 whitespace-nowrap text-sm text-gray-900",
  tdLink: "text-indigo-600 hover:text-indigo-900 font-medium",
  emptyRow: "px-4 py-2 text-center text-sm text-gray-500",
  
  // 検索バー - プロジェクト管理と同じスタイル
  searchWrapper: "mb-4",
  searchForm: "flex items-center gap-3",
  searchInput: "flex-1 max-w-md px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm",
  searchButton: "px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
  clearButton: "px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700",
  
  // フィルターバー - プロジェクト管理と同じスタイル
  filterBar: "mb-4",
  
  // レコード数表示
  recordCount: "text-sm text-gray-600",
  
  // ステータスバッジ
  statusBadge: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
  
  // 旧スタイル（後方互換性のため）
  wrapper: "bg-white shadow-sm rounded-lg overflow-hidden",
  header: "px-4 py-2 flex justify-between items-center border-b border-gray-200",
  title: "text-lg leading-6 font-medium text-gray-900"
};