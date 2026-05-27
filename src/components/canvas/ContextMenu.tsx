'use client';

import { useEffect, useRef } from 'react';
import {
  Pencil,
  Copy,
  Trash2,
  Plus,
  CheckSquare,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import { useNodeStore } from '@/stores/nodeStore';
import { useCanvasStore } from '@/stores/canvasStore';

/** 캔버스 우클릭 시 떠오르는 컨텍스트 메뉴. 대상에 따라 항목이 달라진다. */
export function ContextMenu() {
  const menu = useNodeStore((s) => s.contextMenu);
  const setContextMenu = useNodeStore((s) => s.setContextMenu);
  const beginEdit = useNodeStore((s) => s.beginEdit);
  const duplicateNode = useNodeStore((s) => s.duplicateNode);
  const removeSelected = useNodeStore((s) => s.removeSelected);
  const removeEdge = useNodeStore((s) => s.removeEdge);
  const addNode = useNodeStore((s) => s.addNode);
  const selectAll = useNodeStore((s) => s.selectAll);
  const resetViewport = useCanvasStore((s) => s.resetViewport);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setContextMenu(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    // 메뉴를 띄운 contextmenu 이벤트와 같은 사이클의 mousedown이 즉시 닫는 일을 피하기 위해 다음 프레임에 등록.
    const id = requestAnimationFrame(() => {
      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('keydown', onKeyDown);
    });
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menu, setContextMenu]);

  if (!menu) return null;
  const close = () => setContextMenu(null);

  // 화면 우/하단에 가까운 우클릭은 메뉴가 잘리지 않도록 위치를 안쪽으로 끌어당긴다.
  const left = Math.min(menu.x, window.innerWidth - 200);
  const top = Math.min(menu.y, window.innerHeight - 180);

  return (
    <div
      ref={menuRef}
      className="fixed z-20 min-w-45 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/10"
      style={{ left, top }}
    >
      {menu.target?.type === 'node' && (
        <>
          <Item
            icon={Pencil}
            label="이름 변경"
            onClick={() => {
              beginEdit(menu.target!.id);
              close();
            }}
          />
          <Item
            icon={Copy}
            label="복제"
            onClick={() => {
              duplicateNode(menu.target!.id);
              close();
            }}
          />
          <Item
            icon={Trash2}
            label="삭제"
            shortcut="Delete"
            danger
            onClick={() => {
              // 우클릭 시점에 단일 선택됐거나 다중 선택 유지된 그대로 selectedIds 전체 삭제.
              removeSelected();
              close();
            }}
          />
        </>
      )}
      {menu.target?.type === 'edge' && (
        <Item
          icon={Trash2}
          label="연결선 삭제"
          shortcut="Delete"
          danger
          onClick={() => {
            removeEdge(menu.target!.id);
            close();
          }}
        />
      )}
      {menu.target === null && (
        <>
          <Item
            icon={Plus}
            label="여기에 노드 추가"
            onClick={() => {
              addNode(menu.worldX, menu.worldY);
              close();
            }}
          />
          <Item
            icon={CheckSquare}
            label="전체 선택"
            shortcut="Ctrl+A"
            onClick={() => {
              selectAll();
              close();
            }}
          />
          <Item
            icon={RotateCcw}
            label="뷰 리셋"
            onClick={() => {
              resetViewport();
              close();
            }}
          />
        </>
      )}
    </div>
  );
}

function Item({
  icon: Icon,
  label,
  shortcut,
  danger,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-neutral-100 ${
        danger ? 'text-red-600' : 'text-neutral-800'
      }`}
    >
      <Icon size={14} />
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-xs text-neutral-400">{shortcut}</span>}
    </button>
  );
}
