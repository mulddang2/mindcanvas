import { create } from 'zustand';
import type { YjsStatus } from '@/lib/yjs/provider';

interface YjsStore {
  status: YjsStatus;
  setStatus: (status: YjsStatus) => void;
  /** IndexedDB persistence가 로컬 데이터 hydrate를 마쳤는지. CanvasView가 이후에 initialGraph 적용. */
  indexeddbSynced: boolean;
  setIndexeddbSynced: (v: boolean) => void;
}

export const useYjsStore = create<YjsStore>((set) => ({
  status: 'disconnected',
  setStatus: (status) => set({ status }),
  indexeddbSynced: false,
  setIndexeddbSynced: (v) => set({ indexeddbSynced: v }),
}));
