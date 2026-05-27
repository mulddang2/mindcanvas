import type { CanvasNode, Viewport } from '@/types/canvas';
import { worldToScreen } from './transform';

const FILL = '#ffffff';
const BORDER = '#c4c9d1';
const BORDER_SELECTED = '#2563eb';
const TEXT_COLOR = '#1f2933';
const CORNER_RADIUS = 10;
const LABEL_FONT_SIZE = 14;
const MIN_LABEL_FONT_SIZE = 6;

/** 노드 하나를 world→screen 변환해 둥근 사각형 + 라벨로 그린다. progress<1이면 등장 페이드+스케일. */
export function drawNode(
  ctx: CanvasRenderingContext2D,
  node: CanvasNode,
  viewport: Viewport,
  selected: boolean,
  editing: boolean = false,
  progress: number = 1,
): void {
  const { scale } = viewport;
  const { x, y } = worldToScreen(viewport, node.x, node.y);
  const w = node.width * scale;
  const h = node.height * scale;
  const radius = Math.min(CORNER_RADIUS * scale, w / 2, h / 2);

  const animating = progress < 1;
  if (animating) {
    ctx.save();
    ctx.globalAlpha = progress;
    // 중앙 기준 0.7→1.0 스케일. 페이드와 함께 "팝업" 느낌.
    const animScale = 0.7 + 0.3 * progress;
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.translate(cx, cy);
    ctx.scale(animScale, animScale);
    ctx.translate(-cx, -cy);
  }

  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = FILL;
  ctx.fill();
  ctx.lineWidth = selected ? 2 : 1;
  ctx.strokeStyle = selected ? BORDER_SELECTED : BORDER;
  ctx.stroke();

  // 편집 중인 노드는 input 오버레이가 라벨을 대체하므로 캔버스에서 라벨을 그리지 않는다.
  if (!editing) {
    // 너무 작게 줌아웃되면 글자가 뭉개지므로 라벨은 생략한다.
    const fontSize = LABEL_FONT_SIZE * scale;
    if (fontSize >= MIN_LABEL_FONT_SIZE) {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = `${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, x + w / 2, y + h / 2, w * 0.85);
    }
  }

  if (animating) ctx.restore();
}
