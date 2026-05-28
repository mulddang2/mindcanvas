'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useNodeStore } from '@/stores/nodeStore';
import { usePanZoom } from '@/hooks/usePanZoom';
import { useNodeInteraction } from '@/hooks/useNodeInteraction';
import { drawGrid } from '@/lib/canvas/grid';
import { drawNode } from '@/lib/canvas/drawNode';
import { drawSelectionBox } from '@/lib/canvas/drawSelectionBox';
import { drawEdge, drawPendingEdge } from '@/lib/canvas/drawEdge';
import { drawHandles } from '@/lib/canvas/nodeHandles';
import { getVisibleBounds, isEdgeVisible, isNodeVisible } from '@/lib/canvas/viewport';
import { REMOVE_DURATION_MS, SPAWN_DURATION_MS, spawnProgress } from '@/lib/canvas/animation';
import { subscribeImageEvents } from '@/lib/canvas/imageCache';
import { useFps } from '@/hooks/useFps';
import { NodeLabelEditor } from './NodeLabelEditor';

export function InfiniteCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewport = useCanvasStore((state) => state.viewport);
  const resetViewport = useCanvasStore((state) => state.resetViewport);
  const nodes = useNodeStore((state) => state.nodes);
  const edges = useNodeStore((state) => state.edges);
  const selectedIds = useNodeStore((state) => state.selectedIds);
  const selectedEdgeId = useNodeStore((state) => state.selectedEdgeId);
  const selectionBox = useNodeStore((state) => state.selectionBox);
  const hoveredNodeId = useNodeStore((state) => state.hoveredNodeId);
  const pendingEdge = useNodeStore((state) => state.pendingEdge);
  const editingId = useNodeStore((state) => state.editingId);
  const lastReplacedAt = useNodeStore((state) => state.lastReplacedAt);
  const [visibleCount, setVisibleCount] = useState(0);
  const fps = useFps();

  // 순서 중요: useNodeInteraction이 먼저 등록돼야 노드 위 pointerdown에서
  // stopImmediatePropagation()으로 usePanZoom의 Pan 시작을 막을 수 있다.
  useNodeInteraction(canvasRef);
  usePanZoom(canvasRef);

  // 항상 store의 최신 상태를 읽어 격자 → 연결선 → 노드 → 핸들 → 선택 박스 순으로 그린다.
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

    const state = useNodeStore.getState();
    const nodeById = new Map(state.nodes.map((node) => [node.id, node]));

    const animProgress = spawnProgress(Date.now(), state.lastReplacedAt);
    const bounds = getVisibleBounds(currentViewport, width, height);

    // 연결선은 노드 아래에 깔리도록 먼저 그린다. 화면 밖 엣지는 culling으로 skip — 1만 엣지 시 큰 절감.
    for (const edge of state.edges) {
      const source = nodeById.get(edge.source);
      const target = nodeById.get(edge.target);
      if (!source || !target) continue;
      if (!isEdgeVisible(source, target, bounds)) continue;
      drawEdge(
        ctx,
        source,
        target,
        currentViewport,
        edge.id === state.selectedEdgeId,
        animProgress,
      );
    }
    if (state.pendingEdge) {
      const source = nodeById.get(state.pendingEdge.sourceId);
      if (source) drawPendingEdge(ctx, source, state.pendingEdge.cursor, currentViewport);
    }

    let visible = 0;
    for (const node of state.nodes) {
      if (!isNodeVisible(node, bounds)) continue;
      drawNode(
        ctx,
        node,
        currentViewport,
        state.selectedIds.has(node.id),
        node.id === state.editingId,
        animProgress,
      );
      visible += 1;
    }

    // 핸들은 노드 위에 떠 있어야 잡을 수 있으므로 마지막에 그린다.
    const hovered = state.hoveredNodeId ? nodeById.get(state.hoveredNodeId) : undefined;
    if (hovered) drawHandles(ctx, hovered, currentViewport);

    if (state.selectionBox) drawSelectionBox(ctx, state.selectionBox, currentViewport);

    return visible;
  }, []);

  useEffect(() => {
    setVisibleCount(render());
  }, [
    viewport,
    nodes,
    edges,
    selectedIds,
    selectedEdgeId,
    selectionBox,
    hoveredNodeId,
    pendingEdge,
    editingId,
    render,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => setVisibleCount(render()));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [render]);

  // 이미지 노드의 비동기 이미지 로드가 끝나면 다시 그린다 (placeholder → 실제 이미지).
  useEffect(() => {
    return subscribeImageEvents(() => setVisibleCount(render()));
  }, [render]);

  // 등장 애니메이션: lastReplacedAt 변경 시 SPAWN_DURATION_MS 동안 rAF로 매 프레임 다시 그린다.
  useEffect(() => {
    if (lastReplacedAt === null) return;
    let rafId = 0;
    const tick = () => {
      setVisibleCount(render());
      if (Date.now() - lastReplacedAt < SPAWN_DURATION_MS) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [lastReplacedAt, render]);

  // 단일 노드 추가/제거 transition: spawnedAt 또는 removingAt 진행 중인 노드가 있으면 rAF로 재드로잉.
  useEffect(() => {
    const hasActive = (): boolean => {
      const now = Date.now();
      return useNodeStore.getState().nodes.some((n) => {
        if (n.removingAt !== undefined && now - n.removingAt < REMOVE_DURATION_MS) return true;
        if (n.spawnedAt !== undefined && now - n.spawnedAt < SPAWN_DURATION_MS) return true;
        return false;
      });
    };
    if (!hasActive()) return;
    let rafId = 0;
    const tick = () => {
      setVisibleCount(render());
      if (hasActive()) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [nodes, render]);

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
        <div>edges {edges.length}</div>
        <div>selected {selectedIds.size}</div>
        <div>fps {fps}</div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 select-none rounded-md bg-black/75 px-3 py-2 text-xs text-white">
        더블클릭 추가/편집 · 클릭/Shift+클릭 선택 · Shift+드래그 영역 · 핸들 드래그 연결 · Ctrl+A 전체 · Esc 해제 · Delete 삭제
      </div>

      <NodeLabelEditor />

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
