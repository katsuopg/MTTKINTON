'use client';

import { ReactNode } from 'react';

interface TabItem {
  key: string;
  label: string;
  badge?: number | string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  variant?: 'pill' | 'underline' | 'bordered';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// TailAdmin ChartTab Style Tabs Component
export default function Tabs({
  tabs,
  activeTab,
  onTabChange,
  variant = 'pill',
  size = 'md',
  className = '',
}: TabsProps) {
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-theme-xs',
    md: 'px-3 py-2 text-theme-sm',
    lg: 'px-4 py-2.5 text-theme-sm',
  };

  // Pill variant (ChartTab style)
  if (variant === 'pill') {
    return (
      <div className={`flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900 ${className}`}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`${sizeClasses[size]} font-medium rounded-md transition-colors hover:text-gray-900 dark:hover:text-white flex items-center gap-2 ${
              activeTab === tab.key
                ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-theme-xs font-medium ${
                activeTab === tab.key
                  ? 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Underline variant
  if (variant === 'underline') {
    return (
      <div className={`flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 ${className}`}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`${sizeClasses[size]} font-medium transition-colors relative flex items-center gap-2 ${
              activeTab === tab.key
                ? 'text-brand-500 dark:text-brand-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-theme-xs font-medium ${
                activeTab === tab.key
                  ? 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {tab.badge}
              </span>
            )}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 dark:bg-brand-400" />
            )}
          </button>
        ))}
      </div>
    );
  }

  // Bordered variant
  return (
    <div className={`flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {tabs.map((tab, index) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`${sizeClasses[size]} font-medium transition-colors flex items-center gap-2 ${
            activeTab === tab.key
              ? 'text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-800'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          } ${index !== tabs.length - 1 ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && (
            <span className={`px-1.5 py-0.5 rounded-full text-theme-xs font-medium ${
              activeTab === tab.key
                ? 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400'
                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// Tab Panel component for content
interface TabPanelProps {
  children: ReactNode;
  value: string;
  activeValue: string;
  className?: string;
}

export function TabPanel({ children, value, activeValue, className = '' }: TabPanelProps) {
  if (value !== activeValue) return null;
  return <div className={className}>{children}</div>;
}
