import { ReactNode } from 'react';

interface ListPageLayoutProps {
  children: ReactNode;
  searchBar?: ReactNode;
  filterBar?: ReactNode;
  recordCount?: ReactNode;
}

// 統一されたリストページレイアウト
export function ListPageLayout({ children, searchBar, filterBar, recordCount }: ListPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 検索バー */}
        {searchBar && (
          <div className="mb-6">
            {searchBar}
          </div>
        )}

        {/* フィルターバーまたはレコード数 */}
        {(filterBar || recordCount) && (
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
            {filterBar}
            {recordCount}
          </div>
        )}

        {/* メインコンテンツ（テーブル） */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}