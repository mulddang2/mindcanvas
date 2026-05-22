import type { Viewport, WorldBounds } from '@/types/canvas';
import { worldToScreen } from './transform';

const FILL = 'rgba(37, 99, 235, 0.1)';
const BORDER = '#2563eb';

/** Shift+드래그 영역 선택 박스를 반투명 사각형으로 그린다. */
export function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  box: WorldBounds,
  viewport: Viewport,
): void {
  const topLeft = worldToScreen(viewport, box.minX, box.minY);
  const bottomRight = worldToScreen(viewport, box.maxX, box.maxY);
  const w = bottomRight.x - topLeft.x;
  const h = bottomRight.y - topLeft.y;

  ctx.fillStyle = FILL;
  ctx.fillRect(topLeft.x, topLeft.y, w, h);
  ctx.lineWidth = 1;
  ctx.strokeStyle = BORDER;
  ctx.strokeRect(topLeft.x, topLeft.y, w, h);
}
