import type { CanvasEdge, CanvasNode } from '@/types/canvas';

// 같은 depth의 인접 노드 사이 가로 간격(world 단위). 노드 폭(160) 대비 보기 좋게.
const HORIZONTAL_GAP = 220;
// 위·아래 depth 사이 세로 간격.
const VERTICAL_GAP = 140;

/**
 * 선택된 노드(rootId)를 정점으로 한 트리형 레이아웃을 계산한다.
 * - edges는 방향 무관(undirected)으로 간주 — mindmap 엣지는 부모/자식 관계가 시각만 다름
 * - BFS로 depth 할당 → 각 depth마다 가로 균등 분포(중앙 정렬)
 * - root는 (0,0), 자식이 아래쪽으로 펼쳐짐
 *
 * root에서 도달 불가능한 노드(다른 컴포넌트)는 원래 위치 유지.
 */
export function treeLayout(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  rootId: string,
): Array<{ id: string; x: number; y: number }> {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  if (!nodeById.has(rootId)) return [];

  // adjacency: 양방향. mindmap에서 edge.source·target은 단지 생성 순서.
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    adj.get(e.source)?.push(e.target);
    adj.get(e.target)?.push(e.source);
  }

  // BFS로 depth와 부모 추적.
  const depth = new Map<string, number>();
  const queue: string[] = [rootId];
  depth.set(rootId, 0);
  while (queue.length > 0) {
    const id = queue.shift()!;
    const d = depth.get(id)!;
    for (const next of adj.get(id) ?? []) {
      if (!depth.has(next)) {
        depth.set(next, d + 1);
        queue.push(next);
      }
    }
  }

  // depth 별 노드 ID 수집 (BFS 순서 유지).
  const byDepth = new Map<number, string[]>();
  for (const [id, d] of depth) {
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d)!.push(id);
  }

  // 각 depth마다 가로 균등 분포 + 중앙 정렬. 좌표는 노드 좌상단 기준.
  const positions: Array<{ id: string; x: number; y: number }> = [];
  for (const [d, ids] of byDepth) {
    const count = ids.length;
    const totalWidth = (count - 1) * HORIZONTAL_GAP;
    ids.forEach((id, i) => {
      const node = nodeById.get(id)!;
      const cx = -totalWidth / 2 + i * HORIZONTAL_GAP;
      const cy = d * VERTICAL_GAP;
      positions.push({
        id,
        x: cx - node.width / 2,
        y: cy - node.height / 2,
      });
    });
  }

  return positions;
}
