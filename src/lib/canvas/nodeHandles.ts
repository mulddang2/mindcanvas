import type { CanvasNode, Point, Viewport } from '@/types/canvas';
import { worldToScreen } from './transform';

/** 핸들 원의 화면 반지름(px). 줌과 무관하게 일정한 크기로 그린다. */
const HANDLE_RADIUS = 5;
/** 핸들 클릭 판정 반지름(화면 px). 잡기 쉽도록 그리기 반지름보다 넉넉히 둔다. */
export const HANDLE_HIT_RADIUS = 11;

const FILL = '#ffffff';
const BORDER = '#2563eb';

/** 노드 네 변의 중점(world 좌표). 연결선을 끌어내는 핸들 위치. */
export function nodeHandlePoints(node: CanvasNode): Point[] {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  return [
    { x: cx, y: node.y }, // top
    { x: node.x + node.width, y: cy }, // right
    { x: cx, y: node.y + node.height }, // bottom
    { x: node.x, y: cy }, // left
  ];
}

/** 호버 중인 노드의 연결 핸들 네 개를 작은 원으로 그린다. */
export function drawHandles(
  ctx: CanvasRenderingContext2D,
  node: CanvasNode,
  viewport: Viewport,
): void {
  ctx.fillStyle = FILL;
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1.5;
  for (const point of nodeHandlePoints(node)) {
    const { x, y } = worldToScreen(viewport, point.x, point.y);
    ctx.beginPath();
    ctx.arc(x, y, HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
