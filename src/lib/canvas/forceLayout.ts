import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3';
import type { CanvasEdge, CanvasNode } from '@/types/canvas';

// 노드 크기(기본 160×64) 대비 보기 좋은 간격을 휴리스틱으로 정함.
const LINK_DISTANCE = 180;
const CHARGE_STRENGTH = -800;
const ITERATIONS = 300;

interface ForceNode extends SimulationNodeDatum {
  id: string;
}

/**
 * D3 force simulation을 headless로(rAF 없이) 동기적으로 돌려 안정화된 노드 좌표를 돌려준다.
 * 입력 nodes의 좌상단 좌표(x,y)는 중심점으로 변환해 시뮬레이션하고 결과를 다시 좌상단으로 환산한다.
 */
export function runForceLayout(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
): Array<{ id: string; x: number; y: number }> {
  if (nodes.length < 2) return nodes.map((n) => ({ id: n.id, x: n.x, y: n.y }));

  // D3 force는 datum 객체를 mutate하므로 원본을 건드리지 않게 복제한다.
  const forceNodes: ForceNode[] = nodes.map((n) => ({
    id: n.id,
    x: n.x + n.width / 2,
    y: n.y + n.height / 2,
  }));
  const ids = new Set(forceNodes.map((n) => n.id));
  // 그래프에 없는 노드를 가리키는 엣지는 simulation이 throw하므로 사전에 걸러낸다.
  const links: SimulationLinkDatum<ForceNode>[] = edges
    .filter((e) => ids.has(e.source) && ids.has(e.target))
    .map((e) => ({ source: e.source, target: e.target }));

  const simulation = forceSimulation<ForceNode>(forceNodes)
    .force(
      'link',
      forceLink<ForceNode, SimulationLinkDatum<ForceNode>>(links)
        .id((d) => d.id)
        .distance(LINK_DISTANCE),
    )
    .force('charge', forceManyBody().strength(CHARGE_STRENGTH))
    .force('center', forceCenter(0, 0))
    .stop();

  for (let i = 0; i < ITERATIONS; i += 1) simulation.tick();

  return nodes.map((n, i) => {
    const fn = forceNodes[i];
    return {
      id: n.id,
      x: (fn.x ?? 0) - n.width / 2,
      y: (fn.y ?? 0) - n.height / 2,
    };
  });
}
