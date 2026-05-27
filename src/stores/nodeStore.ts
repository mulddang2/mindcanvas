import { create } from 'zustand';
import type { CanvasEdge, CanvasNode, NodeType, Point, WorldBounds } from '@/types/canvas';

const DEFAULT_WIDTH = 160;
const DEFAULT_HEIGHT = 64;

/** 핸들 드래그 중인 임시 연결선. source 노드에서 cursor world 좌표까지 그린다. */
export interface PendingEdge {
  sourceId: string;
  cursor: Point;
}

/** 우클릭 컨텍스트 메뉴 상태. 메뉴 위치(화면 px)와 hit 대상, 빈 공간 노드 추가용 world 좌표를 함께 보관한다. */
export interface ContextMenuState {
  x: number;
  y: number;
  /** null이면 빈 공간 우클릭. */
  target: { type: 'node' | 'edge'; id: string } | null;
  worldX: number;
  worldY: number;
}

interface NodeStore {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedIds: Set<string>;
  selectedEdgeId: string | null;
  /** Shift+드래그 중인 영역 선택 박스. 드래그가 끝나면 null. */
  selectionBox: WorldBounds | null;
  /** 핸들이 노출될 호버 중인 노드. 없으면 null. */
  hoveredNodeId: string | null;
  pendingEdge: PendingEdge | null;
  /** 라벨 인라인 편집 중인 노드. 없으면 null. */
  editingId: string | null;
  /** 우클릭 컨텍스트 메뉴 상태. null이면 닫힘. */
  contextMenu: ContextMenuState | null;
  /** 마지막 replaceGraph 시점(Date.now). 등장 애니메이션 시작 마커. */
  lastReplacedAt: number | null;
  nextNodeNumber: number;
  /** world 좌표를 중심으로 기본 크기 노드를 추가하고 그 노드만 선택한 뒤 id를 돌려준다. */
  addNode: (centerX: number, centerY: number) => string;
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
  /** 모든 노드를 선택한다 (Ctrl/Cmd+A). */
  selectAll: () => void;
  setSelectionBox: (box: WorldBounds | null) => void;
  /** 두 노드를 잇는 연결선을 추가한다. 자기 연결·중복(방향 무관)은 무시한다. */
  addEdge: (source: string, target: string) => void;
  selectEdge: (id: string | null) => void;
  setHoveredNode: (id: string | null) => void;
  setPendingEdge: (edge: PendingEdge | null) => void;
  /** 노드·엣지를 통째로 교체한다 (AI 생성 등). 선택·편집·번호 카운터는 초기화한다. */
  replaceGraph: (nodes: CanvasNode[], edges: CanvasEdge[]) => void;
  /** 라벨 편집 모드 진입. 해당 노드만 선택한다. */
  beginEdit: (id: string) => void;
  /** 편집 결과를 노드에 반영하고 모드를 종료한다. 빈 문자열은 직전 라벨을 유지한다. */
  commitEdit: (label: string) => void;
  /** 편집을 취소하고 모드를 종료한다. 라벨은 그대로. */
  cancelEdit: () => void;
  /** 선택된 연결선이 있으면 그것을, 없으면 선택된 노드 전체를 삭제한다. */
  removeSelected: () => void;
  /** 노드를 복제해 약간 옆에 둔다. 새 노드만 선택하고 id를 돌려준다. */
  duplicateNode: (id: string) => string | null;
  /** 연결선 하나를 삭제한다. */
  removeEdge: (id: string) => void;
  setContextMenu: (menu: ContextMenuState | null) => void;
  /** 노드 타입을 바꾼다. checkbox → text 전환 시 checked 상태는 유지(메타로 남음). */
  setNodeType: (id: string, type: NodeType) => void;
  /** 체크박스 노드의 checked 상태를 토글한다. checkbox 타입이 아니면 무시. */
  toggleNodeChecked: (id: string) => void;
}

