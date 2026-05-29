'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/stores/themeStore';

/**
 * 사용자 선호값을 <html>의 'dark' 클래스로 반영한다.
 * - 'light'·'dark': 명시적으로 클래스 on/off → tokens.css의 :root.dark가 우선
 * - 'system': 클래스 제거 → tokens.css의 prefers-color-scheme이 적용
 * OS 설정 변경(system 모드일 때만)도 즉시 반영.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const preference = useThemeStore((s) => s.preference);

  useEffect(() => {
    const root = document.documentElement;
    if (preference === 'dark') {
      root.classList.add('dark');
    } else if (preference === 'light') {
      root.classList.remove('dark');
    } else {
      // system — 클래스 제거하고 prefers-color-scheme에 위임
      root.classList.remove('dark');
    }
  }, [preference]);

  return <>{children}</>;
}
