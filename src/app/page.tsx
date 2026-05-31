'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LanguageToggle } from '@/components/i18n/LanguageToggle';

// next-intl이 클라이언트 store 기반이라 SSR/SSG 시 ENVIRONMENT_FALLBACK으로 prerender 실패.
// 랜딩은 정적 prerender가 큰 이득이 아니므로 dynamic으로 처리.
export const dynamic = 'force-dynamic';

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
