// 統一されたテーブルスタイルの定義
// デザイン統一版 - コーポレートサイト向け

export const tableStyles = {
  // ページレイアウト - DashboardLayoutで余白が統一されているため、ここでは0
  contentWrapper: "",

  // テーブルコンテナ
  tableContainer: "bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden",

  // テーブル要素
  table: "w-full",
  thead: "bg-slate-50 border-b border-slate-200",
  th: "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider",
  tbody: "divide-y divide-slate-100",

  // 通常行
  tr: "hover:bg-slate-50 transition-colors duration-150",

  // クリック可能な行（行全体がリンク）
  trClickable: "hover:bg-indigo-50 cursor-pointer transition-colors duration-150 group",

  // セル
  td: "whitespace-nowrap px-4 py-3 text-sm text-slate-700",
  tdCompact: "whitespace-nowrap px-4 py-2 text-sm text-slate-700",

  // リンクスタイル（行クリック時の主要カラム）
  tdPrimary: "font-medium text-slate-900 group-hover:text-indigo-600",
  tdLink: "text-indigo-600 hover:text-indigo-900 font-medium",

  // 空の行
  emptyRow: "px-4 py-8 text-center text-sm text-slate-500",
  emptyIcon: "mx-auto h-12 w-12 text-slate-300 mb-3",

  // 検索バー
  searchWrapper: "mb-5",
  searchForm: "flex items-center gap-3 flex-wrap",
  searchInput: "flex-1 min-w-[200px] max-w-sm px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow",
  searchButton: "px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors",
  clearButton: "px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors",

  // フィルター/セレクトボックス
  select: "px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",

  // フィルターバー
  filterBar: "flex items-center justify-between mb-4",

  // レコード数表示
  recordCount: "text-sm text-slate-600",

  // ステータスバッジ
  statusBadge: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
  statusActive: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
  statusInactive: "bg-slate-100 text-slate-600 ring-1 ring-slate-500/20",
  statusPending: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",

  // タグ/チップ
  tag: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700",
  tagSmall: "inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600",

  // プライマリボタン
  buttonPrimary: "inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors",

  // セカンダリボタン
  buttonSecondary: "inline-flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors",

  // アバター
  avatar: "h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium",
  avatarSmall: "h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium",

  // カード（詳細ページ用）
  card: "bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden",
  cardHeader: "px-5 py-4 border-b border-slate-200 bg-slate-50",
  cardTitle: "text-base font-semibold text-slate-900",
  cardBody: "p-5",

  // フォーム用
  formSection: "space-y-5",
  formLabel: "block text-sm font-medium text-slate-700 mb-1.5",
  formInput: "w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow",
  formInputError: "border-red-300 focus:ring-red-500 focus:border-red-500",
  formHint: "mt-1 text-xs text-slate-500",

  // 入力フィールド（編集モード用）
  input: "w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow",

  // 旧スタイル（後方互換性のため）
  wrapper: "bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden",
  header: "px-5 py-4 flex justify-between items-center border-b border-slate-200",
  title: "text-lg font-semibold text-slate-900"
};

// 行クリック用のラッパーコンポーネント
export const ClickableRow = ({ href, children, className = '' }: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <tr
      className={`${tableStyles.trClickable} ${className}`}
      onClick={() => window.location.href = href}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          window.location.href = href;
        }
      }}
    >
      {children}
    </tr>
  );
};
