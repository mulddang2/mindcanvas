'use client';

import { useEffect, type RefObject } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';

const ZOOM_STEP = 1.1;

/**
 * 캔버스 요소에 Pan(드래그)·Zoom(휠·핀치) 인터랙션을 붙인다.
 * Pointer Capture로 캔버스 밖까지 드래그가 이어진다.
 * 활성 포인터 1개 → pan, 2개 → 두 포인터 거리 변화로 pinch zoom.
 */
export function usePanZoom(ref: RefObject<HTMLCanvasElement | null>): void {
  const panBy = useCanvasStore((state) => state.panBy);
  const zoomAt = useCanvasStore((state) => state.zoomAt);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 활성 포인터 위치(client 좌표). useNodeInteraction이 stopImmediatePropagation으로
    // 가로채면 여기 Map에는 그 포인터가 들어오지 않는다 — 빈 공간 제스처만 추적.
    const activePointers = new Map<number, { x: number; y: number }>();
    // 직전 frame의 두 포인터 거리. null이면 pinch 미활성 상태.
    let pinchPrevDist: number | null = null;

    const onPointerDown = (e: PointerEvent) => {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      // setPointerCapture는 일부 합성 이벤트(테스트 환경 등)에서 예외를 던질 수 있다 —
      // 캡처 실패해도 active pointers 추적은 계속.
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      if (activePointers.size === 1) {
        el.style.cursor = 'grabbing';
      } else if (activePointers.size === 2) {
        const pts = [...activePointers.values()];
        pinchPrevDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const prev = activePointers.get(e.pointerId);
      if (!prev) return;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.size === 1) {
        panBy(e.clientX - prev.x, e.clientY - prev.y);
      } else if (activePointers.size === 2 && pinchPrevDist !== null) {
        const pts = [...activePointers.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (dist > 0 && pinchPrevDist > 0) {
          const factor = dist / pinchPrevDist;
          pinchPrevDist = dist;
          const rect = el.getBoundingClientRect();
          const mx = (pts[0].x + pts[1].x) / 2 - rect.left;
          const my = (pts[0].y + pts[1].y) / 2 - rect.top;
          zoomAt(mx, my, factor);
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!activePointers.has(e.pointerId)) return;
      activePointers.delete(e.pointerId);
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      // 2 → 1 전환: pinch 종료, 남은 포인터의 최신 위치는 Map에 이미 있어 pan jump 없음.
      if (activePointers.size < 2) pinchPrevDist = null;
      if (activePointers.size === 0) el.style.cursor = 'grab';
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
