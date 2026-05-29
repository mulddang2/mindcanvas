import { create } from 'zustand';
import * as Y from 'yjs';
import type {
  CanvasEdge,
  CanvasNode,
  NodeColor,
  NodeType,
  Point,
  WorldBounds,
} from '@/types/canvas';
import { REMOVE_DURATION_MS } from '@/lib/canvas/animation';
import { broadcastEditing } from '@/lib/yjs/awareness';

const DEFAULT_WIDTH = 160;
const DEFAULT_HEIGHT = 64;
const Y_NODES = 'nodes';
const Y_EDGES = 'edges';

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
  /** Y.Map<CanvasNode>의 view. mutation은 Y.Map을 거치고 observer가 이 배열을 갱신한다. */
  nodes: CanvasNode[];
  /** Y.Map<CanvasEdge>의 view. */
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
  /** 이미지 URL을 가진 이미지 노드를 추가한다. */
  addImageNode: (centerX: number, centerY: number, imageUrl: string) => string;
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
  /**
   * Y.Doc이 비어있을 때만 initial로 채운다 (페이지 첫 진입 hydrate 전용).
   * 다른 탭이 먼저 들어와 Y.Doc에 데이터를 채워둔 경우, 초기 hydrate가 그 데이터를 덮어쓰지 않게 한다.
   */
  hydrateIfEmpty: (nodes: CanvasNode[], edges: CanvasEdge[]) => void;
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
  /** 여러 노드의 카테고리 색을 한 번에 변경. 'default'면 color 필드 제거(데이터 깔끔). */
  setNodeColor: (ids: string[], color: NodeColor) => void;
  /** 같은 카테고리 색을 가진 모든 노드를 선택 상태로 교체. removingAt인 노드는 제외. */
  selectByColor: (color: NodeColor) => void;
}

// Y.js binding은 모듈 레벨 mutable로. CanvasView가 useYjs로 마운트 시 bind, unmount 시 unbind.
let yNodes: Y.Map<CanvasNode> | null = null;
let yEdges: Y.Map<CanvasEdge> | null = null;
let boundDoc: Y.Doc | null = null;
let nodesObserver: ((event: Y.YMapEvent<CanvasNode>) => void) | null = null;
let edgesObserver: ((event: Y.YMapEvent<CanvasEdge>) => void) | null = null;

function requireYNodes(): Y.Map<CanvasNode> {
  if (!yNodes) throw new Error('nodeStore not bound to Y.Doc — useYjs를 먼저 호출하세요');
  return yNodes;
}
function requireYEdges(): Y.Map<CanvasEdge> {
  if (!yEdges) throw new Error('nodeStore not bound to Y.Doc');
  return yEdges;
}
function requireDoc(): Y.Doc {
  if (!boundDoc) throw new Error('nodeStore not bound to Y.Doc');
  return boundDoc;
}

function snapshotNodes(): CanvasNode[] {
  return yNodes ? Array.from(yNodes.values()) : [];
}
function snapshotEdges(): CanvasEdge[] {
  return yEdges ? Array.from(yEdges.values()) : [];
}

