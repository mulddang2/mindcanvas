import { create } from 'zustand';
import type { CanvasNode } from '@/types/canvas';

const DEFAULT_WIDTH = 160;
const DEFAULT_HEIGHT = 64;

interface NodeStore {
  nodes: CanvasNode[];
  selectedId: string | null;
  /** world 좌표를 중심으로 기본 크기 노드를 추가하고 곧바로 선택한다. */
  addNode: (centerX: number, centerY: number) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, patch: Partial<Omit<CanvasNode, 'id'>>) => void;
  selectNode: (id: string | null) => void;
  removeSelected: () => void;
}

export const useNodeStore = create<NodeStore>((set) => ({
  nodes: [],
  selectedId: null,
  addNode: (centerX, centerY) =>
    set((state) => {
      const node: CanvasNode = {
        id: crypto.randomUUID(),
        x: centerX - DEFAULT_WIDTH / 2,
        y: centerY - DEFAULT_HEIGHT / 2,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        label: `노드 ${state.nodes.length + 1}`,
      };
      return { nodes: [...state.nodes, node], selectedId: node.id };
    }),
  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),
  updateNode: (id, patch) =>
    set((state) => ({
      nodes: state.nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)),
    })),
  selectNode: (id) => set({ selectedId: id }),
  removeSelected: () =>
    set((state) => ({
      nodes: state.selectedId
        ? state.nodes.filter((node) => node.id !== state.selectedId)
        : state.nodes,
      selectedId: null,
    })),
}));
