'use client';

import { useCanvasStore } from '@/stores/canvasStore';
import { useAwarenessStore } from '@/stores/awarenessStore';
import { worldToScreen } from '@/lib/canvas/transform';
import { NODE_COLORS } from '@/lib/canvas/nodeColors';

/**
 * 다른 사용자(peers)의 마우스 커서를 캔버스 위에 SVG 화살표 + 이름 라벨로 그린다.
 * pointer-events: none — 캔버스 인터랙션을 가리지 않는다. pan/zoom 따라 매 frame 갱신.
 */
export function Cursors() {
  const peers = useAwarenessStore((s) => s.peers);
  const viewport = useCanvasStore((s) => s.viewport);

  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      {Array.from(peers.entries()).map(([clientId, peer]) => {
        if (!peer.cursor) return null;
        const screen = worldToScreen(viewport, peer.cursor.x, peer.cursor.y);
        const palette = NODE_COLORS[peer.user.color];
        return (
          <div
            key={clientId}
            className="absolute"
            style={{ left: screen.x, top: screen.y }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))' }}
            >
              <path
                d="M2 2 L2 19 L7 15 L11 22 L14 21 L10 14 L17 14 Z"
                fill={palette.border}
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <div
              className="absolute left-5 top-4 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium text-white shadow"
              style={{ backgroundColor: palette.border }}
            >
              {peer.user.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
