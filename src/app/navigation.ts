'use client';

import {useRouter, usePathname} from 'next/navigation';
import {useLocale, useTranslations} from 'next-intl';

export function useI18nNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();

  return {
    router,
    pathname,
    locale,
    t
  };
}