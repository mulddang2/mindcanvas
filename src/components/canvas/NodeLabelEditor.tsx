'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useNodeStore } from '@/stores/nodeStore';
import { worldToScreen } from '@/lib/canvas/transform';

const LABEL_FONT_SIZE = 14;
const CORNER_RADIUS = 10;
const TEXT_COLOR = '#1f2933';
const BORDER_COLOR = '#2563eb';

/**
 * 편집 중인 노드 자리에 input을 띄워 라벨을 인라인 편집한다.
 * - 진입 직후 자동 포커스 + 전체 선택, Enter/blur 저장, Esc 취소.
 * - IME 조합 중 Enter는 무시(한글 마지막 글자 끊김 방지).
 */
export function NodeLabelEditor() {
  const editingId = useNodeStore((state) => state.editingId);
  const node = useNodeStore((state) =>
    state.editingId ? state.nodes.find((n) => n.id === state.editingId) ?? null : null,
  );
  const viewport = useCanvasStore((state) => state.viewport);
  const commitEdit = useNodeStore((state) => state.commitEdit);
  const cancelEdit = useNodeStore((state) => state.cancelEdit);

  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const composingRef = useRef(false);

  useEffect(() => {
    if (!editingId || !node) return;
    // 편집 진입 시 input 값을 현재 라벨로 초기화 — 의도된 파생 state 리셋.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(node.label);
    const input = inputRef.current;
    if (!input) return;
    // 다음 프레임에서 포커스해야 div 마운트 직후 select가 안정적으로 동작한다.
    const id = requestAnimationFrame(() => {
      input.focus();
      input.select();
    });
    return () => cancelAnimationFrame(id);
    // node 객체 참조가 바뀌어도(예: 다른 노드의 라벨 갱신) 다시 select하지 않도록 editingId만 추적.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  if (!editingId || !node) return null;

  const { scale } = viewport;
  const { x, y } = worldToScreen(viewport, node.x, node.y);
  const width = node.width * scale;
  const height = node.height * scale;
  const style: CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    lineHeight: `${height}px`,
    fontSize: LABEL_FONT_SIZE * scale,
    borderRadius: Math.min(CORNER_RADIUS * scale, width / 2, height / 2),
    color: TEXT_COLOR,
    borderColor: BORDER_COLOR,
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={() => {
        composingRef.current = false;
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !composingRef.current) {
          e.preventDefault();
          commitEdit(value);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelEdit();
          return;
        }
        // 캔버스 keydown(Delete·Ctrl+A 등)으로 전파되지 않게 차단. useNodeInteraction이
        // input 타겟이면 무시하므로 안전하지만 명시적으로 멈춰 둔다.
        e.stopPropagation();
      }}
      onBlur={() => commitEdit(value)}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      style={style}
      className="border-2 bg-white text-center font-sans outline-none"
    />
  );
}
