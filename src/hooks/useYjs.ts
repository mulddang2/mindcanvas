import { useEffect } from 'react';
import { acquire, release, type YjsStatus } from '@/lib/yjs/provider';
import { useYjsStore } from '@/stores/yjsStore';

/**
 * canvasId(room) 단위로 Y.Doc + WebsocketProvider를 잡고, 연결 상태를 yjsStore에 반영.
 * 컴포넌트 unmount·canvasId 변경 시 release로 refCount 감소시킨다.
 */
export function useYjs(canvasId: string): void {
  const setStatus = useYjsStore((s) => s.setStatus);
  useEffect(() => {
    const { provider } = acquire(canvasId);
    // 초기 상태: 핸드셰이크 전. provider.wsconnected 플래그가 즉시 true일 수도 있어 한 번 동기화.
    setStatus(provider.wsconnected ? 'connected' : 'connecting');
    const onStatus = (event: { status: YjsStatus }) => setStatus(event.status);
    provider.on('status', onStatus);
    return () => {
      provider.off('status', onStatus);
      release(canvasId);
      // unmount 후 status를 정리 — 다음 마운트에서 다시 connecting부터.
      setStatus('disconnected');
    };
  }, [canvasId, setStatus]);
}
