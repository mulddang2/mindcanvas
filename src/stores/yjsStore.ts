import { create } from 'zustand';
import type { YjsStatus } from '@/lib/yjs/provider';

interface YjsStore {
  status: YjsStatus;
  setStatus: (status: YjsStatus) => void;
}

/** WebsocketProvider 연결 상태를 디버그 패널·후속 store 동기화 표시 등에 노출하는 가벼운 store. */
export const useYjsStore = create<YjsStore>((set) => ({
  status: 'disconnected',
  setStatus: (status) => set({ status }),
}));
