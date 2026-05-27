import type { CanvasNode, Viewport } from '@/types/canvas';
import { worldToScreen } from './transform';

const FILL = '#ffffff';
const BORDER = '#c4c9d1';
const BORDER_SELECTED = '#2563eb';
const TEXT_COLOR = '#1f2933';
const TEXT_CHECKED = '#94a3b8';
const CORNER_RADIUS = 10;
const LABEL_FONT_SIZE = 14;
const MIN_LABEL_FONT_SIZE = 6;

/** 체크박스 노드 안쪽 박스의 한 변(world 단위). 노드 좌측에 그려진다. */
export const CHECKBOX_SIZE = 16;
/** 체크박스 박스와 노드 좌측 가장자리 사이 여백(world 단위). */
export const CHECKBOX_PADDING = 12;
const CHECKBOX_BORDER = '#94a3b8';
const CHECKBOX_FILL_CHECKED = '#2563eb';

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
  const isCheckbox = node.type === 'checkbox';
  const isChecked = isCheckbox && node.checked === true;

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

  if (isCheckbox) {
    // 좌측에 체크박스 박스. 라벨 영역은 그만큼 좁아진다.
    const bx = x + CHECKBOX_PADDING * scale;
    const by = y + (h - CHECKBOX_SIZE * scale) / 2;
    const bs = CHECKBOX_SIZE * scale;
    const br = Math.min(3 * scale, bs / 2);
    ctx.beginPath();
    ctx.roundRect(bx, by, bs, bs, br);
    ctx.fillStyle = isChecked ? CHECKBOX_FILL_CHECKED : FILL;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isChecked ? CHECKBOX_FILL_CHECKED : CHECKBOX_BORDER;
    ctx.stroke();
    if (isChecked) {
      // ✓ 표시. 박스 안쪽에서 좌하단→중간→우상단으로 꺾이는 선.
      ctx.beginPath();
      ctx.moveTo(bx + bs * 0.25, by + bs * 0.55);
      ctx.lineTo(bx + bs * 0.45, by + bs * 0.75);
      ctx.lineTo(bx + bs * 0.78, by + bs * 0.3);
      ctx.lineWidth = Math.max(1.5, 2 * scale);
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }

  // 편집 중인 노드는 input 오버레이가 라벨을 대체하므로 캔버스에서 라벨을 그리지 않는다.
  if (!editing) {
    // 너무 작게 줌아웃되면 글자가 뭉개지므로 라벨은 생략한다.
    const fontSize = LABEL_FONT_SIZE * scale;
    if (fontSize >= MIN_LABEL_FONT_SIZE) {
      ctx.fillStyle = isChecked ? TEXT_CHECKED : TEXT_COLOR;
      ctx.font = `${fontSize}px system-ui, sans-serif`;
      ctx.textBaseline = 'middle';
      if (isCheckbox) {
        // 체크박스 옆 라벨은 박스 우측부터 우측 padding까지 좌측 정렬.
        const labelLeft = x + (CHECKBOX_PADDING + CHECKBOX_SIZE + 8) * scale;
        const labelMaxWidth = x + w - labelLeft - 12 * scale;
        ctx.textAlign = 'left';
        ctx.fillText(node.label, labelLeft, y + h / 2, labelMaxWidth);
        if (isChecked) {
          // strikethrough 선
          const metrics = ctx.measureText(node.label);
          const lineWidth = Math.min(metrics.width, labelMaxWidth);
          ctx.beginPath();
          ctx.moveTo(labelLeft, y + h / 2);
          ctx.lineTo(labelLeft + lineWidth, y + h / 2);
          ctx.lineWidth = Math.max(1, scale);
          ctx.strokeStyle = TEXT_CHECKED;
          ctx.stroke();
        }
      } else {
        ctx.textAlign = 'center';
        ctx.fillText(node.label, x + w / 2, y + h / 2, w * 0.85);
      }
    }
  }

  if (animating) ctx.restore();
}
