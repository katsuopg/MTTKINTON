// Re-export all types
export * from './kintone';
export * from './supabase';
export * from './parts';
export * from './quote-request';

// Common application types
export type Language = 'ja' | 'th';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  language: Language;
}