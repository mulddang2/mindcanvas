import type { CanvasNode, Point, WorldBounds } from '@/types/canvas';

/**
 * world 좌표 point를 포함하는 노드를 찾는다. 나중에 그려진(배열 뒤쪽) 노드가
 * 화면상 위에 있으므로 뒤에서부터 검사한다.
 */
export function hitTestNode(nodes: CanvasNode[], point: Point): CanvasNode | null {
  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    const node = nodes[i];
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

/** world 영역과 사각형이 한 점이라도 겹치는 모든 노드 (영역 선택용). */
export function nodesInBounds(nodes: CanvasNode[], bounds: WorldBounds): CanvasNode[] {
  return nodes.filter(
    (node) =>
      node.x + node.width >= bounds.minX &&
      node.x <= bounds.maxX &&
      node.y + node.height >= bounds.minY &&
      node.y <= bounds.maxY,
  );
}
