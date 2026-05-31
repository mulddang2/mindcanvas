import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Locale = 'ko' | 'en' | 'ja';

export const LOCALES: Locale[] = ['ko', 'en', 'ja'];
export const DEFAULT_LOCALE: Locale = 'ko';

interface LocaleStore {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'mindcanvas:locale',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
