'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const sizeMap = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center py-10">
      <div className={`animate-spin ${sizeMap[size]} border-2 border-brand-500 border-t-transparent rounded-full`} />
      {message && (
        <span className="ml-3 text-gray-500 dark:text-gray-400">{message}</span>
      )}
    </div>
  );
}
