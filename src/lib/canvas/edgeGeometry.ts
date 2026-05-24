import type { CanvasNode, Point } from '@/types/canvas';

/** 베지어 곡선 한 개를 이루는 시작·끝 앵커와 두 제어점. */
export interface EdgePath {
  start: Point;
  end: Point;
  cp1: Point;
  cp2: Point;
}

function center(node: CanvasNode): Point {
  return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
}

/** 노드 중심에서 (dirX, dirY) 방향으로 사각 테두리와 만나는 점. */
function borderPoint(node: CanvasNode, dirX: number, dirY: number): Point {
  const c = center(node);
  const hw = node.width / 2;
  const hh = node.height / 2;
  // 테두리까지의 배율: 두 축 중 먼저 닿는 쪽을 택한다.
  const sx = dirX !== 0 ? hw / Math.abs(dirX) : Infinity;
  const sy = dirY !== 0 ? hh / Math.abs(dirY) : Infinity;
  const s = Math.min(sx, sy);
  return { x: c.x + dirX * s, y: c.y + dirY * s };
}

/** 두 앵커 사이를 부드럽게 잇는 제어점. 우세 축으로 휘어 마인드맵식 곡선을 만든다. */
function controls(start: Point, end: Point): { cp1: Point; cp2: Point } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const mx = (start.x + end.x) / 2;
    return { cp1: { x: mx, y: start.y }, cp2: { x: mx, y: end.y } };
  }
  const my = (start.y + end.y) / 2;
  return { cp1: { x: start.x, y: my }, cp2: { x: end.x, y: my } };
}

/** 두 노드를 잇는 연결선의 베지어 경로. 앵커는 각 노드 테두리에 붙는다. */
export function edgePath(source: CanvasNode, target: CanvasNode): EdgePath {
  const cs = center(source);
  const ct = center(target);
  const dx = ct.x - cs.x;
  const dy = ct.y - cs.y;
  const start = borderPoint(source, dx, dy);
  const end = borderPoint(target, -dx, -dy);
  return { start, end, ...controls(start, end) };
}

/** 핸들 드래그 중 노드에서 커서까지 잇는 임시 연결선의 베지어 경로. */
export function pendingEdgePath(source: CanvasNode, cursor: Point): EdgePath {
  const cs = center(source);
  const start = borderPoint(source, cursor.x - cs.x, cursor.y - cs.y);
  return { start, end: cursor, ...controls(start, cursor) };
}

/** 3차 베지어 곡선 위 매개변수 t(0~1) 지점의 좌표. */
export function cubicAt(path: EdgePath, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * path.start.x + b * path.cp1.x + c * path.cp2.x + d * path.end.x,
    y: a * path.start.y + b * path.cp1.y + c * path.cp2.y + d * path.end.y,
  };
}
