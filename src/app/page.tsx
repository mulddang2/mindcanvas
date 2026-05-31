'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LanguageToggle } from '@/components/i18n/LanguageToggle';

export default function Home() {
  const t = useTranslations('landing');
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6 p-8 text-center">
      <LanguageToggle />
      <ThemeToggle />
      <h1 className="text-fg text-4xl font-semibold">{t('title')}</h1>
      <p className="text-fg-muted max-w-md text-sm">{t('description')}</p>
      <Link
        href="/canvas/demo"
        className="bg-brand text-brand-fg hover:bg-brand-hover rounded-md px-5 py-2.5 text-sm font-medium transition-colors"
      >
        {t('cta')}
      </Link>
    </main>
  );
}
