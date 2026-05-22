'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useNodeStore } from '@/stores/nodeStore';
import { usePanZoom } from '@/hooks/usePanZoom';
import { useNodeInteraction } from '@/hooks/useNodeInteraction';
import { drawGrid } from '@/lib/canvas/grid';
import { drawNode } from '@/lib/canvas/drawNode';
import { drawSelectionBox } from '@/lib/canvas/drawSelectionBox';
import { getVisibleBounds, isNodeVisible } from '@/lib/canvas/viewport';

export function InfiniteCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewport = useCanvasStore((state) => state.viewport);
  const resetViewport = useCanvasStore((state) => state.resetViewport);
  const nodes = useNodeStore((state) => state.nodes);
  const selectedIds = useNodeStore((state) => state.selectedIds);
  const selectionBox = useNodeStore((state) => state.selectionBox);
  const [visibleCount, setVisibleCount] = useState(0);

  // 순서 중요: useNodeInteraction이 먼저 등록돼야 노드 위 pointerdown에서
  // stopImmediatePropagation()으로 usePanZoom의 Pan 시작을 막을 수 있다.
  useNodeInteraction(canvasRef);
  usePanZoom(canvasRef);

  // 항상 store의 최신 상태를 읽어 격자 → 노드 → 선택 박스 순으로 그린다.
  // devicePixelRatio를 반영해 물리 픽셀로 버퍼를 잡고, 그리기는 CSS 픽셀 좌표계로 한다.
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return 0;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    // viewport: useEffect deps용 구독값, currentViewport: 실제 그리기에 쓸 최신값
    const { viewport: currentViewport } = useCanvasStore.getState();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    drawGrid(ctx, currentViewport, width, height);

    const { nodes, selectedIds, selectionBox } = useNodeStore.getState();
    const bounds = getVisibleBounds(currentViewport, width, height);
    let visible = 0;
    for (const node of nodes) {
      if (!isNodeVisible(node, bounds)) continue;
      drawNode(ctx, node, currentViewport, selectedIds.has(node.id));
      visible += 1;
    }
    if (selectionBox) drawSelectionBox(ctx, selectionBox, currentViewport);
    return visible;
  }, []);

  useEffect(() => {
    setVisibleCount(render());
  }, [viewport, nodes, selectedIds, selectionBox, render]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => setVisibleCount(render()));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [render]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-white">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />

      <div className="pointer-events-none absolute left-3 top-3 select-none rounded-md bg-black/75 px-3 py-2 font-mono text-xs leading-relaxed text-white">
        <div>x {viewport.x.toFixed(1)}</div>
        <div>y {viewport.y.toFixed(1)}</div>
        <div>scale {viewport.scale.toFixed(2)}</div>
        <div>
          nodes {visibleCount}/{nodes.length}
        </div>
        <div>selected {selectedIds.size}</div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 select-none rounded-md bg-black/75 px-3 py-2 text-xs text-white">
        더블클릭 추가 · 클릭/Shift+클릭 선택 · Shift+드래그 영역 선택 · Delete 삭제
      </div>

      <button
        type="button"
        onClick={resetViewport}
        className="absolute right-3 top-3 rounded-md bg-black/75 px-3 py-2 text-xs text-white transition-colors hover:bg-black/90"
      >
        뷰 리셋
      </button>
    </div>
  );
}
