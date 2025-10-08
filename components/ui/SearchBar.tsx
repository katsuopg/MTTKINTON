'use client';

import { tableStyles } from './TableStyles';

interface SearchBarProps {
  searchQuery?: string;
  placeholder: string;
  searchLabel: string;
  clearLabel: string;
  actionUrl: string;
  additionalHiddenInputs?: Record<string, string | number>;
}

export function SearchBar({
  searchQuery = '',
  placeholder,
  searchLabel,
  clearLabel,
  actionUrl,
  additionalHiddenInputs = {}
}: SearchBarProps) {
  return (
    <div className={tableStyles.searchWrapper}>
      <form method="get" action={actionUrl} className={tableStyles.searchForm}>
        <input
          type="text"
          name="search"
          defaultValue={searchQuery}
          placeholder={placeholder}
          className={tableStyles.searchInput}
        />
        {Object.entries(additionalHiddenInputs).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <button
          type="submit"
          className={tableStyles.searchButton}
        >
          {searchLabel}
        </button>
        {searchQuery && (
          <a
            href={actionUrl + (Object.keys(additionalHiddenInputs).length > 0 
              ? '?' + Object.entries(additionalHiddenInputs).map(([k, v]) => `${k}=${v}`).join('&')
              : '')}
            className={tableStyles.clearButton}
          >
            {clearLabel}
          </a>
        )}
      </form>
    </div>
  );
}