export const useNodeStore = create<NodeStore>((set, get) => ({
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
    const number = get().nextNodeNumber;
    const node: CanvasNode = {
      id,
      x: centerX - DEFAULT_WIDTH / 2,
      y: centerY - DEFAULT_HEIGHT / 2,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      label: `노드 ${number}`,
      spawnedAt: Date.now(),
    };
    requireYNodes().set(id, node);
    set({
      selectedIds: new Set([id]),
      selectedEdgeId: null,
      nextNodeNumber: number + 1,
    });
    return id;
  },
  addImageNode: (centerX, centerY, imageUrl) => {
    const id = crypto.randomUUID();
    const number = get().nextNodeNumber;
    const node: CanvasNode = {
      id,
      x: centerX - DEFAULT_WIDTH / 2,
      y: centerY - DEFAULT_HEIGHT / 2,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      label: `이미지 ${number}`,
      type: 'image',
      imageUrl,
      spawnedAt: Date.now(),
    };
    requireYNodes().set(id, node);
    set({
      selectedIds: new Set([id]),
      selectedEdgeId: null,
      nextNodeNumber: number + 1,
    });
    return id;
  },
  removeNode: (id) => {
    const node = requireYNodes().get(id);
    if (!node) return;
    // 1단계: removingAt 설정으로 양쪽 탭에서 동시에 fade-out 시작.
    requireYNodes().set(id, { ...node, removingAt: Date.now() });
    set((state) => {
      const selectedIds = new Set(state.selectedIds);
      selectedIds.delete(id);
      return { selectedIds };
    });
    // 2단계: fade-out 끝나면 실제 삭제. Y.Map.delete는 idempotent라 양쪽 탭이 같이 호출해도 안전.
    setTimeout(() => {
      requireDoc().transact(() => {
        requireYNodes().delete(id);
        requireYEdges().forEach((edge, edgeId) => {
          if (edge.source === id || edge.target === id) requireYEdges().delete(edgeId);
        });
      });
      if (requireYNodes().size === 0) set({ nextNodeNumber: 1 });
    }, REMOVE_DURATION_MS);
  },
  updateNode: (id, patch) => {
    const node = requireYNodes().get(id);
    if (!node) return;
    requireYNodes().set(id, { ...node, ...patch });
  },
  moveNodes: (positions) => {
    requireDoc().transact(() => {
      const map = requireYNodes();
      for (const p of positions) {
        const node = map.get(p.id);
        if (node) map.set(p.id, { ...node, x: p.x, y: p.y });
      }
    });
  },
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
    set({
      selectedIds: new Set(snapshotNodes().map((n) => n.id)),
      selectedEdgeId: null,
    }),
  setSelectionBox: (box) => set({ selectionBox: box }),
  addEdge: (source, target) => {
    if (source === target) return;
    const edges = requireYEdges();
    for (const edge of edges.values()) {
      if (
        (edge.source === source && edge.target === target) ||
        (edge.source === target && edge.target === source)
      ) {
        return;
      }
    }
    const id = crypto.randomUUID();
    edges.set(id, { id, source, target });
  },
  selectEdge: (id) => set({ selectedEdgeId: id, selectedIds: new Set() }),
  setHoveredNode: (id) => set({ hoveredNodeId: id }),
  setPendingEdge: (edge) => set({ pendingEdge: edge }),
  replaceGraph: (nodes, edges) => {
    requireDoc().transact(() => {
      const yn = requireYNodes();
      const ye = requireYEdges();
      yn.clear();
      ye.clear();
      for (const n of nodes) yn.set(n.id, n);
      for (const e of edges) ye.set(e.id, e);
    });
    set({
      selectedIds: new Set(),
      selectedEdgeId: null,
      selectionBox: null,
      hoveredNodeId: null,
      pendingEdge: null,
      editingId: null,
      lastReplacedAt: Date.now(),
      nextNodeNumber: 1,
    });
  },
  hydrateIfEmpty: (nodes, edges) => {
    const yn = requireYNodes();
    const ye = requireYEdges();
    if (yn.size > 0 || ye.size > 0) {
      // 이미 다른 탭이 채워뒀거나 ws sync로 받음. 등장 애니메이션 마커만 갱신.
      set({ lastReplacedAt: Date.now() });
      return;
    }
    requireDoc().transact(() => {
      for (const n of nodes) yn.set(n.id, n);
      for (const e of edges) ye.set(e.id, e);
    });
    set({ lastReplacedAt: Date.now() });
  },
  beginEdit: (id) => {
    set({ editingId: id, selectedIds: new Set([id]), selectedEdgeId: null });
    broadcastEditing(id);
  },
  commitEdit: (label) => {
    const editingId = get().editingId;
    if (!editingId) return;
    const trimmed = label.trim();
    if (trimmed) {
      const node = requireYNodes().get(editingId);
      if (node) requireYNodes().set(editingId, { ...node, label: trimmed });
    }
    set({ editingId: null });
    broadcastEditing(null);
  },
  cancelEdit: () => {
    set({ editingId: null });
    broadcastEditing(null);
  },
  duplicateNode: (id) => {
    const source = requireYNodes().get(id);
    if (!source) return null;
    const newId = crypto.randomUUID();
    const copy: CanvasNode = {
      ...source,
      id: newId,
      // 살짝 옆으로 이동해서 원본과 겹치지 않게.
      x: source.x + 24,
      y: source.y + 24,
      spawnedAt: Date.now(),
      // 원본이 fade-out 중이었어도 복사본은 새로 등장하므로 removingAt 해제.
      removingAt: undefined,
    };
    requireYNodes().set(newId, copy);
    set({ selectedIds: new Set([newId]), selectedEdgeId: null });
    return newId;
  },
  removeEdge: (id) => {
    requireYEdges().delete(id);
    set((state) => ({
      selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
    }));
  },
  setContextMenu: (menu) => set({ contextMenu: menu }),
  setNodeType: (id, type) => {
    const node = requireYNodes().get(id);
    if (!node) return;
    requireYNodes().set(id, { ...node, type });
  },
  toggleNodeChecked: (id) => {
    const node = requireYNodes().get(id);
    if (!node || node.type !== 'checkbox') return;
    requireYNodes().set(id, { ...node, checked: !(node.checked ?? false) });
  },
  setNodeColor: (ids, color) => {
    const next = color === 'default' ? undefined : color;
    requireDoc().transact(() => {
      const map = requireYNodes();
      for (const id of ids) {
        const node = map.get(id);
        if (node) map.set(id, { ...node, color: next });
      }
    });
  },
  selectByColor: (color) =>
    set({
      selectedIds: new Set(
        snapshotNodes()
          .filter((node) => node.removingAt === undefined && (node.color ?? 'default') === color)
          .map((node) => node.id),
      ),
      selectedEdgeId: null,
    }),
  removeSelected: () => {
    const state = get();
    if (state.selectedEdgeId) {
      // 엣지는 transition 없이 즉시 제거.
      requireYEdges().delete(state.selectedEdgeId);
      set({ selectedEdgeId: null });
      return;
    }
    if (state.selectedIds.size === 0) return;
    const removingIds = new Set(state.selectedIds);
    const now = Date.now();
    // 1단계: 선택 노드들에 removingAt 설정 + 로컬 선택 해제.
    requireDoc().transact(() => {
      const map = requireYNodes();
      for (const id of removingIds) {
        const node = map.get(id);
        if (node) map.set(id, { ...node, removingAt: now });
      }
    });
    set({ selectedIds: new Set() });
    // 2단계: fade-out 끝나면 실제 제거 + 연결 엣지 정리.
    setTimeout(() => {
      requireDoc().transact(() => {
        const yn = requireYNodes();
        const ye = requireYEdges();
        for (const id of removingIds) yn.delete(id);
        ye.forEach((edge, edgeId) => {
          if (removingIds.has(edge.source) || removingIds.has(edge.target)) ye.delete(edgeId);
        });
      });
      if (requireYNodes().size === 0) set({ nextNodeNumber: 1 });
    }, REMOVE_DURATION_MS);
  },
}));

