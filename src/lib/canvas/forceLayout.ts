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
// 기본값(0.0228)보다 빠르게 감쇠시켜 ~1.5초 안에 안정화되도록 한다. 5초는 사용자가 기다리기 길다.
const ALPHA_DECAY = 0.05;

interface ForceNode extends SimulationNodeDatum {
  id: string;
}

export interface ForceLayoutHandle {
  /** 시뮬레이션을 즉시 중단한다. 멱등 — 여러 번 호출해도 안전. */
  stop: () => void;
}

/**
 * D3 force simulation을 라이브로 돌리면서 매 tick마다 `onTick`에 새 좌표를 넘긴다.
 * 호출 측은 onTick에서 nodeStore.moveNodes를 부르면 캔버스가 자동 재렌더된다.
 *
 * 좌표 변환: CanvasNode는 좌상단 기준이라 시뮬레이션 입력 시 중심점으로 변환했다가
 * 결과를 다시 좌상단으로 환산해서 돌려준다.
 */
export function startForceLayout(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  onTick: (positions: Array<{ id: string; x: number; y: number }>) => void,
): ForceLayoutHandle {
  if (nodes.length < 2) {
    return { stop: () => {} };
  }

  // D3 force는 datum 객체를 mutate하므로 원본을 건드리지 않게 복제한다.
  const forceNodes: ForceNode[] = nodes.map((n) => ({
    id: n.id,
    x: n.x + n.width / 2,
    y: n.y + n.height / 2,
  }));
  // tick 콜백에서 다시 좌상단으로 환산할 때 노드별 크기가 필요하다.
  const sizeById = new Map(nodes.map((n) => [n.id, { w: n.width, h: n.height }]));
  const ids = new Set(forceNodes.map((n) => n.id));
  // 그래프에 없는 노드를 가리키는 엣지는 simulation이 throw하므로 사전에 걸러낸다.
  const links: SimulationLinkDatum<ForceNode>[] = edges
    .filter((e) => ids.has(e.source) && ids.has(e.target))
    .map((e) => ({ source: e.source, target: e.target }));

  const emitPositions = () => {
    onTick(
      forceNodes.map((fn) => {
        const size = sizeById.get(fn.id) ?? { w: 0, h: 0 };
        return {
          id: fn.id,
          x: (fn.x ?? 0) - size.w / 2,
          y: (fn.y ?? 0) - size.h / 2,
        };
      }),
    );
  };

  const simulation = forceSimulation<ForceNode>(forceNodes)
    .alphaDecay(ALPHA_DECAY)
    .force(
      'link',
      forceLink<ForceNode, SimulationLinkDatum<ForceNode>>(links)
        .id((d) => d.id)
        .distance(LINK_DISTANCE),
    )
    .force('charge', forceManyBody().strength(CHARGE_STRENGTH))
    .force('center', forceCenter(0, 0))
    .on('tick', emitPositions);

  return {
    stop: () => simulation.stop(),
  };
}
