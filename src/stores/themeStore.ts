import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeStore {
  /** 사용자 선택값 — 'system'은 OS 설정을 따른다. localStorage에 영속화. */
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: 'mindcanvas:theme',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
