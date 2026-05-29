import { create } from 'zustand';
import type { Point } from '@/types/canvas';
import type { User } from '@/lib/yjs/awareness';

export interface PeerState {
  user: User;
  cursor: Point | null;
}

interface AwarenessStore {
  /** Y.js clientID → 다른 사용자 상태. 본인은 제외. */
  peers: Map<number, PeerState>;
  setPeers: (peers: Map<number, PeerState>) => void;
}

export const useAwarenessStore = create<AwarenessStore>((set) => ({
  peers: new Map(),
  setPeers: (peers) => set({ peers }),
}));
