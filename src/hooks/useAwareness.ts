import { useEffect } from 'react';
import { acquire, release } from '@/lib/yjs/provider';
import { getOrCreateUser, setCurrentAwareness, type User } from '@/lib/yjs/awareness';
import { useAwarenessStore, type PeerState } from '@/stores/awarenessStore';
import type { Point } from '@/types/canvas';

interface AwarenessRawState {
  user?: User;
  cursor?: Point | null;
  editingId?: string | null;
}

function isAwarenessRawState(value: unknown): value is AwarenessRawState {
  return typeof value === 'object' && value !== null;
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
    awareness.setLocalStateField('editingId', null);
    setCurrentAwareness(awareness);

    const refresh = () => {
      const next = new Map<number, PeerState>();
      awareness.getStates().forEach((raw, clientId) => {
        if (clientId === awareness.clientID) return;
        if (!isAwarenessRawState(raw)) return;
        if (!raw.user) return;
        next.set(clientId, {
          user: raw.user,
          cursor: raw.cursor ?? null,
          editingId: raw.editingId ?? null,
        });
      });
      setPeers(next);
    };

    // peer가 많을 때 change가 receive마다 발생하면 setPeers→Cursors 리렌더가 폭주한다.
    // RAF로 한 프레임 내 change들을 1회 refresh로 묶어 수신을 60Hz로 제한, 1만 노드와의 메인스레드 경합을 줄인다.
    let rafId: number | null = null;
    const scheduleRefresh = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        refresh();
      });
    };
    refresh();
    awareness.on('change', scheduleRefresh);
    return () => {
      awareness.off('change', scheduleRefresh);
      if (rafId !== null) cancelAnimationFrame(rafId);
      // 본인 state를 비워 다른 탭의 peers에서 즉시 사라지게 한다.
      awareness.setLocalState(null);
      setCurrentAwareness(null);
      setPeers(new Map());
      release(canvasId);
    };
  }, [canvasId, setPeers]);
}
