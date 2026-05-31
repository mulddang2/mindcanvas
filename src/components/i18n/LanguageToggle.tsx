'use client';

import { useTranslations } from 'next-intl';
import { useLocaleStore, LOCALES, type Locale } from '@/stores/localeStore';
import { useRadioGroupKeyboard } from '@/hooks/useRadioGroupKeyboard';

/** 좌상단 fixed radiogroup. 언어 즉시 전환 + localStorage 영속. */
export function LanguageToggle() {
  const t = useTranslations('language');
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const { onKeyDown, setItemRef } = useRadioGroupKeyboard(LOCALES, locale, setLocale);

  return (
    <div
      role="radiogroup"
      aria-label={t('label')}
      onKeyDown={onKeyDown}
      className="bg-surface border-border fixed top-4 left-4 z-50 flex gap-1 rounded-md border p-1 text-xs"
    >
      {LOCALES.map((value: Locale) => {
        const active = locale === value;
        return (
          <button
            key={value}
            ref={setItemRef(value)}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => setLocale(value)}
            className={
              active
                ? 'bg-brand text-brand-fg rounded px-2 py-1'
                : 'text-fg-muted hover:text-fg rounded px-2 py-1'
            }
          >
            {t(value)}
          </button>
        );
      })}
    </div>
  );
}
