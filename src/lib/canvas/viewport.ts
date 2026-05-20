import type { CanvasNode, Viewport, WorldBounds } from '@/types/canvas';
import { screenToWorld } from './transform';

/** 현재 화면에 보이는 world 영역. 격자 범위 계산과 노드 culling의 공통 기준. */
export function getVisibleBounds(
  viewport: Viewport,
  screenWidth: number,
  screenHeight: number,
): WorldBounds {
  const topLeft = screenToWorld(viewport, 0, 0);
  const bottomRight = screenToWorld(viewport, screenWidth, screenHeight);
  return {
    minX: topLeft.x,
    minY: topLeft.y,
    maxX: bottomRight.x,
    maxY: bottomRight.y,
  };
}

/** 노드 사각형이 가시 영역과 겹치는지 (M6 viewport culling의 기초). */
export function isNodeVisible(node: CanvasNode, bounds: WorldBounds): boolean {
  return (
    node.x + node.width >= bounds.minX &&
    node.x <= bounds.maxX &&
    node.y + node.height >= bounds.minY &&
    node.y <= bounds.maxY
  );
}
