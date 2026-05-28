'use client';

import { Plus, Trash2, CheckSquare, Network, type LucideIcon } from 'lucide-react';
import { useNodeStore } from '@/stores/nodeStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { screenToWorld } from '@/lib/canvas/transform';
import { runForceLayout } from '@/lib/canvas/forceLayout';

/** 캔버스 우하단 floating 툴바. 자주 쓰는 액션을 마우스로 접근 가능하게 한다. */
export function Toolbar() {
  const selectedIds = useNodeStore((s) => s.selectedIds);
  const selectedEdgeId = useNodeStore((s) => s.selectedEdgeId);
  const nodesCount = useNodeStore((s) => s.nodes.length);
  const addNode = useNodeStore((s) => s.addNode);
  const removeSelected = useNodeStore((s) => s.removeSelected);
  const selectAll = useNodeStore((s) => s.selectAll);
  const moveNodes = useNodeStore((s) => s.moveNodes);

  const hasSelection = selectedIds.size > 0 || selectedEdgeId !== null;
  const hasNodes = nodesCount > 0;
  const canLayout = nodesCount >= 2;

  const onAdd = () => {
    // 화면 중심을 world로 변환해 새 노드를 그 위치에 추가.
    const viewport = useCanvasStore.getState().viewport;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const world = screenToWorld(viewport, cx, cy);
    addNode(world.x, world.y);
  };

  const onAutoLayout = () => {
    const { nodes, edges } = useNodeStore.getState();
    const positions = runForceLayout(nodes, edges);
    moveNodes(positions);
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
