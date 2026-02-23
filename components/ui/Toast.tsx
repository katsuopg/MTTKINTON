'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';

// ===== Types =====
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastEntry extends ToastOptions {
  id: string;
  createdAt: number;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

// ===== Context =====
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ===== Config =====
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 4000,
};

const MAX_TOASTS = 5;

let toastCounter = 0;

// ===== Icons =====
function SuccessIcon() {
  return (
    <svg className="w-5 h-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="w-5 h-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="w-5 h-5 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

const TOAST_ICONS: Record<ToastType, React.FC> = {
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
};

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'border-success-200 bg-white dark:border-success-500/30 dark:bg-gray-800',
  error: 'border-error-200 bg-white dark:border-error-500/30 dark:bg-gray-800',
  warning: 'border-warning-200 bg-white dark:border-warning-500/30 dark:bg-gray-800',
  info: 'border-brand-200 bg-white dark:border-brand-500/30 dark:bg-gray-800',
};

const PROGRESS_STYLES: Record<ToastType, string> = {
  success: 'bg-success-500',
  error: 'bg-error-500',
  warning: 'bg-warning-500',
  info: 'bg-brand-500',
};

// ===== ToastItem =====
function ToastItem({
  entry,
  onRemove,
}: {
  entry: ToastEntry;
  onRemove: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const duration = entry.duration ?? DEFAULT_DURATIONS[entry.type];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Slide in
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto dismiss
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      handleClose();
    }, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(entry.id), 300);
  }, [entry.id, onRemove]);

  const Icon = TOAST_ICONS[entry.type];

  return (
    <div
      role="alert"
      className={`
        pointer-events-auto w-80 max-w-[calc(100vw-2rem)] rounded-xl border shadow-theme-lg
        transition-all duration-300 ease-out overflow-hidden
        ${TOAST_STYLES[entry.type]}
        ${visible && !exiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="shrink-0 mt-0.5">
          <Icon />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {entry.title}
          </p>
          {entry.message && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {entry.message}
            </p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-1 w-full bg-gray-100 dark:bg-gray-700">
        <div
          className={`h-full ${PROGRESS_STYLES[entry.type]} transition-none`}
          style={{
            animation: `toast-progress ${duration}ms linear forwards`,
          }}
        />
      </div>
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// ===== ToastContainer =====
function ToastContainer({ toasts, onRemove }: { toasts: ToastEntry[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[999999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((entry) => (
        <ToastItem key={entry.id} entry={entry} onRemove={onRemove} />
      ))}
    </div>
  );
}

// ===== Provider =====
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = `toast-${++toastCounter}`;
    const entry: ToastEntry = { ...options, id, createdAt: Date.now() };

    setToasts((prev) => {
      const next = [...prev, entry];
      // 最大数を超えたら古いものから削除
      if (next.length > MAX_TOASTS) {
        return next.slice(next.length - MAX_TOASTS);
      }
      return next;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}
