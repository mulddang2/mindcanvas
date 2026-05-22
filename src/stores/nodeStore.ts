import { create } from 'zustand';
import type { CanvasNode, WorldBounds } from '@/types/canvas';

const DEFAULT_WIDTH = 160;
const DEFAULT_HEIGHT = 64;

interface NodeStore {
  nodes: CanvasNode[];
  selectedIds: Set<string>;
  /** Shift+드래그 중인 영역 선택 박스. 드래그가 끝나면 null. */
  selectionBox: WorldBounds | null;
  nextNodeNumber: number;
  /** world 좌표를 중심으로 기본 크기 노드를 추가하고 그 노드만 선택한다. */
  addNode: (centerX: number, centerY: number) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, patch: Partial<Omit<CanvasNode, 'id'>>) => void;
  /** 여러 노드 위치를 한 번에 절대 좌표로 옮긴다 (다중 드래그용). */
  moveNodes: (positions: Array<{ id: string; x: number; y: number }>) => void;
  /** 선택을 id 하나로 교체한다. null이면 전체 해제. */
  selectOnly: (id: string | null) => void;
  /** id를 선택에 넣거나 뺀다 (Shift+클릭). */
  toggleSelect: (id: string) => void;
  /** 선택을 주어진 id 목록으로 교체한다 (영역 선택). */
  setSelection: (ids: string[]) => void;
  setSelectionBox: (box: WorldBounds | null) => void;
  removeSelected: () => void;
}

export const useNodeStore = create<NodeStore>((set) => ({
  nodes: [],
  selectedIds: new Set(),
  selectionBox: null,
  nextNodeNumber: 1,
  addNode: (centerX, centerY) =>
    set((state) => {
      const node: CanvasNode = {
        id: crypto.randomUUID(),
        x: centerX - DEFAULT_WIDTH / 2,
        y: centerY - DEFAULT_HEIGHT / 2,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        label: `노드 ${state.nextNodeNumber}`,
      };
      return {
        nodes: [...state.nodes, node],
        selectedIds: new Set([node.id]),
        nextNodeNumber: state.nextNodeNumber + 1,
      };
    }),
  removeNode: (id) =>
    set((state) => {
      const nodes = state.nodes.filter((node) => node.id !== id);
      const selectedIds = new Set(state.selectedIds);
      selectedIds.delete(id);
      return {
        nodes,
        selectedIds,
        nextNodeNumber: nodes.length === 0 ? 1 : state.nextNodeNumber,
      };
    }),
  updateNode: (id, patch) =>
    set((state) => ({
      nodes: state.nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)),
    })),
  moveNodes: (positions) =>
    set((state) => {
      const byId = new Map(positions.map((p) => [p.id, p]));
      return {
        nodes: state.nodes.map((node) => {
          const pos = byId.get(node.id);
          return pos ? { ...node, x: pos.x, y: pos.y } : node;
        }),
      };
    }),
  selectOnly: (id) => set({ selectedIds: id ? new Set([id]) : new Set() }),
  toggleSelect: (id) =>
    set((state) => {
      const selectedIds = new Set(state.selectedIds);
      if (selectedIds.has(id)) selectedIds.delete(id);
      else selectedIds.add(id);
      return { selectedIds };
    }),
  setSelection: (ids) => set({ selectedIds: new Set(ids) }),
  setSelectionBox: (box) => set({ selectionBox: box }),
  removeSelected: () =>
    set((state) => {
      if (state.selectedIds.size === 0) return state;
      const nodes = state.nodes.filter((node) => !state.selectedIds.has(node.id));
      return {
        nodes,
        selectedIds: new Set(),
        nextNodeNumber: nodes.length === 0 ? 1 : state.nextNodeNumber,
      };
    }),
}));
