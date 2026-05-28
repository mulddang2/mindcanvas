import type { CanvasEdge, CanvasNode } from '@/types/canvas';

const HORIZONTAL_GAP = 220;
const VERTICAL_GAP = 140;

/**
 * 계층형(layered DAG) 레이아웃. 엣지 방향을 살려 부모-자식 depth를 정한다.
 * 트리 레이아웃과 다른 점:
 *  - undirected가 아닌 directed: edge.source → edge.target만 부모-자식
 *  - 다이아몬드 그래프(A→B, A→C, B→D, C→D)에서 D를 B·C 둘 다 아래(depth 2)에 둠
 * 알고리즘 — 간이 dagre:
 *  - in-degree 0인 노드를 루트로 BFS
 *  - longest-path: 자식 depth = max(부모 depth) + 1, 부모 depth 갱신 시 자식 재방문
 *  - 사이클·도달 불가 컴포넌트는 별도로 depth 0부터 시작
 *  - 같은 depth 내 노드는 부모 x 평균(barycenter, 1-pass)으로 정렬
 */
export function hierarchicalLayout(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
): Array<{ id: string; x: number; y: number }> {
  if (nodes.length === 0) return [];
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const orderIdx = new Map(nodes.map((n, i) => [n.id, i]));

  const outAdj = new Map<string, string[]>();
  const inAdj = new Map<string, string[]>();
  for (const n of nodes) {
    outAdj.set(n.id, []);
    inAdj.set(n.id, []);
  }
  for (const e of edges) {
    if (!nodeById.has(e.source) || !nodeById.has(e.target)) continue;
    outAdj.get(e.source)!.push(e.target);
    inAdj.get(e.target)!.push(e.source);
  }

  const depth = new Map<string, number>();
  const roots = nodes.filter((n) => (inAdj.get(n.id)?.length ?? 0) === 0);
  const seedRoots = roots.length > 0 ? roots.map((n) => n.id) : [nodes[0].id];
  for (const id of seedRoots) depth.set(id, 0);

  // longest-path BFS. 사이클 방지를 위해 enqueue 총량을 N*(N+1)로 cap.
  const queue = [...seedRoots];
  let safety = nodes.length * (nodes.length + 1);
  while (queue.length > 0 && safety-- > 0) {
    const id = queue.shift()!;
    const d = depth.get(id)!;
    for (const child of outAdj.get(id) ?? []) {
      const existing = depth.get(child);
      const next = d + 1;
      if (existing === undefined || existing < next) {
        depth.set(child, next);
        queue.push(child);
      }
    }
  }

  // 도달 안 된 노드(다른 컴포넌트·사이클 잔여)는 자체적으로 depth 0부터 시드.
  for (const n of nodes) {
    if (depth.has(n.id)) continue;
    depth.set(n.id, 0);
    const localQueue = [n.id];
    let localSafety = nodes.length * (nodes.length + 1);
    while (localQueue.length > 0 && localSafety-- > 0) {
      const id = localQueue.shift()!;
      const d = depth.get(id)!;
      for (const child of outAdj.get(id) ?? []) {
        const existing = depth.get(child);
        const next = d + 1;
        if (existing === undefined || existing < next) {
          depth.set(child, next);
          localQueue.push(child);
        }
      }
    }
  }

  const byDepth = new Map<number, string[]>();
  for (const [id, d] of depth) {
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d)!.push(id);
  }

  const xById = new Map<string, number>();
  const sortedDepths = [...byDepth.keys()].sort((a, b) => a - b);

  const parentBarycenter = (id: string): number => {
    const parents = inAdj.get(id) ?? [];
    if (parents.length === 0) return orderIdx.get(id) ?? 0;
    let sum = 0;
    let count = 0;
    for (const p of parents) {
      const px = xById.get(p);
      if (px !== undefined) {
        sum += px;
        count++;
      }
    }
    return count > 0 ? sum / count : 0;
  };

  for (const d of sortedDepths) {
    const ids = byDepth.get(d)!;
    if (d === 0) {
      ids.sort((a, b) => (orderIdx.get(a) ?? 0) - (orderIdx.get(b) ?? 0));
    } else {
      ids.sort((a, b) => parentBarycenter(a) - parentBarycenter(b));
    }
    const totalWidth = (ids.length - 1) * HORIZONTAL_GAP;
    ids.forEach((id, i) => {
      xById.set(id, -totalWidth / 2 + i * HORIZONTAL_GAP);
    });
  }

  return nodes.map((n) => {
    const cx = xById.get(n.id) ?? 0;
    const cy = (depth.get(n.id) ?? 0) * VERTICAL_GAP;
    return { id: n.id, x: cx - n.width / 2, y: cy - n.height / 2 };
  });
}
