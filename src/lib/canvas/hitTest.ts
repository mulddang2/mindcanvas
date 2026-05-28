import type { CanvasEdge, CanvasNode, Point, WorldBounds } from '@/types/canvas';
import { cubicAt, edgePath } from './edgeGeometry';
import { HANDLE_HIT_RADIUS, nodeHandlePoints } from './nodeHandles';
import { CHECKBOX_PADDING, CHECKBOX_SIZE } from './drawNode';

/** 연결선 클릭 판정 폭(화면 px). scale로 나눠 world 허용 오차로 쓴다. */
const EDGE_HIT_TOLERANCE = 6;
/** 베지어 곡선을 직선 구간으로 근사할 때의 분할 수. */
const EDGE_SAMPLES = 16;

/**
 * world 좌표 point를 포함하는 노드를 찾는다. 나중에 그려진(배열 뒤쪽) 노드가
 * 화면상 위에 있으므로 뒤에서부터 검사한다.
 */
export function hitTestNode(nodes: CanvasNode[], point: Point): CanvasNode | null {
  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    const node = nodes[i];
    // fade-out 중인 노드는 곧 사라질 예정 → 클릭·드래그 대상에서 제외.
    if (node.removingAt !== undefined) continue;
    if (
      point.x >= node.x &&
      point.x <= node.x + node.width &&
      point.y >= node.y &&
      point.y <= node.y + node.height
    ) {
      return node;
    }
  }
  return null;
}

/** world 영역과 사각형이 한 점이라도 겹치는 모든 노드 (영역 선택용). fade-out 중 노드는 제외. */
export function nodesInBounds(nodes: CanvasNode[], bounds: WorldBounds): CanvasNode[] {
  return nodes.filter(
    (node) =>
      node.removingAt === undefined &&
      node.x + node.width >= bounds.minX &&
      node.x <= bounds.maxX &&
      node.y + node.height >= bounds.minY &&
      node.y <= bounds.maxY,
  );
}

/** point가 체크박스 노드의 좌측 체크박스 박스 안에 있는지. checkbox 타입이 아니면 항상 false. */
export function hitTestCheckbox(node: CanvasNode, point: Point): boolean {
  if (node.type !== 'checkbox') return false;
  const bx = node.x + CHECKBOX_PADDING;
  const by = node.y + (node.height - CHECKBOX_SIZE) / 2;
  return (
    point.x >= bx &&
    point.x <= bx + CHECKBOX_SIZE &&
    point.y >= by &&
    point.y <= by + CHECKBOX_SIZE
  );
}

/** point가 노드의 연결 핸들 중 하나 위에 있는지. scale로 화면 반지름을 world로 환산한다. */
export function hitTestHandle(node: CanvasNode, point: Point, scale: number): boolean {
  const radius = HANDLE_HIT_RADIUS / scale;
  return nodeHandlePoints(node).some(
    (handle) => Math.hypot(point.x - handle.x, point.y - handle.y) <= radius,
  );
}

/** 점에서 선분 ab까지의 최단 거리. */
function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  const t =
    lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * point에 가장 가까운 연결선을 찾는다. 베지어 곡선을 선분으로 근사해 거리를 잰다.
 * 위에 그려진 연결선이 우선하도록 뒤에서부터 검사한다.
 */
export function hitTestEdge(
  edges: CanvasEdge[],
  nodes: CanvasNode[],
  point: Point,
  scale: number,
): CanvasEdge | null {
  const tolerance = EDGE_HIT_TOLERANCE / scale;
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  for (let i = edges.length - 1; i >= 0; i -= 1) {
    const edge = edges[i];
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target) continue;
    const path = edgePath(source, target);
    let prev = cubicAt(path, 0);
    for (let s = 1; s <= EDGE_SAMPLES; s += 1) {
      const next = cubicAt(path, s / EDGE_SAMPLES);
      if (distanceToSegment(point, prev, next) <= tolerance) return edge;
      prev = next;
    }
  }
  return null;
}

/**
 * 핸들 노출 대상이 될 노드를 정한다. 노드 위면 그 노드, 노드를 벗어나도
 * 직전 호버 노드의 핸들 위라면 그 노드를 유지해 핸들이 깜빡이지 않게 한다.
 */
export function resolveHover(
  nodes: CanvasNode[],
  prevHoveredId: string | null,
  point: Point,
  scale: number,
): string | null {
  const hit = hitTestNode(nodes, point);
  if (hit) return hit.id;
  if (prevHoveredId) {
    const prev = nodes.find((node) => node.id === prevHoveredId);
    if (prev && hitTestHandle(prev, point, scale)) return prevHoveredId;
  }
  return null;
}
