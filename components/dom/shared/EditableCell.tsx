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
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : '';

  if (readOnly) {
    const displayValue = value ?? '';
    const formatted = type === 'number' && displayValue !== ''
      ? Number(displayValue).toLocaleString()
      : String(displayValue);
    return (
      <span className={`block py-1 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap overflow-hidden text-ellipsis ${alignClass} ${className}`}>
        {formatted || <span className="text-gray-300 dark:text-gray-600">{placeholder || '-'}</span>}
      </span>
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
      className={`w-full py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-brand-500 dark:text-white disabled:opacity-50 ${alignClass} ${className}`}
    />
  );
}