export const useNodeStore = create<NodeStore>((set) => ({
  nodes: [],
  edges: [],
  selectedIds: new Set(),
  selectedEdgeId: null,
  selectionBox: null,
  hoveredNodeId: null,
  pendingEdge: null,
  editingId: null,
  contextMenu: null,
  lastReplacedAt: null,
  nextNodeNumber: 1,
  addNode: (centerX, centerY) => {
    const id = crypto.randomUUID();
    set((state) => {
      const node: CanvasNode = {
        id,
        x: centerX - DEFAULT_WIDTH / 2,
        y: centerY - DEFAULT_HEIGHT / 2,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        label: `노드 ${state.nextNodeNumber}`,
      };
      return {
        nodes: [...state.nodes, node],
        selectedIds: new Set([id]),
        selectedEdgeId: null,
        nextNodeNumber: state.nextNodeNumber + 1,
      };
    });
    return id;
  },
  removeNode: (id) =>
    set((state) => {
      const nodes = state.nodes.filter((node) => node.id !== id);
      const selectedIds = new Set(state.selectedIds);
      selectedIds.delete(id);
      return {
        nodes,
        edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
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
  selectOnly: (id) =>
    set({ selectedIds: id ? new Set([id]) : new Set(), selectedEdgeId: null }),
  toggleSelect: (id) =>
    set((state) => {
      const selectedIds = new Set(state.selectedIds);
      if (selectedIds.has(id)) selectedIds.delete(id);
      else selectedIds.add(id);
      return { selectedIds, selectedEdgeId: null };
    }),
  setSelection: (ids) => set({ selectedIds: new Set(ids), selectedEdgeId: null }),
  selectAll: () =>
    set((state) => ({
      selectedIds: new Set(state.nodes.map((node) => node.id)),
      selectedEdgeId: null,
    })),
  setSelectionBox: (box) => set({ selectionBox: box }),
  addEdge: (source, target) =>
    set((state) => {
      if (source === target) return state;
      const exists = state.edges.some(
        (edge) =>
          (edge.source === source && edge.target === target) ||
          (edge.source === target && edge.target === source),
      );
      if (exists) return state;
      return {
        edges: [...state.edges, { id: crypto.randomUUID(), source, target }],
      };
    }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedIds: new Set() }),
  setHoveredNode: (id) => set({ hoveredNodeId: id }),
  setPendingEdge: (edge) => set({ pendingEdge: edge }),
  replaceGraph: (nodes, edges) =>
    set({
      nodes,
      edges,
      selectedIds: new Set(),
      selectedEdgeId: null,
      selectionBox: null,
      hoveredNodeId: null,
      pendingEdge: null,
      editingId: null,
      lastReplacedAt: Date.now(),
      nextNodeNumber: 1,
    }),
  beginEdit: (id) =>
    set({ editingId: id, selectedIds: new Set([id]), selectedEdgeId: null }),
  commitEdit: (label) =>
    set((state) => {
      if (!state.editingId) return state;
      const trimmed = label.trim();
      const editingId = state.editingId;
      return {
        nodes: trimmed
          ? state.nodes.map((node) =>
              node.id === editingId ? { ...node, label: trimmed } : node,
            )
          : state.nodes,
        editingId: null,
      };
    }),
  cancelEdit: () => set({ editingId: null }),
  duplicateNode: (id) => {
    let newId: string | null = null;
    set((state) => {
      const source = state.nodes.find((node) => node.id === id);
      if (!source) return state;
      newId = crypto.randomUUID();
      const copy: CanvasNode = {
        ...source,
        id: newId,
        // 살짝 옆으로 이동해서 원본과 겹치지 않게.
        x: source.x + 24,
        y: source.y + 24,
      };
      return {
        nodes: [...state.nodes, copy],
        selectedIds: new Set([newId]),
        selectedEdgeId: null,
      };
    });
    return newId;
  },
  removeEdge: (id) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
      selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
    })),
  setContextMenu: (menu) => set({ contextMenu: menu }),
  setNodeType: (id, type) =>
    set((state) => ({
      nodes: state.nodes.map((node) => (node.id === id ? { ...node, type } : node)),
    })),
  toggleNodeChecked: (id) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id && node.type === 'checkbox'
          ? { ...node, checked: !(node.checked ?? false) }
          : node,
      ),
    })),
  removeSelected: () =>
    set((state) => {
      if (state.selectedEdgeId) {
        return {
          edges: state.edges.filter((edge) => edge.id !== state.selectedEdgeId),
          selectedEdgeId: null,
        };
      }
      if (state.selectedIds.size === 0) return state;
      const nodes = state.nodes.filter((node) => !state.selectedIds.has(node.id));
      return {
        nodes,
        edges: state.edges.filter(
          (edge) => !state.selectedIds.has(edge.source) && !state.selectedIds.has(edge.target),
        ),
        selectedIds: new Set(),
        nextNodeNumber: nodes.length === 0 ? 1 : state.nextNodeNumber,
      };
    }),
}));
