'use client';

import { NextIntlClientProvider } from 'next-intl';
import { useLocaleStore } from '@/stores/localeStore';
import ko from '../../../messages/ko.json';
import en from '../../../messages/en.json';
import ja from '../../../messages/ja.json';

const MESSAGES = { ko, en, ja } as const;

/** zustand store의 locale을 NextIntlClientProvider에 주입한다. 라우팅 통합 없이 클라이언트 사이드 i18n. */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocaleStore((s) => s.locale);
  return (
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      {children}
    </NextIntlClientProvider>
  );
}
