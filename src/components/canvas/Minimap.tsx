'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useNodeStore } from '@/stores/nodeStore';

const MINIMAP_W = 200;
const MINIMAP_H = 140;
const PADDING = 12;
const NODE_FILL = '#94a3b8';
const NODE_FILL_SELECTED = '#2563eb';
const VIEWPORT_STROKE = '#2563eb';
const BG_FILL = '#ffffff';
const BORDER = '#e2e8f0';

/**
 * 우상단에 떠 있는 미니맵. 모든 노드를 축소해서 보여주고 현재 viewport를 사각형으로 overlay.
 * 노드·엣지 변경 시, viewport 변경 시 다시 그린다. 클릭/드래그 인터랙션은 추후.
 */
export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodes = useNodeStore((s) => s.nodes);
  const selectedIds = useNodeStore((s) => s.selectedIds);
  const viewport = useCanvasStore((s) => s.viewport);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = MINIMAP_W * dpr;
    canvas.height = MINIMAP_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = BG_FILL;
    ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H);

    // 현재 화면(viewport)의 world 영역 — 노드 없을 때도 표시되도록 별도 계산.
    const viewWorldLeft = viewport.x;
    const viewWorldTop = viewport.y;
    const viewWorldRight = viewport.x + window.innerWidth / viewport.scale;
    const viewWorldBottom = viewport.y + window.innerHeight / viewport.scale;

    // 노드 + viewport를 모두 감싸는 world bounds (한쪽이 비어도 항상 무언가 표시).
    let minX = viewWorldLeft;
    let minY = viewWorldTop;
    let maxX = viewWorldRight;
    let maxY = viewWorldBottom;
    for (const n of nodes) {
      if (n.removingAt !== undefined) continue;
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x + n.width > maxX) maxX = n.x + n.width;
      if (n.y + n.height > maxY) maxY = n.y + n.height;
    }
    const worldW = maxX - minX;
    const worldH = maxY - minY;
    if (worldW <= 0 || worldH <= 0) return;

    const innerW = MINIMAP_W - PADDING * 2;
    const innerH = MINIMAP_H - PADDING * 2;
    const scale = Math.min(innerW / worldW, innerH / worldH);
    // 비율 유지 후 빈 공간을 중앙 정렬.
    const offsetX = PADDING + (innerW - worldW * scale) / 2 - minX * scale;
    const offsetY = PADDING + (innerH - worldH * scale) / 2 - minY * scale;

    // 노드 그리기 (선택된 노드는 색 강조).
    for (const n of nodes) {
      if (n.removingAt !== undefined) continue;
      ctx.fillStyle = selectedIds.has(n.id) ? NODE_FILL_SELECTED : NODE_FILL;
      ctx.fillRect(
        offsetX + n.x * scale,
        offsetY + n.y * scale,
        Math.max(2, n.width * scale),
        Math.max(2, n.height * scale),
      );
    }

    // 현재 viewport 사각형 (테두리만).
    ctx.strokeStyle = VIEWPORT_STROKE;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      offsetX + viewWorldLeft * scale,
      offsetY + viewWorldTop * scale,
      (viewWorldRight - viewWorldLeft) * scale,
      (viewWorldBottom - viewWorldTop) * scale,
    );
  }, [nodes, selectedIds, viewport]);

  return (
    <div
      className="fixed right-3 top-14 z-10 rounded-md bg-white p-1 shadow-md ring-1 ring-black/10"
      style={{ borderColor: BORDER }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: MINIMAP_W, height: MINIMAP_H }}
        className="block"
      />
    </div>
  );
}
