'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { usePanZoom } from '@/hooks/usePanZoom';
import { drawGrid } from '@/lib/canvas/grid';

export function InfiniteCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewport = useCanvasStore((state) => state.viewport);
  const resetViewport = useCanvasStore((state) => state.resetViewport);

  usePanZoom(canvasRef);

  // 항상 store의 최신 viewport를 읽어 그린다. devicePixelRatio를 반영해
  // 물리 픽셀 기준으로 버퍼를 잡고, 그리기는 CSS 픽셀 좌표계로 한다.
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    drawGrid(ctx, useCanvasStore.getState().viewport, width, height);
  }, []);

  useEffect(() => {
    render();
  }, [viewport, render]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => render());
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
