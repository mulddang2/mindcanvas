'use client';

import { useEffect, useRef } from 'react';
import { Plus, Trash2, CheckSquare, Network, GitFork, type LucideIcon } from 'lucide-react';
import { useNodeStore } from '@/stores/nodeStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { screenToWorld } from '@/lib/canvas/transform';
import { startForceLayout, type ForceLayoutHandle } from '@/lib/canvas/forceLayout';
import { treeLayout } from '@/lib/canvas/treeLayout';

/** 캔버스 우하단 floating 툴바. 자주 쓰는 액션을 마우스로 접근 가능하게 한다. */
export function Toolbar() {
  const selectedIds = useNodeStore((s) => s.selectedIds);
  const selectedEdgeId = useNodeStore((s) => s.selectedEdgeId);
  const nodesCount = useNodeStore((s) => s.nodes.length);
  const addNode = useNodeStore((s) => s.addNode);
  const removeSelected = useNodeStore((s) => s.removeSelected);
  const selectAll = useNodeStore((s) => s.selectAll);
  const moveNodes = useNodeStore((s) => s.moveNodes);
  // 진행 중인 시뮬레이션 핸들. 다시 클릭하거나 언마운트 시 stop을 호출하기 위해 보관.
  const simRef = useRef<ForceLayoutHandle | null>(null);

  const hasSelection = selectedIds.size > 0 || selectedEdgeId !== null;
  const hasNodes = nodesCount > 0;
  const canLayout = nodesCount >= 2;

  useEffect(() => () => simRef.current?.stop(), []);

  const onAdd = () => {
    // 화면 중심을 world로 변환해 새 노드를 그 위치에 추가.
    const viewport = useCanvasStore.getState().viewport;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const world = screenToWorld(viewport, cx, cy);
    addNode(world.x, world.y);
  };

  const onAutoLayout = () => {
    simRef.current?.stop();
    const { nodes, edges } = useNodeStore.getState();
    simRef.current = startForceLayout(nodes, edges, (positions) => {
      moveNodes(positions);
    });
  };

  const onTreeLayout = () => {
    simRef.current?.stop();
    const { nodes, edges, selectedIds } = useNodeStore.getState();
    // 선택된 노드가 있으면 첫 노드를 root로, 없으면 첫 노드를 root로.
    const rootId = selectedIds.size > 0 ? [...selectedIds][0] : nodes[0]?.id;
    if (!rootId) return;
    const positions = treeLayout(nodes, edges, rootId);
    if (positions.length > 0) moveNodes(positions);
  };

  return (
    <div className="fixed bottom-3 right-3 z-10 flex gap-0.5 rounded-md bg-white p-1 shadow-md ring-1 ring-black/10">
      <Button icon={Plus} title="노드 추가" onClick={onAdd} />
      <Button
        icon={Network}
        title="자동 정렬 (D3 force)"
        onClick={onAutoLayout}
        disabled={!canLayout}
      />
      <Button
        icon={GitFork}
        title="트리 정렬 (선택 노드 root, 없으면 첫 노드)"
        onClick={onTreeLayout}
        disabled={!canLayout}
      />
      <Button
        icon={Trash2}
        title="선택 삭제 (Delete)"
        onClick={removeSelected}
        disabled={!hasSelection}
        danger
      />
      <Button
        icon={CheckSquare}
        title="전체 선택 (Ctrl+A)"
        onClick={selectAll}
        disabled={!hasNodes}
      />
    </div>
  );
}

function Button({
  icon: Icon,
  title,
  onClick,
  disabled,
  danger,
}: {
  icon: LucideIcon;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded transition-colors disabled:cursor-not-allowed disabled:text-neutral-300 ${
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-neutral-700 hover:bg-neutral-100'
      }`}
    >
      <Icon size={16} />
    </button>
  );
}
