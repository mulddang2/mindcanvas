'use client';

import { useThemeStore, type ThemePreference } from '@/stores/themeStore';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
  { value: 'system', label: '시스템' },
];

/** 라이트·다크·시스템 3-state 토글. 우상단 fixed 배치를 가정. */
export function ThemeToggle() {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  return (
    <div
      role="radiogroup"
      aria-label="테마"
      className="bg-surface border-border fixed top-4 right-4 z-50 flex gap-1 rounded-md border p-1 text-xs"
    >
      {OPTIONS.map((opt) => {
        const active = preference === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(opt.value)}
            className={
              active
                ? 'bg-brand text-brand-fg rounded px-2 py-1'
                : 'text-fg-muted hover:text-fg rounded px-2 py-1'
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
