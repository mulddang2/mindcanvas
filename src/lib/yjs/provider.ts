import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

export type YjsStatus = 'connecting' | 'connected' | 'disconnected';

interface Bundle {
  doc: Y.Doc;
  provider: WebsocketProvider;
  persistence: IndexeddbPersistence;
  refCount: number;
}

const bundles = new Map<string, Bundle>();

function getWsUrl(): string {
  // 빌드 시점에 inject되는 NEXT_PUBLIC_ prefix env. 명시 값이 있으면 그대로 사용.
  const url = process.env.NEXT_PUBLIC_YJS_WS_URL;
  if (url) return url;
  // 미설정·빈 값: dev는 로컬 릴레이로 연결, 프로덕션은 빈 값으로 둬 협업을 끈다(오프라인 단독 편집).
  return process.env.NODE_ENV === 'development' ? 'ws://localhost:1234' : '';
}

/**
 * canvasId(room) 단위로 Y.Doc + WebsocketProvider + IndexeddbPersistence 싱글톤.
 * 같은 canvasId를 두 컴포넌트가 동시에 잡으면 refCount만 증가, 둘 다 release한 뒤에야 destroy.
 * persistence는 Y.Doc 변경을 IndexedDB에 자동 저장하고, 페이지 진입 시 로컬 데이터를 doc에 hydrate한다.
 */
export function acquire(canvasId: string): {
  doc: Y.Doc;
  provider: WebsocketProvider;
  persistence: IndexeddbPersistence;
} {
  const existing = bundles.get(canvasId);
  if (existing) {
    existing.refCount += 1;
    return {
      doc: existing.doc,
      provider: existing.provider,
      persistence: existing.persistence,
    };
  }
  const doc = new Y.Doc();
  const persistence = new IndexeddbPersistence(canvasId, doc);
  // ws URL이 비면 connect:false로 둬 https 페이지에서의 mixed-content 재연결 시도를 막는다.
  const wsUrl = getWsUrl();
  const provider = new WebsocketProvider(wsUrl || 'ws://localhost:1234', canvasId, doc, {
    connect: wsUrl !== '',
  });
  bundles.set(canvasId, { doc, provider, persistence, refCount: 1 });
  return { doc, provider, persistence };
}

/** 해당 canvasId 사용을 끝낸 컴포넌트가 호출. refCount가 0이 되면 모두 destroy. */
export function release(canvasId: string): void {
  const bundle = bundles.get(canvasId);
  if (!bundle) return;
  bundle.refCount -= 1;
  if (bundle.refCount <= 0) {
    bundle.provider.destroy();
    bundle.persistence.destroy();
    bundle.doc.destroy();
    bundles.delete(canvasId);
  }
}
