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

/**
 * 두 노드를 잇는 엣지가 가시 영역과 겹치는지.
 * 베지어 곡선의 정확한 bound 대신 source·target 노드의 결합 사각형으로 근사 — fast + 약간 보수적(약간 더 그림).
 */
export function isEdgeVisible(
  source: CanvasNode,
  target: CanvasNode,
  bounds: WorldBounds,
): boolean {
  const minX = Math.min(source.x, target.x);
  const maxX = Math.max(source.x + source.width, target.x + target.width);
  const minY = Math.min(source.y, target.y);
  const maxY = Math.max(source.y + source.height, target.y + target.height);
  return maxX >= bounds.minX && minX <= bounds.maxX && maxY >= bounds.minY && minY <= bounds.maxY;
}
