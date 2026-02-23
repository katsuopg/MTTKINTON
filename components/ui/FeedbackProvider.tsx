'use client';

import React from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { DialogProvider } from '@/components/ui/ConfirmDialog';

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DialogProvider>
        {children}
      </DialogProvider>
    </ToastProvider>
  );
}
