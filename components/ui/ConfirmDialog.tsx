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
type DialogVariant = 'danger' | 'warning' | 'info';

interface DialogOptions {
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface DialogState extends DialogOptions {
  resolve: (value: boolean) => void;
}

interface DialogContextValue {
  confirmDialog: (options: DialogOptions) => Promise<boolean>;
}

// ===== Context =====
const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function useConfirmDialog(): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within a DialogProvider');
  }
  return context;
}

// ===== Variant Styles =====
const VARIANT_ICON_BG: Record<DialogVariant, string> = {
  danger: 'bg-error-100 dark:bg-error-500/20',
  warning: 'bg-warning-100 dark:bg-warning-500/20',
  info: 'bg-brand-100 dark:bg-brand-500/20',
};

const VARIANT_CONFIRM_BTN: Record<DialogVariant, string> = {
  danger: 'bg-error-600 hover:bg-error-700 focus:ring-error-500',
  warning: 'bg-warning-600 hover:bg-warning-700 focus:ring-warning-500',
  info: 'bg-brand-600 hover:bg-brand-700 focus:ring-brand-500',
};

// ===== Icons =====
function DangerIcon() {
  return (
    <svg className="w-6 h-6 text-error-600 dark:text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="w-6 h-6 text-warning-600 dark:text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

const VARIANT_ICONS: Record<DialogVariant, React.FC> = {
  danger: DangerIcon,
  warning: WarningIcon,
  info: InfoIcon,
};

// ===== ConfirmDialog Component =====
function ConfirmDialogModal({ state, onClose }: { state: DialogState; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const variant = state.variant ?? 'danger';
  const Icon = VARIANT_ICONS[variant];

  // Fade in
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Focus trap: focus cancel button on open
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve(true);
    onClose();
  }, [state, onClose]);

  const handleCancel = useCallback(() => {
    state.resolve(false);
    onClose();
  }, [state, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-theme-xl w-full max-w-md transition-all duration-200 ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${VARIANT_ICON_BG[variant]}`}>
              <Icon />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {state.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {state.message}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            {state.cancelLabel ?? 'キャンセル'}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${VARIANT_CONFIRM_BTN[variant]}`}
          >
            {state.confirmLabel ?? '確認'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Provider =====
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogState] = useState<DialogState | null>(null);

  const confirmDialog = useCallback((options: DialogOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setDialogState({ ...options, resolve });
    });
  }, []);

  const handleClose = useCallback(() => {
    setDialogState(null);
  }, []);

  return (
    <DialogContext.Provider value={{ confirmDialog }}>
      {children}
      {dialogState && (
        <ConfirmDialogModal state={dialogState} onClose={handleClose} />
      )}
    </DialogContext.Provider>
  );
}
