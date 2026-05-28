import type { CanvasEdge, CanvasNode } from '@/types/canvas';

const DEFAULT_NODE_WIDTH = 160;
const DEFAULT_NODE_HEIGHT = 64;
// 노드당 차지할 평균 공간(world 단위). 너무 좁으면 겹침이 많아 시각 측정에 방해.
const SPACE_PER_NODE = 200;

/**
 * 성능 측정용 무작위 그래프. 1만 노드·~1만 엣지 같은 대규모 시나리오를 빠르게 만든다.
 * - 위치: 정사각형 영역에 균등 무작위 분포
 * - 라벨: "노드 N"
 * - 엣지: 각 노드에서 random target 노드로 1개 연결 (총 count 개)
 */
export function seedTestGraph(count: number): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const nodes: CanvasNode[] = [];
  const edges: CanvasEdge[] = [];
  const area = Math.ceil(Math.sqrt(count)) * SPACE_PER_NODE;

  for (let i = 0; i < count; i += 1) {
    nodes.push({
      id: crypto.randomUUID(),
      x: Math.random() * area - area / 2,
      y: Math.random() * area - area / 2,
      width: DEFAULT_NODE_WIDTH,
      height: DEFAULT_NODE_HEIGHT,
      label: `노드 ${i + 1}`,
    });
  }

  for (let i = 0; i < count; i += 1) {
    const target = Math.floor(Math.random() * count);
    if (target === i) continue;
    edges.push({
      id: crypto.randomUUID(),
      source: nodes[i].id,
      target: nodes[target].id,
    });
  }

  return { nodes, edges };
}
