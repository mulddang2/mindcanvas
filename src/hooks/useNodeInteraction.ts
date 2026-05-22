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
 * - Delete: 선택 노드 삭제 / Ctrl·Cmd+A: 전체 선택 / Esc: 선택 해제
 */
export function useNodeInteraction(ref: RefObject<HTMLCanvasElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 빈 공간 pointerdown 위치. Pan과 클릭(선택 해제)을 구분하는 데 쓴다.
    let downX = 0;
    let downY = 0;
    // 이번 제스처가 빈 공간 pointerdown으로 시작됐는지. false면 pointerup의
    // 선택 해제 로직을 건너뛴다 (Shift+클릭 등이 잘못 해제되는 것을 막는다).
    let emptyPointerDown = false;

    // 노드 드래그 상태
    let draggingId: string | null = null;
    let dragStartWorld: Point = { x: 0, y: 0 };
    // 드래그 시작 시점 선택 노드들의 위치 스냅샷 (절대 좌표 재배치용)
    let dragSnapshot: Array<{ id: string; x: number; y: number }> = [];
    // 포인터가 CLICK_SLOP을 넘겨 실제 이동으로 판정됐는지. false면 pointerup을
    // 클릭으로 보고 그 노드만 단일 선택한다.
    let dragMoved = false;

    // 영역 선택(러버밴드) 상태
    let rubberStartWorld: Point | null = null;
    // 러버밴드 시작 시점의 선택. 영역 결과를 여기에 합쳐 누적 선택한다.
    let rubberBaseSelection: string[] = [];

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
      emptyPointerDown = false;

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
        dragMoved = false;
        downX = e.clientX;
        downY = e.clientY;
        el.setPointerCapture(e.pointerId);
        return;
      }

      if (e.shiftKey) {
        // Shift+빈 공간 드래그: 영역 선택 시작. Pan을 막는다.
        e.stopImmediatePropagation();
        rubberStartWorld = world;
        rubberBaseSelection = [...store.selectedIds];
        el.setPointerCapture(e.pointerId);
        return;
      }

      // 빈 공간 일반 드래그는 Pan(usePanZoom)에 맡기고, 클릭 여부 판별용 좌표만 기록한다.
      emptyPointerDown = true;
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
        // 시작 시점 선택에 영역 안 노드를 합친다 (Shift+클릭과 같은 누적 동작).
        const inBox = nodesInBounds(store.nodes, box).map((n) => n.id);
        store.setSelection([...rubberBaseSelection, ...inBox]);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!draggingId && !rubberStartWorld) return;
      if (draggingId && !dragMoved) {
        // CLICK_SLOP 이내 미세 이동은 아직 클릭으로 본다. 넘어서면 드래그 시작.
        if (Math.hypot(e.clientX - downX, e.clientY - downY) <= CLICK_SLOP) return;
        dragMoved = true;
        el.style.cursor = 'move';
      }
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
      dragMoved = false;
      rubberStartWorld = null;
      rubberBaseSelection = [];
      useNodeStore.getState().setSelectionBox(null);
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.style.cursor = 'grab';
    };

    const onPointerUp = (e: PointerEvent) => {
      if (draggingId || rubberStartWorld) {
        // 이동 없이 끝난 노드 제스처는 클릭 → 그 노드만 단일 선택한다.
        const clickedId = draggingId && !dragMoved ? draggingId : null;
        finishGesture(e);
        if (clickedId) useNodeStore.getState().selectOnly(clickedId);
        return;
      }
      // 빈 공간 pointerdown으로 시작한 제스처만 선택 해제 대상이다.
      if (!emptyPointerDown) return;
      emptyPointerDown = false;
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
      // 입력 요소에 포커스가 있으면(향후 라벨 인라인 편집 등) 캔버스 단축키를
      // 가로채지 않는다 — input 타이핑 중 Backspace·Ctrl+A 오작동 방지.
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA')
      ) {
        return;
      }

      const store = useNodeStore.getState();

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (store.selectedIds.size === 0) return;
        e.preventDefault();
        store.removeSelected();
        return;
      }

      // Ctrl/Cmd+A: 전체 선택
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        if (store.nodes.length === 0) return;
        e.preventDefault();
        store.selectAll();
        return;
      }

      // Escape: 선택 해제
      if (e.key === 'Escape' && store.selectedIds.size > 0) {
        store.selectOnly(null);
      }
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
