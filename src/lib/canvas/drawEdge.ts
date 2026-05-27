import type { CanvasNode, Point, Viewport } from '@/types/canvas';
import { edgePath, pendingEdgePath, type EdgePath } from './edgeGeometry';
import { worldToScreen } from './transform';

const COLOR = '#94a3b8';
const COLOR_SELECTED = '#2563eb';
const WIDTH = 2;
const WIDTH_SELECTED = 3;

function strokePath(ctx: CanvasRenderingContext2D, path: EdgePath, viewport: Viewport): void {
  const s = worldToScreen(viewport, path.start.x, path.start.y);
  const c1 = worldToScreen(viewport, path.cp1.x, path.cp1.y);
  const c2 = worldToScreen(viewport, path.cp2.x, path.cp2.y);
  const e = worldToScreen(viewport, path.end.x, path.end.y);
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, e.x, e.y);
  ctx.stroke();
}

/** 두 노드를 잇는 연결선을 베지어 곡선으로 그린다. progress<1이면 등장 페이드. */
export function drawEdge(
  ctx: CanvasRenderingContext2D,
  source: CanvasNode,
  target: CanvasNode,
  viewport: Viewport,
  selected: boolean,
  progress: number = 1,
): void {
  const animating = progress < 1;
  if (animating) {
    ctx.save();
    ctx.globalAlpha = progress;
  }
  ctx.strokeStyle = selected ? COLOR_SELECTED : COLOR;
  ctx.lineWidth = selected ? WIDTH_SELECTED : WIDTH;
  strokePath(ctx, edgePath(source, target), viewport);
  if (animating) ctx.restore();
}

/** 핸들 드래그 중인 임시 연결선을 점선으로 그린다. */
export function drawPendingEdge(
  ctx: CanvasRenderingContext2D,
  source: CanvasNode,
  cursor: Point,
  viewport: Viewport,
): void {
  ctx.save();
  ctx.strokeStyle = COLOR_SELECTED;
  ctx.lineWidth = WIDTH;
  ctx.setLineDash([6, 4]);
  strokePath(ctx, pendingEdgePath(source, cursor), viewport);
  ctx.restore();
}
