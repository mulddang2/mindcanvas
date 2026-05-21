'use client';

import { useEffect, type RefObject } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';

const ZOOM_STEP = 1.1;

/**
 * 캔버스 요소에 Pan(드래그)·Zoom(휠) 인터랙션을 붙인다.
 * Pointer Capture로 캔버스 밖까지 드래그가 이어진다.
 */
export function usePanZoom(ref: RefObject<HTMLCanvasElement | null>): void {
  const panBy = useCanvasStore((state) => state.panBy);
  const zoomAt = useCanvasStore((state) => state.zoomAt);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let panning = false;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (e: PointerEvent) => {
      panning = true;
      lastX = e.clientX;
      lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!panning) return;
      panBy(e.clientX - lastX, e.clientY - lastY);
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      panning = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.style.cursor = 'grab';
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor);
    };

    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('wheel', onWheel);
    };
  }, [ref, panBy, zoomAt]);
}
