import { useEffect } from 'react';
import { acquire, release, type YjsStatus } from '@/lib/yjs/provider';
import { useYjsStore } from '@/stores/yjsStore';
import { bindNodeStore, unbindNodeStore } from '@/stores/nodeStore';

/**
 * canvasId(room) 단위로 Y.Doc + WebsocketProvider를 잡고, nodeStore을 Y.Doc에 바인딩한 뒤
 * 연결 상태를 yjsStore에 반영한다. 컴포넌트 unmount·canvasId 변경 시 unbind + release.
 */
export function useYjs(canvasId: string): void {
  const setStatus = useYjsStore((s) => s.setStatus);
  useEffect(() => {
    const { doc, provider } = acquire(canvasId);
    bindNodeStore(doc);
    // 초기 상태: 핸드셰이크 전. provider.wsconnected 플래그가 즉시 true일 수도 있어 한 번 동기화.
    setStatus(provider.wsconnected ? 'connected' : 'connecting');
    const onStatus = (event: { status: YjsStatus }) => setStatus(event.status);
    provider.on('status', onStatus);
    return () => {
      provider.off('status', onStatus);
      unbindNodeStore();
      release(canvasId);
      // unmount 후 status를 정리 — 다음 마운트에서 다시 connecting부터.
      setStatus('disconnected');
    };
  }, [canvasId, setStatus]);
}
