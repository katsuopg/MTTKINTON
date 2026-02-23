'use client';

import React from 'react';

interface EditableCellProps {
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  type?: 'text' | 'number';
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  align?: 'left' | 'center' | 'right';
}

export default function EditableCell({
  value,
  onChange,
  type = 'text',
  className = '',
  placeholder = '',
  disabled = false,
  readOnly = false,
  align = 'left',
}: EditableCellProps) {
  const textAlign = align as React.CSSProperties['textAlign'];

  if (readOnly) {
    const displayValue = value ?? '';
    const formatted = type === 'number' && displayValue !== ''
      ? Number(displayValue).toLocaleString()
      : String(displayValue);
    return (
      <div style={{ textAlign }} className={`py-1 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap ${className}`}>
        {formatted || <span className="text-gray-300 dark:text-gray-600">{placeholder || '-'}</span>}
      </div>
    );
  }

  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => {
        const v = type === 'number'
          ? (e.target.value === '' ? null : Number(e.target.value))
          : e.target.value;
        onChange(v);
      }}
      placeholder={placeholder}
      disabled={disabled}
      style={{ textAlign }}
      className={`w-full px-1.5 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 dark:text-white disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${className}`}
    />
  );
}