/**
 * nodeStore을 주어진 Y.Doc에 바인딩한다. canvasId가 바뀌거나 컴포넌트 unmount 시 unbind 필요.
 * 같은 doc에 이미 bind되어 있으면 no-op.
 */
export function bindNodeStore(doc: Y.Doc): void {
  if (boundDoc === doc) return;
  if (boundDoc) unbindNodeStore();
  boundDoc = doc;
  yNodes = doc.getMap<CanvasNode>(Y_NODES);
  yEdges = doc.getMap<CanvasEdge>(Y_EDGES);

  // 초기 sync: bind 시점에 Y.Map에 이미 있는 값들로 store을 채운다.
  useNodeStore.setState({
    nodes: snapshotNodes(),
    edges: snapshotEdges(),
  });

  nodesObserver = () => {
    useNodeStore.setState({ nodes: snapshotNodes() });
  };
  edgesObserver = () => {
    useNodeStore.setState({ edges: snapshotEdges() });
  };
  yNodes.observe(nodesObserver);
  yEdges.observe(edgesObserver);
}

export function unbindNodeStore(): void {
  if (yNodes && nodesObserver) yNodes.unobserve(nodesObserver);
  if (yEdges && edgesObserver) yEdges.unobserve(edgesObserver);
  yNodes = null;
  yEdges = null;
  boundDoc = null;
  nodesObserver = null;
  edgesObserver = null;
  // store은 빈 상태로. 다음 bind에서 다시 채워진다.
  useNodeStore.setState({
    nodes: [],
    edges: [],
    selectedIds: new Set(),
    selectedEdgeId: null,
    hoveredNodeId: null,
    pendingEdge: null,
    editingId: null,
    contextMenu: null,
    nextNodeNumber: 1,
  });
}
