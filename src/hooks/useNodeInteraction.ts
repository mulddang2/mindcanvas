'use client';

import { useEffect, type RefObject } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useNodeStore } from '@/stores/nodeStore';
import { screenToWorld } from '@/lib/canvas/transform';
import { hitTestNode } from '@/lib/canvas/hitTest';

// 이 픽셀 이내의 포인터 이동은 Pan 드래그가 아니라 클릭(선택)으로 본다.
const CLICK_SLOP = 4;

/** 캔버스에 노드 추가(더블클릭)·선택(클릭)·드래그(이동)·삭제(Delete) 인터랙션을 붙인다. */
export function useNodeInteraction(ref: RefObject<HTMLCanvasElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let downX = 0;
    let downY = 0;
    let draggingId: string | null = null;
    let dragStartWorld = { x: 0, y: 0 };
    let dragStartNode = { x: 0, y: 0 };

    const toWorld = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      return screenToWorld(
        useCanvasStore.getState().viewport,
        clientX - rect.left,
        clientY - rect.top,
      );
    };

    const onPointerDown = (e: PointerEvent) => {
      const world = toWorld(e.clientX, e.clientY);
      const hit = hitTestNode(useNodeStore.getState().nodes, world);

      if (hit) {
        // 노드 위 pointerdown: Pan이 시작되지 않도록 이후 리스너를 막는다.
        e.stopImmediatePropagation();
        draggingId = hit.id;
        dragStartWorld = world;
        dragStartNode = { x: hit.x, y: hit.y };
        el.setPointerCapture(e.pointerId);
        el.style.cursor = 'move';
        useNodeStore.getState().selectNode(hit.id);
      } else {
        downX = e.clientX;
        downY = e.clientY;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!draggingId) return;
      const world = toWorld(e.clientX, e.clientY);
      useNodeStore.getState().updateNode(draggingId, {
        x: dragStartNode.x + (world.x - dragStartWorld.x),
        y: dragStartNode.y + (world.y - dragStartWorld.y),
      });
    };

    const stopDrag = (e: PointerEvent) => {
      if (!draggingId) return;
      draggingId = null;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.style.cursor = 'grab';
    };

    const onPointerUp = (e: PointerEvent) => {
      if (draggingId) {
        stopDrag(e);
        return;
      }
      // 빈 공간 클릭 vs Pan 드래그 구분
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > CLICK_SLOP) return;
      const hit = hitTestNode(useNodeStore.getState().nodes, toWorld(e.clientX, e.clientY));
      useNodeStore.getState().selectNode(hit ? hit.id : null);
    };

    const onDoubleClick = (e: MouseEvent) => {
      const world = toWorld(e.clientX, e.clientY);
      // 기존 노드 위에서의 더블클릭은 노드가 겹치지 않도록 무시한다.
      if (hitTestNode(useNodeStore.getState().nodes, world)) return;
      useNodeStore.getState().addNode(world.x, world.y);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (!useNodeStore.getState().selectedId) return;
      e.preventDefault();
      useNodeStore.getState().removeSelected();
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', stopDrag);
    el.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', stopDrag);
      el.removeEventListener('dblclick', onDoubleClick);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [ref]);
}
