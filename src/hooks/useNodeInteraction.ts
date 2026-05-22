'use client';

import { useEffect, type RefObject } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useNodeStore } from '@/stores/nodeStore';
import { screenToWorld } from '@/lib/canvas/transform';
import { hitTestNode, nodesInBounds } from '@/lib/canvas/hitTest';
import type { Point, WorldBounds } from '@/types/canvas';

// 이 픽셀 이내의 포인터 이동은 Pan 드래그가 아니라 클릭(선택)으로 본다.
const CLICK_SLOP = 4;

/** 두 world 좌표로 정규화된 사각 영역을 만든다. */
function boundsFromPoints(a: Point, b: Point): WorldBounds {
  return {
    minX: Math.min(a.x, b.x),
    minY: Math.min(a.y, b.y),
    maxX: Math.max(a.x, b.x),
    maxY: Math.max(a.y, b.y),
  };
}

/**
 * 캔버스에 노드 인터랙션을 붙인다.
 * - 더블클릭: 노드 추가 / 클릭: 단일 선택 / Shift+클릭: 선택 토글
 * - 노드 드래그: 선택된 노드 전체 이동 / Shift+빈 공간 드래그: 영역 선택
 * - Delete: 선택 노드 삭제
 */
export function useNodeInteraction(ref: RefObject<HTMLCanvasElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let downX = 0;
    let downY = 0;

    // 노드 드래그 상태
    let draggingId: string | null = null;
    let dragStartWorld: Point = { x: 0, y: 0 };
    // 드래그 시작 시점 선택 노드들의 위치 스냅샷 (절대 좌표 재배치용)
    let dragSnapshot: Array<{ id: string; x: number; y: number }> = [];

    // 영역 선택(러버밴드) 상태
    let rubberStartWorld: Point | null = null;

    // pointermove는 프레임보다 잦으므로 store 업데이트를 rAF로 한 프레임당 한 번으로 묶는다.
    let rafId = 0;
    let pendingWorld: Point | null = null;

    const toWorld = (clientX: number, clientY: number): Point => {
      const rect = el.getBoundingClientRect();
      return screenToWorld(
        useCanvasStore.getState().viewport,
        clientX - rect.left,
        clientY - rect.top,
      );
    };

    const onPointerDown = (e: PointerEvent) => {
      const world = toWorld(e.clientX, e.clientY);
      const store = useNodeStore.getState();
      const hit = hitTestNode(store.nodes, world);

      if (hit) {
        // 노드 위 pointerdown: Pan이 시작되지 않도록 이후 리스너를 막는다.
        e.stopImmediatePropagation();

        if (e.shiftKey) {
          // Shift+클릭: 선택 토글만 하고 드래그는 시작하지 않는다.
          store.toggleSelect(hit.id);
          return;
        }

        // 선택에 없는 노드를 잡으면 그 노드만, 이미 선택된 노드면 선택 전체를 드래그한다.
        if (!store.selectedIds.has(hit.id)) store.selectOnly(hit.id);
        const { nodes, selectedIds } = useNodeStore.getState();
        dragSnapshot = nodes
          .filter((n) => selectedIds.has(n.id))
          .map((n) => ({ id: n.id, x: n.x, y: n.y }));
        draggingId = hit.id;
        dragStartWorld = world;
        el.setPointerCapture(e.pointerId);
        el.style.cursor = 'move';
        return;
      }

      if (e.shiftKey) {
        // Shift+빈 공간 드래그: 영역 선택 시작. Pan을 막는다.
        e.stopImmediatePropagation();
        rubberStartWorld = world;
        el.setPointerCapture(e.pointerId);
        return;
      }

      // 빈 공간 일반 드래그는 Pan(usePanZoom)에 맡기고, 클릭 여부 판별용 좌표만 기록한다.
      downX = e.clientX;
      downY = e.clientY;
    };

    const flushGesture = () => {
      rafId = 0;
      if (!pendingWorld) return;

      if (draggingId) {
        const dx = pendingWorld.x - dragStartWorld.x;
        const dy = pendingWorld.y - dragStartWorld.y;
        useNodeStore
          .getState()
          .moveNodes(dragSnapshot.map((s) => ({ id: s.id, x: s.x + dx, y: s.y + dy })));
      } else if (rubberStartWorld) {
        const box = boundsFromPoints(rubberStartWorld, pendingWorld);
        const store = useNodeStore.getState();
        store.setSelectionBox(box);
        store.setSelection(nodesInBounds(store.nodes, box).map((n) => n.id));
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!draggingId && !rubberStartWorld) return;
      pendingWorld = toWorld(e.clientX, e.clientY);
      if (!rafId) rafId = requestAnimationFrame(flushGesture);
    };

    const finishGesture = (e: PointerEvent) => {
      // 예약된 rAF가 남아 있으면 마지막 위치를 즉시 반영하고 정리한다.
      if (rafId) {
        cancelAnimationFrame(rafId);
        flushGesture();
      }
      rafId = 0;
      pendingWorld = null;
      draggingId = null;
      dragSnapshot = [];
      rubberStartWorld = null;
      useNodeStore.getState().setSelectionBox(null);
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.style.cursor = 'grab';
    };

    const onPointerUp = (e: PointerEvent) => {
      if (draggingId || rubberStartWorld) {
        finishGesture(e);
        return;
      }
      // 빈 공간 클릭(Pan 아님) → 선택 해제
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > CLICK_SLOP) return;
      useNodeStore.getState().selectOnly(null);
    };

    const onDoubleClick = (e: MouseEvent) => {
      const world = toWorld(e.clientX, e.clientY);
      // 기존 노드 위에서의 더블클릭은 노드가 겹치지 않도록 무시한다.
      if (hitTestNode(useNodeStore.getState().nodes, world)) return;
      useNodeStore.getState().addNode(world.x, world.y);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (useNodeStore.getState().selectedIds.size === 0) return;
      e.preventDefault();
      useNodeStore.getState().removeSelected();
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', finishGesture);
    el.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', finishGesture);
      el.removeEventListener('dblclick', onDoubleClick);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [ref]);
}
