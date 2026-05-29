import { create } from 'zustand';

interface ShareTokenStore {
  /** 공유 라우트 진입 시 token 보관. createClient가 호출 시 헤더로 자동 주입. */
  token: string | null;
  setToken: (token: string | null) => void;
}

export const useShareTokenStore = create<ShareTokenStore>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
}));
