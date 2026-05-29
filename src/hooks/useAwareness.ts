import { useEffect } from 'react';
import { acquire, release } from '@/lib/yjs/provider';
import { getOrCreateUser, setCurrentAwareness, type User } from '@/lib/yjs/awareness';
import { useAwarenessStore, type PeerState } from '@/stores/awarenessStore';
import type { Point } from '@/types/canvas';

interface AwarenessRawState {
  user?: User;
  cursor?: Point | null;
}

/**
 * canvasId 단위 provider.awareness를 잡고 자기 user info를 broadcast,
 * 다른 peer 변경을 awarenessStore에 반영한다. 본인은 peers에서 제외.
 * provider 인스턴스는 acquire/release 패턴으로 useYjs와 refCount 공유.
 */
export function useAwareness(canvasId: string): void {
  const setPeers = useAwarenessStore((s) => s.setPeers);
  useEffect(() => {
    const { provider } = acquire(canvasId);
    const awareness = provider.awareness;
    const user = getOrCreateUser();
    awareness.setLocalStateField('user', user);
    awareness.setLocalStateField('cursor', null);
    setCurrentAwareness(awareness);

    const refresh = () => {
      const next = new Map<number, PeerState>();
      awareness.getStates().forEach((raw, clientId) => {
        if (clientId === awareness.clientID) return;
        const state = raw as AwarenessRawState;
        if (!state.user) return;
        next.set(clientId, { user: state.user, cursor: state.cursor ?? null });
      });
      setPeers(next);
    };
    refresh();
    awareness.on('change', refresh);
    return () => {
      awareness.off('change', refresh);
      // 본인 state를 비워 다른 탭의 peers에서 즉시 사라지게 한다.
      awareness.setLocalState(null);
      setCurrentAwareness(null);
      setPeers(new Map());
      release(canvasId);
    };
  }, [canvasId, setPeers]);
}
