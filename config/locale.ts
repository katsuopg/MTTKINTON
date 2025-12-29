export const locales = ['ja', 'th'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale = 'ja' as const;

// Define your path structure
export type PathnameType = {
  '/': string;
  '/dashboard': string;
  '/auth/login': string;
  '/projects': string;
  '/suppliers': string;
  '/employees': string;
  '/workno': string;
  '/project-management': string;
};

export const pathnames: PathnameType = {
  '/': '/',
  '/dashboard': '/dashboard',
  '/auth/login': '/auth/login',
  '/projects': '/projects',
  '/suppliers': '/suppliers',
  '/employees': '/employees',
  '/workno': '/workno',
  '/project-management': '/project-management',
};

export const localePrefix = 'always';

export type Messages = Record<string, string>;